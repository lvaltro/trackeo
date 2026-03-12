// ═══════════════════════════════════════════════════
// GoalIndicator — Línea de objetivo semanal (dashed)
// Se renderiza como overlay SVG dentro del chart
// ═══════════════════════════════════════════════════
import React from 'react';

/**
 * GoalIndicator — Componente customizado de Recharts (ReferenceLine)
 * Renderiza la línea dashed de meta con badge
 * 
 * @param {Object} props
 * @param {number} props.goal      - Valor numérico de la meta
 * @param {string} props.unit      - Unidad de medida (KM, L/100km, etc.)
 * @param {number} props.chartWidth - Ancho total del chart
 */
const GoalIndicator = React.memo(({ goal, unit }) => {
  if (!goal || goal <= 0) return null;

  return (
    <div
      className="flex items-center gap-2 ml-auto"
      role="status"
      aria-label={`Meta semanal: ${goal} ${unit}`}
    >
      <div className="h-px w-4 border-t-2 border-dashed border-amber-500/70" />
      <span className="text-[10px] font-semibold text-amber-500/90 bg-amber-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
        Meta: {goal} {unit}
      </span>
    </div>
  );
});

GoalIndicator.displayName = 'GoalIndicator';

export default GoalIndicator;
