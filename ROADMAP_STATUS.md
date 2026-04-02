# Trackeo System — Roadmap Status

Last updated: 2026-04-01

## Current Phase: FASE 1 — Consolidar SaaS

### Critical (must complete before any enterprise work)

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Ownership middleware (verify user owns vehicleId via org) | DONE | middleware/ownership.js: Traccar devices -> IMEI -> Supabase UUID. Applied to maintenance, documents, weeklyStats. 60s cache. |
| 1.2 | Modularize server/index.js into routes/ + middleware/ | DONE | 655 -> 111 lines. 8 route files, 4 middleware, 2 lib modules. |
| 1.3 | Zod validation on all endpoints | DONE | zod ^3.23.0, validateBody/validateQuery middleware, schemas en todos los routes con body. |
| 1.4 | Activate AuditLog (log all mutations) | DONE | core/audit/index.js + server/lib/auditLogger.js. Wired en maintenance, documents, notifications, liveShare. Migration: 20260401000005_audit_logs. Pendiente: aplicar SQL en Supabase. |
| 1.5 | Add organization_id to standalone tables | DONE | Columna agregada vía migración 20260310000004. core/ actualizado: create() acepta organizationId (null por ahora). Filtrado por org pendiente hasta task 1.9b (RBAC). |
| 1.6 | Global error handler + request IDs | DONE | middleware/errorHandler.js + middleware/requestId.js + X-Request-ID header |
| 1.7 | Basic tests (vitest for core/) | DONE | 50 tests, 5 suites: maintenance (14), audit (6), documents (10), validate (8), rbac (12). Patrón: createRequire + supabaseLib.getClient mock. |
| 1.8 | GitHub Actions CI (lint + test) | DONE | .github/workflows/ci.yml — test-backend (blocking) + lint-frontend (continue-on-error hasta limpiar 69 errores preexistentes). |
| 1.9a | organization_features table + feature flag middleware | NOT STARTED | Plan = bundle of feature keys. Never check plan name directly. |
| 1.9b | RBAC: roles, permissions, user_roles tables + requirePermission middleware | DONE | core/rbac/index.js (PERMISSIONS, ROLE_PERMISSIONS, getUserPermissions, hasPermission) + server/middleware/authorize.js (requirePermission). Fase 1 bridge: administrator=true→OWNER, false→DRIVER. Wired en maintenance, documents, liveShare. Migration: 20260401000006_rbac_tables (pendiente aplicar en Supabase). |

### Important (complete within Fase 1)

| # | Task | Status | Notes |
|---|---|---|---|
| 1.9 | API versioning (/api/v1/) | NOT STARTED | Needed before external consumers |
| 1.10 | Structured logging (pino) | DONE | pino ^9.0.0 en server/lib/logger.js. logError/logInfo. LOG_LEVEL env var. |
| 1.11 | Rate limit per user (not per IP) | DONE | keyGenerator: JSESSIONID cookie → session key, fallback IP. Fase 2: migrar a Supabase user UUID. |
| 1.12 | CORS from env vars (not hardcoded) | DONE | CORS_ALLOWED_ORIGINS env var (comma-separated). Fallback a lista hardcoded si no está. |
| 1.13 | Rotate Supabase service role key | NOT STARTED | Check git history first |

---

## Fase 2 — Preparar Infraestructura Enterprise (NOT STARTED)

| # | Task | Status | Depends On |
|---|---|---|---|
| 2.1 | RBAC middleware (user.role enforcement) | NOT STARTED | 1.1, 1.2 |
| 2.2 | Feature flags per organization | NOT STARTED | 1.2 |
| 2.3 | SSO/OAuth2 (decouple from Traccar as IdP) | NOT STARTED | 1.1 |
| 2.4 | White-label: CSS variables + branding endpoint | NOT STARTED | |
| 2.5 | Org switcher + multi-org frontend context | NOT STARTED | 2.1 |
| 2.6 | Team management UI (invite, roles, deactivate) | NOT STARTED | 2.1, 2.5 |
| 2.7 | Redis for cache + sessions + live-share | NOT STARTED | |
| 2.8 | PM2 cluster mode or container migration | NOT STARTED | 2.7 |
| 2.9 | Sentry + uptime monitoring | NOT STARTED | 1.10 |
| 2.10 | Public API with OpenAPI docs | NOT STARTED | 1.9, 2.1 |

---

## Fase 3 — Verticalizacion Industrial/Gobierno (NOT STARTED)

| # | Task | Status | Depends On |
|---|---|---|---|
| 3.1 | vehicle_telemetry table (CAN bus: fuel, rpm, temp, voltage) | NOT STARTED | 1.5 |
| 3.2 | Engine hours module (construction/mining) | NOT STARTED | 3.1 |
| 3.3 | Configurable dashboards per vertical | NOT STARTED | 2.2 |
| 3.4 | Outbound webhooks (external system notifications) | NOT STARTED | 2.10 |
| 3.5 | Data export (CSV, batch API) for BI | NOT STARTED | 2.10 |
| 3.6 | Dedicated instances (Docker compose per client) | NOT STARTED | 2.8 |
| 3.7 | SAML 2.0 for gov/corporate | NOT STARTED | 2.3 |
| 3.8 | Encryption at rest + data residency config | NOT STARTED | |
| 3.9 | SLA dashboard + status page | NOT STARTED | 2.9 |
| 3.10 | SDK/CLI for programmatic integrations | NOT STARTED | 2.10 |

---

## Future Integrations (NOT any phase yet — context only)

These are planned but blocked until Phase 1 security hardening is complete.
Phase 1 architecture must not block them.

| Integration | Notes |
|---|---|
| WhatsApp automation | Notifications, support workflows. Requires extensible notification channels in audit/permissions. |
| n8n workflows | Webhooks, scheduled jobs. Requires event-driven patterns / outbox in core/. |
| Maps/geocoding/routing | Advanced features. Core geocoding already exists, keep it extensible. |
| Public API + webhooks | Requires API versioning (1.9), RBAC (1.9b), rate limiting per API key. |

**Rule:** Do not implement until tenant isolation, RBAC, RLS, audit logs, input validation, and tests/CI are done.
**Architectural principle:** Prefer event-driven patterns, keep core/ pure and callable from any trigger.

---

## Scoring

| Phase | Target Score | Current |
|---|---|---|
| Fase 1 complete | 6/10 enterprise-ready | 3/10 |
| Fase 2 complete | 7.5/10 | - |
| Fase 3 complete | 8.5/10 | - |
