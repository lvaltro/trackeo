-- Trackeo — device_positions (partitioned by month) + device_events (alerts only)
-- Run in Supabase SQL Editor. Enable pg_cron in Dashboard → Database → Extensions first.

-- =============================================================================
-- 1. device_positions — raw GPS time-series, partitioned by month
-- =============================================================================

CREATE TABLE IF NOT EXISTS device_positions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL,
  latitude    double precision NOT NULL,
  longitude   double precision NOT NULL,
  speed       double precision,
  attributes  jsonb DEFAULT '{}'
) PARTITION BY RANGE (recorded_at);

-- Index on parent (applies to all partitions in PG11+)
CREATE INDEX IF NOT EXISTS idx_device_positions_device_time
  ON device_positions (device_id, recorded_at DESC);

-- Optional: first partition so the table is usable before cron runs
-- Replace with your desired start month
CREATE TABLE IF NOT EXISTS device_positions_2025_02 PARTITION OF device_positions
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- =============================================================================
-- 2. device_events — alerts only (ignition, speed, geofence, etc.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS device_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  event_type   text NOT NULL,
  server_time  timestamptz NOT NULL,
  position_data jsonb DEFAULT '{}',
  attributes   jsonb DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_events_device_id_server_time
  ON device_events (device_id, server_time DESC);

CREATE INDEX IF NOT EXISTS idx_device_events_event_type
  ON device_events (event_type) WHERE event_type IS NOT NULL;

-- =============================================================================
-- 3. pg_cron — auto-create next month's partition for device_positions
-- =============================================================================
-- Enable in Supabase: Database → Extensions → pg_cron

CREATE OR REPLACE FUNCTION create_device_positions_partition_for_next_month()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  partition_date date := date_trunc('month', now() + interval '1 month')::date;
  partition_name text := 'device_positions_' || to_char(partition_date, 'YYYY_MM');
  range_start    text := to_char(partition_date, 'YYYY-MM-DD');
  range_end      text := to_char(partition_date + interval '1 month', 'YYYY-MM-DD');
  sql text;
BEGIN
  -- Check if partition already exists
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = partition_name
  ) THEN
    RETURN;
  END IF;

  sql := format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF device_positions FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    range_start,
    range_end
  );
  EXECUTE sql;
END;
$$;

-- Schedule cron: run on the 1st of every month at 00:05
-- (Requires pg_cron extension and cron.schedule available in Supabase.)
SELECT cron.schedule(
  'create-device-positions-partition',
  '5 0 1 * *',  -- At 00:05 on day 1 of every month
  $$SELECT create_device_positions_partition_for_next_month()$$
);

-- To create the next partition manually once:
-- SELECT create_device_positions_partition_for_next_month();
