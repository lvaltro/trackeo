const { logError } = require('../lib/logger');

const TRACCAR_API_URL = process.env.TRACCAR_API_URL || 'https://api.trackeo.cl';

/**
 * Verify Traccar session from JSESSIONID cookie.
 * Returns user object or null.
 */
async function verifyTraccarSession(req) {
  const cookie = req.headers.cookie;
  if (!cookie) return null;

  try {
    const resp = await fetch(`${TRACCAR_API_URL}/api/session`, {
      headers: { 'Cookie': cookie, 'Accept': 'application/json' },
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (err) {
    logError('Traccar:session', 'Error verificando sesion', err.message);
    return null;
  }
}

/**
 * Express middleware: require authenticated Traccar session.
 * Sets req.user on success, returns 403 on failure.
 */
async function requireAuth(req, res, next) {
  try {
    const user = await verifyTraccarSession(req);
    if (!user) {
      return res.status(403).json({ error: 'No autenticado.' });
    }
    req.user = user;
    next();
  } catch (err) {
    logError('Auth:middleware', 'Error en middleware de autenticacion', err.message);
    return res.status(500).json({ error: 'Error interno verificando sesion.' });
  }
}

module.exports = { verifyTraccarSession, requireAuth };
