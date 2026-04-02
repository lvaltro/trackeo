'use strict';
/**
 * core/audit — Registro de auditoría de mutaciones.
 *
 * Escribe en la tabla audit_logs de Supabase.
 * NUNCA lanza error ni rechaza promesas — una falla de auditoría
 * no debe interrumpir la operación del usuario.
 *
 * Sin lógica HTTP: el módulo recibe datos planos. El wrapper HTTP
 * que extrae ip/userAgent del req vive en server/lib/auditLogger.js.
 */

const supabaseLib = require('../lib/supabaseClient');

const TABLE = 'audit_logs';

/**
 * Registra una mutación en audit_logs.
 *
 * @param {object} params
 * @param {string}  params.action          - 'MAINTENANCE_CREATE', 'DOCUMENT_DELETE', etc.
 * @param {string}  [params.resourceType]  - 'maintenance_record', 'vehicle_document', etc.
 * @param {string}  [params.resourceId]    - UUID del recurso afectado
 * @param {object}  [params.changes]       - payload / diff relevante
 * @param {string}  [params.ipAddress]
 * @param {string}  [params.userAgent]
 * @param {string}  [params.traccarUserId] - ID numérico del usuario en Traccar (como TEXT)
 * @param {string}  [params.traccarEmail]
 * @returns {Promise<void>}
 */
async function logAudit({
  action,
  resourceType = null,
  resourceId   = null,
  changes      = {},
  ipAddress    = null,
  userAgent    = null,
  traccarUserId = null,
  traccarEmail  = null,
}) {
  try {
    const supabase = supabaseLib.getClient();
    const { error } = await supabase.from(TABLE).insert({
      action,
      resource_type:    resourceType,
      resource_id:      resourceId,
      changes,
      ip_address:       ipAddress,
      user_agent:       userAgent,
      traccar_user_id:  traccarUserId != null ? String(traccarUserId) : null,
      traccar_email:    traccarEmail,
    });

    if (error) {
      // Solo loguear — nunca propagar
      console.error(`[Audit] Error escribiendo log: ${error.message}`, { action, resourceType, resourceId });
    }
  } catch (err) {
    console.error(`[Audit] Excepcion inesperada: ${err.message}`, { action });
  }
}

module.exports = { logAudit };
