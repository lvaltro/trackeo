// ═══════════════════════════════════════════════════
// ProPlanWidget — Banner flotante de Plan Pro
// Se muestra como CTA no invasivo en el dashboard
// ═══════════════════════════════════════════════════
import React, { useState } from 'react';
import { Zap, ChevronUp, X, Check, Sparkles, Crown } from 'lucide-react';

const PRO_FEATURES = [
  'Widgets ilimitados',
  'Historial completo',
  'Alertas personalizadas',
  'Reportes avanzados',
  'Soporte prioritario',
];

/**
 * ProPlanWidget
 * @param {Object}  props
 * @param {boolean} props.isEditMode - Ocultar durante edición
 */
const ProPlanWidget = ({ isEditMode = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem('trackeo_pro_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  if (isDismissed) return null;

  return (
    <div className={`
      fixed bottom-24 right-6 z-40
      transition-all duration-300
      ${isEditMode ? 'translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
    `}>
      
      {/* Banner compacto */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="
            bg-gradient-to-r from-orange-500 to-amber-500
            hover:from-orange-600 hover:to-amber-600
            text-white px-4 py-2.5 rounded-xl
            shadow-lg shadow-orange-500/30
            flex items-center gap-2
            transition-all hover:scale-105 active:scale-95
          "
        >
          <Zap className="w-4 h-4" />
          <span className="font-medium text-sm">Upgrade a Pro</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      )}

      {/* Modal expandido */}
      {isExpanded && (
        <div className="
          bg-slate-900 border border-slate-700 rounded-2xl
          shadow-2xl shadow-orange-500/20
          p-6 w-80
          animate-slide-in-bottom
        ">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-slate-100 font-bold text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-orange-400" />
                Plan Pro
              </h3>
              <p className="text-slate-400 text-sm">
                Desbloquea todas las funciones
              </p>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Features */}
          <div className="space-y-2.5 mb-5">
            {PRO_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-slate-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button className="
            w-full bg-gradient-to-r from-orange-500 to-amber-500
            hover:from-orange-600 hover:to-amber-600
            text-white font-semibold py-3 rounded-xl
            transition-all hover:shadow-lg hover:shadow-orange-500/50
            flex items-center justify-center gap-2
          ">
            <Sparkles className="w-4 h-4" />
            Activar Plan Pro
          </button>

          <p className="text-center text-slate-500 text-xs mt-3">
            $29.99/mes &bull; Cancela cuando quieras
          </p>

          {/* Dismiss link */}
          <button
            onClick={() => {
              setIsDismissed(true);
              setIsExpanded(false);
              try {
                localStorage.setItem('trackeo_pro_dismissed', 'true');
              } catch {}
            }}
            className="w-full text-center text-slate-600 text-[11px] mt-2 hover:text-slate-400 transition-colors"
          >
            No me interesa por ahora
          </button>
        </div>
      )}
    </div>
  );
};

export default ProPlanWidget;
