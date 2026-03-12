-- Bloque 2 saneamiento: device_positions (histórico) + device_events con recorded_at
-- Ejecutar en Supabase SQL Editor. Idempotente.

-- =============================================================================
-- 1. device_positions — tabla normal (no particionada) para histórico GPS
-- =============================================================================

CREATE TABLE IF NOT EXISTS device_positions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL,
  latitude    double precision NOT NULL,
  longitude   double precision NOT NULL,
  speed       double precision,
  attributes  jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_device_positions_device_time
  ON device_positions (device_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_device_positions_recorded_at
  ON device_positions (recorded_at DESC);

-- =============================================================================
-- 2. device_events — estandarizar a recorded_at (renombrar server_time)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'device_events' AND column_name = 'server_time'
  ) THEN
    ALTER TABLE device_events RENAME COLUMN server_time TO recorded_at;
  END IF;
END $$;
