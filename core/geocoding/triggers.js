/**
 * Filtro y disparadores — Trackeo.cl
 * Decide si una posición debe encolarse para geocodificación (sin procesar cada punto de la ruta).
 */

const { distanceMeters } = require('./cache.js');

const DEFAULT_RADIUS_SAME_LOCATION_M = 10;
const DEFAULT_STOPPED_MINUTES = 3;
const DEFAULT_SPEED_THRESHOLD_KMH = 1;

/**
 * Estado por dispositivo para detectar "detenido X minutos" y redundancia.
 */
const deviceState = new Map();

/**
 * ¿Debe geocodificarse esta posición?
 * - Redundancia: misma ubicación (radio ~10 m) → no.
 * - Disparador 1: usuario solicitó dirección (prioritario).
 * - Disparador 2: velocidad = 0 durante ≥ X minutos (primera vez que se cumple).
 *
 * @param {Object} event - { deviceId, latitude, longitude, speed }
 * @param {Object} options - { radiusSameLocationM, stoppedMinutes, speedThresholdKmh }
 * @param {boolean} userRequested - true si el usuario pidió "Ver dirección" en la UI
 */
function shouldGeocode(event, options = {}, userRequested = false) {
  const {
    radiusSameLocationM = DEFAULT_RADIUS_SAME_LOCATION_M,
    stoppedMinutes = DEFAULT_STOPPED_MINUTES,
    speedThresholdKmh = DEFAULT_SPEED_THRESHOLD_KMH,
  } = options;

  const { deviceId, latitude: lat, longitude: lon, speed: speedKmh = 0 } = event;
  const now = Date.now();
  const state = deviceState.get(deviceId) || {
    lat: null,
    lon: null,
    speed: null,
    stoppedSince: null,
    userRequested: false,
  };

  // 1) Redundancia: misma ubicación (estacionado, sin movimiento)
  if (state.lat != null && state.lon != null) {
    const dist = distanceMeters(state.lat, state.lon, lat, lon);
    if (dist < radiusSameLocationM) {
      state.lat = lat;
      state.lon = lon;
      state.speed = speedKmh;
      if (speedKmh <= speedThresholdKmh) state.stoppedSince = state.stoppedSince || now;
      deviceState.set(deviceId, state);
      return { geocode: false, reason: 'same_location' };
    }
  }

  // 2) Actualizar última posición
  state.lat = lat;
  state.lon = lon;
  state.speed = speedKmh;

  // 3) Disparador: usuario solicitó dirección
  if (userRequested || state.userRequested) {
    state.userRequested = false;
    state.stoppedSince = null;
    state.firedForCurrentStop = false;
    deviceState.set(deviceId, state);
    return { geocode: true, reason: 'user_request' };
  }

  // 4) Disparador: vehículo detenido ≥ X minutos (una sola vez por parada)
  if (speedKmh <= speedThresholdKmh) {
    const stoppedSince = state.stoppedSince || now;
    const elapsedMinutes = (now - stoppedSince) / (60 * 1000);
    if (!state.firedForCurrentStop && elapsedMinutes >= stoppedMinutes) {
      state.stoppedSince = null;
      state.firedForCurrentStop = true; // no volver a disparar hasta que se mueva
      deviceState.set(deviceId, state);
      return { geocode: true, reason: 'stopped_long_enough' };
    }
    state.stoppedSince = stoppedSince;
  } else {
    state.stoppedSince = null;
    state.firedForCurrentStop = false; // se movió; próxima parada puede disparar de nuevo
  }

  deviceState.set(deviceId, state);
  return { geocode: false, reason: 'no_trigger' };
}

/**
 * Marcar que el usuario pidió la dirección para este dispositivo (desde la UI).
 */
function setUserRequested(deviceId) {
  const state = deviceState.get(deviceId) || {
    lat: null,
    lon: null,
    speed: null,
    stoppedSince: null,
    userRequested: false,
    firedForCurrentStop: false,
  };
  state.userRequested = true;
  deviceState.set(deviceId, state);
}

module.exports = {
  shouldGeocode,
  setUserRequested,
  deviceState,
};
