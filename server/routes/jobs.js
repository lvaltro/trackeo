const { Router } = require('express');
const { calculateCurrentWeekForAll } = require('../../core/jobs/weeklyStats.js');
const { runDocReminders } = require('../../core/jobs/docReminders.js');
const { requireAuth } = require('../middleware/auth');
const { logError } = require('../lib/logger');

const router = Router();

/**
 * Temporary admin guard using Traccar's administrator flag.
 * Replace with requirePermission('JOB_TRIGGER') once RBAC is implemented (task 1.9b).
 */
function requireAdmin(req, res, next) {
  if (!req.user?.administrator) {
    return res.status(403).json({ error: 'Requiere permisos de administrador.' });
  }
  next();
}

/**
 * POST /api/app/jobs/weekly-stats — Manual trigger for weekly stats job
 * Restricted to Traccar administrators (temporary — see requireAdmin above).
 */
router.post('/weekly-stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await calculateCurrentWeekForAll();
    return res.json({ ok: true, ...result });
  } catch (err) {
    logError('Jobs:weeklyStats', 'Error en trigger manual', err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/app/jobs/doc-reminders — Manual trigger for doc reminders job
 * Restricted to Traccar administrators (temporary — see requireAdmin above).
 */
router.post('/doc-reminders', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await runDocReminders();
    return res.json({ ok: true, ...result });
  } catch (err) {
    logError('Jobs:docReminders', 'Error en trigger manual', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
