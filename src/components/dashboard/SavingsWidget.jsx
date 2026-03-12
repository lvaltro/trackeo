// ═══════════════════════════════════════════════════
// SavingsWidget — Ahorros totales con desglose
// Muestra fuelSaved + maintenanceSaved con CountUp
// Dual theme (light/dark)
// ═══════════════════════════════════════════════════

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Fuel, Wrench, TrendingUp } from 'lucide-react';

/**
 * CountUp — Animación de número que cuenta hacia arriba al montar
 */
function CountUp({ value, className = '', decimals = 0 }) {
  const count = useMotionValue(0);
  const springCount = useSpring(count, { stiffness: 50, damping: 25 });
  const rounded = useTransform(springCount, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v)
  );

  useEffect(() => {
    count.set(value);
  }, [value, count]);

  return <motion.span className={className}>{rounded}</motion.span>;
}

/**
 * SavingsWidget
 * @param {Object}  props
 * @param {number}  props.fuelSaved       - Ahorro en combustible
 * @param {number}  props.maintenanceSaved - Ahorro en mantenimiento
 */
function SavingsWidget({ fuelSaved = 0, maintenanceSaved = 0 }) {
  const total = fuelSaved + maintenanceSaved;

  return (
    <div
      className="
        rounded-2xl border p-5 transition-colors duration-200
        bg-white border-slate-200 shadow-sm
        dark:bg-slate-900 dark:border-slate-800 dark:shadow-none
      "
    >
      {/* Header: Título y badge de tendencia */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Ahorros totales
        </h3>
        <span
          className="
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
            bg-emerald-100 text-emerald-700
            dark:bg-emerald-500/10 dark:text-emerald-400
          "
        >
          <TrendingUp className="w-3 h-3" />
          Tendencia
        </span>
      </div>

      {/* Valor principal */}
      <div className="mb-4">
        <CountUp
          value={total}
          className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums"
        />
        <span className="text-slate-500 dark:text-slate-400 text-sm ml-1">
          $/mes
        </span>
      </div>

      {/* Desglose */}
      <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400 text-xs">
            Combustible
          </span>
          <CountUp
            value={fuelSaved}
            className="text-slate-900 dark:text-white text-sm font-semibold tabular-nums"
          />
        </div>
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400 text-xs">
            Mantenimiento
          </span>
          <CountUp
            value={maintenanceSaved}
            className="text-slate-900 dark:text-white text-sm font-semibold tabular-nums"
          />
        </div>
      </div>
    </div>
  );
}

export default SavingsWidget;
