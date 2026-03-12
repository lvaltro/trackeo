# Backend Audit & Hardening — Trackeo.cl

**Fecha:** 2026-03-05
**Rama:** `fix/harden-backend-48h`
**Commit:** `c851d40`
**Autor:** Claude Opus 4.6 + Luciano

---

## 1. Qué se hizo (cambios aplicados)

### 1.1 Seguridad HTTP — `server/index.js`

| Cambio | Antes | Después |
|--------|-------|---------|
| **Helmet** | Sin headers de seguridad | `app.use(helmet())` — agrega X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, CSP, etc. |
| **Rate Limiting** | Sin límite — cualquiera podía hacer requests ilimitados | `express-rate-limit` → 100 requests / 15 min por IP en `/api/` |
| **Body size** | `express.json()` sin límite — aceptaba payloads de cualquier tamaño | `express.json({ limit: '100kb' })` — rechaza payloads > 100KB con 413 |
| **CORS** | Fallback a `Access-Control-Allow-Origin: *` si el origin no estaba en whitelist | Responde `403 { error: 'Origin no permitido.' }` si el origin no está en la lista |

### 1.2 Configuración — `server/index.js`

| Cambio | Antes | Después |
|--------|-------|---------|
| **Carga de .env** | Parseo manual (15 líneas, sin soporte para comillas, multiline, etc.) | `require('dotenv').config()` — estándar de la industria, no sobreescribe vars del sistema |
| **logError()** | `fs.appendFileSync()` — bloqueaba el event loop en cada error | `fs.appendFile()` async con callback de error |

### 1.3 Dependencias — `server/package.json`

| Cambio | Antes | Después |
|--------|-------|---------|
| **prisma** | `^5.10.0` (permitía saltar a 7.x vía npx) | `~5.22.0` (fijado a 5.22.x) |
| **@prisma/client** | No existía | `~5.22.0` agregado |
| **helmet** | No existía | `^8.0.0` |
| **express-rate-limit** | No existía | `^7.5.0` |
| **dotenv** | No existía | `^16.4.0` |

### 1.4 Prisma Schema — `prisma/schema.prisma`

- **Fix:** Eliminada relación huérfana `notifications Notification[]` en modelo `Alert` (apuntaba a modelo `Notification` standalone que no tenía campo inverso). Prisma validate ahora pasa limpio.

### 1.5 Scripts — `scripts/cleanup-notifications.js`

- **Fix:** `setInterval` callback cambiado de sync a `async` con `try/catch`. Antes, un error en `cleanupOld()` podía crashear el proceso silenciosamente.

### 1.6 Operaciones — PM2 en VPS

| Cambio | Antes | Después |
|--------|-------|---------|
| **PM2 config** | Iniciado con `pm2 start index.js` — ecosystem.config.js ignorado | Iniciado con `pm2 start ecosystem.config.js` |
| **NODE_ENV** | No seteado (undefined) | `production` (definido en ecosystem.config.js) |
| **Logs** | Iban a `~/.pm2/logs/` (default PM2) | Van a `/root/personas-trackeo/server/logs/pm2-*.log` |
| **Restart policy** | Default PM2 | `restart_delay: 3000`, `max_restarts: 5`, `min_uptime: 10s` |

---

## 2. Estado actual del backend

### 2.1 Arquitectura

```
server/
  index.js              622 líneas — monolito con todas las rutas
  package.json          7 dependencias (express, helmet, rate-limit, dotenv, supabase, prisma, @prisma/client)
  ecosystem.config.js   PM2 config (fork mode, 1 instancia)
  .env                  7 variables requeridas
  logs/                 error.log + pm2-error.log + pm2-out.log

core/
  geocoding/            Cache grid 25m + cola rate-limited a Nominatim (1 req/s)
  live-share/           Store in-memory (Map) — tokens hex 12 chars, TTL 1-8h
  notifications/        CRUD Supabase → tabla notifications
  maintenance/          CRUD Supabase → tabla maintenance_records
  documents/            CRUD Supabase → tabla vehicle_documents + lógica expiración
  jobs/
    weeklyStats.js      Calcula stats semanales desde device_positions/device_events
    docReminders.js     Verifica documentos por vencer → crea notificaciones del sistema

prisma/
  schema.prisma         789 líneas, 25+ modelos (SaaS base + standalone tables)
  migrations/           5 migraciones aplicadas
```

### 2.2 Endpoints (19 rutas)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/app/health` | No | Health check |
| GET | `/api/geocode/reverse` | No | Geocodificación inversa |
| POST | `/api/live-share` | Sí | Crear link temporal |
| GET | `/api/live-share/my` | Sí | Mis links activos |
| GET | `/api/live-share/:token` | No | Consultar link (público) |
| DELETE | `/api/live-share/:token` | Sí | Cancelar link |
| POST | `/api/app/notifications` | Sí | Crear notificación |
| GET | `/api/app/notifications` | Sí | Listar notificaciones (7 días) |
| PUT | `/api/app/notifications/:id/read` | Sí | Marcar como leída |
| PUT | `/api/app/notifications/read-all` | Sí | Marcar todas como leídas |
| GET | `/api/app/maintenance/:vehicleId` | Sí | Listar mantenimientos |
| POST | `/api/app/maintenance/:vehicleId` | Sí | Crear mantenimiento |
| PUT | `/api/app/maintenance/:vehicleId/:id` | Sí | Actualizar mantenimiento |
| DELETE | `/api/app/maintenance/:vehicleId/:id` | Sí | Eliminar mantenimiento |
| GET | `/api/app/documents/:vehicleId` | Sí | Listar documentos |
| POST | `/api/app/documents/:vehicleId` | Sí | Crear documento |
| PUT | `/api/app/documents/:vehicleId/:id` | Sí | Actualizar documento |
| DELETE | `/api/app/documents/:vehicleId/:id` | Sí | Eliminar documento |
| GET | `/api/app/weekly-stats/:vehicleId` | Sí | Stats semanales |
| POST | `/api/app/jobs/weekly-stats` | Sí | Trigger manual stats |
| POST | `/api/app/jobs/doc-reminders` | Sí | Trigger manual reminders |

### 2.3 Scores post-fix

| Área | Antes | Después | Justificación |
|------|-------|---------|---------------|
| **Seguridad** | 3/10 | **6/10** | Helmet, rate limit, CORS fix, body limit. Falta: validación input, auth por roles, HTTPS enforcement |
| **Arquitectura** | 5/10 | **5/10** | No se tocó estructura (alcance 48h). Sigue siendo monolito |
| **Escalabilidad** | 4/10 | **4.5/10** | logError async mejora throughput. Falta: clustering, métricas |
| **Mantenibilidad** | 5/10 | **5.5/10** | dotenv estándar, ecosystem.config.js activo. Falta: tests, modularización |

---

## 3. Qué falta para un backend bien estructurado

### Prioridad Alta (semana 1-2)

#### 3.1 Modularizar rutas — Separar `server/index.js`

**Problema:** 622 líneas en un archivo con todas las rutas, middleware y configuración.

**Estructura objetivo:**
```
server/
  index.js              Solo startup: carga middleware + monta routers
  middleware/
    auth.js             verifyTraccarSession() extraído
    cors.js             CORS config extraída
  routes/
    geocode.js          GET /api/geocode/*
    liveShare.js        /api/live-share/*
    notifications.js    /api/app/notifications/*
    maintenance.js      /api/app/maintenance/*
    documents.js        /api/app/documents/*
    weeklyStats.js      /api/app/weekly-stats/* + jobs
    health.js           GET /api/app/health
```

#### 3.2 Validación de input con schema

**Problema:** Validaciones manuales inline, inconsistentes entre endpoints.

**Fix:** Instalar `zod` y validar cada endpoint:
```javascript
const createMaintenanceSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
  status: z.enum(['scheduled', 'completed']).optional(),
  cost: z.number().positive().optional(),
});
```

#### 3.3 Tests mínimos

**Problema:** 0 tests. Cualquier cambio puede romper producción sin saberlo.

**Fix:** Agregar al menos smoke tests:
```
server/
  __tests__/
    health.test.js          Health responde 200
    auth.test.js            verifyTraccarSession con mock
    notifications.test.js   CRUD con Supabase mock
    cors.test.js            Origins permitidos vs bloqueados
```

**Stack sugerido:** `vitest` (ya está en el proyecto para frontend) + `supertest`.

#### 3.4 Resolver dependencias de `core/`

**Problema:** `core/` hace `require('@supabase/supabase-js')` pero `node_modules` solo existe en `server/`. Funciona por accidente (Node sube por el árbol de directorios).

**Opciones:**
- A) Mover dependencias compartidas al `package.json` raíz e instalar ahí
- B) Agregar `package.json` en `core/` con sus propias dependencias
- C) Symlink `core/node_modules → ../server/node_modules` (frágil)

**Recomendación:** Opción A — un solo `npm install` en raíz, `server/` y `core/` importan de ahí.

### Prioridad Media (semana 2-4)

#### 3.5 Logger estructurado

**Problema:** `logError()` custom con `appendFile` — sin niveles, sin request-id, sin JSON.

**Fix:** Reemplazar por `pino`:
```javascript
const pino = require('pino');
const logger = pino({ level: 'info' });
// { level: 'error', context: 'Traccar:session', msg: '...', reqId: 'abc123' }
```

#### 3.6 Error middleware global

**Problema:** Cada ruta tiene su propio `try/catch`. Si alguien olvida el catch, el server crashea.

**Fix:**
```javascript
// Al final de index.js, después de todas las rutas
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({ error: 'Error interno del servidor.' });
});
```

#### 3.7 Persistir live-share

**Problema:** Los links de "Viaje Seguro" se almacenan en memoria. Se pierden en cada restart/deploy.

**Opciones:**
- A) Migrar a tabla Supabase `live_shares` (token, device_id, expires_at, etc.)
- B) Aceptar el riesgo (links duran max 8h, deploys son infrecuentes)

#### 3.8 Auth por roles en endpoints de jobs

**Problema:** `POST /api/app/jobs/weekly-stats` y `POST /api/app/jobs/doc-reminders` solo verifican auth, no si el usuario es admin.

**Fix:** Agregar check de admin (email en whitelist o campo `administrator` de Traccar).

#### 3.9 Versionado en VPS

**Problema:** VPS no tiene git — imposible saber qué versión del código está corriendo.

**Fix:** En `deploy.sh`, generar `BUILD_INFO.json`:
```bash
echo "{\"commit\":\"$(git rev-parse --short HEAD)\",\"date\":\"$(date -u +%FT%TZ)\",\"branch\":\"$(git branch --show-current)\"}" > server/BUILD_INFO.json
```

Y exponerlo en `/api/app/health`:
```javascript
const buildInfo = fs.existsSync('./BUILD_INFO.json')
  ? JSON.parse(fs.readFileSync('./BUILD_INFO.json'))
  : { commit: 'unknown' };

app.get('/api/app/health', (req, res) => {
  res.json({ status: 'ok', ...buildInfo, uptime: process.uptime() });
});
```

### Prioridad Baja (mes 1-2)

#### 3.10 CI/CD básico

GitHub Actions → SSH deploy automático en push a `main`:
```yaml
on:
  push:
    branches: [main]
    paths: ['server/**', 'core/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bash scripts/deploy.sh --backend
```

#### 3.11 Monitoreo externo

- UptimeRobot (free) → ping `/api/app/health` cada 5 min
- Alerta por email/Telegram si cae

#### 3.12 Clustering / escalado horizontal

- PM2 cluster mode (`instances: 'max'` o `instances: 2`)
- Requiere que live-share se persista (ver 3.7)

#### 3.13 Prisma cleanup

- El schema tiene 25+ modelos SaaS (Organizations, Plans, Subscriptions, etc.) que NO se usan en el backend actual
- Todo el CRUD real usa Supabase directo, no PrismaClient
- Decisión pendiente: usar Prisma solo para migraciones, o migrar el CRUD a PrismaClient

---

## 4. Checklist de deploy seguro (actualizado)

```bash
# Pre-deploy
git checkout fix/harden-backend-48h    # o main después del merge
npx --no-install prisma validate --schema prisma/schema.prisma

# Deploy
bash scripts/deploy.sh --backend

# Post-deploy (en VPS)
ssh root@76.13.81.62 "pm2 start /root/personas-trackeo/server/ecosystem.config.js"
ssh root@76.13.81.62 "pm2 save"
ssh root@76.13.81.62 "curl -s http://localhost:3001/api/app/health"
ssh root@76.13.81.62 "pm2 logs app-trackeo --lines 20 --nostream"

# Rollback si falla
git checkout main
bash scripts/deploy.sh --backend
ssh root@76.13.81.62 "pm2 restart app-trackeo --update-env"
```

---

## 5. Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| Líneas de código backend | ~2,000 (server + core) |
| Dependencias producción | 7 |
| Endpoints | 19 rutas (21 con jobs) |
| Tests | 0 |
| Vulnerabilidades npm | 0 |
| Uptime post-deploy | Estable, 0 restarts |
| Tiempo de deploy | ~2 min (rsync + npm install + pm2 reload) |

**El backend pasó de "funciona pero expuesto" a "funciona con seguridad mínima viable". Los próximos pasos críticos son: modularizar rutas, agregar validación con zod, y escribir smoke tests.**
