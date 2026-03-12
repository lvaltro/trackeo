/**
 * Cola con rate limiting (1 req/s) y cliente Nominatim — Trackeo.cl
 * Procesa peticiones de geocodificación de forma asíncrona respetando
 * la política de Nominatim: https://operations.osmfoundation.org/policies/nominatim/
 */

const { GeocodeCache, verifyCacheAndDistance } = require('./cache.js');

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/reverse';
const MIN_DELAY_MS = 1000; // 1 petición por segundo

const cache = new GeocodeCache({ radiusMeters: 25, useGridKey: true });

/** Cola de tareas: { lat, lon, resolve, reject } */
const queue = [];
let processing = false;

/**
 * Llama a Nominatim reverse geocoding (1 req/s).
 * User-Agent y Referer obligatorios según política de uso.
 */
async function callNominatim(lat, lon, userAgent = 'Trackeo/1.0 (Vehicle Tracking)') {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
  });
  const url = `${NOMINATIM_BASE}?${params}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': userAgent,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  const address = data.address;
  const displayName = [
    address?.road,
    address?.house_number,
    address?.suburb,
    address?.city,
    address?.state,
    address?.country,
  ]
    .filter(Boolean)
    .join(', ') || data.display_name || 'Dirección no disponible';
  return displayName;
}

/**
 * Procesa un ítem: caché primero, si no hay → Nominatim → guardar en caché.
 */
async function processOne(item) {
  const { lat, lon, resolve, reject } = item;
  try {
    const check = verifyCacheAndDistance(cache, lat, lon);
    if (!check.shouldCall) {
      resolve({ address: check.address, fromCache: true });
      return;
    }
    const address = await callNominatim(lat, lon);
    cache.set(lat, lon, address);
    resolve({ address, fromCache: false });
  } catch (err) {
    reject(err);
  }
}

/**
 * Worker: saca de la cola de a uno, con delay ≥ 1 s entre llamadas a Nominatim.
 */
async function drainQueue() {
  if (queue.length === 0) {
    processing = false;
    return;
  }
  processing = true;
  const item = queue.shift();
  const start = Date.now();
  await processOne(item);
  const elapsed = Date.now() - start;
  const wait = Math.max(0, MIN_DELAY_MS - elapsed);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  setImmediate(drainQueue);
}

/**
 * Encola una petición de geocodificación. Retorna Promise con { address, fromCache? }.
 */
function enqueueReverseGeocode(lat, lon) {
  return new Promise((resolve, reject) => {
    queue.push({ lat, lon, resolve, reject });
    if (!processing) drainQueue();
  });
}

module.exports = {
  enqueueReverseGeocode,
  cache,
  callNominatim,
};
