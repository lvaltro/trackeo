// ═══════════════════════════════════════════════════
// BarChart — Gráfico de barras con gradiente, animaciones y accesibilidad
// Usa Recharts para layout + Framer Motion para animaciones de entrada
// ═══════════════════════════════════════════════════
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingTooltip from './FloatingTooltip';
import { DAY_SHORT, BAR_GRADIENT, METRICS } from './types';

// ─── Barra animada personalizada (Framer Motion) ───
const AnimatedBar = (props) => {
  const { x, y, width, height, index, isActive, isHovered, onClick, payload, dataKey } = props;

  // Altura mínima de 24px para días sin actividad
  const minHeight = 24;
  const barHeight = Math.max(height, minHeight);
  const barY = y + height - barHeight;

  return (
    <motion.rect
      x={x}
      y={barY}
      width={width}
      rx={8}
      ry={8}
      fill={`url(#barGradient)`}
      initial={{ height: 0, y: y + height }}
      animate={{
        height: barHeight,
        y: barY,
        opacity: isActive ? 1 : isHovered ? 0.9 : 1,
        scaleX: isHovered ? 1.05 : 1,
      }}
      transition={{
        height: { type: 'spring', stiffness: 100, damping: 15, delay: index * 0.05 },
        y:      { type: 'spring', stiffness: 100, damping: 15, delay: index * 0.05 },
        opacity: { duration: 0.15 },
        scaleX:  { duration: 0.15 },
      }}
      style={{
        cursor: 'pointer',
        filter: isActive
          ? 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))'
          : isHovered
            ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
            : 'none',
        transformOrigin: `${x + width / 2}px ${barY + barHeight}px`,
      }}
      onClick={onClick}
      role="img"
      aria-label={`${payload?.day}: ${payload?.[dataKey]?.toFixed?.(1) ?? 0}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    />
  );
};

// ─── Shape renderer para cada barra ───
const CustomBarShape = (shapeProps) => {
  const {
    x, y, width, height, index, payload,
    activeIndex, hoveredIndex, onBarClick, dataKey,
  } = shapeProps;

  const isActive = activeIndex === index;
  const isHovered = hoveredIndex === index;

  return (
    <AnimatedBar
      x={x}
      y={y}
      width={width}
      height={height}
      index={index}
      isActive={isActive}
      isHovered={isHovered}
      payload={payload}
      dataKey={dataKey}
      onClick={() => onBarClick(index, { x: x + width / 2, y })}
    />
  );
};

// ─── Tick personalizado para eje X con responsividad ───
const CustomXAxisTick = ({ x, y, payload, screenSize }) => {
  const day = payload.value;
  const shortMap = DAY_SHORT[day];
  let label = day;
  if (screenSize === 'mobile' && shortMap) label = shortMap.one;
  else if (screenSize === 'tablet' && shortMap) label = shortMap.two;

  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      className="fill-slate-500 text-[11px] font-medium"
      aria-hidden="true"
    >
      {label}
    </text>
  );
};

/**
 * BarChart — Componente principal del gráfico
 * @param {Object}   props
 * @param {Array}    props.data        - Array de datos semanales
 * @param {string}   props.activeMetric - Métrica activa ('distance'|'efficiency'|'time')
 * @param {number}   props.goal        - Valor de la meta (línea dashed)
 * @param {number}   props.height      - Altura del chart en px
 */
const EfficiencyBarChart = React.memo(({ data, activeMetric = 'distance', goal = 0, height = 300 }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const hoverTimerRef = useRef(null);

  // Obtener la key de datos según la métrica activa
  const metricConfig = useMemo(
    () => METRICS.find((m) => m.id === activeMetric) || METRICS[0],
    [activeMetric]
  );
  const dataKey = metricConfig.dataKey;

  // Detectar tamaño de pantalla
  const [screenSize, setScreenSize] = useState('desktop');
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setScreenSize('mobile');
      else if (w < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Resetear barra activa al cambiar métrica (con animación de morphing)
  useEffect(() => {
    setActiveIndex(null);
  }, [activeMetric]);

  // Calcular máximo para padding del eje Y
  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d[dataKey] || 0), 1),
    [data, dataKey]
  );

  // Handler de clic en barra con debounce
  const handleBarClick = useCallback((index, position) => {
    if (activeIndex === index) {
      setActiveIndex(null);
    } else {
      setActiveIndex(index);
      setTooltipPosition(position);
    }
  }, [activeIndex]);

  // Handler hover con debounce de 100ms
  const handleBarHover = useCallback((index) => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setHoveredIndex(index);
    }, 50);
  }, []);

  const handleBarLeave = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setHoveredIndex(null);
    }, 100);
  }, []);

  // Cleanup timer
  useEffect(() => {
    return () => clearTimeout(hoverTimerRef.current);
  }, []);

  // Navegación por teclado (Arrow keys)
  const handleKeyNavigation = useCallback((e) => {
    const currentIdx = activeIndex ?? -1;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = Math.min(currentIdx + 1, data.length - 1);
      setActiveIndex(next);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = Math.max(currentIdx - 1, 0);
      setActiveIndex(prev);
    } else if (e.key === 'Escape') {
      setActiveIndex(null);
    }
  }, [activeIndex, data.length]);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height }}
      onKeyDown={handleKeyNavigation}
      tabIndex={-1}
      role="img"
      aria-label={`Gráfico de eficiencia semanal — ${metricConfig.label}`}
    >
      {/* Definición del gradiente SVG */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={BAR_GRADIENT.start} stopOpacity={1} />
            <stop offset="100%" stopColor={BAR_GRADIENT.end}   stopOpacity={0.85} />
          </linearGradient>
        </defs>
      </svg>

      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
          barCategoryGap="20%"
          onMouseMove={(state) => {
            if (state?.activeTooltipIndex !== undefined) {
              handleBarHover(state.activeTooltipIndex);
            }
          }}
          onMouseLeave={handleBarLeave}
        >
          {/* Eje X: solo labels, sin línea */}
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={<CustomXAxisTick screenSize={screenSize} />}
            interval={0}
          />

          {/* Eje Y oculto (solo para escala) */}
          <YAxis
            hide
            domain={[0, maxValue * 1.15]}
          />

          {/* Línea de meta (dashed) */}
          {goal > 0 && (
            <ReferenceLine
              y={goal}
              stroke="rgb(245 158 11 / 0.7)"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: `Meta: ${goal} ${metricConfig.unit}`,
                position: 'right',
                fill: 'rgb(245 158 11 / 0.9)',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          )}

          {/* Barras con shape personalizado */}
          <Bar
            dataKey={dataKey}
            radius={[8, 8, 0, 0]}
            maxBarSize={48}
            shape={(shapeProps) => (
              <CustomBarShape
                {...shapeProps}
                activeIndex={activeIndex}
                hoveredIndex={hoveredIndex}
                onBarClick={handleBarClick}
                dataKey={dataKey}
              />
            )}
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>

      {/* Tooltip flotante */}
      <FloatingTooltip
        data={activeIndex !== null ? data[activeIndex] : null}
        isOpen={activeIndex !== null}
        position={tooltipPosition}
        onClose={() => setActiveIndex(null)}
      />

      {/* Screen reader: anunciar valor al cambiar métrica */}
      <div className="sr-only" aria-live="polite" role="status">
        {activeIndex !== null && data[activeIndex] && (
          <span>
            {data[activeIndex].day}: {data[activeIndex][dataKey]?.toFixed(1)} {metricConfig.unit}
          </span>
        )}
      </div>
    </div>
  );
});

EfficiencyBarChart.displayName = 'EfficiencyBarChart';

export default EfficiencyBarChart;
