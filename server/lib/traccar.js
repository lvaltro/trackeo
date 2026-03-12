const { logError } = require('./logger');

const TRACCAR_API_URL = process.env.TRACCAR_API_URL || 'https://api.trackeo.cl';
const TRACCAR_ADMIN_EMAIL = process.env.TRACCAR_ADMIN_EMAIL || '';
const TRACCAR_ADMIN_PASSWORD = process.env.TRACCAR_ADMIN_PASSWORD || '';

/**
 * Get latest position for a device using admin credentials.
 * NEVER expose deviceId to public consumers.
 */
async function getDevicePosition(deviceId) {
  if (!TRACCAR_ADMIN_EMAIL || !TRACCAR_ADMIN_PASSWORD) {
    logError('Traccar:position', 'TRACCAR_ADMIN_EMAIL y TRACCAR_ADMIN_PASSWORD no configurados');
    return null;
  }

  try {
    const auth = Buffer.from(`${TRACCAR_ADMIN_EMAIL}:${TRACCAR_ADMIN_PASSWORD}`).toString('base64');
    const resp = await fetch(`${TRACCAR_API_URL}/api/positions?deviceId=${deviceId}`, {
      headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' },
    });
    if (!resp.ok) return null;
    const positions = await resp.json();
    return positions[0] || null;
  } catch (err) {
    logError('Traccar:position', 'Error obteniendo posicion del dispositivo', err.message);
    return null;
  }
}

/**
 * Detect app base URL from request headers or env.
 */
function getAppUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL;
  const origin = req.headers.origin;
  if (origin) {
    try { return new URL(origin).origin; } catch { /* ignore */ }
  }
  const referer = req.headers.referer;
  if (referer) {
    try { return new URL(referer).origin; } catch { /* ignore */ }
  }
  return 'https://app.trackeo.cl';
}

module.exports = { getDevicePosition, getAppUrl };
