# Fase 1 — Análisis y plan de saneamiento (Supabase vs código)

**Objetivo:** Corregir inconsistencias críticas entre código y esquema real de Supabase con cambios mínimos, seguros y sin refactor masivo.

**Fuentes:** `docs/audits/supabase-fix-recommendations.md`, `docs/audits/supabase-schema-audit.md`, búsqueda en código.

---

## 1. Archivos afectados por la auditoría

### 1.1 Tabla `vehicles_status` (BD real: `vehicle_status`)

| Archivo | Uso exacto | Causa de inconsistencia |
|---------|------------|-------------------------|
| **api/webhooks/traccar.js** | L.51 comentario "vehicles_status"; L.56 `.from('vehicles_status')` en upsert de estado en tiempo real | Nombre de tabla incorrecto: en BD existe `vehicle_status` (singular). El webhook falla al escribir. |
| **core/jobs/docReminders.js** | L.7-8, 24 comentarios; L.28-34 `getVehicleOwnerEmail`: `.from('vehicles_status').select('user_email, email').eq('device_id', vehicleId)` | (1) Tabla correcta es `vehicle_status`. (2) Esa tabla **no tiene** columnas `user_email` ni `email` (solo device_id, last_latitude, last_longitude, last_speed, ignition, is_online, last_update, updated_at). La query es inválida. |
| **core/maintenance/index.js** | L.7 comentario "vehicles_status" | Solo documentación; no afecta ejecución. |

**Nota:** `src/hooks/useVehicleTracker.js` ya usa correctamente `vehicle_status` (lectura y Realtime). No tocar.

---

### 1.2 Tabla `device_positions` (no existe en BD)

En `docs/audits/supabase-tables.json` no aparece `device_positions`. La BD tiene `device_events`, `devices`, `vehicle_status`, etc., pero no `device_positions`.

| Archivo | Uso exacto | Causa de inconsistencia |
|---------|------------|-------------------------|
| **core/jobs/weeklyStats.js** | L.16 `POSITIONS_TABLE = 'device_positions'`; L.67-74 select con `recorded_at`; L.109-110, 118-119, 145-146 `curr.recorded_at`, `prev.recorded_at`, `positions[i].recorded_at`; L.195-205 `calculateCurrentWeekForAll` lee device_id desde `device_positions` | La tabla no existe en Supabase. El job falla al ejecutarse. Existe migración en `docs/migrations/supabase_device_positions_partitioned.sql` (no aplicada). |
| **app/api/worker/process/route.ts** | L.106-113 select en `device_positions` (dedup); L.125-132 insert en `device_positions` | Mismo problema: escritura/lectura a tabla inexistente. |

---

### 1.3 Notifications: columnas antiguas en código vs BD

BD tiene: `id, organization_id, user_id, alert_id, data, sent_at, read_at, created_at, leido, type, title, body, channel, status`.  
Código usa: `tipo`, `mensaje`, `dispositivo`, `fuente` (no existen en BD).

| Archivo | Uso exacto | Causa de inconsistencia |
|---------|------------|-------------------------|
| **core/notifications/index.js** | `rowToNotification`: lee `row.tipo`, `row.mensaje`, `row.dispositivo`, `row.fuente`. `addNotification` y `createSystemNotification`: insertan `tipo`, `mensaje`, `dispositivo`, `fuente`. | Inserts/selects usan nombres de columna que no existen. Las operaciones fallan o devuelven null en esos campos. |
| **server/routes/notifications.js** | API sigue exponiendo `tipo`, `mensaje`, `dispositivo` (Zod y body). Delega a core. | No hay que cambiar el contrato API; el mapeo se hace en core. |
| **server/routes/health.js** | L.24 `.from('notifications').select('id', { head: true, count: 'exact' }).limit(1)` | Solo comprueba que la tabla existe; no usa columnas antiguas. OK. |
| **Frontend** (ActivityFeed.jsx, NotificationsDropdown.jsx) | Consumen `alert.tipo`, `alert.mensaje`, `alert.dispositivo`, `n.tipo`, `n.mensaje`, `n.dispositivo`. | Si el backend sigue devolviendo tipo/mensaje/dispositivo/fuente (mapeando desde type/body/data.device/channel), no hace falta tocar frontend. |

---

### 1.4 device_events: `recorded_at` vs BD (`server_time` / `created_at`)

BD tiene: `position_data, attributes, created_at, device_id, server_time, id, event_type`. **No** hay columna `recorded_at`.

| Archivo | Uso exacto | Causa de inconsistencia |
|---------|------------|-------------------------|
| **core/jobs/weeklyStats.js** | L.79-84 `.from(EVENTS_TABLE).select('device_id, event_type, attributes, recorded_at').gte('recorded_at', ...).lt('recorded_at', ...)` | La columna se llama `server_time` (o `created_at`). La query falla o no filtra correctamente. |
| **app/api/worker/process/route.ts** | L.151-159 insert en `device_events` con `server_time` | Ya correcto; no cambiar. |

---

## 2. Resumen de usos exactos

- **vehicles_status:** 2 sitios que escriben/leen: webhook traccar (upsert estado), docReminders (select user_email/email — inválido). Frontend useVehicleTracker ya usa `vehicle_status`.
- **device_positions:** weeklyStats (lectura para stats y lista de device_id) y worker (lectura dedup + insert). Tabla no existe en BD.
- **notifications (columnas antiguas):** core/notifications (rowToNotification, addNotification, createSystemNotification). Rutas y frontend consumen el shape actual; la capa de compatibilidad debe estar en core (leer type/body/channel/data, escribir type/body/channel/data; exponer tipo/mensaje/fuente/dispositivo al API).
- **device_events.recorded_at:** solo weeklyStats.js en la query de eventos; usar `server_time` en select y filtros. Los `recorded_at` en ese archivo para `positions` son de `device_positions`; si más adelante se crea esa tabla con `recorded_at`, se mantienen.

---

## 3. Orden recomendado de saneamiento

Prioridad: (1) tablas con nombre equivocado o uso inválido, (2) columnas inexistentes en tablas que sí existen, (3) tabla inexistente que requiere decisión (crear vs adaptar).

| Orden | Bloque | Alcance | Motivo |
|-------|--------|---------|--------|
| 1 | **vehicles_status → vehicle_status + docReminders** | Corregir nombre de tabla donde se escribe estado; eliminar query inválida de email en docReminders | Desbloquea webhook y evita query a columnas inexistentes. |
| 2 | **notifications: mapeo en core** | Leer/escribir en BD con type, title, body, channel, data; exponer tipo, mensaje, dispositivo, fuente al API | Arregla lecturas/escrituras sin tocar frontend ni contrato API. |
| 3 | **device_events: recorded_at → server_time** | En weeklyStats.js, usar server_time en select y filtros de device_events | Query de eventos coherente con el esquema real. |
| 4 | **device_positions** | Decisión: aplicar migración en Supabase para crear la tabla **o** adaptar weeklyStats + worker a otra fuente (p. ej. solo device_events con position_data). Si se crea, código ya usa `recorded_at` en la migración; si no, hay que cambiar lógica. | Depende de si se quiere historial de posiciones en tabla dedicada. |

---

## 4. Bloque 1 propuesto (alcance mínimo)

**Nombre:** Saneamiento tabla `vehicle_status` y uso en docReminders.

**Objetivo:** Que el webhook Traccar escriba en la tabla real y que docReminders deje de ejecutar una query inválida.

### 4.1 Cambios concretos

1. **api/webhooks/traccar.js**
   - Cambiar comentario L.51: "vehicles_status" → "vehicle_status".
   - Cambiar L.56: `.from('vehicles_status')` → `.from('vehicle_status')`.
   - **Efecto:** El upsert de estado en tiempo real se escribe en la tabla correcta.

2. **core/jobs/docReminders.js**
   - **Opción A (mínima):** Hacer que `getVehicleOwnerEmail(vehicleId)` no consulte Supabase para email. Devolver `null` siempre (o intentar resolución por Prisma si existe modelo vehicle → org → owner en un bloque posterior). Actualizar comentarios L.7-8, 24: indicar que vehicle_status no contiene email y que la resolución de propietario queda pendiente (Prisma/otra fuente).
   - **Opción B (solo comentarios):** Cambiar comentarios a "vehicle_status" y dejar la query; la query seguirá fallando o devolviendo vacío porque la tabla no tiene user_email/email. No recomendado.
   - **Recomendación:** Opción A. Comentarios: "Requiere resolución vehicle_id → user_email vía Prisma (vehicles/organizations/users) o vista. Mientras tanto getVehicleOwnerEmail retorna null."
   - **Implementación mínima:** En `getVehicleOwnerEmail`, quitar la llamada a Supabase; `return null;`. Así el job ya no hace una query inválida; las notificaciones de recordatorio de documentos simplemente no se enviarán hasta implementar la resolución de propietario en un bloque posterior.

3. **core/maintenance/index.js**
   - Actualizar comentario L.7: "vehicles_status" → "vehicle_status" (opcional, solo documentación).

### 4.2 Archivos a tocar (lista exacta)

| Archivo | Cambios |
|---------|--------|
| `api/webhooks/traccar.js` | 2 líneas: comentario + `.from('vehicle_status')` |
| `core/jobs/docReminders.js` | Sustituir cuerpo de `getVehicleOwnerEmail` por `return null;` (o implementación Prisma mínima si se desea); actualizar comentarios de cabecera y función. |
| `core/maintenance/index.js` | 1 comentario (opcional). |

### 4.3 Lo que NO se hace en el Bloque 1

- No se toca `notifications` (Bloque 2).
- No se toca `device_events` ni `device_positions` (Bloques 3 y 4).
- No se implementa resolución vehicle → owner email por Prisma (queda para un bloque posterior).
- No se cambia frontend ni rutas de API.

---

## 5. Riesgos del Bloque 1

| Riesgo | Mitigación |
|--------|------------|
| El webhook podría estar escribiendo en una tabla con otro nombre en algún otro entorno | Verificar en Supabase que la tabla se llama `vehicle_status`. Si en algún entorno fuera `vehicles_status`, habría que alinear esquema primero. |
| docReminders deja de enviar notificaciones de documentos por vencimiento | Esperado: hasta tener resolución de propietario (Prisma o vista), no hay email que usar. El job sigue ejecutándose y procesando documentos; solo no notifica. |
| Realtime en frontend (useVehicleTracker) | Ya usa `vehicle_status`; no hay cambio. Sin riesgo. |

---

## 6. Verificación sugerida tras aplicar Bloque 1

1. Ejecutar webhook Traccar (POST con position) y comprobar que en Supabase `vehicle_status` se actualiza.
2. Ejecutar job docReminders y comprobar que no hay error de query a `vehicles_status` ni a columnas inexistentes (logs sin error de Supabase).
3. Frontend: mapa/estado en tiempo real sigue igual (misma tabla y canal).

---

**Documento listo para revisión. No se aplican cambios hasta aprobación del Bloque 1.**
