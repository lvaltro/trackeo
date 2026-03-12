# Reglas Arquitectónicas — R1 a R11

Estas reglas aplican a TODO cambio de código. Son inmutables en Fase 1.

## R1: Tenant Isolation + Ownership
- Todo query que lea/escriba datos de usuario/vehículo/org DEBE filtrar por `organization_id` o verificar ownership.
- Nunca confiar en un `:vehicleId` o `:id` sin verificar que el usuario autenticado tenga acceso.
- Middleware: `server/middleware/ownership.js` → `requireVehicleOwnership`
- **Status Fase 1:** Ownership activo en maintenance, documents, weeklyStats. `organization_id` nullable en tablas standalone (migración 20260310000004). Filtrado en core/ pendiente hasta implementar RBAC.

## R2: Input Validation
- Todo endpoint con input DEBE validar con Zod.
- Middleware: `server/middleware/validate.js` → `validateBody(schema)` / `validateQuery(schema)`
- Usar `req.validated` en los handlers (no `req.body` directamente).
- **Status Fase 1:** Implementado en todos los routes con body (maintenance, documents, notifications, liveShare).

## R3: Audit Trail
- Todo mutation (POST/PUT/DELETE) en datos de negocio DEBE loggear a audit (usuario, acción, recurso, cambios, timestamp).
- Módulo: `core/audit/` (pendiente implementar)
- El modelo `AuditLog` existe en `prisma/schema.prisma` pero no se escribe aún.
- **Status Fase 1:** PENDIENTE.

## R4: No Hardcoded Branding
- Colores, logos y nombres de producto usan CSS variables — no hex hardcodeados.
- Componentes nuevos deben seguir este patrón.

## R5: Core Must Be HTTP-Agnostic
- `core/` NUNCA importa Express, `req`, `res`, ni conceptos HTTP.
- Recibe objetos planos, retorna objetos planos.
- El handling HTTP vive en `server/routes/`.

## R6: No In-Memory State for Shared Data
- Datos que deben sobrevivir reinicios o funcionar en múltiples instancias deben usar Redis o DB.
- Excepción: caché de geocoding (pérdida aceptable en restart).
- **Violación activa:** `core/live-share/index.js` usa `Map()` → PENDIENTE migrar a Supabase.

## R7: CommonJS in server/ and core/
- NUNCA usar `import`/`export` en `server/` o `core/`.
- Usar `require()` y `module.exports`.
- `src/` usa ESM. `app/` (worker Next.js) usa TypeScript/ESM.

## R8: No Silent Failures
- Todo `catch` debe: (a) loggear con contexto via `logError()`, o (b) re-throw.
- `catch {}` vacíos no están permitidos.

## R9: Permission-Based Access Control
- NUNCA `if (user.role === 'admin')`.
- SIEMPRE `if (user.hasPermission('VEHICLE_WRITE'))`.
- Ver `docs/RBAC.md` para la matriz de permisos.
- **Status Fase 1:** Sin RBAC implementado. Usando `req.user.administrator` (flag Traccar) como guard temporal en `server/routes/jobs.js`.

## R10: Feature Flags Over Plan Checks
- NUNCA `if (plan === 'pro')`.
- SIEMPRE verificar tabla `organization_features` con claves de feature.
- Ver `docs/BUSINESS_MODEL.md` para las claves.
- **Status Fase 1:** Schema listo. Código aún no usa feature flags.

## R11: Don't Block Future Integrations
- WhatsApp, n8n, webhooks, API pública → NO son Fase 1.
- Pero la arquitectura Fase 1 no debe bloquearlos:
  - Preferir patrones event-driven donde sea razonable
  - `core/` debe ser callable desde HTTP, webhook, cron, queue (sin cambios)
  - Permisos y audit deben ser extensibles
