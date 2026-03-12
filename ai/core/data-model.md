# Data Model — Trackeo.cl

## Arquitectura de 3 capas

```
CAPA 1 — Prisma (tablas SaaS)
  Organizations, Users, Plans, Subscriptions, Payments
  Vehicles, Devices, Trips, Alerts, Geofences, Places
  Installer, InstallationJob, AuditLog
  → Managed by: prisma/schema.prisma
  → Migraciones en: prisma/migrations/

CAPA 2 — Supabase directo (pipeline IoT, escritas por worker)
  devices         (id UUID, imei TEXT)
  vehicles        (id UUID, device_id FK, name TEXT)
  vehicles_status (device_id FK, last_lat, last_lng, speed, is_online, ignition)
  device_positions (time-series: device_id, recorded_at, lat, lng, speed, attributes)
  device_events   (alertas: device_id, event_type, server_time, position_data, attributes)
  → Managed by: worker en app/api/worker/process/route.ts

CAPA 3 — Supabase directo (datos de negocio)
  maintenance_records   (vehicle_id, type, title, status, ..., organization_id)
  vehicle_documents     (vehicle_id, type, title, expires_at, ..., organization_id)
  notifications         (user_id, tipo, mensaje, leido, ..., organization_id)
  vehicle_weekly_stats  (vehicle_id, week_start, km_total, score, ..., organization_id)
  → Managed by: core/ modules + standalone SQL migrations
```

## Relaciones clave

```
Organization ──< User
Organization ──< Vehicle (Prisma)
Vehicle >── Device (IMEI mapping)
Device ──< vehicles_status      (1:1 estado actual)
Device ──< device_positions     (time-series)
Device ──< device_events        (alertas)
Device ──< maintenance_records  (via vehicle_id = device_id)
Device ──< vehicle_documents    (via vehicle_id)
Device ──< vehicle_weekly_stats (via vehicle_id)
User   ──< notifications        (via user_id = email)
```

## Naming gotcha crítico

**`vehicle.id` en frontend ≠ UUID de la tabla `vehicles`**

En `vehicles_status`, la PK/FK es `device_id` (el UUID del dispositivo en Supabase).
En el frontend, `activeVehicle.id` = `device_id` de `vehicles_status` (no el UUID de `vehicles`).

Join correcto en `useVehicleTracker.js`:
```javascript
.select('*, devices!inner(id, vehicles(name))')
// Accessor: row.devices?.vehicles?.name
```

## Tablas standalone y sus migration IDs

| Tabla | Migration | organization_id |
|---|---|---|
| `maintenance_records` | 20260303000000 | ✅ agregado en 20260310000004 |
| `vehicle_documents` | 20260303000001 | ✅ agregado en 20260310000004 |
| `notifications` | 20260303000002 | ✅ agregado en 20260310000004 |
| `vehicle_weekly_stats` | 20260303000003 | ✅ agregado en 20260310000004 |

## Estado de organization_id

- **Columna:** nullable UUID, sin FK constraint (standalone)
- **Índices:** creados en migración 20260310000004
- **Filtrado en core/:** PENDIENTE — se activa cuando RBAC esté implementado (task 1.9b)
- **Datos existentes:** NULL hasta que se implemente migración de datos

## Tablas IoT — notas de escala

- `device_positions` es time-series. Sin particionamiento por mes aún.
- Índice recomendado: `(device_id, recorded_at DESC)`
- Deduplicación activa en worker: ignora posición si existe igual en el último minuto (±0.0001°)
