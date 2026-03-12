# Tech Stack — Trackeo.cl

## Frontend (`src/`)
- **React 19.2.0** + Vite 7.2.4
- **Tailwind CSS 3.4.17** — estilos. Sin component library custom.
- **Leaflet 1.9.4** + react-leaflet — mapas
- **Recharts 3.7.0** — gráficos
- **Framer Motion 12.x** — animaciones
- **Lucide React 0.563.0** — iconos
- **@supabase/supabase-js 2.97.0** — Realtime (anon_key, seguro en browser)
- Module system: **ESM** (`import`/`export`)

## Backend (`server/`)
- **Express 4.21.0** — HTTP routing only
- **Helmet 8.0.0** — security headers
- **express-rate-limit 7.5.0** — 100 req/15min por IP
- **Zod 3.23+** — input validation (R2)
- **Pino 9.x** — structured logging
- **@supabase/supabase-js 2.47.0** — service_role_key (nunca en frontend)
- **@prisma/client ~5.22.0** — ORM para tablas SaaS
- Module system: **CommonJS** (`require`/`module.exports`)
- Puerto: **3001**

## Domain Logic (`core/`)
- Pure Node.js, sin dependencias HTTP
- Module system: **CommonJS**
- Supabase directo (service_role_key, bypass RLS)
- NO importa Express en ningún módulo

## Worker (`app/api/`)
- **Next.js 14** (TypeScript) en Vercel
- **@upstash/qstash** — signature verification
- **@upstash/ratelimit** + **@upstash/redis** — rate limiting en edge
- Module system: **ESM/TypeScript**

## Database
- **Supabase PostgreSQL** (hosted)
- **Prisma ~5.22.0** — para tablas SaaS (`Organizations`, `Users`, `Vehicles`, etc.)
- **Standalone SQL migrations** — para tablas IoT y de negocio
- **Supabase Realtime** — para live tracking en frontend

## Infra
- **VPS** root@76.13.81.62 (Hostinger, Ubuntu 22.04)
- **PM2** — process manager (`app-trackeo`, fork mode, puerto 3001)
- **Nginx** — reverse proxy + SSL (Let's Encrypt)
- **Traccar** (self-hosted, puerto 8082) — GPS server
- **Upstash** — QStash (message queue) + Redis (rate limiting)
- **Vercel** — worker Next.js

## Testing
- **Vitest 2.x** — test runner (configurado en `server/vitest.config.js`)
- Tests en `server/__tests__/` y `core/**/__tests__/`
- Sin E2E tests aún
