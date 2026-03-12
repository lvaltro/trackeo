// ═══════════════════════════════════════════════════
// WeeklyEfficiencyWidget — Container principal
// Widget interactivo de eficiencia semanal con selector de métricas,
// gráfico de barras animadas, tooltip flotante y línea de objetivo.
// ═══════════════════════════════════════════════════
//
// Props:
//   data       {Array}   - Datos semanales [{day, km, maxSpeed, fuelCost, efficiency, hours}]
//   goal       {Object}  - Metas por métrica {distance: 100, efficiency: 7, time: 3}
//   className  {string}  - Clases CSS adicionales para el contenedor
//
// Ejemplo de uso:
//   <WeeklyEfficiencyWidget
//     data={weeklyData}
//     goal={{ distance: 100, efficiency: 7, time: 3 }}
//   />
// ═══════════════════════════════════════════════════

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import MetricTabs from './MetricTabs';
import EfficiencyBarChart from './BarChart';
import GoalIndicator from './GoalIndicator';
import { METRICS, CHART_HEIGHTS, MOCK_DATA } from './types';

/**
 * WeeklyEfficiencyWidget
 * @param {Object}  props
 * @param {Array}   props.data      - Datos semanales (usa MOCK_DATA si no se provee)
 * @param {Object}  props.goal      - Objetivos por métrica { distance, efficiency, time }
 * @param {string}  props.className - Clases CSS extra
 */
const WeeklyEfficiencyWidget = React.memo(({ data, goal = {}, className = '' }) => {
  const [activeMetric, setActiveMetric] = useState('distance');

  // Datos (fallback a mock)
  const chartData = data && data.length > 0 ? data : MOCK_DATA;

  // Detectar altura responsiva
  const [chartHeight, setChartHeight] = useState(CHART_HEIGHTS.desktop);
  useEffect(() => {
    const updateHeight = () => {
      const w = window.innerWidth;
      if (w < 640) setChartHeight(CHART_HEIGHTS.mobile);
      else if (w < 1024) setChartHeight(CHART_HEIGHTS.tablet);
      else setChartHeight(CHART_HEIGHTS.desktop);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Configuración de la métrica actual
  const currentMetric = useMemo(
    () => METRICS.find((m) => m.id === activeMetric) || METRICS[0],
    [activeMetric]
  );

  // Meta para la métrica actual
  const currentGoal = useMemo(
    () => goal[activeMetric] ?? 0,
    [goal, activeMetric]
  );

  // Calcular resumen semanal
  const summary = useMemo(() => {
    const key = currentMetric.dataKey;
    const total = chartData.reduce((sum, d) => sum + (d[key] || 0), 0);
    const avg = total / chartData.length;
    const max = Math.max(...chartData.map((d) => d[key] || 0));
    const activeDays = chartData.filter((d) => (d[key] || 0) > 0).length;

    return { total, avg, max, activeDays };
  }, [chartData, currentMetric]);

  // Tendencia simulada (comparar última mitad vs primera mitad de la semana)
  const trend = useMemo(() => {
    const key = currentMetric.dataKey;
    const mid = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, mid).reduce((s, d) => s + (d[key] || 0), 0);
    const secondHalf = chartData.slice(mid).reduce((s, d) => s + (d[key] || 0), 0);
    
    if (firstHalf === 0 && secondHalf === 0) return { direction: 'neutral', percent: 0 };
    if (firstHalf === 0) return { direction: 'up', percent: 100 };
    
    const change = ((secondHalf - firstHalf) / firstHalf) * 100;
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
      percent: Math.abs(Math.round(change)),
    };
  }, [chartData, currentMetric]);

  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const trendColor = trend.direction === 'up'
    ? 'text-emerald-400 bg-emerald-500/10'
    : trend.direction === 'down'
      ? 'text-red-400 bg-red-500/10'
      : 'text-slate-400 bg-slate-500/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`
        rounded-2xl border border-slate-700/50
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        shadow-2xl shadow-orange-500/10
        backdrop-blur-sm
        p-5 sm:p-6
        ${className}
      `}
      role="region"
      aria-label="Widget de eficiencia semanal"
    >
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Título + tendencia */}
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-100 font-sans antialiased">
              Eficiencia Semanal
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {summary.activeDays} de 7 días activos
            </p>
          </div>

          {/* Badge de tendencia */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span className="text-[11px] font-bold">
              {trend.direction === 'neutral' ? '—' : `${trend.percent}%`}
            </span>
          </div>
        </div>

        {/* Tabs de métricas + Indicador de meta */}
        <div className="flex items-center gap-3">
          <GoalIndicator goal={currentGoal} unit={currentMetric.unit} />
          <MetricTabs activeMetric={activeMetric} onChange={setActiveMetric} />
        </div>
      </div>

      {/* ═══ Resumen compacto ═══ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMetric}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-4"
        >
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold text-slate-100 font-sans antialiased">
              {summary.total.toFixed(1)}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Total {currentMetric.unit}
            </p>
          </div>
          <div className="text-center border-x border-slate-700/40">
            <p className="text-lg sm:text-xl font-bold text-slate-100 font-sans antialiased">
              {summary.avg.toFixed(1)}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Promedio
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold text-slate-100 font-sans antialiased">
              {summary.max.toFixed(1)}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Máximo
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ═══ Gráfico de barras ═══ */}
      <div id={`panel-${activeMetric}`} role="tabpanel" aria-label={`Panel de ${currentMetric.label}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMetric}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <EfficiencyBarChart
              data={chartData}
              activeMetric={activeMetric}
              goal={currentGoal}
              height={chartHeight}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

WeeklyEfficiencyWidget.displayName = 'WeeklyEfficiencyWidget';

export default WeeklyEfficiencyWidget;
