const { Router } = require('express');
const { enqueueReverseGeocode } = require('../../core/geocoding/index.js');
const { logError } = require('../lib/logger');

const router = Router();

/**
 * GET /api/geocode/reverse?lat=-33.45&lon=-70.66
 */
router.get('/reverse', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'Parametros lat y lon requeridos y deben ser numeros.' });
  }

  try {
    const result = await enqueueReverseGeocode(lat, lon);
    return res.json({ address: result.address, fromCache: result.fromCache ?? false });
  } catch (err) {
    logError('Geocode', 'Error en reverse geocoding', err.message);
    return res.status(502).json({ error: 'No se pudo obtener la direccion.', detail: err.message });
  }
});

module.exports = router;
