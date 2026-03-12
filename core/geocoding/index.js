/**
 * core/geocoding — Barrel export
 * Punto de entrada único para la lógica de geocodificación inversa.
 */

const { GeocodeCache, distanceMeters, gridKey, verifyCacheAndDistance } = require('./cache.js');
const { enqueueReverseGeocode, cache, callNominatim } = require('./queue.js');
const { shouldGeocode, setUserRequested, deviceState } = require('./triggers.js');

module.exports = {
  // cache.js
  GeocodeCache,
  distanceMeters,
  gridKey,
  verifyCacheAndDistance,
  // queue.js
  enqueueReverseGeocode,
  cache,
  callNominatim,
  // triggers.js
  shouldGeocode,
  setUserRequested,
  deviceState,
};
