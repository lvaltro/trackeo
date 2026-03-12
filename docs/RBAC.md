# Trackeo.cl — RBAC (Roles & Permissions)

## Roles

### Fase 1 (implementar ahora)

| Role | Scope | Descripcion |
|------|-------|-------------|
| OWNER | Org | Dueno de la cuenta. 1 por org. Gestiona plan, usuarios, datos. |
| ADMIN | Org | Gerente/jefe flota. Gestiona vehiculos, reportes, alertas. No cambia plan. |
| DRIVER | Org | Chofer. Ve solo su vehiculo asignado. |
| INSTALLER | Cross-org | Externo. Acceso temporal tecnico via installer_assignments. |
| SUPER_ADMIN | Global | Solo tu. Gestiona orgs, planes, features, suspensiones. |

### Fase 2

| Role | Scope | Descripcion |
|------|-------|-------------|
| OPERATOR | Org | Centro de monitoreo. Ve vehiculos, alertas, ubicacion. No edita usuarios ni plan. |
| SUPPORT | Global | Soporte Trackeo. Ve estado tecnico y logs. No ve datos privados sin motivo. Auditado. |

### Fase 3

| Role | Scope | Descripcion |
|------|-------|-------------|
| FLEET_MANAGER | Sub-org | Subnivel para flotas >50 vehiculos. Ve grupo especifico. |
| ENTERPRISE_IT | Org | Gestiona SSO y permisos. No necesariamente ve tracking. |
| API_CLIENT | Org | No humano. API key, acceso limitado, rate-limited. |

## Permissions

```
VEHICLE_READ          - Ver vehiculos y posiciones
VEHICLE_WRITE         - Crear/editar/eliminar vehiculos
VEHICLE_COMMAND       - Enviar comandos (corte corriente, etc)
REPORT_VIEW           - Ver reportes
REPORT_EXPORT         - Descargar/exportar reportes
USER_INVITE           - Invitar usuarios a la org
USER_MANAGE           - Editar/desactivar usuarios
PLAN_VIEW             - Ver plan actual
PLAN_CHANGE           - Cambiar plan / facturacion
ORG_DELETE            - Eliminar organizacion
ALERT_READ            - Ver alertas
ALERT_WRITE           - Configurar alertas
GEOFENCE_READ         - Ver geocercas
GEOFENCE_WRITE        - Crear/editar geocercas
MAINTENANCE_READ      - Ver mantenimientos
MAINTENANCE_WRITE     - Crear/editar mantenimientos
DOCUMENT_READ         - Ver documentos
DOCUMENT_WRITE        - Crear/editar documentos
NOTIFICATION_READ     - Ver notificaciones
INSTALLER_REVOKE      - Revocar acceso instalador
TELEMETRY_READ        - Ver telemetria CAN/BLE
API_ACCESS            - Usar API publica
AUDIT_READ            - Ver logs de auditoria
```

## Role -> Permission mapping (Fase 1)

| Permission | OWNER | ADMIN | DRIVER | INSTALLER | SUPER_ADMIN |
|------------|-------|-------|--------|-----------|-------------|
| VEHICLE_READ | x | x | own | technical | x |
| VEHICLE_WRITE | x | x | - | - | x |
| VEHICLE_COMMAND | x | x | - | test-only | x |
| REPORT_VIEW | x | x | own | - | x |
| REPORT_EXPORT | x | x | - | - | x |
| USER_INVITE | x | x* | - | - | x |
| USER_MANAGE | x | - | - | - | x |
| PLAN_VIEW | x | x | - | - | x |
| PLAN_CHANGE | x | - | - | - | x |
| ORG_DELETE | x | - | - | - | x |
| ALERT_READ | x | x | own | - | x |
| ALERT_WRITE | x | x | - | - | x |
| GEOFENCE_READ | x | x | - | - | x |
| GEOFENCE_WRITE | x | x | - | - | x |
| MAINTENANCE_READ | x | x | - | - | x |
| MAINTENANCE_WRITE | x | x | - | - | x |
| DOCUMENT_READ | x | x | - | - | x |
| DOCUMENT_WRITE | x | x | - | - | x |
| NOTIFICATION_READ | x | x | own | - | x |
| INSTALLER_REVOKE | x | - | - | - | x |
| TELEMETRY_READ | x | x | - | diagnostic | x |
| AUDIT_READ | x | - | - | - | x |

*ADMIN invita segun limite del plan (MULTI_USER feature flag).

"own" = solo recursos asociados a su vehiculo asignado.
"technical" = solo estado conexion, senal, IMEI, ultima conexion.
"diagnostic" = solo datos diagnostico, no historial completo.
"test-only" = solo comandos de test tecnico.

## Implementacion tecnica

### Nunca:
```javascript
if (user.role === 'admin') { /* ... */ }
```

### Siempre:
```javascript
if (user.hasPermission('VEHICLE_WRITE')) { /* ... */ }
```

### Tablas

```sql
-- Roles predefinidos con permisos default
roles (id, name, permissions JSONB, is_system BOOLEAN)

-- Asignacion usuario -> rol dentro de org
user_roles (user_id, organization_id, role_id)

-- Override de permisos por org (enterprise custom)
organization_role_overrides (organization_id, role_id, permissions JSONB)
```

### Middleware pattern

```javascript
// server/middleware/authorize.js
function requirePermission(...permissions) {
  return async (req, res, next) => {
    const userPerms = await getUserPermissions(req.user.id, req.orgId);
    const hasAll = permissions.every(p => userPerms.includes(p));
    if (!hasAll) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// Usage in routes
router.post('/:vehicleId',
  requirePermission('MAINTENANCE_WRITE'),
  async (req, res) => { /* ... */ }
);
```

### Driver vehicle scoping

Driver solo ve su vehiculo asignado. Tabla `driver_vehicle_assignments`:
```sql
driver_vehicle_assignments (
  user_id UUID FK -> users.id,
  vehicle_id UUID FK -> vehicles.id,
  assigned_at TIMESTAMP,
  revoked_at TIMESTAMP NULL
)
```

Middleware adicional para DRIVER: filtrar queries automaticamente por vehiculo asignado.
