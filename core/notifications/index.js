'use strict';
/**
 * core/notifications — Historial de notificaciones del usuario.
 * Persistencia en Supabase (tabla "notifications").
 * Sin lógica HTTP: las rutas Express viven en server/index.js.
 *
 * Preserva los mismos nombres de campo que usa el frontend:
 *   tipo, mensaje, dispositivo, leido, fuente, createdAt
 */

const supabaseLib = require('../lib/supabaseClient');

const TABLE = 'notifications';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Cache del tamaño total (para health check síncrono)
let _cachedSize = 0;

/** Mapea fila de DB al shape que espera el frontend */
function rowToNotification(row) {
  return {
    id:          row.id,
    userId:      row.user_id,
    tipo:        row.tipo,
    mensaje:     row.mensaje,
    dispositivo: row.dispositivo || null,
    leido:       row.leido,
    fuente:      row.fuente || 'alerta',
    createdAt:   row.created_at,
    data:        row.data || {},
  };
}

const TIPOS_VALIDOS = ['geovalla', 'motor', 'mantenimiento', 'alerta', 'perfil', 'sistema'];

/**
 * Agregar una notificación.
 * @param {string} tipo
 * @param {string} mensaje
 * @param {string|null} dispositivo
 * @param {boolean} leido
 * @param {string} userId - Email del usuario
 * @param {string|null} [organizationId] - UUID de la organización. null hasta que RBAC esté implementado.
 * @returns {{ ok: true, notification } | { ok: false, error: string }}
 */
async function addNotification(tipo, mensaje, dispositivo, leido, userId, organizationId = null) {
  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    return { ok: false, error: `Tipo inválido: "${tipo}". Debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` };
  }
  if (!mensaje || typeof mensaje !== 'string') {
    return { ok: false, error: 'El campo "mensaje" es obligatorio y debe ser texto.' };
  }

  let sb;
  try {
    sb = supabaseLib.getClient();
  } catch (err) {
    console.error('[Notifications] Supabase no configurado:', err.message);
    return { ok: false, error: 'Servicio de notificaciones no disponible.' };
  }

  const insert = {
    user_id:         userId,
    organization_id: organizationId,
    tipo,
    mensaje:         mensaje.trim(),
    dispositivo:     dispositivo || null,
    leido:           leido === true,
    fuente:          leido === true ? 'usuario' : 'alerta',
    data:            {},
  };

  const { data, error } = await sb.from(TABLE).insert(insert).select().single();
  if (error) {
    console.error('[Notifications] Error insertando:', error.message);
    return { ok: false, error: error.message };
  }

  _cachedSize++;
  return { ok: true, notification: rowToNotification(data) };
}

/**
 * Obtener notificaciones de un usuario (últimos 7 días).
 * @param {string} userId
 * @param {number|string} limit
 * @returns {object[]}
 */
async function getNotifications(userId, limit = 50) {
  const maxLimit = Math.min(parseInt(limit) || 50, 100);
  const since = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

  let sb;
  try {
    sb = supabaseLib.getClient();
  } catch {
    return [];
  }

  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(maxLimit);

  if (error) {
    console.error('[Notifications] Error leyendo:', error.message);
    return [];
  }

  _cachedSize = data?.length || 0;
  return (data || []).map(rowToNotification);
}

/**
 * Marcar una notificación como leída.
 * @param {string} id - UUID
 * @param {string} userId
 * @returns {{ status: 'ok', notification } | { status: 'not-found' } | { status: 'forbidden' }}
 */
async function markRead(id, userId) {
  let sb;
  try {
    sb = supabaseLib.getClient();
  } catch {
    return { status: 'not-found' };
  }

  // Verificar propiedad
  const { data: existing } = await sb.from(TABLE).select('id, user_id').eq('id', id).single();
  if (!existing) return { status: 'not-found' };
  if (existing.user_id !== userId) return { status: 'forbidden' };

  const { data, error } = await sb
    .from(TABLE)
    .update({ leido: true })
    .eq('id', id)
    .select()
    .single();

  if (error) return { status: 'not-found' };
  return { status: 'ok', notification: rowToNotification(data) };
}

/**
 * Marcar todas las notificaciones de un usuario como leídas.
 * @param {string} userId
 * @returns {number} cantidad marcada
 */
async function markAllRead(userId) {
  let sb;
  try {
    sb = supabaseLib.getClient();
  } catch {
    return 0;
  }

  const { data, error } = await sb
    .from(TABLE)
    .update({ leido: true })
    .eq('user_id', userId)
    .eq('leido', false)
    .select('id');

  if (error) return 0;
  return data?.length || 0;
}

/**
 * Eliminar notificaciones más antiguas que maxDays días.
 * @param {number} maxDays
 * @returns {Promise<number>} cantidad eliminada
 */
async function cleanupOld(maxDays = 7) {
  const cutoff = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000).toISOString();

  let sb;
  try {
    sb = supabaseLib.getClient();
  } catch {
    return 0;
  }

  const { data, error } = await sb
    .from(TABLE)
    .delete()
    .lt('created_at', cutoff)
    .select('id');

  if (error) {
    console.error('[Notifications] Error en cleanup:', error.message);
    return 0;
  }

  const cleaned = data?.length || 0;
  if (cleaned > 0) {
    console.log(`[Notifications] Limpieza: ${cleaned} notificación(es) eliminada(s) (>${maxDays} días).`);
  }
  return cleaned;
}

/**
 * Tamaño aproximado del almacén (para health check síncrono).
 * Retorna valor cacheado de la última operación de lectura/escritura.
 */
function getSize() {
  return _cachedSize;
}

/**
 * Crear notificación interna (usada por jobs del servidor).
 * @param {object} opts - { tipo, mensaje, userId, dispositivo?, data? }
 */
async function createSystemNotification({ tipo, mensaje, userId, dispositivo, data = {} }) {
  let sb;
  try {
    sb = supabaseLib.getClient();
  } catch (err) {
    console.error('[Notifications] Supabase no configurado:', err.message);
    return null;
  }

  const insert = {
    user_id:     userId,
    tipo,
    mensaje,
    dispositivo: dispositivo || null,
    leido:       false,
    fuente:      'sistema',
    data,
  };

  const { data: row, error } = await sb.from(TABLE).insert(insert).select().single();
  if (error) {
    console.error('[Notifications] Error creando notificación del sistema:', error.message);
    return null;
  }
  return rowToNotification(row);
}

module.exports = {
  addNotification,
  getNotifications,
  markRead,
  markAllRead,
  cleanupOld,
  getSize,
  createSystemNotification,
  TIPOS_VALIDOS,
};
