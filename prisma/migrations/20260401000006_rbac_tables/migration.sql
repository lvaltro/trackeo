-- Migration: 20260401000006_rbac_tables
-- Tablas RBAC standalone (sin FK a tablas Prisma que aún no existen en prod).
-- Diseñadas para cuando Supabase Auth esté integrado (Fase 2).
--
-- Para aplicar en Supabase:
--   Ir a Supabase Dashboard → SQL Editor → pegar este script → Run

-- ─── 1. roles ─────────────────────────────────────────────────────────────────
-- Roles del sistema con sus permisos default en JSONB.
-- is_system = true: roles predefinidos que no se pueden eliminar.

CREATE TABLE IF NOT EXISTS "roles" (
    "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
    "name"        VARCHAR(50) NOT NULL,
    "permissions" JSONB       NOT NULL DEFAULT '[]',
    "is_system"   BOOLEAN     NOT NULL DEFAULT true,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "roles_pkey"        PRIMARY KEY ("id"),
    CONSTRAINT "roles_name_unique" UNIQUE ("name")
);

-- ─── 2. user_roles ────────────────────────────────────────────────────────────
-- Asignación usuario → rol dentro de una organización.
-- user_id / organization_id son UUIDs de Supabase Auth / organizations.
-- Sin FK constraints (esas tablas no existen aún en prod).

CREATE TABLE IF NOT EXISTS "user_roles" (
    "user_id"         UUID        NOT NULL,
    "organization_id" UUID        NOT NULL,
    "role_id"         UUID        NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "assigned_by"     UUID,
    "assigned_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "revoked_at"      TIMESTAMPTZ,
    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "organization_id", "role_id")
);

CREATE INDEX IF NOT EXISTS "user_roles_user_org_idx" ON "user_roles" ("user_id", "organization_id");

-- ─── 3. driver_vehicle_assignments ────────────────────────────────────────────
-- Driver solo ve el vehículo que tiene asignado.
-- vehicle_id = device_id de Traccar (TEXT).

CREATE TABLE IF NOT EXISTS "driver_vehicle_assignments" (
    "user_id"         UUID        NOT NULL,
    "vehicle_id"      TEXT        NOT NULL,
    "organization_id" UUID,
    "assigned_by"     UUID,
    "assigned_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "revoked_at"      TIMESTAMPTZ,
    CONSTRAINT "driver_vehicle_assignments_pkey" PRIMARY KEY ("user_id", "vehicle_id")
);

CREATE INDEX IF NOT EXISTS "driver_vehicle_assignments_user_idx" ON "driver_vehicle_assignments" ("user_id")
    WHERE "revoked_at" IS NULL;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE "roles"                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "driver_vehicle_assignments" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_allow_all"                      ON "roles";
DROP POLICY IF EXISTS "user_roles_allow_all"                 ON "user_roles";
DROP POLICY IF EXISTS "driver_vehicle_assignments_allow_all" ON "driver_vehicle_assignments";

CREATE POLICY "roles_allow_all"                      ON "roles"                     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "user_roles_allow_all"                 ON "user_roles"                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "driver_vehicle_assignments_allow_all" ON "driver_vehicle_assignments" FOR ALL USING (true) WITH CHECK (true);

-- ─── Seed: roles del sistema ──────────────────────────────────────────────────

INSERT INTO "roles" ("name", "permissions", "is_system") VALUES
('SUPER_ADMIN', '["*"]', true),
('OWNER', '[
  "VEHICLE_READ","VEHICLE_WRITE","VEHICLE_COMMAND",
  "REPORT_VIEW","REPORT_EXPORT",
  "USER_INVITE","USER_MANAGE",
  "PLAN_VIEW","PLAN_CHANGE","ORG_DELETE",
  "ALERT_READ","ALERT_WRITE",
  "GEOFENCE_READ","GEOFENCE_WRITE",
  "MAINTENANCE_READ","MAINTENANCE_WRITE",
  "DOCUMENT_READ","DOCUMENT_WRITE",
  "NOTIFICATION_READ","INSTALLER_REVOKE",
  "TELEMETRY_READ","AUDIT_READ"
]', true),
('ADMIN', '[
  "VEHICLE_READ","VEHICLE_WRITE","VEHICLE_COMMAND",
  "REPORT_VIEW","REPORT_EXPORT",
  "USER_INVITE",
  "PLAN_VIEW",
  "ALERT_READ","ALERT_WRITE",
  "GEOFENCE_READ","GEOFENCE_WRITE",
  "MAINTENANCE_READ","MAINTENANCE_WRITE",
  "DOCUMENT_READ","DOCUMENT_WRITE",
  "NOTIFICATION_READ",
  "TELEMETRY_READ"
]', true),
('DRIVER', '[
  "VEHICLE_READ",
  "REPORT_VIEW",
  "ALERT_READ",
  "MAINTENANCE_READ",
  "NOTIFICATION_READ"
]', true),
('INSTALLER', '[
  "VEHICLE_READ",
  "VEHICLE_COMMAND",
  "TELEMETRY_READ"
]', true)
ON CONFLICT ("name") DO NOTHING;
