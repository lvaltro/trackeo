// src/components/FleetInsightsWidget.jsx
// Widget de Insights de Flota con métricas básicas y preview premium (blur + CTA Pro)

import { useState } from 'react';
import {
  TrendingUp,
  Car,
  MapPin,
  Zap,
  Lock,
  Sparkles,
  BarChart3,
  Target,
} from 'lucide-react';

const CURRENT_STATS = {
  totalKm: 380.7,
  averageKm: 54.4,
  maxKm: 120.5,
  activeVehicles: 12,
  totalVehicles: 18,
  completedRoutes: 47,
};

function UpgradeModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-orange-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Trackeo Pro
          </h2>
          <p className="text-slate-400">
            Desbloquea el potencial completo de tu flota
          </p>
        </div>

        {/* Features list */}
        <div className="space-y-3 mb-6">
          {[
            'Gráficos y tendencias avanzadas',
            'Comparativas mensuales ilimitadas',
            'Predicciones de consumo con IA',
            'Alertas personalizadas en tiempo real',
            'Mapas de calor de rutas',
            'Reportes automáticos por email',
            'Historial ilimitado (vs 30 días)',
            'Soporte prioritario 24/7',
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-3 h-3 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-slate-300 text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6 text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-slate-400 text-sm">$</span>
            <span className="text-4xl font-bold text-slate-100">29.99</span>
            <span className="text-slate-400 text-sm">/mes</span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Cancela cuando quieras &bull; Sin compromisos
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 rounded-xl font-medium text-sm transition-all duration-300"
          >
            Tal vez después
          </button>
          <button
            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
          >
            Activar Pro Ahora
          </button>
        </div>

        {/* Trust badges */}
        <div className="mt-6 pt-6 border-t border-slate-700/50 flex items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Pago seguro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-amber-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>4.9/5 estrellas</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const PREMIUM_FEATURES = [
  { icon: TrendingUp, label: 'Comparativas mensuales', color: 'text-green-400' },
  { icon: BarChart3, label: 'Gráficos de tendencias', color: 'text-orange-400' },
  { icon: Target, label: 'Predicciones de consumo', color: 'text-amber-400' },
  { icon: Zap, label: 'Alertas personalizadas', color: 'text-orange-400' },
  { icon: MapPin, label: 'Mapa de calor de rutas', color: 'text-green-400' },
];

export default function FleetInsightsWidget() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/20 h-full flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-xl">
              <BarChart3 className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-slate-100 font-semibold text-lg">
                Insights de Flota
              </h3>
              <p className="text-slate-400 text-xs">
                Esta semana (6 de 7 días activos)
              </p>
            </div>
          </div>

          {/* Badge Pro */}
          <div className="px-2.5 py-1 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-lg flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-orange-400" />
            <span className="text-orange-400 text-xs font-semibold">PRO</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            SECCIÓN GRATUITA - Métricas Básicas
            ════════════════════════════════════════════════ */}
        <div className="space-y-4 mb-6">

          {/* Métricas principales en grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800 hover:border-slate-600 transition-all duration-300 cursor-default">
              <p className="text-slate-400 text-xs mb-1">TOTAL KM</p>
              <p className="text-slate-100 text-2xl font-bold">
                {CURRENT_STATS.totalKm}
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800 hover:border-slate-600 transition-all duration-300 cursor-default">
              <p className="text-slate-400 text-xs mb-1">PROMEDIO</p>
              <p className="text-slate-100 text-2xl font-bold">
                {CURRENT_STATS.averageKm}
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800 hover:border-slate-600 transition-all duration-300 cursor-default">
              <p className="text-slate-400 text-xs mb-1">MÁXIMO</p>
              <p className="text-slate-100 text-2xl font-bold">
                {CURRENT_STATS.maxKm}
              </p>
            </div>
          </div>

          {/* Stats adicionales */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Vehículos activos</span>
              </div>
              <span className="text-slate-100 font-semibold">
                {CURRENT_STATS.activeVehicles}/{CURRENT_STATS.totalVehicles}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Rutas completadas</span>
              </div>
              <span className="text-slate-100 font-semibold">
                {CURRENT_STATS.completedRoutes}
              </span>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-6" />

        {/* ════════════════════════════════════════════════
            SECCIÓN PREMIUM - Preview Bloqueado
            ════════════════════════════════════════════════ */}
        <div className="flex-1 relative">

          {/* Título de sección premium */}
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-orange-400" />
            <span className="text-slate-300 text-sm font-medium">
              Desbloquea con Pro
            </span>
          </div>

          {/* Lista de features premium con blur */}
          <div className="relative">

            {/* Contenido con blur */}
            <div className="space-y-2 blur-sm select-none pointer-events-none">
              {PREMIUM_FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2.5 bg-slate-800/30 border border-slate-700/30 rounded-lg"
                  >
                    <Icon className={`w-4 h-4 ${feature.color}`} />
                    <span className="text-slate-300 text-sm">{feature.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Overlay con CTA */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="group px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 flex items-center gap-2 hover:scale-105"
              >
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                Upgrade a Pro
              </button>
            </div>
          </div>
        </div>

        {/* Footer informativo */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
          <span>Plan Gratuito</span>
          <span>Actualizado hace 2 min</span>
        </div>
      </div>

      {/* Modal de Upgrade */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </>
  );
}
