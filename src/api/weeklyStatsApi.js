// src/api/weeklyStatsApi.js
// Cliente REST para vehicle_weekly_stats → Express /api/app/weekly-stats/

const BASE = `${import.meta.env.VITE_API_URL || '/api'}/app/weekly-stats`;

async function request(path, options = {}) {
  const resp = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

/**
 * Obtener stats de las últimas N semanas de un vehículo.
 * @param {string} vehicleId
 * @param {number} weeks - Default 4, máximo 12
 */
export const getWeeklyStats = (vehicleId, weeks = 4) =>
  request(`/${vehicleId}?weeks=${weeks}`);
