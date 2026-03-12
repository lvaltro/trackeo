// ═══════════════════════════════════════════════════
// MetricTabs — Selector de métricas (Pills)
// Permite alternar entre Distancia, Eficiencia y Tiempo
// ═══════════════════════════════════════════════════
import React from 'react';
import { motion } from 'framer-motion';
import { METRICS } from './types';

/**
 * MetricTabs
 * @param {Object}   props
 * @param {string}   props.activeMetric - ID de la métrica activa
 * @param {(id: string) => void} props.onChange - Callback al cambiar métrica
 */
const MetricTabs = React.memo(({ activeMetric, onChange }) => {
  return (
    <div
      className="flex gap-1.5 p-1 bg-slate-800/60 rounded-xl"
      role="tablist"
      aria-label="Selector de métricas"
    >
      {METRICS.map((metric) => {
        const isActive = activeMetric === metric.id;
        return (
          <button
            key={metric.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${metric.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(metric.id)}
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              text-xs font-medium transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
              ${isActive
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/40'
              }
            `}
          >
            {/* Fondo animado del tab activo */}
            {isActive && (
              <motion.div
                layoutId="activeMetricTab"
                className="absolute inset-0 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/50"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-[13px]">{metric.icon}</span>
            <span className="relative z-10 hidden sm:inline">{metric.label}</span>
          </button>
        );
      })}
    </div>
  );
});

MetricTabs.displayName = 'MetricTabs';

export default MetricTabs;
