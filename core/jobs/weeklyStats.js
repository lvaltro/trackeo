'use strict';
/**
 * core/jobs/weeklyStats.js
 * Calcula estadísticas semanales por vehículo desde device_positions / device_events.
 *
 * Fórmula score:
 *   score = MAX(0, 100 - 2×overspeed - 4×harsh_brake - 3×harsh_accel)
 *
 * vehicle_id = device_id de Traccar (TEXT).
 * week_start = lunes de la semana (DATE).
 */

const { createClient } = require('@supabase/supabase-js');

const STATS_TABLE     = 'vehicle_weekly_stats';
const POSITIONS_TABLE = 'device_positions';
const EVENTS_TABLE    = 'device_events';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  return createClient(url, key);
}

/** Calcular distancia haversine en km entre dos puntos GPS */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Obtener lunes de la semana que contiene una fecha */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Dom, 1=Lun...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}

/** Obtener semana anterior al week_start dado */
function getPrevWeekStart(weekStart) {
  const d = new Date(weekStart + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().split('T')[0];
}

/**
 * Calcular y guardar estadísticas semanales para un vehículo y semana dados.
 * @param {string} vehicleId - device_id
 * @param {string} weekStart - 'YYYY-MM-DD' (lunes)
 * @returns {object} stats calculadas
 */
async function calculateWeeklyStats(vehicleId, weekStart) {
  const sb = getClient();

  const weekEnd = new Date(weekStart + 'T00:00:00Z');
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const weekEndStr = weekEnd.toISOString();
  const weekStartStr = weekStart + 'T00:00:00Z';

  // ─── Posiciones GPS de la semana ───
  const { data: positions, error: posErr } = await sb
    .from(POSITIONS_TABLE)
    .select('device_id, latitude, longitude, speed, recorded_at')
    .eq('device_id', vehicleId)
    .gte('recorded_at', weekStartStr)
    .lt('recorded_at', weekEndStr)
    .order('recorded_at', { ascending: true });

  if (posErr) throw new Error(`Error leyendo posiciones: ${posErr.message}`);

  // ─── Eventos de la semana ───
  const { data: events, error: evtErr } = await sb
    .from(EVENTS_TABLE)
    .select('device_id, event_type, attributes, recorded_at')
    .eq('device_id', vehicleId)
    .gte('recorded_at', weekStartStr)
    .lt('recorded_at', weekEndStr);

  if (evtErr) throw new Error(`Error leyendo eventos: ${evtErr.message}`);

  // ─── Cálculo de km totales y km diarios ───
  let kmTotal = 0;
  const dailyKm = {}; // 'YYYY-MM-DD' → km
  let maxSpeedKmh = 0;
  let totalSpeedSum = 0;
  let speedCount = 0;
  let drivingMinutes = 0;

  for (let i = 1; i < (positions || []).length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];

    const dist = haversineKm(
      parseFloat(prev.latitude), parseFloat(prev.longitude),
      parseFloat(curr.latitude), parseFloat(curr.longitude),
    );

    // Filtrar saltos irreales (>500km entre posiciones)
    if (dist > 500) continue;

    kmTotal += dist;

    const day = curr.recorded_at.split('T')[0];
    dailyKm[day] = (dailyKm[day] || 0) + dist;

    const speedKmh = parseFloat(curr.speed || 0) * 1.852; // knots → km/h
    if (speedKmh > maxSpeedKmh) maxSpeedKmh = speedKmh;
    if (speedKmh > 2) {
      totalSpeedSum += speedKmh;
      speedCount++;
      // Tiempo de conducción aproximado (intervalo entre posiciones en minutos)
      const dt = (new Date(curr.recorded_at) - new Date(prev.recorded_at)) / 60000;
      if (dt < 60) drivingMinutes += dt; // ignorar gaps > 1h
    }
  }

  const avgSpeedKmh = speedCount > 0 ? totalSpeedSum / speedCount : 0;

  // ─── Contar eventos de penalización ───
  let overspeedCount  = 0;
  let harshBrakeCount = 0;
  let harshAccelCount = 0;

  for (const evt of (events || [])) {
    const type = (evt.event_type || '').toLowerCase();
    const alarm = ((evt.attributes?.alarm) || '').toLowerCase();

    if (type === 'overspeed' || type === 'speeding') {
      overspeedCount++;
    } else if (type === 'alarm') {
      if (['hardbraking', 'hardbrake', 'harsh_brake'].includes(alarm)) harshBrakeCount++;
      else if (['hardacceleration', 'hardaccel', 'harsh_accel'].includes(alarm)) harshAccelCount++;
    }
  }

  // ─── Trips count (posiciones con gap > 5 minutos = nuevo viaje) ───
  let tripsCount = (positions && positions.length > 0) ? 1 : 0;
  for (let i = 1; i < (positions || []).length; i++) {
    const dt = (new Date(positions[i].recorded_at) - new Date(positions[i - 1].recorded_at)) / 60000;
    if (dt > 5) tripsCount++;
  }

  // ─── Score ───
  const score = Math.max(0, Math.min(100, 100 - 2 * overspeedCount - 4 * harshBrakeCount - 3 * harshAccelCount));

  // ─── Stats de semana anterior (para comparación) ───
  const prevWeekStart = getPrevWeekStart(weekStart);
  const { data: prevStats } = await sb
    .from(STATS_TABLE)
    .select('score, km_total')
    .eq('vehicle_id', vehicleId)
    .eq('week_start', prevWeekStart)
    .single();

  // ─── Upsert en Supabase ───
  const record = {
    vehicle_id:       vehicleId,
    organization_id:  null, // Se llenará cuando RBAC esté implementado (task 1.9b)
    week_start:       weekStart,
    km_total:         Math.round(kmTotal * 10) / 10,
    driving_minutes:  Math.round(drivingMinutes),
    trips_count:      tripsCount,
    max_speed_kmh:    Math.round(maxSpeedKmh * 10) / 10,
    avg_speed_kmh:    Math.round(avgSpeedKmh * 10) / 10,
    overspeed_count:  overspeedCount,
    harsh_brake_count: harshBrakeCount,
    harsh_accel_count: harshAccelCount,
    score,
    prev_score:       prevStats?.score ?? null,
    prev_km:          prevStats?.km_total ?? null,
    daily_km:         dailyKm,
    calculated_at:    new Date().toISOString(),
  };

  const { data, error: upsertErr } = await sb
    .from(STATS_TABLE)
    .upsert(record, { onConflict: 'vehicle_id,week_start' })
    .select()
    .single();

  if (upsertErr) throw new Error(`Error guardando stats: ${upsertErr.message}`);

  console.log(`[WeeklyStats] ${vehicleId} semana ${weekStart}: ${kmTotal.toFixed(1)}km, score=${score}`);
  return data;
}

/**
 * Calcular stats de la semana actual para todos los vehículos activos.
 * Obtiene IDs únicos desde device_positions (últimos 30 días).
 */
async function calculateCurrentWeekForAll() {
  const sb = getClient();
  const weekStart = getWeekStart(new Date());
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: devices, error } = await sb
    .from(POSITIONS_TABLE)
    .select('device_id')
    .gte('recorded_at', since);

  if (error) throw new Error(`Error obteniendo dispositivos: ${error.message}`);

  const uniqueIds = [...new Set((devices || []).map(d => d.device_id).filter(Boolean))];
  console.log(`[WeeklyStats] Calculando semana ${weekStart} para ${uniqueIds.length} vehículos`);

  const results = [];
  for (const vehicleId of uniqueIds) {
    try {
      const stats = await calculateWeeklyStats(vehicleId, weekStart);
      results.push({ vehicleId, ok: true, stats });
    } catch (err) {
      console.error(`[WeeklyStats] Error para ${vehicleId}:`, err.message);
      results.push({ vehicleId, ok: false, error: err.message });
    }
  }

  return { weekStart, processed: results.length, results };
}

/**
 * Obtener stats de las últimas N semanas para un vehículo.
 * @param {string} vehicleId
 * @param {number} weeks
 * @returns {object[]}
 */
async function getWeeklyStats(vehicleId, weeks = 4) {
  const sb = getClient();
  const { data, error } = await sb
    .from(STATS_TABLE)
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('week_start', { ascending: false })
    .limit(weeks);

  if (error) throw new Error(error.message);
  return data || [];
}

module.exports = { calculateWeeklyStats, calculateCurrentWeekForAll, getWeeklyStats, getWeekStart };
