const { Router } = require('express');
const { z } = require('zod');
const liveShare = require('../../core/live-share/index.js');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { getDevicePosition, getAppUrl } = require('../lib/traccar');
const { logError } = require('../lib/logger');
const { audit } = require('../lib/auditLogger');

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const createSchema = z.object({
  deviceId:   z.string().min(1).max(255),
  deviceName: z.string().min(1).max(255),
  duration:   z.number().int().refine(v => [1, 2, 4, 8].includes(v), {
    message: 'Duración debe ser 1, 2, 4 u 8 horas.',
  }),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/live-share — Generate temporary share link
 */
router.post('/', requireAuth, validateBody(createSchema), async (req, res) => {
  const { deviceId, deviceName, duration: hours } = req.validated;

  try {
    const appUrl = getAppUrl(req);
    const userName = req.user.name || req.user.email || 'Usuario';
    const share = liveShare.createShare(deviceId, deviceName, hours, req.user.email, userName, appUrl);
    console.log(`[LiveShare] Nuevo link: ${share.url} (expira ${new Date(share.expiresAt).toLocaleString()})`);
    audit(req, { action: 'LIVE_SHARE_CREATE', resourceType: 'live_share', resourceId: share.token, changes: { deviceId, deviceName, hours } });

    return res.json({
      token: share.token,
      url: share.url,
      deviceName: share.deviceName,
      userName: share.userName,
      duration: share.duration,
      expiresAt: share.expiresAt,
    });
  } catch (err) {
    logError('LiveShare:create', 'Error generando link de comparticion', err.message);
    return res.status(500).json({ error: 'Error interno generando link.' });
  }
});

/**
 * GET /api/live-share/my — Active links for current user
 * IMPORTANT: defined BEFORE /:token so Express doesn't confuse it
 */
router.get('/my', requireAuth, async (req, res) => {
  return res.json(liveShare.listShares(req.user.email));
});

/**
 * GET /api/live-share/:token — Query share link (PUBLIC, no auth)
 */
router.get('/:token', async (req, res) => {
  const { token } = req.params;
  const result = liveShare.getShare(token);

  if (result.status === 'not-found') return res.status(404).json({ error: 'Link no valido.' });
  if (result.status === 'expired') return res.status(410).json({ error: 'Este link ha expirado.' });

  const share = result.share;

  const pos = await getDevicePosition(share.deviceId);
  const position = pos
    ? {
        lat: pos.latitude,
        lng: pos.longitude,
        speed: pos.speed != null ? Math.round(Number(pos.speed) * 1.852) : 0,
        course: pos.course || 0,
        timestamp: pos.fixTime || pos.deviceTime || new Date().toISOString(),
      }
    : null;

  return res.json({
    deviceName: share.deviceName,
    userName: share.userName,
    expiresAt: share.expiresAt,
    position,
  });
});

/**
 * DELETE /api/live-share/:token — Cancel share link
 */
router.delete('/:token', requireAuth, async (req, res) => {
  const { token } = req.params;
  const result = liveShare.deleteShare(token, req.user.email);

  if (result.status === 'not-found') return res.status(404).json({ error: 'Link no encontrado.' });
  if (result.status === 'forbidden') return res.status(403).json({ error: 'No tienes permiso para cancelar este link.' });

  console.log(`[LiveShare] Link cancelado: ${token}`);
  audit(req, { action: 'LIVE_SHARE_DELETE', resourceType: 'live_share', resourceId: token });
  return res.json({ ok: true });
});

module.exports = router;
