-- Migration: vehicle_documents
-- Tabla de documentos del vehículo con vencimientos.
-- Standalone (sin FK constraints) — compatible con tablas Supabase existentes.

CREATE TABLE IF NOT EXISTS "vehicle_documents" (
    "id"              UUID          NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id"      TEXT          NOT NULL,
    "type"            VARCHAR(50)   NOT NULL,
    "title"           VARCHAR(255)  NOT NULL,
    "issue_date"      DATE,
    "expires_at"      DATE          NOT NULL,
    "notes"           TEXT,
    "reminder_days"   INT[]         NOT NULL DEFAULT ARRAY[30, 7, 0],
    "file_url"        VARCHAR(500),
    "status"          VARCHAR(20)   NOT NULL DEFAULT 'ok',
    "metadata"        JSONB         NOT NULL DEFAULT '{}',
    "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "updated_at"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "vehicle_documents_vehicle_id_idx" ON "vehicle_documents" ("vehicle_id");
CREATE INDEX IF NOT EXISTS "vehicle_documents_expires_at_idx" ON "vehicle_documents" ("expires_at");
CREATE INDEX IF NOT EXISTS "vehicle_documents_status_idx"     ON "vehicle_documents" ("status");

-- Trigger para updated_at (reutiliza función existente si ya existe)
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_vehicle_documents_updated_at ON "vehicle_documents";
CREATE TRIGGER set_vehicle_documents_updated_at
    BEFORE UPDATE ON "vehicle_documents"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

-- RLS
ALTER TABLE "vehicle_documents" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_documents_allow_all" ON "vehicle_documents";
CREATE POLICY "vehicle_documents_allow_all"
    ON "vehicle_documents"
    FOR ALL
    USING (true)
    WITH CHECK (true);
