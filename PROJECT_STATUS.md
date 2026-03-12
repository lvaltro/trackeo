# PROJECT STATUS — Trackeo.cl
> Última actualización: 2026-03-02

---

## Visión del Producto

**Trackeo.cl** es una plataforma SaaS de **gestión, seguridad y control inteligente de activos** orientada a LATAM (inicio: Chile). El foco va más allá del rastreo vehicular: incluye activos de alto valor (maquinaria, remolques, equipos industriales), gestión de conductores, mantenimiento preventivo y alertas inteligentes.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 7 + Tailwind CSS 3 |
| UI/Motion | Lucide React, Framer Motion, Recharts, DnD-Kit |
| Mapa | Leaflet + React-Leaflet |
| Backend API | Express.js (Node.js, CommonJS) |
| Base de datos | Supabase (PostgreSQL) + Prisma ORM |
| Auth (tracking) | Traccar session cookie (`JSESSIONID`) |
| Auth (SaaS) | Supabase Auth (JWT) |
| GPS Server | Traccar (self-hosted, `api.trackeo.cl`) |
| Webhook pipeline | Traccar → Upstash QStash → Next.js Worker → Supabase |
| Worker | Next.js App Router (`app/api/worker/`) en Vercel |
| Geocodificación | Nominatim (OpenStreetMap) — cola + cache en memoria |
| Infra | VPS Hostinger Ubuntu 22.04 (IP: 76.13.81.62) |
| Proceso manager | PM2 (`app-trackeo` en puerto 3001) |
| Reverse proxy | Nginx |
| Deploy | `scripts/deploy.sh` (rsync + SSH) |
| AI Development | Claude Code (MCP) |

---

## Arquitectura de Directorios

```
personas-trackeo/
├── src/                    # Frontend React (Vite SPA)
│   ├── api/                # apiClient.js, traccarApi.js, geocodeApi.js
│   ├── hooks/              # useVehicleTracker, useTraccarSocket (TODO), ...
│   ├── screens/            # DashboardLayout, LoginScreen, InstallerScreen, LiveTrackingPublic
│   ├── components/         # MapView, HistoryView, MaintenanceDashboard, ...
│   ├── context/            # DemoContext (modo demo con paywall)
│   └── utils/              # mapUtils, demoData
│
├── core/                   # Lógica de dominio pura (sin HTTP)
│   ├── geocoding/          # cache.js, queue.js, triggers.js, index.js
│   ├── live-share/         # index.js — Viaje Seguro (store en memoria)
│   └── notifications/      # index.js — store con persistencia JSON
│
├── server/                 # Express.js — solo routing HTTP
│   ├── index.js            # 4 grupos: geocode, live-share, health, notifications
│   └── logs/               # error.log (escrito por logError())
│
├── scripts/                # Automatización y ops
│   ├── cleanup-notifications.js  # setInterval 1h → core/notifications.cleanupOld
│   └── deploy.sh           # rsync → VPS → pm2 restart
│
├── app/                    # Next.js (Vercel) — webhook pipeline
│   └── api/worker/process/ # route.ts — QStash worker (escribe en Supabase)
│
├── prisma/                 # Schema completo del SaaS layer
│   └── schema.prisma       # ~20 modelos (Organizations, Plans, Vehicles, Trips, ...)
│
├── landing/                # Landing page (Next.js separado)
└── docs/                   # Documentación técnica
```

---

## Flujo de Datos en Producción

```
GPS Device
   ↓ (protocolo GPS)
Traccar Server (api.trackeo.cl:8082)
   ↓ (HTTP webhook por cada evento)
Upstash QStash (cola con retry automático)
   ↓ (POST firmado)
Next.js Worker (Vercel) — app/api/worker/process/route.ts
   ↓ (upsert con deduplicación ±11m / 60s)
Supabase PostgreSQL
   ├── device_positions   (time-series de posiciones GPS)
   ├── device_events      (alertas: ignición, exceso velocidad, geocerca, ...)
   └── vehicles_status    (estado actual del vehículo — actualizado por trigger)

Supabase Realtime
   ↓ (postgres_changes subscription)
Frontend React — useVehicleTracker.js
   ↓
MapView.jsx (Leaflet)
```

---

## Tablas Supabase Activas (fuera de Prisma)

> Estas tablas son escritas por el worker y leídas por el frontend. **No están en el schema Prisma.**

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `devices` | Registro de dispositivos GPS (imei → id) | Activa |
| `vehicles` | Nombre del vehículo (join con devices) | Activa |
| `vehicles_status` | Estado actual: lat, lng, speed, is_online, ignition | Activa |
| `device_positions` | Historial GPS particionado por mes | Activa |
| `device_events` | Alertas de eventos (ignición, overspeed, geofence) | Activa |

### SQL pendiente de ejecutar en Supabase

```sql
-- 1. Habilitar RLS en vehicles_status
ALTER TABLE vehicles_status ENABLE ROW LEVEL SECURITY;

-- 2. Política de lectura pública (ajustar a user_id si se necesita auth)
CREATE POLICY "Lectura autenticada de vehicles_status"
  ON vehicles_status FOR SELECT
  USING (true);

-- 3. FK: vehicles_status.device_id → devices.id
ALTER TABLE vehicles_status
  ADD CONSTRAINT fk_vehicles_status_device
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

-- 4. Habilitar Realtime para vehicles_status
-- (hacer en Supabase Dashboard → Database → Replication → supabase_realtime publication)
```

---

## Endpoints del Backend Express (puerto 3001)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/geocode/reverse?lat=&lon=` | Geocodificación inversa (Nominatim + cache) | No |
| POST | `/api/live-share` | Crear link de Viaje Seguro | JSESSIONID |
| GET | `/api/live-share/my` | Listar links activos del usuario | JSESSIONID |
| GET | `/api/live-share/:token` | Ver posición compartida (público) | No |
| DELETE | `/api/live-share/:token` | Cancelar link | JSESSIONID |
| GET | `/api/app/health` | Health check | No |
| POST | `/api/app/notifications` | Crear notificación | JSESSIONID |
| GET | `/api/app/notifications` | Listar notificaciones (7 días) | JSESSIONID |
| PUT | `/api/app/notifications/:id/read` | Marcar como leída | JSESSIONID |
| PUT | `/api/app/notifications/read-all` | Marcar todas como leídas | JSESSIONID |

---

## Estado de Funcionalidades

### Funcionando en Producción
- [x] Login con Traccar (cookie JSESSIONID, persistencia 24h en localStorage)
- [x] Dashboard con mapa Leaflet en tiempo real (Supabase Realtime via `useVehicleTracker`)
- [x] Geocodificación inversa con caché y rate limiting (1 req/s)
- [x] Viaje Seguro (live-share): links temporales de 1/2/4/8h con posición en vivo
- [x] Notificaciones con historial (7 días, JSON persistence)
- [x] Health check endpoint
- [x] Modo demo con datos simulados y paywall modal
- [x] Logging de errores en `server/logs/error.log`
- [x] Deduplicación de posiciones GPS en el worker (±11m / 60s)
- [x] Deploy automatizado con `scripts/deploy.sh`
- [x] Limpieza automática de notificaciones (cada 1h)
- [x] CORS dinámico con whitelist de orígenes

### En Desarrollo / Parcial
- [ ] `useTraccarSocket.js` — WebSocket existe pero polling activo (10s)
- [ ] `InstallerScreen` — formulario funcional pero envío simulado (sin endpoint)
- [ ] `MaintenanceDashboard` — UI completa, datos hardcodeados (no conectado a Supabase)
- [ ] Supabase Auth — schema Prisma completo pero no integrado al login
- [ ] Variables de entorno Supabase en frontend (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

### Pendiente / Backlog
- [ ] CI/CD con GitHub Actions (actualmente deploy manual)
- [ ] Migrar de Traccar auth a Supabase Auth JWT para el SaaS layer
- [ ] Conectar Prisma models (Organizations, Plans, Billing) al backend
- [ ] Añadir `vehicles_status`, `device_positions`, `device_events` al schema Prisma
- [ ] Unificar notificaciones: JSON en memoria vs tabla Supabase `notifications`
- [ ] Rate limiting en endpoint de login (anti-bruteforce)
- [ ] Service Worker para cache offline de tiles del mapa
- [ ] Lazy loading de MapView y HistoryView
- [ ] Migrar terminología "vehículo" → "activo" en UI para el pivot de producto
- [ ] Soporte multi-activo: maquinaria, remolques, equipos industriales
- [ ] Eliminar `api/webhooks/traccar.js` (legado, supersedido por `app/api/worker/`)
- [ ] Añadir `supabase/.temp/` al `.gitignore`

---

## Agentes y Automatización

### Deploy Agent (`scripts/deploy.sh`)
Script bash para deploy manual al VPS. Requiere SSH sin contraseña configurada.

```bash
bash scripts/deploy.sh              # Frontend + backend completo
bash scripts/deploy.sh --frontend   # Solo dist/ → Nginx
bash scripts/deploy.sh --backend    # Solo server/ + core/ → PM2 restart
```

**VPS:** `root@76.13.81.62` | **Project root:** `/root/personas-trackeo` | **PM2:** `app-trackeo`

### Cleanup Agent (`scripts/cleanup-notifications.js`)
`setInterval` de 1 hora que llama a `core/notifications.cleanupOld(7)`.
Se inicia automáticamente al arrancar `server/index.js`.

### QStash Worker (`app/api/worker/process/route.ts`)
Webhook processor desplegado en Vercel. Recibe eventos de Traccar vía Upstash QStash:
- Verifica firma QStash (`verifySignatureAppRouter`)
- Busca dispositivo por IMEI en `devices`
- Deduplica posiciones (±0.0001° / 60s)
- Escribe en `device_positions` y/o `device_events`

### MCP / Claude Code
El desarrollo activo se realiza con **Claude Code** como agente de desarrollo principal.
El modelo usado es `claude-sonnet-4-6`. Las instrucciones del proyecto están en `CLAUDE.md`.

---

## Infraestructura de Producción

```
┌─────────────────────────────────────────────────────┐
│                    VPS Hostinger                    │
│                  IP: 76.13.81.62                    │
│                                                     │
│  Nginx (443 SSL)                                    │
│   ├── trackeo.cl          → landing/                │
│   ├── app.trackeo.cl      → localhost:3001 (PM2)    │
│   │    ├── /api/app/*     → Express                 │
│   │    ├── /api/live-share → Express                │
│   │    ├── /api/geocode   → Express                 │
│   │    └── /*             → dist/ (SPA React)       │
│   └── api.trackeo.cl      → localhost:8082          │
│                                                     │
│  PM2 Processes:                                     │
│   └── app-trackeo (server/index.js) :3001           │
│                                                     │
│  Traccar GPS Server     :8082                       │
│  MySQL (Traccar DB)     :3306                       │
└─────────────────────────────────────────────────────┘

┌──────────────┐    ┌─────────────────┐
│   Supabase   │    │     Vercel      │
│  PostgreSQL  │    │  Next.js Worker │
│  + Realtime  │    │  (QStash hook)  │
└──────────────┘    └─────────────────┘
```

---

## Variables de Entorno Requeridas

### Frontend (`.env`)
```env
VITE_API_URL=/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Backend (`server/.env`)
```env
TRACCAR_API_URL=https://api.trackeo.cl
TRACCAR_ADMIN_EMAIL=admin@trackeo.cl
TRACCAR_ADMIN_PASSWORD=***
APP_URL=https://app.trackeo.cl
GEOCODE_PORT=3001
```

### Worker Vercel (variables de entorno en dashboard)
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
QSTASH_CURRENT_SIGNING_KEY=sig_...
QSTASH_NEXT_SIGNING_KEY=sig_...
```

---

## Schema Prisma (SaaS Layer)

El schema define ~20 modelos para la capa SaaS completa. **Están definidos pero no aplicados en producción.**

| Grupo | Modelos |
|-------|---------|
| Plataforma | `Country`, `Plan`, `PlanPrice`, `PlatformAdmin` |
| Tenants | `Organization`, `User` |
| Activos | `Device`, `Vehicle`, `VehicleDriver`, `VehicleDocument`, `Installer`, `InstallationJob` |
| Operación | `Trip`, `PlannedRoute`, `RouteEvent`, `Geofence`, `Place`, `Alert` |
| Finanzas | `Subscription`, `Payment`, `SavingsStat` |
| Sistema | `Notification`, `AuditLog`, `GeocodingCache`, `MaintenanceRecord` |

---

## Próximos Pasos Recomendados

### Inmediato (esta semana)
1. Ejecutar SQL pendiente en Supabase (RLS + FK + Realtime)
2. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env` y Vercel
3. Agregar `supabase/.temp/` a `.gitignore`
4. Eliminar `api/webhooks/traccar.js` (legado)

### Corto plazo
5. Conectar `MaintenanceDashboard` con datos reales de Supabase
6. Migrar `useVehicleTracker` de polling a Supabase Realtime (ya implementado — solo necesita habilitar Realtime en dashboard)
7. Activar `useTraccarSocket.js` para posiciones en tiempo real desde Traccar WebSocket

### Mediano plazo
8. Definir y migrar a Supabase Auth (JWT) para reemplazar Traccar JSESSIONID en el SaaS layer
9. Aplicar migraciones Prisma a producción (`prisma migrate deploy`)
10. Implementar gestión de organizaciones (multi-tenant) y planes de suscripción
11. Pivot de terminología: "vehículo" → "activo" en UI y expandir tipos de activos
12. Configurar GitHub Actions para CI/CD automático

---

*Generado con Claude Code — claude-sonnet-4-6*
