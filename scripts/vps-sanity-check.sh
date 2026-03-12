#!/usr/bin/env bash
# scripts/vps-sanity-check.sh — Auditoría de infra del VPS de Trackeo.cl
#
# Ejecutar desde local (SSH automático):
#   bash scripts/vps-sanity-check.sh
#
# Ejecutar directamente en VPS:
#   bash /root/personas-trackeo/scripts/vps-sanity-check.sh --local

set -uo pipefail

VPS="root@76.13.81.62"
REMOTE_DIR="/root/personas-trackeo"
PM2_APP="app-trackeo"
PM2_LEGACY="trackeo-api"
PORT=3001
LOCAL_HEALTH="http://127.0.0.1:${PORT}/api/app/health"
EXTERNAL_HEALTH="https://app.trackeo.cl/api/app/health"

# ─── Modo --local: ejecuta los checks en la máquina actual (el VPS) ───────────

if [[ "${1:-}" == "--local" ]]; then

  PASS=0; FAIL=0; WARN=0
  ok()   { echo "  [OK]   $*"; PASS=$((PASS+1)); }
  fail() { echo "  [FAIL] $*"; FAIL=$((FAIL+1)); }
  warn() { echo "  [WARN] $*"; WARN=$((WARN+1)); }
  info() { echo "         $*"; }

  echo ""
  echo "══════════════════════════════════════════════"
  echo "  VPS Sanity Check — $(date '+%Y-%m-%d %H:%M:%S')"
  echo "══════════════════════════════════════════════"

  # ── 1. PM2: app-trackeo existe y está online ────────────────────────────────
  echo ""
  echo "▶ PM2"

  if pm2 show "${PM2_APP}" >/dev/null 2>&1; then
    PM2_LINE=$(pm2 show "${PM2_APP}" 2>/dev/null | grep -E 'status|pid|cpu|memory|restart' | \
      awk -F'│' '{gsub(/^[ \t]+|[ \t]+$/,"",$2); gsub(/^[ \t]+|[ \t]+$/,"",$3); if($2!="" && $3!="") printf "  %s: %s\n",$2,$3}' | head -8)

    STATUS=$(pm2 show "${PM2_APP}" 2>/dev/null | grep -i '│ status' | grep -oE 'online|stopped|errored|stopping' | head -1)
    if [ "${STATUS}" = "online" ]; then
      ok "'${PM2_APP}' está ONLINE"
      echo "${PM2_LINE}"
    else
      fail "'${PM2_APP}' estado: '${STATUS:-desconocido}'"
      echo "${PM2_LINE}"
    fi
  else
    fail "Proceso '${PM2_APP}' NO existe en PM2"
    info "Fix: cd ${REMOTE_DIR}/server && pm2 start ecosystem.config.js && pm2 save"
  fi

  # ── 2. PM2: proceso legacy NO debe existir ──────────────────────────────────
  if pm2 show "${PM2_LEGACY}" >/dev/null 2>&1; then
    fail "Proceso legacy '${PM2_LEGACY}' EXISTE — ocupa el puerto ${PORT}"
    info "Fix: pm2 delete ${PM2_LEGACY} && pm2 save --force"
  else
    ok "Sin proceso legacy '${PM2_LEGACY}'"
  fi

  # ── 3. Puerto 3001 ──────────────────────────────────────────────────────────
  echo ""
  echo "▶ Puerto ${PORT}"

  LISTENERS=$(ss -tlnp 2>/dev/null | grep ":${PORT} " || true)
  if [ -n "${LISTENERS}" ]; then
    # Contar cuántos procesos escuchan
    COUNT=$(echo "${LISTENERS}" | wc -l)
    PID=$(echo "${LISTENERS}" | grep -oP 'pid=\K[0-9]+' | head -1 || echo "")
    PNAME=""
    [ -n "${PID}" ] && PNAME=$(ps -p "${PID}" -o comm= 2>/dev/null || echo "")

    if [ "${COUNT}" -gt 1 ]; then
      fail "MÚLTIPLES procesos escuchan en :${PORT} (${COUNT}) — posible conflicto"
      echo "${LISTENERS}" | sed 's/^/    /'
    else
      ok "Puerto ${PORT} en uso por PID ${PID:-?} (${PNAME:-node})"
    fi
  else
    fail "Nadie escucha en el puerto ${PORT}"
    info "El proceso PM2 puede estar caído. Ver: pm2 logs ${PM2_APP} --lines 30 --nostream"
  fi

  # ── 4. Health check local ───────────────────────────────────────────────────
  echo ""
  echo "▶ Health Check"

  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${LOCAL_HEALTH}" 2>/dev/null || echo "000")
  if [ "${CODE}" = "200" ]; then
    BODY=$(curl -s --max-time 5 "${LOCAL_HEALTH}" 2>/dev/null | \
      python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'),'|',d.get('timestamp','?'))" \
      2>/dev/null || echo "")
    ok "Local HTTP ${CODE} — ${BODY}"
  else
    fail "Local HTTP ${CODE} (esperado 200)"
    info "Endpoint: ${LOCAL_HEALTH}"
  fi

  # ── 5. Nginx ────────────────────────────────────────────────────────────────
  echo ""
  echo "▶ Nginx"

  if nginx -t 2>&1 | grep -q "syntax is ok"; then
    ok "nginx -t: configuración válida"
  else
    fail "nginx -t: ERROR de sintaxis"
    nginx -t 2>&1 | grep -v "^$" | sed 's/^/    /'
  fi

  if systemctl is-active --quiet nginx 2>/dev/null; then
    ok "nginx: activo (systemd)"
  else
    fail "nginx: NO activo"
    info "Fix: systemctl start nginx"
  fi

  # ── 6. Archivos críticos ────────────────────────────────────────────────────
  echo ""
  echo "▶ Archivos del proyecto"

  REQUIRED_FILES=(
    "${REMOTE_DIR}/server/index.js"
    "${REMOTE_DIR}/server/.env"
    "${REMOTE_DIR}/server/ecosystem.config.js"
    "${REMOTE_DIR}/core/notifications/index.js"
    "${REMOTE_DIR}/core/maintenance/index.js"
  )
  OPTIONAL_FILES=(
    "${REMOTE_DIR}/prisma/schema.prisma"
    "${REMOTE_DIR}/scripts/vps-migrate.sh"
  )

  for f in "${REQUIRED_FILES[@]}"; do
    if [ -f "$f" ]; then
      SIZE=$(wc -c < "$f" 2>/dev/null || echo "?")
      ok "${f##${REMOTE_DIR}/} (${SIZE}B)"
    else
      fail "FALTA: ${f}"
    fi
  done
  for f in "${OPTIONAL_FILES[@]}"; do
    if [ -f "$f" ]; then
      SIZE=$(wc -c < "$f" 2>/dev/null || echo "?")
      ok "${f##${REMOTE_DIR}/} (${SIZE}B)"
    else
      warn "Opcional faltante: ${f##${REMOTE_DIR}/}"
    fi
  done

  # ── 7. Variables de entorno (sin imprimir valores) ──────────────────────────
  echo ""
  echo "▶ Variables de entorno (server/.env)"

  ENV_FILE="${REMOTE_DIR}/server/.env"
  if [ -f "${ENV_FILE}" ]; then
    REQUIRED_VARS=(TRACCAR_API_URL APP_URL GEOCODE_PORT SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY)
    OPTIONAL_VARS=(DATABASE_URL TRACCAR_ADMIN_EMAIL TRACCAR_ADMIN_PASSWORD)

    for VAR in "${REQUIRED_VARS[@]}"; do
      if grep -qE "^${VAR}=.+" "${ENV_FILE}"; then
        ok "${VAR}: definido"
      else
        fail "${VAR}: FALTA en server/.env"
      fi
    done
    for VAR in "${OPTIONAL_VARS[@]}"; do
      if grep -qE "^${VAR}=.+" "${ENV_FILE}"; then
        ok "${VAR}: definido"
      else
        warn "${VAR}: no definido (opcional)"
      fi
    done
  else
    fail "server/.env NO existe en VPS"
    info "El .env solo vive en el VPS — NO se sube con rsync"
  fi

  # ── 8. Migraciones (informativo) ────────────────────────────────────────────
  echo ""
  echo "▶ Prisma"

  PRISMA_DIR="${REMOTE_DIR}/prisma/migrations"
  if [ -d "${PRISMA_DIR}" ]; then
    COUNT=$(ls "${PRISMA_DIR}" 2>/dev/null | grep -v migration_lock | wc -l)
    ok "${COUNT} migraciones en disco"
    ls "${PRISMA_DIR}" 2>/dev/null | grep -v migration_lock | sort | tail -5 | sed 's/^/    ↳ /'
  else
    warn "prisma/migrations/ no existe en VPS (ejecuta deploy con --migrate)"
  fi

  # ── Resumen ──────────────────────────────────────────────────────────────────
  echo ""
  echo "══════════════════════════════════════════════"
  TOTAL=$((PASS + FAIL + WARN))
  if [ $FAIL -eq 0 ]; then
    echo "  ✓ INFRA OK — ${PASS} OK, ${WARN} avisos, 0 fallos (${TOTAL} checks)"
  else
    echo "  ✗ PROBLEMAS — ${FAIL} fallos, ${WARN} avisos, ${PASS} OK (${TOTAL} checks)"
  fi
  echo "══════════════════════════════════════════════"
  echo ""

  [ $FAIL -eq 0 ]
  exit $?
fi

# ─── Modo remoto: SSH → VPS → ejecuta --local ─────────────────────────────────

echo ""
echo "══════════════════════════════════════════════"
echo "  VPS Sanity Check → ${VPS}"
echo "══════════════════════════════════════════════"

ssh "${VPS}" "bash ${REMOTE_DIR}/scripts/vps-sanity-check.sh --local"
VPS_CODE=$?

# Health check externo (desde local → valida DNS + SSL + Nginx completo)
echo ""
echo "▶ Health Check externo (desde esta máquina)"
EXT_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${EXTERNAL_HEALTH}" 2>/dev/null || echo "000")
if [ "${EXT_CODE}" = "200" ]; then
  echo "  [OK]   HTTP ${EXT_CODE} — ${EXTERNAL_HEALTH}"
else
  echo "  [FAIL] HTTP ${EXT_CODE} — ${EXTERNAL_HEALTH}"
  VPS_CODE=1
fi

echo ""
exit ${VPS_CODE}
