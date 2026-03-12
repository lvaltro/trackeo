-- =============================================================================
-- Migración: vehicle_status.device_id integer → uuid
-- Ejecutar en Supabase SQL Editor.
-- Idempotente: verifica el tipo actual antes de actuar.
-- =============================================================================

DO $$
BEGIN

  -- Solo actúa si device_id sigue siendo integer
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'vehicle_status'
      AND column_name  = 'device_id'
      AND data_type    = 'integer'
  ) THEN

    -- 1. Vaciar filas inválidas (IDs enteros de Traccar, no UUIDs de Supabase)
    TRUNCATE TABLE vehicle_status;

    -- 2. Eliminar índices sobre device_id (si existen)
    DROP INDEX IF EXISTS idx_vehicles_status_device_id;
    DROP INDEX IF EXISTS idx_vehicle_status_device_id;

    -- 3. Eliminar constraints existentes sobre device_id
    ALTER TABLE vehicle_status
      DROP CONSTRAINT IF EXISTS vehicle_status_pkey,
      DROP CONSTRAINT IF EXISTS vehicle_status_device_id_key,
      DROP CONSTRAINT IF EXISTS fk_vehicle_status_device;

    -- 4. Cambiar tipo de columna
    ALTER TABLE vehicle_status
      DROP COLUMN device_id;

    ALTER TABLE vehicle_status
      ADD COLUMN device_id uuid NOT NULL;

  END IF;

END $$;

-- =============================================================================
-- FK hacia devices(id) — idempotente
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema    = 'public'
      AND table_name      = 'vehicle_status'
      AND constraint_name = 'fk_vehicle_status_device'
  ) THEN
    ALTER TABLE vehicle_status
      ADD CONSTRAINT fk_vehicle_status_device
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================================================
-- UNIQUE constraint en device_id — requerido para onConflict('device_id')
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema    = 'public'
      AND table_name      = 'vehicle_status'
      AND constraint_name = 'vehicle_status_device_id_key'
  ) THEN
    ALTER TABLE vehicle_status
      ADD CONSTRAINT vehicle_status_device_id_key UNIQUE (device_id);
  END IF;
END $$;

-- =============================================================================
-- Índice en last_update (para queries de estado reciente)
-- =============================================================================

DROP INDEX IF EXISTS idx_vehicles_status_last_update;

CREATE INDEX IF NOT EXISTS idx_vehicle_status_last_update
  ON vehicle_status (last_update DESC);
