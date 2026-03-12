-- Trackeo — Indexes for device_events and vehicles_status
-- Run in Supabase SQL Editor when ready (adjust table names if different).

-- device_events: resolve by device and time (history, reports)
CREATE INDEX IF NOT EXISTS idx_device_events_device_id_server_time
  ON device_events (device_id, server_time DESC);

-- Optional: filter by event type
CREATE INDEX IF NOT EXISTS idx_device_events_event_type
  ON device_events (event_type) WHERE event_type IS NOT NULL;

-- vehicles_status: recently updated devices (optional)
CREATE INDEX IF NOT EXISTS idx_vehicles_status_last_update
  ON vehicles_status (last_update DESC);
