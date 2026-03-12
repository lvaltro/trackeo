# API Endpoints — Trackeo Backend

**Base URL (producción):** `https://app.trackeo.cl`
**Base URL (desarrollo):** `http://localhost:3001`
**Auth:** Cookie `JSESSIONID` (Traccar session). Todas las rutas marcadas con 🔒 requieren sesión activa.

---

## Health

### `GET /api/app/health`
Estado del servidor y conectividad a Supabase.
**Auth:** No requerida
**Response:**
```json
{
  "status": "ok",
  "service": "trackeo-backend",
  "port": 3001,
  "timestamp": "2026-03-10T00:00:00.000Z",
  "build": { "builtAt": "...", "node": "v20.x.x" },
  "db": { "ok": true }
}
```

---

## Geocoding

### `GET /api/geocode/reverse?lat={lat}&lon={lon}`
Reverse geocoding de coordenadas → dirección.
**Auth:** No requerida
**Query params:** `lat` (float), `lon` (float)
**Response:**
```json
{ "address": "Av. O'Higgins 123, Santiago", "fromCache": true }
```
**Error:** `400` si lat/lon inválidos. `502` si Nominatim falla.

---

## Live Share (Viaje Seguro)

### `POST /api/live-share` 🔒
Crear link temporal de compartición de ubicación.
**Body:**
```json
{
  "deviceId": "string (min 1)",
  "deviceName": "string (min 1, max 255)",
  "duration": 1 | 2 | 4 | 8
}
```
**Response `201`:**
```json
{
  "token": "abc123",
  "url": "https://app.trackeo.cl/live/abc123",
  "deviceName": "Mi Auto",
  "userName": "Juan",
  "duration": 2,
  "expiresAt": "2026-03-10T02:00:00.000Z"
}
```

### `GET /api/live-share/my` 🔒
Links activos del usuario autenticado.
**Response:** Array de shares.

### `GET /api/live-share/:token`
Consulta pública de un share (sin auth). Incluye posición actual del dispositivo.
**Response:** `{ deviceName, userName, expiresAt, position: { lat, lng, speed, course, timestamp } }`
**Error:** `404` si no existe. `410` si expiró.

### `DELETE /api/live-share/:token` 🔒
Cancelar un link de compartición.
**Response:** `{ "ok": true }`
**Error:** `403` si el share no pertenece al usuario.

---

## Notifications

### `GET /api/app/notifications` 🔒
Últimas notificaciones del usuario (últimos 7 días).
**Query:** `?limit=50` (default 50, max 100)
**Response:** Array de notificaciones.

### `POST /api/app/notifications` 🔒
Crear nueva notificación.
**Body:**
```json
{
  "tipo": "geovalla" | "motor" | "mantenimiento" | "alerta" | "perfil" | "sistema",
  "mensaje": "string (min 1, max 1000)",
  "dispositivo": "string (opcional)",
  "leido": false
}
```
**Response `201`:** Notificación creada.

### `PUT /api/app/notifications/:id/read` 🔒
Marcar notificación como leída.
**Error:** `403` si la notificación no pertenece al usuario.

### `PUT /api/app/notifications/read-all` 🔒
Marcar todas las notificaciones del usuario como leídas.
**Response:** `{ "ok": true, "marcadas": 5 }`

---

## Maintenance

Todas las rutas requieren 🔒 auth + verificación de ownership del vehicleId.

### `GET /api/app/maintenance/:vehicleId`
Listar registros de mantenimiento del vehículo. Ordenados por `created_at DESC`.
**Response:** Array de registros.

### `POST /api/app/maintenance/:vehicleId`
Crear registro de mantenimiento.
**Body:**
```json
{
  "type": "string (min 1, max 50)",
  "title": "string (min 1, max 255)",
  "notes": "string (opcional, max 2000)",
  "status": "scheduled" | "completed" | "overdue",
  "scheduled_date": "YYYY-MM-DD (opcional)",
  "scheduled_km": "number (opcional)",
  "next_service_km": "number (opcional)",
  "completed_date": "YYYY-MM-DD (opcional)",
  "completed_km": "number (opcional)",
  "completed_by": "string (opcional, max 255)",
  "cost": "number (opcional)",
  "invoice_url": "URL (opcional)",
  "metadata": "object (opcional)"
}
```
**Response `201`:** Registro creado.

### `PUT /api/app/maintenance/:vehicleId/:id`
Actualizar registro. Acepta los mismos campos que POST (todos opcionales).
**Error:** `404` si el registro no existe para ese vehicleId.

### `DELETE /api/app/maintenance/:vehicleId/:id`
Eliminar registro.
**Response:** `{ "ok": true }`

---

## Documents

Todas las rutas requieren 🔒 auth + verificación de ownership del vehicleId.

### `GET /api/app/documents/:vehicleId`
Listar documentos del vehículo. Ordenados por `expires_at ASC`.
**Response:** Array de documentos con campo `status` calculado (`ok` | `expiring` | `expired`).

### `POST /api/app/documents/:vehicleId`
Crear documento del vehículo.
**Body:**
```json
{
  "type": "permiso_circulacion" | "seguro_obligatorio" | "revision_tecnica" | "seguro_adicional" | "licencia" | "otro",
  "title": "string (min 1, max 255)",
  "expires_at": "YYYY-MM-DD",
  "issue_date": "YYYY-MM-DD (opcional)",
  "notes": "string (opcional)",
  "reminder_days": "[30, 7, 0] (opcional)",
  "file_url": "URL (opcional)",
  "metadata": "object (opcional)"
}
```
**Response `201`:** Documento creado con `status` calculado.

### `PUT /api/app/documents/:vehicleId/:id`
Actualizar documento. Acepta los mismos campos que POST (todos opcionales).
**Response:** Documento actualizado.

### `DELETE /api/app/documents/:vehicleId/:id`
Eliminar documento.
**Response:** `{ "ok": true }`

---

## Weekly Stats

### `GET /api/app/weekly-stats/:vehicleId` 🔒
Estadísticas semanales del vehículo.
**Auth:** Auth + ownership requeridos.
**Query:** `?weeks=4` (default 4, max 12)
**Response:** Array de objetos por semana con `{ week_start, km_total, score, daily_km, ... }`.

---

## Jobs (Admin only)

Requieren 🔒 auth + `req.user.administrator === true` (flag de Traccar).
Pendiente migrar a `requirePermission('JOB_TRIGGER')` cuando RBAC esté implementado.

### `POST /api/app/jobs/weekly-stats`
Disparar manualmente el cálculo de stats semanales para todos los vehículos.
**Response:** `{ "ok": true, "processed": 12, "errors": 0 }`

### `POST /api/app/jobs/doc-reminders`
Disparar manualmente el job de recordatorios de documentos.
**Response:** `{ "ok": true, "checked": 45, "notified": 3 }`

---

## Notas de implementación

- **Rate limiting:** 100 requests / 15 min por IP (excepto `/api/app/health`).
- **Body size limit:** 100kb máximo.
- **Validation:** Todos los endpoints con body usan Zod. Errores de validación retornan `400` con array `issues`.
- **Ownership:** Los endpoints con `:vehicleId` verifican que el usuario autenticado tenga acceso al dispositivo via Traccar → Supabase UUID mapping (caché 60s).
- **Request ID:** Cada request recibe un header `X-Request-ID` para trazabilidad.
