#!/usr/bin/env bash
# scripts/vps-migrate.sh — Migraciones Prisma en VPS (ejecutar DIRECTAMENTE en el VPS)
#
# Uso (desde VPS):
#   bash /root/personas-trackeo/scripts/vps-migrate.sh
#
# O remotamente desde deploy.sh via:
#   ssh root@76.13.81.62 "bash /root/personas-trackeo/scripts/vps-migrate.sh"
#
# Requisito: DATABASE_URL en /root/personas-trackeo/server/.env
#   Formato: postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
#   O pooled: postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

set -euo pipefail

REMOTE_DIR="/root/personas-trackeo"
ENV_FILE="${REMOTE_DIR}/server/.env"
SCHEMA_PATH="${REMOTE_DIR}/prisma/schema.prisma"
MIGRATIONS_DIR="${REMOTE_DIR}/prisma/migrations"
OLD_MIGRATION="20260218165304_gestion_ahorro_documentacion"

echo ""
echo "══════════════════════════════════════════════"
echo "  Trackeo.cl — Prisma Migrate Deploy"
echo "══════════════════════════════════════════════"

# ─── Verificar prerequisitos ──────────────────────────────────────────────────

if [ ! -f "${ENV_FILE}" ]; then
  echo "✗ No se encontró ${ENV_FILE}"
  exit 1
fi

if [ ! -f "${SCHEMA_PATH}" ]; then
  echo "✗ No se encontró ${SCHEMA_PATH}"
  echo "  ¿Corriste el deploy con prisma/ incluido?"
  exit 1
fi

if [ ! -d "${MIGRATIONS_DIR}" ]; then
  echo "✗ No se encontró ${MIGRATIONS_DIR}/"
  exit 1
fi

# ─── Cargar DATABASE_URL desde server/.env (SIN imprimir el valor) ────────────

DATABASE_URL=$(grep -E '^DATABASE_URL=' "${ENV_FILE}" | cut -d= -f2- | tr -d '"'"'" 2>/dev/null || echo "")

if [ -z "${DATABASE_URL}" ]; then
  echo ""
  echo "✗ DATABASE_URL no encontrado en ${ENV_FILE}"
  echo ""
  echo "  Para obtenerlo, ve a Supabase → Project Settings → Database → Connection string"
  echo "  Copia la URL tipo 'URI' y agrégala en VPS:"
  echo ""
  echo "  ssh root@76.13.81.62"
  echo "  echo 'DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres' >> /root/personas-trackeo/server/.env"
  echo ""
  echo "  IMPORTANTE: No commitees DATABASE_URL — solo vive en el VPS."
  exit 1
fi

echo "  ✓ DATABASE_URL encontrado en ${ENV_FILE}"

# ─── Verificar node + npx disponibles ────────────────────────────────────────

if ! command -v node >/dev/null 2>&1; then
  echo "✗ node no está instalado en el VPS"
  exit 1
fi

NODE_VER=$(node --version)
echo "  ✓ Node ${NODE_VER}"

# ─── Verificar que prisma esté instalado en server/node_modules ──────────────

PRISMA_BIN="${REMOTE_DIR}/server/node_modules/.bin/prisma"

if [ ! -f "${PRISMA_BIN}" ]; then
  echo "  ⚠ prisma no encontrado en node_modules — ejecutando npm install..."
  cd "${REMOTE_DIR}/server" && npm install --omit=dev --silent
fi

echo "  ✓ Prisma CLI disponible"

# ─── Mostrar migraciones pendientes ──────────────────────────────────────────

echo ""
echo "  Migraciones en disco:"
ls "${MIGRATIONS_DIR}" | grep -v migration_lock | sed 's/^/    /'
echo ""

# ─── Manejar baseline de la migración legacy ─────────────────────────────────
#
# Si la DB ya tiene tablas (la migración vieja fue aplicada manualmente en Supabase
# pero Prisma no la conoce), hay que marcarla como "applied" para que no intente
# volver a crearla. Solo hacemos esto si Prisma reporta "already exists" error.

export DATABASE_URL

echo "▶ Ejecutando: npx prisma migrate deploy --schema=${SCHEMA_PATH}"
echo ""

MIGRATE_OUTPUT=$(cd "${REMOTE_DIR}/server" && \
  "${PRISMA_BIN}" migrate deploy --schema="${SCHEMA_PATH}" 2>&1) || {
  EXIT_CODE=$?

  # Detectar error de tabla ya existente → baseline necesario
  if echo "${MIGRATE_OUTPUT}" | grep -qiE "already exists|relation.*exists|P3009"; then
    echo "  ⚠ La migración antigua ya existe en DB — aplicando baseline..."
    "${PRISMA_BIN}" migrate resolve \
      --applied "${OLD_MIGRATION}" \
      --schema="${SCHEMA_PATH}" 2>&1 || true

    echo ""
    echo "▶ Reintentando migrate deploy..."
    "${PRISMA_BIN}" migrate deploy --schema="${SCHEMA_PATH}" 2>&1 || {
      echo "✗ Las migraciones siguen fallando tras el baseline."
      echo "  Salida completa:"
      echo "${MIGRATE_OUTPUT}"
      exit 1
    }
  else
    echo "✗ Error en migrate deploy:"
    echo "${MIGRATE_OUTPUT}"
    exit ${EXIT_CODE}
  fi
}

# Imprimir salida (ya ejecutado sin error)
echo "${MIGRATE_OUTPUT:-Migraciones OK}"

echo ""
echo "══════════════════════════════════════════════"
echo "  ✓ Migraciones aplicadas correctamente."
echo "══════════════════════════════════════════════"
echo ""
