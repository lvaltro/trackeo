// src/components/WeeklyUsageWidget.jsx
// Widget de Uso Semanal — Midnight Premium con efecto glow neón naranja
// Soporta tema claro/oscuro via prop isDark
// Acepta datos reales via props data, kmChange, score, scoreChange

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const MOCK_DATA = [
  { day: 'Lun', km: 45 },
  { day: 'Mar', km: 78 },
  { day: 'Mié', km: 92 },
  { day: 'Jue', km: 65 },
  { day: 'Vie', km: 118 },
  { day: 'Sáb', km: 135 },
  { day: 'Dom', km: 85 },
];

export default function WeeklyUsageWidget({
  isDark = false,
  data,          // [{ day, km }] — datos reales del hook
  kmChange,      // number | null — % cambio vs semana anterior
  score,         // number | null — driver score 0-100
  scoreChange,   // number | null — diferencia de score vs semana anterior
}) {
  const weeklyData = data || MOCK_DATA;
  const trend = kmChange != null ? kmChange : 12; // fallback al +12% demo
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9';
  const tickColor = isDark ? '#475569' : '#94a3af';
  const axisColor = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0';
  const dotStroke = isDark ? '#131B2C' : '#ffffff';

  return (
    <div
      className="
        w-full min-h-[300px] flex flex-col
        bg-white dark:bg-[#131B2C]
        border border-slate-100 dark:border-white/[0.06]
        rounded-2xl
        shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none
        p-5
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-slate-800 dark:text-white font-semibold text-lg">
            Uso Semanal
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Kilómetros por día
          </p>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          {trend > 0
            ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            : trend < 0
              ? <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              : <Minus className="w-3.5 h-3.5 text-slate-400" />}
          <span className={`text-sm font-semibold ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        </div>
      </div>

      {/* Gráfico de área — altura explícita para que no colapse */}
      <div className="h-64 w-full mt-4 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={weeklyData.map(d => ({ day: d.day, km: d.km }))}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <defs>
              {/* Gradiente de relleno naranja con volumen */}
              <linearGradient id="glowGradientKm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.30} />
                <stop offset="50%" stopColor="#f97316" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              {/* Filtro de glow neón para la línea */}
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feFlood floodColor="#f97316" floodOpacity="0.6" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="shadow" />
                <feMerge>
                  <feMergeNode in="shadow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />

            <XAxis
              dataKey="day"
              stroke={axisColor}
              tick={{ fill: tickColor, fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: axisColor }}
              tickLine={false}
            />

            <YAxis
              stroke={axisColor}
              tick={{ fill: tickColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              cursor={{ stroke: '#f97316', strokeWidth: 2 }}
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                padding: '8px 12px',
              }}
              itemStyle={{
                color: isDark ? '#f3f4f6' : '#1f2937',
                fontSize: '14px',
                fontWeight: '500',
              }}
              labelStyle={{
                color: isDark ? '#9ca3af' : '#6b7280',
                marginBottom: '4px',
              }}
              formatter={(value) => [`${value} km`, 'Distancia']}
            />

            <Area
              type="monotone"
              dataKey="km"
              stroke="#f97316"
              strokeWidth={3}
              fill="url(#glowGradientKm)"
              style={{ filter: isDark ? 'url(#neonGlow)' : 'none' }}
              dot={{
                fill: '#f97316',
                strokeWidth: 3,
                r: 4,
                stroke: dotStroke,
              }}
              activeDot={{
                r: 6,
                fill: '#f97316',
                stroke: dotStroke,
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Driver Score — solo si viene el dato */}
      {score != null && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Driver Score</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-2xl font-bold ${score >= 90 ? 'text-emerald-500' : score >= 75 ? 'text-amber-500' : 'text-red-500'}`}>
                {score}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
              {scoreChange != null && (
                <span className={`text-xs font-semibold ml-1 ${scoreChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {scoreChange > 0 ? '+' : ''}{scoreChange}
                </span>
              )}
            </div>
          </div>
          {/* Mini barra de progreso */}
          <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
