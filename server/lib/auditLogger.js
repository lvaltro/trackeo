'use strict';
/**
 * server/lib/auditLogger.js
 *
 * Wrapper HTTP sobre core/audit.
 * Extrae ip + userAgent del req de Express y llama logAudit.
 *
 * Uso en un route handler (después de la operación exitosa):
 *
 *   const { audit } = require('../lib/auditLogger');
 *   await audit(req, { action: 'MAINTENANCE_CREATE', resourceType: 'maintenance_record', resourceId: record.id, changes: { created: req.validated } });
 */

const { logAudit } = require('../../core/audit/index.js');

/**
 * @param {import('express').Request} req
 * @param {object} params
 * @param {string}  params.action
 * @param {string}  [params.resourceType]
 * @param {string}  [params.resourceId]
 * @param {object}  [params.changes]
 * @returns {Promise<void>}
 */
function audit(req, { action, resourceType, resourceId, changes = {} }) {
  const ip = req.ip || req.headers['x-forwarded-for'] || null;
  const userAgent = req.headers['user-agent'] || null;
  const traccarUserId = req.user?.id != null ? String(req.user.id) : null;
  const traccarEmail  = req.user?.email || null;

  return logAudit({
    action,
    resourceType,
    resourceId,
    changes,
    ipAddress: ip,
    userAgent,
    traccarUserId,
    traccarEmail,
  });
}

module.exports = { audit };
