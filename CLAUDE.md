# CLAUDE.md — Trackeo.cl / Trackeo System

## Vision & North Star

Trackeo.cl is evolving from a GPS tracking SaaS for individuals/SMBs into **Trackeo System** — an enterprise platform for industrial verticals (agriculture, construction, mining, electric buses, municipalities/government).

**Every code change must be evaluated against this trajectory.** If a task introduces patterns that block enterprise scaling (hardcoded values, missing tenant isolation, skipped validation), flag it before proceeding.

### The Triangle

```
            Trackeo System
           (Enterprise/Gov/API)
              /          \
         Fase 2          Fase 3
        (Infra)       (Verticals)
          /                \
    Trackeo.cl SaaS --------
       (Fase 1: Foundation)
```

**Current phase: FASE 1 — Consolidar SaaS**
Check `ROADMAP_STATUS.md` for current progress within this phase.

### Key Business Documents
- `docs/BUSINESS_MODEL.md` — Plans (Start/Pro/Pro+/Enterprise), feature flags, upgrade triggers, installer model, onboarding flows, pricing
- `docs/RBAC.md` — Roles (Owner/Admin/Driver/Installer/Super Admin), permissions matrix, middleware pattern, driver scoping

---

## Commands

```bash
# Frontend (Vite + React 19)
npm run dev          # Dev server on port 5173
npm run build        # Production build -> dist/
npm run lint         # ESLint
npm run preview      # Preview production build

# Backend (Express) — separate process
cd server && node index.js   # Starts on port 3001

# Deploy
bash scripts/deploy.sh --backend [--migrate] [--flush-logs] [--debug]
bash scripts/vps-sanity-check.sh

# Database
cd server && npx prisma migrate deploy   # Apply pending migrations
cd server && npx prisma generate          # Regenerate client after schema changes
```

---

## Architecture

### Process Layout

```
src/          # Frontend — Vite + React 19 + Tailwind (ESM)
server/       # Express HTTP routing only (CommonJS) — port 3001
core/         # Pure domain logic, no HTTP (CommonJS)
app/api/      # Next.js Vercel worker — QStash webhook -> Supabase
landing/      # Next.js landing page (separate)
prisma/       # Schema + migrations
scripts/      # Deploy, sanity check, ops
```

### Module System Conflict (IMPORTANT)

Root `package.json` has `"type": "module"`. Both `core/` and `scripts/` have their own `package.json` with `"type": "commonjs"`. When creating new files:
- In `src/`: use ESM (`import/export`)
- In `server/`, `core/`, `scripts/`: use CommonJS (`require/module.exports`)

### External Services

- **Traccar** (self-hosted, port 8082) — GPS device management, positions. Auth: JSESSIONID cookie.
- **Supabase** (hosted) — PostgreSQL + Realtime + Auth. Backend uses service_role_key. Frontend uses anon_key for Realtime.
- **Nominatim** — reverse geocoding, rate-limited 1 req/s.

### Auth Flow (Dual — Legacy)

1. Supabase Auth for user identity (email/password -> JWT in localStorage)
2. Traccar JSESSIONID cookie for GPS data access
3. Backend `verifyTraccarSession(req)` validates cookie against Traccar `/api/session`
4. **Known gap:** No ownership verification on vehicleId params (IDOR risk — Fase 1 fix)

### Key Data Tables

| Table | Managed By | Notes |
|---|---|---|
| `organizations`, `users`, `vehicles`, `devices`, `trips`, `alerts` | Prisma | Core SaaS schema, have `organization_id` |
| `maintenance_records`, `vehicle_documents`, `notifications`, `vehicle_weekly_stats` | Standalone SQL | **Missing `organization_id`** — Fase 1 fix |
| `devices`, `vehicles_status`, `device_positions`, `device_events` | Supabase direct | IoT pipeline tables |

### Deploy

- **VPS:** root@76.13.81.62, PM2 `app-trackeo` (port 3001), dir `/root/personas-trackeo/`
- **Frontend dest:** `/var/www/app.trackeo.cl`
- **Script:** `bash scripts/deploy.sh --backend [--migrate]`
- **PM2 config:** `server/ecosystem.config.js`

---

## Architectural Rules (ENFORCED)

These rules apply to ALL code changes. Violations must be flagged.

### R1: Tenant Isolation + Ownership
Every query that reads or writes user/vehicle/org data MUST filter by `organization_id` or verify ownership. Never trust a `:vehicleId` or `:id` URL param without checking the authenticated user has access. Driver role: auto-scope to assigned vehicle only.

### R2: Input Validation
Every endpoint that accepts user input MUST validate with a schema (Zod preferred). No raw `req.body` or `req.params` passed to business logic without validation.

### R3: Audit Trail
Every mutation (POST/PUT/DELETE) on business data MUST log to audit (user, action, resource, changes, timestamp). Use `core/audit/` module when available.

### R4: No Hardcoded Branding
Colors, logos, and product names should use CSS variables or configuration — not hardcoded hex values. New components must follow this pattern. (Existing components will be migrated incrementally.)

### R5: Core Must Be HTTP-Agnostic
`core/` modules must NEVER import Express, `req`, `res`, or HTTP concepts. They receive plain objects and return plain objects. HTTP handling stays in `server/routes/`.

### R6: No In-Memory State for Shared Data
Data that must survive restarts or work across multiple instances (sessions, shares, cache) should use Redis or database — not `Map()` or plain objects. Exception: geocoding cache (acceptable loss on restart).

### R7: CommonJS in server/ and core/
Never use `import`/`export` syntax in `server/` or `core/`. These directories are CommonJS. Use `require()` and `module.exports`.

### R8: No Silent Failures
Every `catch` block must either: (a) log the error with context, or (b) re-throw. Empty `catch {}` blocks are not allowed.

### R9: Permission-Based Access Control
Never `if (user.role === 'admin')`. Always `if (user.hasPermission('VEHICLE_WRITE'))`. See `docs/RBAC.md` for full matrix.

### R10: Feature Flags Over Plan Checks
Never `if (plan === 'pro')`. Always check `organization_features` table for feature keys. Each plan is a bundle of features. See `docs/BUSINESS_MODEL.md` for feature keys.

### R11: Don't Block Future Integrations
WhatsApp automation, n8n workflows, maps/routing, public API + webhooks are NOT Phase 1. Do NOT implement them now. But Phase 1 architecture must not block them:
- Prefer event-driven patterns where reasonable (internal domain events / outbox pattern)
- Keep permissions and audit logging extensible for future external notification channels
- Keep core/ functions pure and callable from any trigger (HTTP, webhook, cron, queue)

---

## Strategic Alignment Check

When the user requests a feature or change, mentally evaluate:

1. **Does this block enterprise scaling?** (e.g., hardcoding single-tenant assumptions)
2. **Does this create tech debt that compounds?** (e.g., adding more routes to monolithic index.js)
3. **Is this the simplest solution that stays aligned with the roadmap?**

If a request conflicts with the architectural rules or roadmap, briefly flag it:
> "This works for now, but note: [specific concern]. Want me to implement it in a way that's also compatible with [phase]?"

Do NOT block work or lecture. Flag once, then execute what the user wants.

---

## Fase 1 Priorities (Current)

These are the foundational fixes before any enterprise work:

1. **Ownership middleware** — verify user owns vehicleId before any CRUD
2. **Modularize server/index.js** — split into `server/routes/*.js` + `server/middleware/*.js`
3. **Zod validation** — schemas for all endpoint inputs
4. **Audit logging** — activate the existing `AuditLog` Prisma model
5. **Add org_id to standalone tables** — maintenance_records, vehicle_documents, notifications, vehicle_weekly_stats
6. **Global error handler** — structured error responses with request IDs
7. **Basic tests** — vitest for core/ modules
8. **CI pipeline** — GitHub Actions: lint + test on PR

Progress tracked in `ROADMAP_STATUS.md`.

---

## File Patterns

When creating new backend routes:
```
server/routes/<feature>.js    # Express router
server/middleware/<name>.js    # Reusable middleware
core/<feature>/index.js        # Business logic (no HTTP)
```

When creating new frontend features:
```
src/api/<feature>Api.js        # API client methods
src/hooks/use<Feature>.js      # Data hook (dual-mode pattern if applicable)
src/components/<Feature>/      # Component directory
```

---

## Environment Variables

**Frontend (.env):**
```
VITE_API_URL=/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Backend (server/.env):**
```
TRACCAR_API_URL=https://api.trackeo.cl
TRACCAR_ADMIN_EMAIL=
TRACCAR_ADMIN_PASSWORD=
APP_URL=https://app.trackeo.cl
GEOCODE_PORT=3001
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
```

## Nginx Routing (Production)

`app.trackeo.cl`:
- `/api/app/*` -> Express port 3001
- `/api/live-share` -> Express port 3001
- `/api/geocode` -> Express port 3001
- `/*` -> static dist/ (SPA fallback)

`api.trackeo.cl` -> Traccar on localhost:8082
