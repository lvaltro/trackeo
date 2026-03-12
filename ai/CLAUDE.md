# AI Context — Trackeo.cl

Contexto global para sesiones de desarrollo AI. Para contexto detallado, cargar el archivo específico.

## Fase actual
**FASE 1 — Consolidar SaaS** (score ~5/10 enterprise-ready)

## Stack
- **Frontend:** React 19 + Vite 7 + Tailwind (ESM) — `src/`
- **Backend:** Express 4 CommonJS — `server/` (puerto 3001)
- **Dominio:** CommonJS HTTP-agnostic — `core/`
- **Worker:** Next.js serverless en Vercel — `app/api/`
- **DB:** Supabase (Prisma para SaaS, standalone SQL para IoT + negocio)
- **GPS:** Traccar (auto-alojado, puerto 8082), auth via JSESSIONID cookie
- **Geocoding:** Nominatim (1 req/s) con caché por proximidad — `core/geocoding/`

## Paths críticos
```
server/index.js           ← entry point (solo wiring)
server/routes/            ← 8 routers Express
server/middleware/        ← auth, ownership, validate, cors, errorHandler, requestId
core/                     ← lógica de dominio pura (sin HTTP)
src/api/apiClient.js      ← cliente HTTP centralizado
src/hooks/                ← hooks React (patrón dual-mode)
prisma/schema.prisma      ← 25+ modelos SaaS
prisma/migrations/        ← 5 migraciones aplicadas
scripts/deploy.sh         ← deploy a VPS
```

## Reglas que nunca se violan
Ver `ai/core/architecture-rules.md` para las R1-R11 completas.
- R1: Todo query filtra por `organization_id` o verifica ownership
- R2: Todo endpoint con input usa Zod (`server/middleware/validate.js`)
- R5: `core/` nunca importa Express
- R7: `server/` y `core/` usan CommonJS
- R9: Permisos, no roles (`hasPermission()`, no `role === 'admin'`)
- R10: Feature flags, no planes (`organization_features`, no `plan === 'pro'`)

## Para trabajar en un dominio específico
Cargar `ai/domains/<dominio>.md` antes de modificar código.

## Para tareas recurrentes
Ver `ai/playbooks/` para guías paso a paso.
