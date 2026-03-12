// src/components/HistoryView.jsx
// Panel de Historial de Rutas: selector de fecha, búsqueda y resumen (distancia, velocidad máx).
// Usa processRouteData (mapUtils) para reducir GPS drift antes de dibujar y calcular estadísticas.

import React, { useState } from 'react';
import { Calendar, Search, Route, Gauge, Loader2 } from 'lucide-react';
import { traccarService } from '../api/traccarApi';
import { processRouteData } from '../utils/mapUtils';

/** Convierte fecha local (YYYY-MM-DD) a inicio y fin del día en ISO UTC */
function dayToISOFromTo(dateStr) {
  if (!dateStr) return { from: null, to: null };
  const from = new Date(dateStr + 'T00:00:00.000Z');
  const to = new Date(dateStr + 'T23:59:59.999Z');
  return { from: from.toISOString(), to: to.toISOString() };
}

const HistoryView = ({ deviceId, deviceName, onRouteLoaded, isDark }) => {
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (deviceId == null) return;
    const { from, to } = dayToISOFromTo(dateStr);
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    setStats(null);
    onRouteLoaded?.(null);
    setHasSearched(true);
    try {
      const data = await traccarService.getRouteReport(deviceId, from, to);
      const rawPositions = Array.isArray(data) ? data : data?.positions ?? data?.data ?? [];
      const { path, distanceKm, maxSpeedKmh, cleanRoute } = processRouteData(rawPositions);
      setStats({ distanceKm, maxSpeedKmh, count: cleanRoute.length });
      onRouteLoaded?.(path.length > 0 ? { path } : null);
      if (path.length === 0) onRouteLoaded?.(null);
    } catch (err) {
      setError(err.message || 'Error al cargar la ruta');
      onRouteLoaded?.(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-5 shadow-sm">
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Fecha
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              disabled={loading}
              className="pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-neutral-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none disabled:opacity-60"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 disabled:opacity-60 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Buscar Ruta
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 mb-4 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2">
          {error}
        </p>
      )}

      {hasSearched && !loading && !error && (
        <>
          {stats && stats.count > 0 ? (
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="rounded-xl p-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10">
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 mb-1">
                  <Route className="w-4 h-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Distancia Recorrida</span>
                </div>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {stats.distanceKm.toFixed(1)} km
                </p>
              </div>
              <div className="rounded-xl p-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10">
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 mb-1">
                  <Gauge className="w-4 h-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Velocidad Máxima</span>
                </div>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {Math.round(stats.maxSpeedKmh)} km/h
                </p>
              </div>
            </div>
          ) : (
            <p className="text-neutral-500 dark:text-neutral-400 text-sm py-4 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 px-4">
              No hay recorridos registrados en esta fecha.
            </p>
          )}
        </>
      )}

      {deviceName && (
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
          Vehículo: <span className="font-medium text-neutral-600 dark:text-neutral-400">{deviceName}</span>
        </p>
      )}
    </div>
  );
};

export default HistoryView;
export { dayToISOFromTo };
