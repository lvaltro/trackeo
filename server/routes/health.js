const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const { getSupabaseClient } = require('../lib/supabase');

const router = Router();

/**
 * GET /api/app/health — Connectivity and build info check
 */
router.get('/', async (req, res) => {
  let build = null;
  try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'BUILD_INFO.json'), 'utf-8');
    build = JSON.parse(raw);
  } catch {
    build = { builtAt: null, node: process.version };
  }

  let db = { ok: false };
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('notifications')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    db = error ? { ok: false, error: error.message } : { ok: true };
  } catch (err) {
    db = { ok: false, error: err.message };
  }

  return res.json({
    status: 'ok',
    service: 'trackeo-backend',
    port: process.env.GEOCODE_PORT || 3001,
    timestamp: new Date().toISOString(),
    build,
    db,
  });
});

module.exports = router;
