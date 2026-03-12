-- Migration: vehicle_weekly_stats
-- Stats semanales por vehículo calculadas desde device_positions / device_events.
-- vehicle_id = device_id de Traccar (TEXT). week_start = lunes de la semana (DATE).

CREATE TABLE IF NOT EXISTS "vehicle_weekly_stats" (
    "id"                    UUID         NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id"            TEXT         NOT NULL,
    "week_start"            DATE         NOT NULL,
    "km_total"              DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "driving_minutes"       INT          NOT NULL DEFAULT 0,
    "trips_count"           INT          NOT NULL DEFAULT 0,
    "max_speed_kmh"         DECIMAL(6, 2) NOT NULL DEFAULT 0,
    "avg_speed_kmh"         DECIMAL(6, 2) NOT NULL DEFAULT 0,
    "overspeed_count"       INT          NOT NULL DEFAULT 0,
    "harsh_brake_count"     INT          NOT NULL DEFAULT 0,
    "harsh_accel_count"     INT          NOT NULL DEFAULT 0,
    "score"                 INT          NOT NULL DEFAULT 100,
    "prev_score"            INT,
    "prev_km"               DECIMAL(10, 2),
    "daily_km"              JSONB        NOT NULL DEFAULT '{}',
    "calculated_at"         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "created_at"            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "vehicle_weekly_stats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vehicle_weekly_stats_unique" UNIQUE ("vehicle_id", "week_start")
);

-- Índices
CREATE INDEX IF NOT EXISTS "vehicle_weekly_stats_vehicle_id_idx"  ON "vehicle_weekly_stats" ("vehicle_id");
CREATE INDEX IF NOT EXISTS "vehicle_weekly_stats_week_start_idx"  ON "vehicle_weekly_stats" ("week_start" DESC);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_vehicle_weekly_stats_updated_at ON "vehicle_weekly_stats";
CREATE TRIGGER set_vehicle_weekly_stats_updated_at
    BEFORE UPDATE ON "vehicle_weekly_stats"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

-- RLS
ALTER TABLE "vehicle_weekly_stats" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_weekly_stats_allow_all" ON "vehicle_weekly_stats";
CREATE POLICY "vehicle_weekly_stats_allow_all"
    ON "vehicle_weekly_stats"
    FOR ALL
    USING (true)
    WITH CHECK (true);
