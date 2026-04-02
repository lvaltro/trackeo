'use strict';
/**
 * server/middleware/authorize.js
 * Permission-based authorization middleware.
 *
 * Usage: router.post('/...', requireAuth, requirePermission('MAINTENANCE_WRITE'), ...)
 *
 * Never check roles directly — always check permissions.
 * Fase 1: permissions derived from Traccar session (administrator flag).
 * Fase 2 (Supabase Auth): getUserPermissions() will query user_roles table.
 */

const { getUserPermissions, hasPermission } = require('../../core/rbac/index.js');

/**
 * Returns Express middleware that enforces a single permission.
 * Requires requireAuth to have run first (req.user must be set).
 *
 * @param {string} permission - e.g. 'MAINTENANCE_WRITE'
 * @returns {Function} Express middleware
 */
function requirePermission(permission) {
  return function checkPermission(req, res, next) {
    const permissions = getUserPermissions(req.user);
    if (hasPermission(permissions, permission)) {
      return next();
    }
    return res.status(403).json({
      error: 'No tienes permiso para realizar esta acción.',
      required: permission,
    });
  };
}

module.exports = { requirePermission };
