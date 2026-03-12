-- Migration: 20260310000004_add_org_id_standalone_tables
-- Agrega organization_id (nullable) a las 4 tablas standalone que lo necesitan.
-- FASE 1 fix: sin esta columna es imposible filtrar por tenant en estas tablas.
--
-- Columna nullable: los registros existentes quedan con NULL hasta migración de datos.
-- El código en core/ filtrará por organization_id una vez que RBAC esté implementado (task 1.9b).
-- Sin FK constraint: standalone tables no usan Prisma FK para evitar conflictos con tablas existentes.
--
-- Para aplicar en Supabase:
--   Ir a Supabase Dashboard → SQL Editor → pegar este script → Run

-- ─── 1. maintenance_records ──────────────────────────────────────────────────

ALTER TABLE "maintenance_records"
  ADD COLUMN IF NOT EXISTS "organization_id" UUID;

CREATE INDEX IF NOT EXISTS "maintenance_records_org_id_idx"
  ON "maintenance_records" ("organization_id")
  WHERE "organization_id" IS NOT NULL;

-- Índice compuesto para el patrón de query más común: org + vehicle
CREATE INDEX IF NOT EXISTS "maintenance_records_org_vehicle_idx"
  ON "maintenance_records" ("organization_id", "vehicle_id")
  WHERE "organization_id" IS NOT NULL;

-- ─── 2. vehicle_documents ────────────────────────────────────────────────────

ALTER TABLE "vehicle_documents"
  ADD COLUMN IF NOT EXISTS "organization_id" UUID;

CREATE INDEX IF NOT EXISTS "vehicle_documents_org_id_idx"
  ON "vehicle_documents" ("organization_id")
  WHERE "organization_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "vehicle_documents_org_vehicle_idx"
  ON "vehicle_documents" ("organization_id", "vehicle_id")
  WHERE "organization_id" IS NOT NULL;

-- ─── 3. notifications ────────────────────────────────────────────────────────

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "organization_id" UUID;

CREATE INDEX IF NOT EXISTS "notifications_org_id_idx"
  ON "notifications" ("organization_id")
  WHERE "organization_id" IS NOT NULL;

-- ─── 4. vehicle_weekly_stats ─────────────────────────────────────────────────

ALTER TABLE "vehicle_weekly_stats"
  ADD COLUMN IF NOT EXISTS "organization_id" UUID;

CREATE INDEX IF NOT EXISTS "vehicle_weekly_stats_org_id_idx"
  ON "vehicle_weekly_stats" ("organization_id")
  WHERE "organization_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "vehicle_weekly_stats_org_vehicle_idx"
  ON "vehicle_weekly_stats" ("organization_id", "vehicle_id")
  WHERE "organization_id" IS NOT NULL;
