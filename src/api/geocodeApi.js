/**
 * Cliente de geocodificación inversa — Trackeo.cl
 * Usa Nominatim (OpenStreetMap) con cache en memoria y rate limiting.
 *
 * Política de Nominatim: máximo 1 request/segundo, User-Agent obligatorio.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

// ═══ Cache en memoria ═══
const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const CACHE_MAX_SIZE = 200;

// ═══ Rate limiting ═══
const REQUEST_DELAY = 1100; // 1.1 segundos entre requests (cumple política Nominatim)
let lastRequestTime = 0;

/**
 * Redondea coordenadas para agrupar ubicaciones cercanas bajo la misma key de cache.
 * 4 decimales ≈ 11 metros de precisión (suficiente para dirección).
 */
function getCacheKey(lat, lon) {
  return `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
}

/**
 * Limpia entradas expiradas del cache.
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, entry] of CACHE) {
    if (now - entry.timestamp > CACHE_TTL) {
      CACHE.delete(key);
    }
  }
}

/**
 * Obtiene la dirección para una coordenada (lat, lon).
 * Usa cache primero. Si no hay hit, respeta rate limit antes de llamar a Nominatim.
 * @returns {Promise<{ address: object, display_name: string }>}
 */
export async function reverseGeocode(lat, lon) {
  const key = getCacheKey(lat, lon);

  // Check cache
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Rate limit: esperar si la última petición fue hace menos de 1.1s
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY) {
    await new Promise(r => setTimeout(r, REQUEST_DELAY - elapsed));
  }
  lastRequestTime = Date.now();

  const url = `${NOMINATIM_URL}?format=json&lat=${lat}&lon=${lon}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'TrackeoApp/1.0 (contacto@trackeo.cl)',
      'Accept-Language': 'es',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Nominatim error ${res.status}: ${text}`);
  }

  const data = await res.json();

  // Guardar en cache
  CACHE.set(key, { data, timestamp: Date.now() });

  // Limpiar cache viejo periódicamente
  if (CACHE.size > CACHE_MAX_SIZE) {
    cleanCache();
  }

  return data;
}

/**
 * Extrae dirección corta: Calle + Número + Comuna.
 * @param {object} data - Respuesta de Nominatim (con .address y opcionalmente .display_name)
 * @returns {string}
 */
export function getShortAddress(data) {
  const addr = data?.address;

  if (!addr || typeof addr !== 'object') {
    return (data?.display_name || 'Ubicación desconocida').split(',').slice(0, 2).join(',');
  }

  // Calle (varios nombres posibles en OSM)
  const road = addr.road || addr.pedestrian || addr.footway || addr.street || addr.path || 'Calle s/n';

  // Número
  const number = addr.house_number || '';

  // Comuna/Ciudad (varios niveles administrativos)
  const place = addr.city || addr.town || addr.village || addr.suburb
    || addr.neighbourhood || addr.municipality || addr.county || '';

  // "Calle #123" o solo "Calle"
  const streetPart = number ? `${road} #${number}` : road;

  // "Calle #123, Concepción"
  return [streetPart, place].filter(Boolean).join(', ');
}
