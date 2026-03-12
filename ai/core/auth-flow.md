# Auth Flow — Trackeo.cl

## Estado actual (Fase 1 — Legacy dual auth)

### Login flow

1. Frontend: POST a Traccar `/api/session` (via `traccarApi.js`)
2. Traccar retorna `Set-Cookie: JSESSIONID=xxx` (24h TTL)
3. Cookie se almacena en localStorage por Traccar
4. Todas las requests del frontend incluyen `credentials: 'include'`
5. Backend `verifyTraccarSession(req)` valida la cookie contra Traccar `/api/session`
6. Si válida: `req.user` = objeto Traccar `{ id, name, email, administrator, ... }`

### Campos disponibles en `req.user` (desde Traccar)

```javascript
req.user = {
  id: 1234,              // Traccar user ID (integer)
  name: "Juan Pérez",
  email: "juan@example.com",
  administrator: false,  // true solo para admins de Traccar
  // ... otros campos de Traccar
}
```

**No hay `organization_id` en `req.user` actualmente.**

### Ownership verification

`server/middleware/ownership.js` mapea Traccar devices → Supabase device UUIDs:

```
req.user.email + cookie
    ↓
GET Traccar /api/devices (con cookie)
    ↓ IMEIs de los dispositivos del usuario
SELECT id FROM devices WHERE imei IN (...)
    ↓ Set de UUIDs
deviceUUIDs.has(req.params.vehicleId) → 403 si no
```

Cache: 60 segundos por `userEmail` (Map en memoria).

### Admin guard (temporal)

Mientras RBAC no esté implementado, `server/routes/jobs.js` usa:
```javascript
if (!req.user?.administrator) return res.status(403).json(...)
```

### RBAC pendiente (task 1.9b)

Cuando se implemente:
1. `requireAuth` debe verificar JWT Supabase (no solo Traccar)
2. `req.user` debe incluir `organization_id` y `permissions[]`
3. Reemplazar `requireAdmin` con `requirePermission('JOB_TRIGGER')`
4. Ver `docs/RBAC.md` para la matriz de permisos completa

## Supabase Auth (preparado, no activo)

- `src/lib/supabaseClient.js` tiene el cliente Supabase con anon_key
- Supabase Auth está en el schema Prisma (`User` model con `supabase_id`)
- No está integrado al login actual (aún usa Traccar como IdP)
- Fase 2: migrar login principal a Supabase Auth, mantener Traccar para GPS

## Claves de entorno relacionadas

```bash
# Backend (server/.env)
TRACCAR_API_URL=https://api.trackeo.cl    # Para validar sesiones
TRACCAR_ADMIN_EMAIL=                       # Para live-share (obtener posiciones)
TRACCAR_ADMIN_PASSWORD=

# Frontend (.env)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...             # Solo para Realtime, NO service_role
```
