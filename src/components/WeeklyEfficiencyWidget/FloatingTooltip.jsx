// ═══════════════════════════════════════════════════
// FloatingTooltip — Tooltip flotante al hacer clic en una barra
// Muestra detalle del día: KM, velocidad máx, consumo estimado
// ═══════════════════════════════════════════════════
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DAY_FULL_NAMES } from './types';

const tooltipVariants = {
  initial: { y: 10, opacity: 0, scale: 0.95 },
  animate: { y: 0, opacity: 1, scale: 1 },
  exit:    { y: -10, opacity: 0, scale: 0.95 },
};

/**
 * FloatingTooltip
 * @param {Object}   props
 * @param {Object|null} props.data       - Datos del día seleccionado
 * @param {boolean}  props.isOpen        - Controla visibilidad
 * @param {{x: number, y: number}} props.position - Posición absoluta respecto al contenedor
 * @param {() => void} props.onClose     - Callback para cerrar
 */
const FloatingTooltip = React.memo(({ data, isOpen, position, onClose }) => {
  const tooltipRef = useRef(null);

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Delay para evitar cerrar inmediatamente al mismo clic que abre
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!data) return null;

  const fullDay = DAY_FULL_NAMES[data.day] || data.day;

  // Formatear costo CLP
  const formatCLP = (value) => {
    if (!value) return '$0';
    return `$${value.toLocaleString('es-CL')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={tooltipRef}
          variants={tooltipVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute z-50 pointer-events-auto"
          style={{
            left: position?.x ?? 0,
            top: (position?.y ?? 0) - 8,
            transform: 'translate(-50%, -100%)',
          }}
          role="tooltip"
          aria-live="polite"
        >
          {/* Flecha inferior */}
          <div className="relative">
            <div className="bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl shadow-black/40 px-4 py-3 min-w-[180px] backdrop-blur-sm">
              {/* Día */}
              <p className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <span>📍</span>
                <span>{fullDay}</span>
              </p>

              {/* Separador */}
              <div className="h-px bg-slate-700/60 mb-2" />

              {/* Métricas */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>🚗</span> KM totales
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {data.km?.toFixed(1) ?? '0.0'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>⚡</span> Vel. máx
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {data.maxSpeed ?? 0} km/h
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>⛽</span> Est. consumo
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {formatCLP(data.fuelCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Flecha triangular */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-[6px]">
              <div className="w-3 h-3 bg-slate-800 border-r border-b border-slate-600/50 rotate-45" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

FloatingTooltip.displayName = 'FloatingTooltip';

export default FloatingTooltip;
