#!/usr/bin/env bash
# scripts/deploy.sh — Deploy reproducible al VPS de Trackeo.cl
#
# Uso:
#   bash scripts/deploy.sh                        # Solo backend (default)
#   bash scripts/deploy.sh --backend              # Solo backend
#   bash scripts/deploy.sh --frontend             # Solo frontend (build + Nginx)
#   bash scripts/deploy.sh --backend --migrate    # Backend + migraciones Prisma
#   bash scripts/deploy.sh --backend --flush-logs # Backend + vaciar logs PM2
#   bash scripts/deploy.sh --debug                # Verbose (set -x)
#
# Requisito: SSH sin contraseña → ssh-copy-id root@76.13.81.62

# ─── Configuración ─────────────────────────────────────────────────────────────
VPS="root@76.13.81.62"
REMOTE_DIR="/root/personas-trackeo"
PM2_APP="app-trackeo"
PM2_LEGACY="trackeo-api"
FRONTEND_DEST="/var/www/app.trackeo.cl"          # donde Nginx sirve el frontend
HEALTH_URL="https://app.trackeo.cl/api/app/health"
HEALTH_LOCAL="http://127.0.0.1:3001/api/app/health"
HEALTH_RETRIES=10                                # intentos (3s c/u → 30s max)
HEALTH_WAIT=3
# ───────────────────────────────────────────────────────────────────────────────

# ─── Parsear flags ─────────────────────────────────────────────────────────────
DO_FRONTEND=false
DO_BACKEND=false
DO_MIGRATE=false
DO_FLUSH=false
DO_DEBUG=false

for arg in "$@"; do
  case "$arg" in
    --frontend)   DO_FRONTEND=true ;;
    --backend)    DO_BACKEND=true ;;
    --migrate)    DO_MIGRATE=true ;;
    --flush-logs) DO_FLUSH=true ;;
    --debug)      DO_DEBUG=true ;;
    --all)        DO_FRONTEND=true; DO_BACKEND=true ;;
    *)
      echo "Flag desconocido: $arg"
      echo "Uso: bash scripts/deploy.sh [--frontend] [--backend] [--migrate] [--flush-logs] [--debug]"
      exit 1
      ;;
  esac
done

# Default: solo backend
if ! $DO_FRONTEND && ! $DO_BACKEND; then
  DO_BACKEND=true
fi

$DO_DEBUG && set -x
set -euo pipefail

# ─── Helpers ───────────────────────────────────────────────────────────────────
log()  { echo "  $*"; }
ok()   { echo "  ✓ $*"; }
warn() { echo "  ⚠ $*"; }
step() { echo ""; echo "▶ $*"; }
die()  { echo ""; echo "  ✗ $*" >&2; exit 1; }

# ─── Deploy frontend ───────────────────────────────────────────────────────────

deploy_frontend() {
  step "[frontend] Build..."
  npm run build

  step "[frontend] Creando destino en VPS: ${FRONTEND_DEST}..."
  ssh "${VPS}" "mkdir -p ${FRONTEND_DEST}"

  step "[frontend] Uploading dist/ → ${VPS}:${FRONTEND_DEST}/"
  rsync -az --delete dist/ "${VPS}:${FRONTEND_DEST}/"

  step "[frontend] Reload Nginx..."
  ssh "${VPS}" "nginx -t && systemctl reload nginx"

  ok "[frontend] Listo."
}

# ─── Deploy backend ────────────────────────────────────────────────────────────

deploy_backend() {
  # 1. Crear directorios
  step "[backend] Creando directorios en VPS..."
  ssh "${VPS}" "mkdir -p ${REMOTE_DIR}/server ${REMOTE_DIR}/core ${REMOTE_DIR}/scripts"

  # 2. Eliminar proceso legacy si existe
  step "[backend] Verificando proceso legacy '${PM2_LEGACY}'..."
  ssh "${VPS}" "
    if pm2 show ${PM2_LEGACY} >/dev/null 2>&1; then
      echo '  ⚠ Proceso legacy ${PM2_LEGACY} encontrado — eliminando...'
      pm2 delete ${PM2_LEGACY}
      pm2 save --force
    else
      echo '  — Sin proceso legacy (OK)'
    fi
  "

  # 3. Rsync — sin .env, sin node_modules
  step "[backend] Subiendo server/ core/ scripts/ → VPS..."

  rsync -az --delete \
    --exclude='node_modules/' \
    --exclude='.env' \
    --exclude='notifications.json' \
    --exclude='logs/' \
    --exclude='BUILD_INFO.json' \
    server/ "${VPS}:${REMOTE_DIR}/server/"

  rsync -az --delete \
    core/ "${VPS}:${REMOTE_DIR}/core/"

  rsync -az --delete \
    scripts/ "${VPS}:${REMOTE_DIR}/scripts/"

  # 4. Prisma: solo si existe localmente
  if [ -d "prisma" ]; then
    step "[backend] Subiendo prisma/ → VPS..."
    ssh "${VPS}" "mkdir -p ${REMOTE_DIR}/prisma"
    rsync -az --delete \
      prisma/ "${VPS}:${REMOTE_DIR}/prisma/"
  else
    log "prisma/ no encontrada localmente — omitiendo."
  fi

  # 5. npm install
  step "[backend] Instalando dependencias (npm install --omit=dev)..."
  ssh "${VPS}" "cd ${REMOTE_DIR}/server && npm install --omit=dev --silent"

  # 6. Generar BUILD_INFO.json en VPS
  step "[backend] Generando BUILD_INFO.json en VPS..."
  ssh "${VPS}" "cd ${REMOTE_DIR} && node -e \"const fs=require('fs'); const o={builtAt:new Date().toISOString(), node:process.version}; fs.writeFileSync('./server/BUILD_INFO.json', JSON.stringify(o,null,2)); console.log('BUILD_INFO', o);\""

  # 7. Vaciar logs si se pidió
  if $DO_FLUSH; then
    step "[backend] Vaciando logs PM2..."
    ssh "${VPS}" "pm2 flush ${PM2_APP} 2>/dev/null || true"
  fi

  # 8. Migraciones si se pidió (antes de restart para no servir código nuevo con DB vieja)
  if $DO_MIGRATE; then
    run_migrations
  fi

  # 9. Restart PM2
  step "[backend] Reiniciando PM2 '${PM2_APP}'..."
  ssh "${VPS}" "
    set -e
    ECOSYSTEM=${REMOTE_DIR}/server/ecosystem.config.js
    if pm2 show ${PM2_APP} >/dev/null 2>&1; then
      pm2 restart ${PM2_APP} --update-env
    else
      echo '  ⚠ Proceso no existe — iniciando desde ecosystem.config.js...'
      if [ -f \"\$ECOSYSTEM\" ]; then
        pm2 start \"\$ECOSYSTEM\"
      else
        pm2 start index.js --name ${PM2_APP} --cwd ${REMOTE_DIR}/server
      fi
    fi
    pm2 save --force
  "

  # 10. Health check
  step "[backend] Verificando health check..."
  health_check

  ok "[backend] Deploy completado."
}

# ─── Migraciones Prisma ────────────────────────────────────────────────────────

run_migrations() {
  step "[migrate] Ejecutando migraciones en VPS..."
  ssh "${VPS}" "bash ${REMOTE_DIR}/scripts/vps-migrate.sh" || {
    die "Migraciones fallaron. Diagnóstico: ssh ${VPS} 'bash ${REMOTE_DIR}/scripts/vps-migrate.sh'"
  }
  ok "[migrate] Migraciones aplicadas."
}

# ─── Health Check ──────────────────────────────────────────────────────────────

health_check() {
  local attempt=0 code

  # Primero: health local en VPS (más rápido, sin DNS/SSL)
  log "Health local en VPS (${HEALTH_LOCAL})..."
  local local_ok=false
  for i in $(seq 1 $HEALTH_RETRIES); do
    code=$(ssh "${VPS}" \
      "curl -s -o /dev/null -w '%{http_code}' --max-time 4 '${HEALTH_LOCAL}' 2>/dev/null || echo 000")
    if [ "${code}" = "200" ]; then
      ok "Health local OK (HTTP 200) — intento ${i}/${HEALTH_RETRIES}"
      local_ok=true
      break
    fi
    log "Intento ${i}/${HEALTH_RETRIES}: HTTP ${code} — esperando ${HEALTH_WAIT}s..."
    sleep "${HEALTH_WAIT}"
  done

  if ! $local_ok; then
    echo ""
    echo "  ✗ Health check local FALLÓ tras ${HEALTH_RETRIES} intentos."
    echo ""
    echo "  Últimas 30 líneas de log PM2:"
    ssh "${VPS}" "pm2 logs ${PM2_APP} --lines 30 --nostream 2>/dev/null || true" || true
    echo ""
    echo "  Diagnóstico: ssh ${VPS}"
    echo "    pm2 status"
    echo "    pm2 logs ${PM2_APP} --lines 50 --nostream"
    echo "    bash ${REMOTE_DIR}/scripts/vps-sanity-check.sh --local"
    exit 1
  fi

  # Segundo: health externo (valida Nginx + SSL)
  log "Health externo (${HEALTH_URL})..."
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "${HEALTH_URL}" 2>/dev/null || echo "000")
  if [ "${code}" = "200" ]; then
    ok "Health externo OK (HTTP 200)"
  else
    warn "Health externo: HTTP ${code} — Nginx o DNS puede estar afectado"
    warn "El backend local funciona. Verifica: nginx -t && systemctl reload nginx"
  fi
}

# ─── Main ──────────────────────────────────────────────────────────────────────

echo ""
echo "══════════════════════════════════════════════"
echo "  Trackeo.cl — Deploy → ${VPS}"
printf "  Frontend: %-5s | Backend: %s\n" "$DO_FRONTEND" "$DO_BACKEND"
printf "  Migrate:  %-5s | Flush:   %s\n" "$DO_MIGRATE"  "$DO_FLUSH"
echo "══════════════════════════════════════════════"

$DO_FRONTEND && deploy_frontend
$DO_BACKEND  && deploy_backend

echo ""
echo "══════════════════════════════════════════════"
echo "  ✓ Deploy completado."
echo "══════════════════════════════════════════════"
echo ""
