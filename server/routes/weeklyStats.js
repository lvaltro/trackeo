const { Router } = require('express');
const { getWeeklyStats } = require('../../core/jobs/weeklyStats.js');
const { requireAuth } = require('../middleware/auth');
const { requireVehicleOwnership } = require('../middleware/ownership');
const { logError } = require('../lib/logger');

const router = Router();

/**
 * GET /api/app/weekly-stats/:vehicleId
 * Query: ?weeks=4 (default 4, max 12)
 */
router.get('/:vehicleId', requireAuth, requireVehicleOwnership, async (req, res) => {
  try {
    const weeks = Math.min(parseInt(req.query.weeks) || 4, 12);
    const stats = await getWeeklyStats(req.params.vehicleId, weeks);
    return res.json(stats);
  } catch (err) {
    logError('WeeklyStats:get', 'Error obteniendo estadisticas', err.message);
    return res.status(500).json({ error: 'Error obteniendo estadisticas semanales.' });
  }
});

module.exports = router;
