/**
 * Utilidades para mapas y procesamiento de rutas GPS.
 * Incluye Haversine y limpieza de ruido (GPS drift).
 */

const KNOTS_TO_KMH = 1.852;
const MIN_SPEED_KNOTS_FLOOR = 2;     // < 2 nudos (~3.7 km/h) → velocidad 0 (speed floor)
const MIN_DISTANCE_METERS = 30;      // solo agrega punto si está a > 30 m del último válido
const MIN_SPEED_KMH_MOVE = 10;       // O si velocidad > 10 km/h (movimiento real)

/**
 * Distancia entre dos puntos en km (fórmula de Haversine).
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distancia en kilómetros
 */
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Distancia entre dos puntos en metros.
 */
export function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  return getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) * 1000;
}

/**
 * Procesa la ruta cruda para reducir GPS drift (ruido / zigzag cuando está estacionado).
 *
 * Paso 1 – Speed floor: si speed < 2 nudos → velocidad a 0.
 * Paso 2 – Deduplicación: solo agrega punto si (A) distancia al último válido > 30 m O (B) velocidad > 10 km/h.
 * Paso 3 – Estadísticas recalculadas solo con cleanPoints (distancia total y velocidad máxima).
 *
 * @param {Array<{ latitude: number, longitude: number, speed?: number }>} rawData - Posiciones de Traccar (speed en nudos)
 * @returns {{ cleanRoute: Array<{ latitude, longitude, speedKmh }>, path: Array<[number, number]>, distanceKm: number, maxSpeedKmh: number }}
 */
export function processRouteData(rawData) {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return { cleanRoute: [], path: [], distanceKm: 0, maxSpeedKmh: 0 };
  }

  // Paso 1: Limpieza de velocidad (speed floor) — < 2 nudos → 0
  const normalized = rawData
    .filter((p) => p.latitude != null && p.longitude != null && !Number.isNaN(p.latitude) && !Number.isNaN(p.longitude))
    .map((p) => {
      const speedKnots = p.speed != null ? Number(p.speed) : 0;
      const speedKmh = speedKnots < MIN_SPEED_KNOTS_FLOOR ? 0 : speedKnots * KNOTS_TO_KMH;
      return {
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        speedKmh,
      };
    });

  if (normalized.length === 0) return { cleanRoute: [], path: [], distanceKm: 0, maxSpeedKmh: 0 };

  // Paso 2: Filtro de distancia y movimiento — cleanPoints: primer punto siempre; resto solo si (A) > 30 m o (B) > 10 km/h
  const cleanRoute = [normalized[0]];
  for (let i = 1; i < normalized.length; i++) {
    const point = normalized[i];
    const last = cleanRoute[cleanRoute.length - 1];
    const distanceM = getDistanceFromLatLonInMeters(
      last.latitude,
      last.longitude,
      point.latitude,
      point.longitude
    );
    const conditionA = distanceM > MIN_DISTANCE_METERS;
    const conditionB = point.speedKmh > MIN_SPEED_KMH_MOVE;
    if (conditionA || conditionB) cleanRoute.push(point);
  }

  // Paso 3: recálculo de estadísticas solo con cleanRoute
  let distanceKm = 0;
  let maxSpeedKmh = 0;
  for (let i = 0; i < cleanRoute.length; i++) {
    const p = cleanRoute[i];
    if (p.speedKmh > maxSpeedKmh) maxSpeedKmh = p.speedKmh;
    if (i > 0) {
      const prev = cleanRoute[i - 1];
      distanceKm += getDistanceFromLatLonInKm(
        prev.latitude,
        prev.longitude,
        p.latitude,
        p.longitude
      );
    }
  }

  const path = cleanRoute.map((p) => [p.latitude, p.longitude]);

  return { cleanRoute, path, distanceKm, maxSpeedKmh };
}
