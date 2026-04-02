'use strict';
/**
 * core/documents — Documentos del vehículo con vencimientos.
 * Sin lógica HTTP. Las rutas Express viven en server/index.js.
 *
 * vehicle_id = device_id de Traccar (TEXT, no UUID de vehicles table).
 */

const supabaseLib = require('../lib/supabaseClient');

const TABLE = 'vehicle_documents';

const TIPOS_VALIDOS = [
  'permiso_circulacion',
  'seguro_obligatorio',
  'revision_tecnica',
  'seguro_adicional',
  'licencia',
  'otro',
];

/**
 * Calcular status según fecha de vencimiento.
 * @param {string} expiresAt - ISO date string
 * @returns {'expired'|'expiring'|'ok'}
 */
function calcStatus(expiresAt) {
  const diff = Math.floor((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'expired';
  if (diff <= 30) return 'expiring';
  return 'ok';
}

/**
 * Listar documentos de un vehículo, ordenados por vencimiento.
 * @param {string} vehicleId
 * @returns {object[]}
 */
async function listByVehicle(vehicleId) {
  const sb = supabaseLib.getClient();
  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('expires_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Crear documento.
 * @param {string} vehicleId
 * @param {object} fields - { type, title, expires_at, issue_date?, notes?, reminder_days?, file_url?, metadata? }
 * @param {string|null} [organizationId] - UUID de la organización. null hasta que RBAC esté implementado.
 * @returns {object} documento creado
 */
async function create(vehicleId, fields, organizationId = null) {
  const { type, title, expires_at } = fields;
  if (!type || !TIPOS_VALIDOS.includes(type)) {
    throw new Error(`Tipo inválido: "${type}". Debe ser uno de: ${TIPOS_VALIDOS.join(', ')}`);
  }
  if (!title) throw new Error('El campo "title" es obligatorio.');
  if (!expires_at) throw new Error('El campo "expires_at" es obligatorio.');

  const sb = supabaseLib.getClient();
  const insert = {
    vehicle_id:      vehicleId,
    organization_id: organizationId,
    type:            fields.type,
    title:           fields.title,
    expires_at:      fields.expires_at,
    issue_date:      fields.issue_date    || null,
    notes:           fields.notes         || null,
    reminder_days:   fields.reminder_days || [30, 7, 0],
    file_url:        fields.file_url      || null,
    metadata:        fields.metadata      || {},
    status:          calcStatus(fields.expires_at),
  };

  const { data, error } = await sb.from(TABLE).insert(insert).select().single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Actualizar documento. Solo el propietario del vehículo puede hacerlo
 * (la seguridad real viene del auth de Traccar en la capa HTTP).
 * @param {string} id - UUID del documento
 * @param {string} vehicleId - Para verificar pertenencia
 * @param {object} fields - Campos a actualizar
 * @returns {object|null}
 */
async function update(id, vehicleId, fields) {
  // Campos protegidos que no se pueden modificar externamente
  const { id: _id, vehicle_id: _vid, created_at: _ca, ...rest } = fields;

  // Recalcular status si cambia expires_at
  if (rest.expires_at) {
    rest.status = calcStatus(rest.expires_at);
  }

  const sb = supabaseLib.getClient();
  const { data, error } = await sb
    .from(TABLE)
    .update(rest)
    .eq('id', id)
    .eq('vehicle_id', vehicleId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Eliminar documento.
 * @param {string} id
 * @param {string} vehicleId
 */
async function remove(id, vehicleId) {
  const sb = supabaseLib.getClient();
  const { error } = await sb
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('vehicle_id', vehicleId);

  if (error) throw new Error(error.message);
}

/**
 * Documentos próximos a vencer (para job de recordatorios).
 * @param {number} withinDays - Vencen dentro de N días
 * @returns {object[]}
 */
async function getExpiringSoon(withinDays = 30) {
  const sb = supabaseLib.getClient();
  const until = new Date();
  until.setDate(until.getDate() + withinDays);

  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .lte('expires_at', until.toISOString().split('T')[0])
    .gte('expires_at', new Date().toISOString().split('T')[0])
    .order('expires_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

module.exports = { listByVehicle, create, update, remove, getExpiringSoon, TIPOS_VALIDOS };
