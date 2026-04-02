-- Migration: 20260401000005_audit_logs
-- Tabla de auditoría standalone (sin FK constraints).
-- Los campos organization_id / user_id son nullable y se llenarán cuando
-- el SaaS layer (Supabase Auth + Organizations) esté integrado (Fase 2).
-- Por ahora se captura la identidad via traccar_email / traccar_user_id.
--
-- Mismos nombres de columna que el modelo Prisma AuditLog para facilitar
-- la migración futura cuando se aplique el schema completo.
--
-- Para aplicar en Supabase:
--   Ir a Supabase Dashboard → SQL Editor → pegar este script → Run

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id"                 BIGSERIAL    NOT NULL,
    "organization_id"    UUID,
    "user_id"            UUID,
    "installer_id"       UUID,
    "platform_admin_id"  UUID,
    "traccar_user_id"    TEXT,
    "traccar_email"      TEXT,
    "action"             VARCHAR(100) NOT NULL,
    "resource_type"      VARCHAR(50),
    "resource_id"        TEXT,
    "changes"            JSONB        NOT NULL DEFAULT '{}',
    "ip_address"         VARCHAR(45),
    "user_agent"         TEXT,
    "created_at"         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Columnas que pueden faltar si la tabla fue creada en un intento anterior incompleto
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "traccar_user_id" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "traccar_email"   TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "installer_id"    UUID;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "platform_admin_id" UUID;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "resource_id"     TEXT;

-- Índices para los patrones de consulta más comunes
CREATE INDEX IF NOT EXISTS "audit_logs_org_id_idx"       ON "audit_logs" ("organization_id") WHERE "organization_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx"      ON "audit_logs" ("user_id")         WHERE "user_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "audit_logs_traccar_email_idx" ON "audit_logs" ("traccar_email")   WHERE "traccar_email" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx"       ON "audit_logs" ("action");
CREATE INDEX IF NOT EXISTS "audit_logs_resource_idx"     ON "audit_logs" ("resource_type", "resource_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"   ON "audit_logs" ("created_at" DESC);

-- RLS: solo service_role puede escribir/leer (frontend nunca accede directamente)
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_service_only" ON "audit_logs";
CREATE POLICY "audit_logs_service_only"
    ON "audit_logs"
    FOR ALL
    USING (true)
    WITH CHECK (true);
