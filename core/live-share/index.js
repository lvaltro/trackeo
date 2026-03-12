/**
 * core/live-share — Viaje Seguro
 * Almacén en memoria de links temporales de ubicación compartida.
 * Sin lógica HTTP: las rutas Express viven en server/index.js.
 */

const crypto = require('crypto');

// TODO: Migrar a base de datos cuando haya >100 shares simultáneos.
const liveShares = new Map();

/** Generar token criptográficamente seguro (12 caracteres hex). */
function generateToken() {
  return crypto.randomBytes(6).toString('hex');
}

/**
 * Crear un nuevo link de compartición temporal.
 * @param {string} deviceId - ID del dispositivo (NO se expone al público)
 * @param {string} deviceName - Nombre del vehículo
 * @param {number} hours - Duración: 1, 2, 4 u 8
 * @param {string} userEmail - Email del propietario del link
 * @param {string} userName - Nombre del propietario
 * @param {string} appUrl - URL base de la app (para generar el link público)
 * @returns {object} share — objeto con token, url, expiresAt, etc.
 */
function createShare(deviceId, deviceName, hours, userEmail, userName, appUrl) {
  // Limpiar expirados de paso
  const now = Date.now();
  for (const [token, share] of liveShares) {
    if (now > new Date(share.expiresAt).getTime()) liveShares.delete(token);
  }

  const token = generateToken();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + hours * 60 * 60 * 1000);

  const share = {
    token,
    deviceId,
    deviceName,
    userName,
    userEmail,
    duration: hours,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    url: `${appUrl}/live/${token}`,
  };

  liveShares.set(token, share);
  return share;
}

/**
 * Obtener share por token. Elimina automáticamente si expiró.
 * @returns {{ status: 'ok', share } | { status: 'not-found' } | { status: 'expired' }}
 */
function getShare(token) {
  const share = liveShares.get(token);
  if (!share) return { status: 'not-found' };
  if (Date.now() > new Date(share.expiresAt).getTime()) {
    liveShares.delete(token);
    return { status: 'expired' };
  }
  return { status: 'ok', share };
}

/**
 * Listar shares activos de un usuario. Limpia expirados de paso.
 * @param {string} userEmail
 * @returns {object[]} array de shares activos del usuario
 */
function listShares(userEmail) {
  const now = Date.now();
  const result = [];
  for (const [token, share] of liveShares) {
    if (now > new Date(share.expiresAt).getTime()) {
      liveShares.delete(token);
      continue;
    }
    if (share.userEmail === userEmail) {
      result.push({
        token: share.token,
        url: share.url,
        deviceName: share.deviceName,
        userName: share.userName,
        duration: share.duration,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
      });
    }
  }
  return result;
}

/**
 * Cancelar un share. Verifica propiedad.
 * @returns {{ status: 'ok' } | { status: 'not-found' } | { status: 'forbidden' }}
 */
function deleteShare(token, userEmail) {
  const share = liveShares.get(token);
  if (!share) return { status: 'not-found' };
  if (share.userEmail !== userEmail) return { status: 'forbidden' };
  liveShares.delete(token);
  return { status: 'ok' };
}

/**
 * Eliminar todos los shares expirados. Para uso en cleanup periódico.
 * @returns {number} cantidad eliminada
 */
function cleanupExpired() {
  const now = Date.now();
  let cleaned = 0;
  for (const [token, share] of liveShares) {
    if (now > new Date(share.expiresAt).getTime()) {
      liveShares.delete(token);
      cleaned++;
    }
  }
  return cleaned;
}

module.exports = {
  createShare,
  getShare,
  listShares,
  deleteShare,
  cleanupExpired,
};
