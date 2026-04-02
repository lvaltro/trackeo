'use strict';
/**
 * core/rbac/index.js
 * Permission constants and role→permission mapping.
 *
 * Fase 1 bridge: derives permissions from Traccar session flags.
 * Fase 2 (Supabase Auth): getUserPermissions() will query user_roles table.
 */

// ─── Permission constants ──────────────────────────────────────────────────────

const PERMISSIONS = {
  VEHICLE_READ:       'VEHICLE_READ',
  VEHICLE_WRITE:      'VEHICLE_WRITE',
  VEHICLE_COMMAND:    'VEHICLE_COMMAND',
  REPORT_VIEW:        'REPORT_VIEW',
  REPORT_EXPORT:      'REPORT_EXPORT',
  USER_INVITE:        'USER_INVITE',
  USER_MANAGE:        'USER_MANAGE',
  PLAN_VIEW:          'PLAN_VIEW',
  PLAN_CHANGE:        'PLAN_CHANGE',
  ORG_DELETE:         'ORG_DELETE',
  ALERT_READ:         'ALERT_READ',
  ALERT_WRITE:        'ALERT_WRITE',
  GEOFENCE_READ:      'GEOFENCE_READ',
  GEOFENCE_WRITE:     'GEOFENCE_WRITE',
  MAINTENANCE_READ:   'MAINTENANCE_READ',
  MAINTENANCE_WRITE:  'MAINTENANCE_WRITE',
  DOCUMENT_READ:      'DOCUMENT_READ',
  DOCUMENT_WRITE:     'DOCUMENT_WRITE',
  NOTIFICATION_READ:  'NOTIFICATION_READ',
  INSTALLER_REVOKE:   'INSTALLER_REVOKE',
  TELEMETRY_READ:     'TELEMETRY_READ',
  AUDIT_READ:         'AUDIT_READ',
};

// ─── Role→permission mapping (mirrors seed data in RBAC migration) ─────────────

const ROLE_PERMISSIONS = {
  SUPER_ADMIN: new Set(['*']),
  OWNER: new Set([
    'VEHICLE_READ', 'VEHICLE_WRITE', 'VEHICLE_COMMAND',
    'REPORT_VIEW', 'REPORT_EXPORT',
    'USER_INVITE', 'USER_MANAGE',
    'PLAN_VIEW', 'PLAN_CHANGE', 'ORG_DELETE',
    'ALERT_READ', 'ALERT_WRITE',
    'GEOFENCE_READ', 'GEOFENCE_WRITE',
    'MAINTENANCE_READ', 'MAINTENANCE_WRITE',
    'DOCUMENT_READ', 'DOCUMENT_WRITE',
    'NOTIFICATION_READ', 'INSTALLER_REVOKE',
    'TELEMETRY_READ', 'AUDIT_READ',
  ]),
  ADMIN: new Set([
    'VEHICLE_READ', 'VEHICLE_WRITE', 'VEHICLE_COMMAND',
    'REPORT_VIEW', 'REPORT_EXPORT',
    'USER_INVITE',
    'PLAN_VIEW',
    'ALERT_READ', 'ALERT_WRITE',
    'GEOFENCE_READ', 'GEOFENCE_WRITE',
    'MAINTENANCE_READ', 'MAINTENANCE_WRITE',
    'DOCUMENT_READ', 'DOCUMENT_WRITE',
    'NOTIFICATION_READ',
    'TELEMETRY_READ',
  ]),
  DRIVER: new Set([
    'VEHICLE_READ',
    'REPORT_VIEW',
    'ALERT_READ',
    'MAINTENANCE_READ',
    'NOTIFICATION_READ',
  ]),
  INSTALLER: new Set([
    'VEHICLE_READ',
    'VEHICLE_COMMAND',
    'TELEMETRY_READ',
  ]),
};

// ─── Fase 1 bridge ─────────────────────────────────────────────────────────────
// Traccar user object has:
//   administrator: true  → treat as OWNER
//   administrator: false → treat as DRIVER (read-only)
//
// Fase 2 will replace this with a Supabase query on user_roles.

/**
 * Returns a Set<string> of permissions for the given Traccar user.
 * @param {object} traccarUser - req.user from Traccar session
 * @returns {Set<string>}
 */
function getUserPermissions(traccarUser) {
  if (!traccarUser) return new Set();
  if (traccarUser.administrator === true) return ROLE_PERMISSIONS.OWNER;
  return ROLE_PERMISSIONS.DRIVER;
}

/**
 * Check if a permission set grants the given permission.
 * Handles the wildcard '*' used by SUPER_ADMIN.
 * @param {Set<string>} permissions
 * @param {string} permission
 * @returns {boolean}
 */
function hasPermission(permissions, permission) {
  return permissions.has('*') || permissions.has(permission);
}

module.exports = { PERMISSIONS, ROLE_PERMISSIONS, getUserPermissions, hasPermission };
