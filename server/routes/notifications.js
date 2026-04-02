const { Router } = require('express');
const { z } = require('zod');
const notifications = require('../../core/notifications/index.js');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { audit } = require('../lib/auditLogger');

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const TIPOS_VALIDOS_NOTIF = ['geovalla', 'motor', 'mantenimiento', 'alerta', 'perfil', 'sistema'];

const createSchema = z.object({
  tipo:        z.enum(TIPOS_VALIDOS_NOTIF),
  mensaje:     z.string().min(1).max(1000),
  dispositivo: z.string().max(255).optional(),
  leido:       z.boolean().optional(),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/app/notifications — Save new notification
 * Body: { tipo, mensaje, dispositivo?, leido? }
 */
router.post('/', requireAuth, validateBody(createSchema), async (req, res) => {
  const { tipo, mensaje, dispositivo, leido } = req.validated;
  const result = await notifications.addNotification(tipo, mensaje, dispositivo, leido, req.user.email, req.user?.organizationId ?? null);

  if (!result.ok) return res.status(400).json({ error: result.error });

  audit(req, { action: 'NOTIFICATION_CREATE', resourceType: 'notification', resourceId: result.notification.id, changes: { tipo, mensaje, dispositivo } });
  return res.status(201).json(result.notification);
});

/**
 * GET /api/app/notifications — Last 7 days for current user
 * Query: ?limit=50
 */
router.get('/', requireAuth, async (req, res) => {
  return res.json(await notifications.getNotifications(req.user.email, req.query.limit));
});

/**
 * PUT /api/app/notifications/:id/read — Mark as read
 */
router.put('/:id/read', requireAuth, async (req, res) => {
  const result = await notifications.markRead(req.params.id, req.user.email);

  if (result.status === 'not-found') return res.status(404).json({ error: 'Notificacion no encontrada.' });
  if (result.status === 'forbidden') return res.status(403).json({ error: 'No autorizado.' });
  return res.json(result.notification);
});

/**
 * PUT /api/app/notifications/read-all — Mark all as read
 */
router.put('/read-all', requireAuth, async (req, res) => {
  const count = await notifications.markAllRead(req.user.email);
  return res.json({ ok: true, marcadas: count });
});

module.exports = router;
