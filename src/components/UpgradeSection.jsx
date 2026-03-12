// src/components/UpgradeSection.jsx
// Sección de upgrade a Plan Pro - ancho completo, debajo del mapa y gráfico
// Soporta tema claro/oscuro dinámicamente

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

function UpgradeModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#131B2C] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <Sparkles className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Trackeo Pro
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Análisis avanzados para tu flota
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
              <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-gray-800 dark:text-white">
            $29.99
            <span className="text-lg text-gray-500 dark:text-gray-400">/mes</span>
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Cancela cuando quieras &bull; Sin compromisos
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.10] text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm transition-all"
          >
            Cancelar
          </button>
          <button className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 transition-all hover:scale-105">
            Activar Pro
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UpgradeSection() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Banner horizontal ancho: icono + texto a la izquierda, botón a la derecha */}
      <div className="w-full p-6 bg-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <span className="text-2xl" aria-hidden>👑</span>
          <span className="text-slate-200 font-medium text-base md:text-lg">
            Desbloquea Análisis Premium
          </span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm transition-all"
        >
          Ver Planes
        </button>
      </div>

      {showModal && <UpgradeModal onClose={() => setShowModal(false)} />}
    </>
  );
}
