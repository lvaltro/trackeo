-- Migration: 20260303000000_add_maintenance_records
-- Tabla standalone para registros de mantenimiento de activos/vehículos.
-- vehicle_id almacena el device_id de la tabla devices (el mismo UUID que usa vehicles_status).
-- Sin FK constraints para evitar conflictos con tablas pre-existentes en Supabase.

-- ─── Tabla principal ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "maintenance_records" (
    "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id"      UUID         NOT NULL,
    "type"            VARCHAR(50)  NOT NULL DEFAULT 'other',
    "title"           VARCHAR(255) NOT NULL,
    "notes"           TEXT,
    "scheduled_date"  DATE,
    "scheduled_km"    DECIMAL(10, 2),
    "next_service_km" DECIMAL(10, 2),
    "completed_date"  DATE,
    "completed_km"    DECIMAL(10, 2),
    "completed_by"    VARCHAR(255),
    "cost"            DECIMAL(10, 2),
    "invoice_url"     VARCHAR(500),
    "status"          VARCHAR(20)  NOT NULL DEFAULT 'scheduled',
    "metadata"        JSONB        NOT NULL DEFAULT '{}',
    "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- ─── Índices ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "maintenance_records_vehicle_id_idx"
    ON "maintenance_records" ("vehicle_id");

CREATE INDEX IF NOT EXISTS "maintenance_records_status_idx"
    ON "maintenance_records" ("status");

CREATE INDEX IF NOT EXISTS "maintenance_records_vehicle_status_idx"
    ON "maintenance_records" ("vehicle_id", "status");

-- ─── Trigger: auto-actualizar updated_at ──────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS maintenance_records_set_updated_at ON "maintenance_records";
CREATE TRIGGER maintenance_records_set_updated_at
    BEFORE UPDATE ON "maintenance_records"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- El servidor usa SUPABASE_SERVICE_ROLE_KEY → bypass automático de RLS.
-- Esta política permite que futuros clientes autenticados (Supabase Auth) lean sus datos.

ALTER TABLE "maintenance_records" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "maintenance_records_all" ON "maintenance_records";
CREATE POLICY "maintenance_records_all" ON "maintenance_records"
    USING (true)
    WITH CHECK (true);
