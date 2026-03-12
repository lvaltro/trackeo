// ═══════════════════════════════════════════════════
// AddWidgetModal — Catálogo de widgets disponibles
// Permite al usuario añadir nuevos widgets al dashboard
// ═══════════════════════════════════════════════════
import React from 'react';
import {
  X, Gauge, Radio, MapPin, TrendingUp, Battery,
  Map, BarChart3, Activity, Clock, Fuel, Shield, Crown,
} from 'lucide-react';

const WIDGET_CATALOG = [
  {
    id: 'velocidad',
    label: 'Velocidad',
    description: 'Velocidad actual del vehículo',
    icon: Gauge,
    type: 'metric-card',
    color: 'from-amber-500 to-orange-600',
    isPro: false,
  },
  {
    id: 'estado-gps',
    label: 'Estado GPS',
    description: 'Estado de conexión del dispositivo',
    icon: Radio,
    type: 'metric-card',
    color: 'from-emerald-500 to-green-600',
    isPro: false,
  },
  {
    id: 'ubicacion',
    label: 'Ubicación',
    description: 'Dirección actual con enlace a Maps',
    icon: MapPin,
    type: 'metric-card',
    color: 'from-blue-500 to-cyan-600',
    isPro: false,
  },
  {
    id: 'recorrido',
    label: 'Recorrido',
    description: 'Odómetro total del vehículo',
    icon: TrendingUp,
    type: 'metric-card',
    color: 'from-violet-500 to-purple-600',
    isPro: false,
  },
  {
    id: 'bateria',
    label: 'Batería',
    description: 'Voltaje y estado de la batería',
    icon: Battery,
    type: 'metric-card',
    color: 'from-amber-500 to-yellow-600',
    isPro: false,
  },
  {
    id: 'mapa',
    label: 'Mapa',
    description: 'Mapa interactivo con posición',
    icon: Map,
    type: 'main-widget',
    color: 'from-emerald-500 to-teal-600',
    isPro: false,
  },
  {
    id: 'eficiencia-semanal',
    label: 'Eficiencia Semanal',
    description: 'Gráficos de distancia, eficiencia y tiempo',
    icon: BarChart3,
    type: 'main-widget',
    color: 'from-orange-500 to-amber-600',
    isPro: false,
  },
  {
    id: 'actividad-reciente',
    label: 'Actividad Reciente',
    description: 'Últimas alertas y notificaciones',
    icon: Activity,
    type: 'main-widget',
    color: 'from-rose-500 to-pink-600',
    isPro: true,
  },
  {
    id: 'historial-rapido',
    label: 'Historial Rápido',
    description: 'Resumen de los últimos viajes',
    icon: Clock,
    type: 'main-widget',
    color: 'from-indigo-500 to-blue-600',
    isPro: true,
  },
  {
    id: 'consumo',
    label: 'Consumo de Combustible',
    description: 'Estimación de consumo semanal',
    icon: Fuel,
    type: 'main-widget',
    color: 'from-amber-500 to-orange-600',
    isPro: true,
  },
  {
    id: 'seguridad',
    label: 'Panel de Seguridad',
    description: 'Estado de protección y geovallas',
    icon: Shield,
    type: 'main-widget',
    color: 'from-emerald-500 to-green-600',
    isPro: true,
  },
];

/**
 * AddWidgetModal
 * @param {Object}   props
 * @param {boolean}  props.isOpen         - Controla visibilidad
 * @param {string[]} props.activeWidgets  - IDs de widgets actualmente en el dashboard
 * @param {(widget: Object) => void} props.onAdd - Callback al añadir widget
 * @param {() => void} props.onClose      - Cerrar modal
 */
const AddWidgetModal = ({ isOpen, activeWidgets = [], onAdd, onClose }) => {
  if (!isOpen) return null;

  const activeSet = new Set(activeWidgets);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-slide-in-bottom">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Catálogo de Widgets</h2>
            <p className="text-sm text-slate-400 mt-0.5">Elige qué mostrar en tu dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Widget list */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2">
          {WIDGET_CATALOG.map((widget) => {
            const isActive = activeSet.has(widget.id);
            const Icon = widget.icon;

            return (
              <div
                key={widget.id}
                className={`
                  flex items-center gap-4 p-3 rounded-xl border transition-all
                  ${isActive
                    ? 'bg-slate-800/50 border-slate-600/50 opacity-60'
                    : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/60 hover:border-orange-500/30'
                  }
                `}
              >
                {/* Icon */}
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${widget.color} shadow-sm flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">
                      {widget.label}
                    </span>
                    {widget.isPro && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-full">
                        <Crown className="w-2.5 h-2.5 text-orange-400" />
                        <span className="text-[9px] font-bold text-orange-400 uppercase">Pro</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {widget.description}
                  </p>
                </div>

                {/* Action */}
                <button
                  onClick={() => !isActive && onAdd(widget)}
                  disabled={isActive}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0
                    ${isActive
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : widget.isPro
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg hover:shadow-orange-500/30'
                        : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/30'
                    }
                  `}
                >
                  {isActive ? 'Activo' : widget.isPro ? 'Pro' : 'Añadir'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AddWidgetModal;
