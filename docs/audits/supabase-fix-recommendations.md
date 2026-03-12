# Correcciones recomendadas: inconsistencias Supabase vs código

**Objetivo:** Alinear código con el esquema real de Supabase. Solo recomendaciones; no se aplican cambios automáticamente.

**Fuentes:** `docs/audits/supabase-schema-audit.md`, `docs/audits/supabase-tables.json`, `docs/audits/supabase-columns.json`.

---

## Resumen por prioridad

| Prioridad | Tema | Archivos afectados |
|-----------|------|--------------------|
| **Alta** | Tabla `vehicles_status` inexistente (BD tiene `vehicle_status`) | docReminders.js, api/webhooks/traccar.js |
| **Alta** | Tabla `device_positions` inexistente en BD | weeklyStats.js, app/api/worker/process/route.ts |
| **Alta** | Columnas de `notifications` (tipo, mensaje, dispositivo, fuente) no existen en BD | core/notifications/index.js, server/routes/notifications.js, componentes frontend |
| **Alta** | `device_events`: código usa `recorded_at`, BD tiene `server_time` / `created_at` | weeklyStats.js |
| **Media** | docReminders: `vehicle_status` no tiene `user_email` ni `email` | core/jobs/docReminders.js |

---

## 1. Tabla `vehicles_status` → usar `vehicle_status`

En BD existe **`vehicle_status`** (singular). El código usa **`vehicles_status`** (plural).

### 1.1 core/jobs/docReminders.js

| Ubicación | Uso actual | Cambio recomendado | Prioridad |
|-----------|------------|--------------------|-----------|
| Líneas 7-8 (comentario) | "tabla user_vehicles o vehicles_status" | "tabla vehicle_status (estado) no contiene email; ver §1.3" | Baja |
| Líneas 24-26 (comentario) | "Busca en vehicles_status el campo user_email o session_id" | Actualizar: vehicle_status no tiene user_email; ver §1.3 | Baja |
| Líneas 28-34, función `getVehicleOwnerEmail` | `.from('vehicles_status').select('user_email, email').eq('device_id', vehicleId)` | **Problema doble:** (1) Tabla correcta es `vehicle_status`. (2) En BD `vehicle_status` **no** tiene columnas `user_email` ni `email` (solo device_id, last_latitude, last_longitude, last_speed, ignition, is_online, last_update, updated_at). **Recomendación:** No usar vehicle_status para obtener email. Obtener propietario vía Prisma: `vehicles` (por device_id o id) → `organization_id` → `users` (role owner/admin) o tabla equivalente. Si no existe ese modelo, crear un endpoint o vista que devuelva vehicle_id → user_email. | **Alta** |

### 1.2 api/webhooks/traccar.js

| Ubicación | Uso actual | Cambio recomendado | Prioridad |
|-----------|------------|--------------------|-----------|
| Línea 51 (comentario) | "ACTUALIZAR ESTADO EN TIEMPO REAL (vehicles_status)" | "ACTUALIZAR ESTADO EN TIEMPO REAL (vehicle_status)" | Baja |
| Líneas 54-65 | `.from('vehicles_status').upsert({ device_id, last_latitude, ... }, { onConflict: 'device_id' })` | Cambiar a `.from('vehicle_status')`. El resto de columnas (last_latitude, last_longitude, last_speed, ignition, is_online, last_update, updated_at) coinciden con la BD. | **Alta** |

---

## 2. Tabla `device_positions` inexistente en BD

En el esquema auditado de Supabase **no existe** la tabla `device_positions`. Las tablas existentes no incluyen esta.

**Opciones:**

- **A)** Crear la tabla en Supabase (por ejemplo con la migración ya documentada en `docs/migrations/supabase_device_positions_partitioned.sql`) y dejar el código como está (solo asegurar que el nombre de tabla/columnas coincida con esa migración).
- **B)** Si no se crea la tabla: dejar de leer/escribir `device_positions` en el código y usar otra fuente (por ejemplo solo `device_events` con `position_data`, o otra tabla de posiciones si existe).

A continuación se listan los usos actuales para que, si se crea la tabla, el código use el mismo esquema.

### 2.1 core/jobs/weeklyStats.js

| Ubicación | Uso actual | Cambio recomendado | Prioridad |
|-----------|------------|--------------------|-----------|
| Línea 4 (comentario) | "desde device_positions / device_events" | Mantener si se crea la tabla; si no, indicar fuente alternativa (ej. device_events con position_data). | Media |
| Línea 16 | `const POSITIONS_TABLE = 'device_positions';` | Si la tabla se crea con ese nombre, no cambiar. Si no existe, cambiar a tabla/vista alternativa o desactivar esta parte del job hasta que exista. | **Alta** |
| Líneas 67-74 | `.from(POSITIONS_TABLE).select('device_id, latitude, longitude, speed, recorded_at').gte('recorded_at', ...).lt('recorded_at', ...)` | Si `device_positions` se crea con columnas `device_id, latitude, longitude, speed, recorded_at`, dejar igual. Si la tabla usa otro nombre de columna de tiempo (p. ej. `server_time`), usar ese nombre. | **Alta** |
| Líneas 109-110, 118-119, 145-146 | `curr.recorded_at`, `prev.recorded_at`, `positions[i].recorded_at` | Mismo criterio: si la tabla tiene `recorded_at`, OK; si solo tiene `server_time`, usar `server_time` en select y en estos accesos. | **Alta** |
| Líneas 195, 201-205 | Comentario y query desde `POSITIONS_TABLE` con `recorded_at` | Mismo que arriba: alinear nombre de tabla y columna de tiempo con la BD. | **Alta** |

### 2.2 app/api/worker/process/route.ts

| Ubicación | Uso actual | Cambio recomendado | Prioridad |
|-----------|------------|--------------------|-----------|
| Líneas 5-6 (comentario) | "device_positions: every GPS position..." | Mantener si se crea la tabla. | Baja |
| Líneas 104-113 | Deduplicación: `.from("device_positions").select("id").eq(...).gte("recorded_at", ...)` | Si se crea `device_positions` con `id` y `recorded_at`, dejar igual. Si la columna de tiempo es otra (p. ej. `server_time`), usar esa. | **Alta** |
| Líneas 125-132 | `supabase.from("device_positions").insert({ device_id, recorded_at, latitude, longitude, speed, attributes })` | Ajustar a los nombres reales de la tabla cuando exista. Si la tabla usa `server_time` en lugar de `recorded_at`, insertar con ese nombre. | **Alta** |
| Líneas 143-144 | Mensaje de error "Failed to write device_positions" | Sin cambio de lógica; solo mensaje. | Baja |

---

## 3. Notifications: columnas tipo, mensaje, dispositivo, fuente

En BD la tabla **`notifications`** tiene: `id, organization_id, user_id, alert_id, data, sent_at, read_at, created_at, leido, type, title, body, channel, status`.

El código usa nombres que **no existen** en BD: `tipo`, `mensaje`, `dispositivo`, `fuente`.

Mapeo recomendado (código → BD):

- `tipo` → **`type`**
- `mensaje` → **`body`** (o `title` si se usa para resumen corto)
- `dispositivo` → guardar en **`data.device`** o incluir en **`body`/`title`**
- `fuente` → **`channel`**
- `leido` → ya existe en BD como **`leido`**

### 3.1 core/notifications/index.js

| Ubicación | Uso actual | Cambio recomendado | Prioridad |
|-----------|------------|--------------------|-----------|
| Líneas 26-37, `rowToNotification` | `tipo: row.tipo`, `mensaje: row.mensaje`, `dispositivo: row.dispositivo`, `fuente: row.fuente` | Leer de BD: `type`, `body` (y opcionalmente `title`), `data?.device` para dispositivo, `channel` para fuente. Exponer al frontend como `tipo`, `mensaje`, `dispositivo`, `fuente` para no romper la API actual: `tipo: row.type`, `mensaje: row.body ?? row.title`, `dispositivo: row.data?.device ?? null`, `fuente: row.channel ?? 'alerta'`. | **Alta** |
| Líneas 67-74, `addNotification` (insert) | `insert = { user_id, tipo, mensaje, dispositivo, leido, fuente, data }` | Escribir en BD: `type: tipo`, `body: mensaje` (y opcionalmente `title` con truncado de mensaje), `data: { ...data, device: dispositivo }`, `channel: fuente`. No escribir columnas `tipo`, `mensaje`, `dispositivo`, `fuente`. | **Alta** |
| Líneas 219-227, `createSystemNotification` (insert) | `insert = { user_id, tipo, mensaje, dispositivo, leido, fuente, data }` | Mismo mapeo: `type`, `body`/`title`, `data` (con device), `channel`. | **Alta** |
| Línea 139, `markRead` | `update({ leido: true })` | Ya correcto (columna `leido` existe). | — |
| Líneas 161-164, `markAllRead` | `update({ leido: true }).eq('leido', false)` | Ya correcto. | — |

### 3.2 server/routes/notifications.js

| Ubicación | Uso actual | Cambio recomendado | Prioridad |
|-----------|------------|--------------------|-----------|
| Líneas 13-18, schema Zod | `tipo`, `mensaje`, `dispositivo`, `leido` | Mantener el API (tipo, mensaje, dispositivo) y seguir enviando esos nombres a `notifications.addNotification`; el mapeo a columnas BD se hace en core/notifications (type, body, data.device, channel). | Media |
| Línea 28 | `addNotification(tipo, mensaje, dispositivo, leido, ...)` | Sin cambio; el core hace el mapeo a la BD. | — |

### 3.3 Frontend (consumen tipo, mensaje, dispositivo, fuente)

El backend puede seguir exponiendo `tipo`, `mensaje`, `dispositivo`, `fuente` en la respuesta (mapeando desde `type`, `body`, `data.device`, `channel` en `rowToNotification`). Así no hace falta tocar el frontend.

| Archivo | Uso | Cambio recomendado | Prioridad |
|---------|-----|--------------------|-----------|
| src/components/ActivityFeed.jsx | `alert.tipo`, `alert.mensaje`, `alert.dispositivo`, TYPE_CONFIG[alert.tipo] | Ninguno si el API sigue devolviendo tipo/mensaje/dispositivo. | — |
| src/components/NotificationsDropdown.jsx | `n.tipo`, `n.mensaje`, `n.dispositivo`, ICON_MAP[n.tipo] | Igual: sin cambio si el API mantiene el shape actual. | — |

---

## 4. device_events: `recorded_at` → `server_time` / `created_at`

En BD **`device_events`** tiene: `position_data, attributes, created_at, device_id, server_time, id, event_type`. **No** hay columna `recorded_at`.

### 4.1 core/jobs/weeklyStats.js

| Ubicación | Uso actual | Cambio recomendado | Prioridad |
|-----------|------------|--------------------|-----------|
| Líneas 79-84 | `.from(EVENTS_TABLE).select('device_id, event_type, attributes, recorded_at').gte('recorded_at', ...).lt('recorded_at', ...)` | Usar columna de tiempo existente: `.select('device_id, event_type, attributes, server_time')` (o `created_at` si se prefiere). Filtros: `.gte('server_time', weekStartStr).lt('server_time', weekEndStr)`. Si en la BD solo hay `created_at`, usar `created_at` en select y filtros. | **Alta** |
| Cualquier uso posterior de `evt.recorded_at` | No aparece en este archivo para eventos; solo se usa `positions[i].recorded_at`. | Si en el futuro se usa el tiempo del evento, usar `evt.server_time` o `evt.created_at`. | Media |

### 4.2 app/api/worker/process/route.ts

| Ubicación | Uso actual | Cambio recomendado | Prioridad |
|-----------|------------|--------------------|-----------|
| Líneas 151-159 | `insert({ device_id, event_type, server_time: serverTime, position_data, attributes })` | Ya usa `server_time`; correcto para la BD. No cambiar. | — |

---

## 5. Resumen de acciones sugeridas (sin aplicar)

1. **vehicles_status → vehicle_status**  
   - En **api/webhooks/traccar.js**: cambiar `.from('vehicles_status')` a `.from('vehicle_status')`.  
   - En **core/jobs/docReminders.js**: no usar `vehicle_status` para obtener email (no tiene user_email/email). Resolver propietario por Prisma o por otra tabla/vista (vehicle → organization → user email).

2. **device_positions**  
   - Crear la tabla en Supabase con el esquema usado en código (p. ej. `docs/migrations/supabase_device_positions_partitioned.sql`) **o** dejar de usar esa tabla y adaptar weeklyStats y worker a otra fuente (p. ej. device_events + position_data). Si se crea, asegurar que nombres de columnas (`recorded_at` vs `server_time`) sean coherentes en toda la app.

3. **notifications**  
   - En **core/notifications/index.js**: en lecturas, mapear `type`→`tipo`, `body`/`title`→`mensaje`, `data.device`→`dispositivo`, `channel`→`fuente`. En escrituras, guardar `type`, `body` (y opcionalmente `title`), `data` (con device), `channel`. Mantener la API actual hacia el frontend.

4. **device_events**  
   - En **core/jobs/weeklyStats.js**: en la query de eventos, usar `server_time` (o `created_at`) en lugar de `recorded_at` en select y filtros.

5. **docReminders (email del propietario)**  
   - Implementar resolución vehicle_id → user_email vía Prisma (vehicles/organizations/users) o vista/endpoint equivalente; quitar la dependencia de `vehicles_status`/`vehicle_status` para ese dato.

---

**Documento generado a partir de la auditoría Supabase vs código. No se ha aplicado ningún cambio en el repositorio.**
