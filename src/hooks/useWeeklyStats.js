// src/hooks/useWeeklyStats.js
// Estadísticas semanales y Driver Score.
// Modo demo cuando vehicleId es null → datos mock.
// Modo real cuando vehicleId presente → API REST.

import { useState, useEffect, useCallback } from 'react';
import { getWeeklyStats } from '../api/weeklyStatsApi';

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getMockStats() {
  const today = new Date();
  // Generar 7 días de la semana actual con km mock
  const dailyKm = {};
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const km = i === 0 ? 0 : Math.round(30 + Math.random() * 80);
    dailyKm[key] = km;
    days.push({ day: DAY_LABELS[d.getDay()], km, date: key });
  }
  return [
    {
      id: 'mock-current',
      vehicle_id: 'demo',
      week_start: days[0].date,
      km_total: days.reduce((sum, d) => sum + d.km, 0),
      driving_minutes: 320,
      trips_count: 14,
      max_speed_kmh: 112,
      avg_speed_kmh: 54,
      overspeed_count: 1,
      harsh_brake_count: 2,
      harsh_accel_count: 1,
      score: 89,
      prev_score: 84,
      prev_km: 380,
      daily_km: dailyKm,
      calculated_at: today.toISOString(),
    },
  ];
}

/**
 * Convertir daily_km { 'YYYY-MM-DD': km } en array para el gráfico.
 * Siempre retorna 7 puntos (lun–dom de la semana).
 */
function dailyKmToChartData(weekStart, dailyKm = {}) {
  const data = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().split('T')[0];
    data.push({
      day: DAY_LABELS[d.getUTCDay()],
      km: Math.round((dailyKm[key] || 0) * 10) / 10,
      date: key,
    });
  }
  return data;
}

function scoreColor(score) {
  if (score >= 90) return 'emerald';
  if (score >= 75) return 'amber';
  return 'red';
}

export function useWeeklyStats(vehicleId, weeks = 4) {
  const useMock = !vehicleId;

  const [statsRows, setStatsRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (useMock) {
        setStatsRows(getMockStats());
      } else {
        const data = await getWeeklyStats(vehicleId, weeks);
        setStatsRows(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, weeks, useMock]);

  useEffect(() => { load(); }, [load]);

  // Semana más reciente
  const currentWeek = statsRows[0] || null;
  const prevWeek    = statsRows[1] || null;

  // Chart data: días de la semana actual
  const chartData = currentWeek
    ? dailyKmToChartData(currentWeek.week_start, currentWeek.daily_km)
    : [];

  // Porcentaje de cambio vs semana anterior
  const kmChange = currentWeek && currentWeek.prev_km && currentWeek.prev_km > 0
    ? Math.round(((currentWeek.km_total - currentWeek.prev_km) / currentWeek.prev_km) * 100)
    : null;

  const scoreChange = currentWeek && currentWeek.prev_score != null
    ? currentWeek.score - currentWeek.prev_score
    : null;

  return {
    statsRows,
    currentWeek,
    prevWeek,
    chartData,
    kmChange,
    scoreChange,
    scoreColor: currentWeek ? scoreColor(currentWeek.score) : 'slate',
    loading,
    error,
    refresh: load,
  };
}
