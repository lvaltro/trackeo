/**
 * Verificación de Caché y Distancia — Trackeo.cl
 * Evita llamadas innecesarias a Nominatim:
 * 1) Comprueba si ya existe una dirección para una coordenada "cercana" (≤ radio metros).
 * 2) Clave de caché por celda de grid (~25 m) para búsqueda O(1) o por vecinos.
 *
 * Uso: en memoria (Map) o fácil de reemplazar por Redis con clave geo/celda.
 */

const EARTH_RADIUS_M = 6_371_000;

/**
 * Distancia aproximada entre dos puntos (fórmula de Haversine), en metros.
 */
function distanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Genera una clave de celda de grid para ~25 m (aprox. 4 decimales ≈ 11 m).
 * Misma celda → misma clave → reutilizar misma dirección sin llamar a Nominatim.
 */
function gridKey(lat, lon, precisionDecimals = 4) {
  const factor = 10 ** precisionDecimals;
  const latCell = Math.floor(lat * factor) / factor;
  const lonCell = Math.floor(lon * factor) / factor;
  return `${latCell.toFixed(precisionDecimals)}_${lonCell.toFixed(precisionDecimals)}`;
}

/**
 * Caché en memoria: clave (grid o "lat_lon") → { address, lat, lon, timestamp }.
 * Para producción con Redis: set/get por clave de celda y opcionalmente búsqueda por radio.
 */
class GeocodeCache {
  constructor(options = {}) {
    this.radiusMeters = options.radiusMeters ?? 25;
    this.useGridKey = options.useGridKey !== false;
    this.precisionDecimals = options.precisionDecimals ?? 4;
    this.maxEntries = options.maxEntries ?? 50_000;
    /** @type {Map<string, { address: string, lat: number, lon: number, timestamp: number }>} */
    this.storage = new Map();
    this.keyOrder = []; // FIFO para eviction
  }

  /**
   * Busca en caché si hay una dirección para una coordenada cercana (≤ radiusMeters).
   * Retorna { hit: true, address } si existe, o { hit: false } si no.
   */
  get(lat, lon) {
    if (this.useGridKey) {
      const key = gridKey(lat, lon, this.precisionDecimals);
      const entry = this.storage.get(key);
      if (entry) return { hit: true, address: entry.address, lat: entry.lat, lon: entry.lon };
      return { hit: false };
    }

    // Búsqueda por distancia (útil si no usas grid; más lenta con muchos ítems)
    for (const [k, entry] of this.storage) {
      const d = distanceMeters(lat, lon, entry.lat, entry.lon);
      if (d <= this.radiusMeters) return { hit: true, address: entry.address, lat: entry.lat, lon: entry.lon };
    }
    return { hit: false };
  }

  /**
   * Guarda una dirección para (lat, lon). Clave = gridKey para reutilización por proximidad.
   */
  set(lat, lon, address) {
    const key = this.useGridKey ? gridKey(lat, lon, this.precisionDecimals) : `${lat}_${lon}`;
    if (!this.storage.has(key)) {
      this.keyOrder.push(key);
      if (this.keyOrder.length > this.maxEntries) {
        const oldest = this.keyOrder.shift();
        this.storage.delete(oldest);
      }
    }
    this.storage.set(key, { address, lat, lon, timestamp: Date.now() });
  }
}

/**
 * Verificación completa: "¿Debo llamar a Nominatim o hay caché?"
 * Retorna { shouldCall: false, address } si hay caché; { shouldCall: true } si hay que llamar.
 */
function verifyCacheAndDistance(cache, lat, lon) {
  const result = cache.get(lat, lon);
  if (result.hit) return { shouldCall: false, address: result.address };
  return { shouldCall: true };
}

module.exports = {
  distanceMeters,
  gridKey,
  GeocodeCache,
  verifyCacheAndDistance,
};
