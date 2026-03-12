# Bloque 2 — Plan de saneamiento (capa histórica telemetría)

## 1. Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| **Crear** | `docs/migrations/supabase_telemetry_recorded_at.sql` — migración idempotente: device_positions si no existe + device_events usa recorded_at |
| **Modificar** | `app/api/worker/process/route.ts` — insert en device_events: `server_time` → `recorded_at` |
| **Modificar** | `api/webhooks/traccar.js` — insert en device_events: `server_time` → `recorded_at` |
| **Revisar (sin cambio)** | `core/jobs/weeklyStats.js` — ya usa `recorded_at` en selects/filtros; queda alineado tras migración |

---

## 2. Esquema propuesto de device_positions

Reutilizado de `docs/migrations/supabase_device_positions_partitioned.sql`:

```sql
CREATE TABLE IF NOT EXISTS device_positions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL,
  latitude    double precision NOT NULL,
  longitude   double precision NOT NULL,
  speed       double precision,
  attributes  jsonb DEFAULT '{}'
) PARTITION BY RANGE (recorded_at);
```

- Índice: `(device_id, recorded_at DESC)`.
- Primera partición: creada en la misma migración para el mes actual (o rango fijo reciente) para que la tabla sea usable.

---

## 3. Cambio exacto para device_events

- **BD hoy:** columna `server_time` (timestamptz).
- **Decisión:** estandarizar a `recorded_at`.
- **Migración:** renombrar columna (sin duplicar datos, sin backfill):
  - `ALTER TABLE device_events RENAME COLUMN server_time TO recorded_at;`
- **Condición:** ejecutar solo si existe la columna `server_time` (idempotente para BD ya migradas o sin tabla).
- **Índice:** el índice existente sobre `(device_id, server_time DESC)` en PostgreSQL sigue funcionando tras el rename (referencia por columna); opcional renombrar el índice por claridad.

---

## 4. Riesgos y compatibilidad

| Riesgo | Mitigación |
|--------|------------|
| Otras apps o jobs lean `server_time` en device_events | Buscar referencias a `server_time` en repo; solo worker y webhook traccar escriben. Tras migración, todo el código usa `recorded_at`. |
| device_positions ya existe con otro esquema | Migración usa `CREATE TABLE IF NOT EXISTS`; no pisa tablas existentes. Si la tabla existe con otras columnas, la migración no altera. |
| device_events no existe aún | El `RENAME COLUMN` va dentro de un bloque condicional (solo si existe `server_time`); no falla si la tabla no existe. Quien cree device_events en el futuro debe usar columna `recorded_at`. |
| Partición de device_positions | Se crea una partición inicial para el mes actual; sin pg_cron la creación de meses futuros debe hacerse manual o con otro job. |

---

## Entrega post-aplicación (Bloque 2)

### Archivos modificados
- **Creado:** `docs/migrations/supabase_telemetry_recorded_at.sql`
- **Modificado:** `app/api/worker/process/route.ts` (insert device_events: `recorded_at`)
- **Modificado:** `api/webhooks/traccar.js` (insert device_events: `recorded_at`)
- **Sin cambio:** `core/jobs/weeklyStats.js` — ya usaba `recorded_at` en posiciones y eventos; queda alineado tras aplicar la migración en Supabase.

### SQL final de la migración
Ver `docs/migrations/supabase_telemetry_recorded_at.sql`: (1) CREATE TABLE IF NOT EXISTS device_positions + índice + partición mes actual; (2) RENAME COLUMN server_time → recorded_at en device_events (condicional).

### Diff del worker
En `app/api/worker/process/route.ts`, insert a device_events: `server_time: serverTime` → `recorded_at: serverTime`.

### weeklyStats
Confirmado alineado: usa `recorded_at` en select/filtros de device_positions y device_events; no se modificó.

### Pruebas manuales
1. Ejecutar la migración en Supabase SQL Editor.
2. Enviar evento/posición vía worker o webhook traccar; comprobar que device_events tiene columna `recorded_at` y se inserta bien.
3. Si device_positions existía o se creó: insert de posición y verificar fila en device_positions.
4. Ejecutar job weeklyStats (si hay datos) y comprobar que no hay error de columna.

### Auditoría
Sí: volver a ejecutar el script de auditoría tras aplicar la migración en BD para confirmar que device_positions existe y device_events usa recorded_at.
