# Playbook: Agregar una nueva tabla standalone

Para tablas de datos de negocio (no tablas SaaS gestionadas por Prisma).

## 1. Crear la migración SQL

Archivo: `prisma/migrations/<YYYYMMDDHHMMSS>_<nombre>/migration.sql`

```sql
-- Siempre incluir:
CREATE TABLE IF NOT EXISTS "<nombre>" (
    "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id"      TEXT         NOT NULL,     -- o UUID según contexto
    "organization_id" UUID,                       -- OBLIGATORIO desde Fase 1
    -- ... campos del dominio
    "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "<nombre>_pkey" PRIMARY KEY ("id")
);

-- Índices mínimos:
CREATE INDEX IF NOT EXISTS "<nombre>_vehicle_id_idx"  ON "<nombre>" ("vehicle_id");
CREATE INDEX IF NOT EXISTS "<nombre>_org_id_idx"      ON "<nombre>" ("organization_id") WHERE "organization_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "<nombre>_org_vehicle_idx" ON "<nombre>" ("organization_id", "vehicle_id") WHERE "organization_id" IS NOT NULL;

-- Trigger updated_at:
DROP TRIGGER IF EXISTS set_<nombre>_updated_at ON "<nombre>";
CREATE TRIGGER set_<nombre>_updated_at
    BEFORE UPDATE ON "<nombre>"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

-- RLS (service_role_key bypasses this):
ALTER TABLE "<nombre>" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "<nombre>_allow_all" ON "<nombre>";
CREATE POLICY "<nombre>_allow_all" ON "<nombre>" FOR ALL USING (true) WITH CHECK (true);
```

## 2. Aplicar la migración en Supabase

Ir a Supabase Dashboard → SQL Editor → pegar el SQL → Run.

## 3. Crear módulo core/

```javascript
// core/<dominio>/index.js
'use strict';
const { createClient } = require('@supabase/supabase-js');

const TABLE = '<nombre>';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function listBy(vehicleId) {
  const { data, error } = await getClient()
    .from(TABLE).select('*').eq('vehicle_id', vehicleId);
  if (error) throw error;
  return data ?? [];
}

// ... create, update, remove

module.exports = { listBy };
```

## 4. Crear route + schema Zod

Ver `ai/playbooks/add-new-endpoint.md`.

## 5. Agregar al cliente frontend

```javascript
// src/api/<dominio>Api.js
import { apiClient } from './apiClient';

export const miDominioApi = {
  list: (vehicleId) => apiClient.get(`/api/app/<dominio>/${vehicleId}`),
  create: (vehicleId, data) => apiClient.post(`/api/app/<dominio>/${vehicleId}`, data),
};
```

## 6. Crear hook dual-mode

Ver `ai/core/conventions.md` → "Estructura de un nuevo hook frontend".

## Checklist

- [ ] `organization_id UUID` incluido en la tabla (nullable)
- [ ] Índices en `vehicle_id`, `org_id`, y `(org_id, vehicle_id)`
- [ ] Trigger `updated_at` creado
- [ ] RLS habilitado
- [ ] Módulo core/ sin importar Express
- [ ] Campos protegidos destrucurados en create/update
- [ ] Route con Zod schema
- [ ] Hook dual-mode en frontend
- [ ] Test básico
