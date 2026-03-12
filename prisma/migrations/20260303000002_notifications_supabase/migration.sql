-- Migration: notifications (reemplaza almacén en memoria)
-- Usa los mismos nombres de campo que usa el frontend (tipo, mensaje, leido, etc.)
-- para no romper NotificationsDropdown.jsx ni useNotifications.js.
-- Standalone (sin FK) — vehicle_id es el device_id de Traccar (TEXT).

CREATE TABLE IF NOT EXISTS "notifications" (
    "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
    "user_id"      TEXT         NOT NULL,
    "tipo"         VARCHAR(30)  NOT NULL,
    "mensaje"      TEXT         NOT NULL,
    "dispositivo"  VARCHAR(255),
    "leido"        BOOLEAN      NOT NULL DEFAULT false,
    "fuente"       VARCHAR(20)  NOT NULL DEFAULT 'alerta',
    "data"         JSONB        NOT NULL DEFAULT '{}',
    "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx"    ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "notifications_leido_idx"      ON "notifications" ("leido");

-- RLS
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_allow_all" ON "notifications";
CREATE POLICY "notifications_allow_all"
    ON "notifications"
    FOR ALL
    USING (true)
    WITH CHECK (true);
