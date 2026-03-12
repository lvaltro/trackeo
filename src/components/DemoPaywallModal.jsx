// src/components/DemoPaywallModal.jsx
// Modal premium de upsell para el Modo Demo.
// Se muestra al intentar ejecutar acciones críticas (motor, geovallas, protección, etc.).

import React from 'react';
import { ShieldCheck, Lock, Zap, MapPinned, Bell, X, ExternalLink } from 'lucide-react';

const FEATURES = [
  { icon: Zap, text: 'Corte e inmovilización de motor remota' },
  { icon: Bell, text: 'Alertas en tiempo real por movimiento y geovallas' },
  { icon: MapPinned, text: 'Geovallas ilimitadas y zonas de seguridad' },
  { icon: ShieldCheck, text: 'Modo Protección y escolta en vivo' },
];

const DemoPaywallModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header con gradiente */}
        <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 px-8 pt-10 pb-8 text-center">
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Ícono principal */}
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
            <Lock className="w-10 h-10 text-white drop-shadow-md" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2 leading-tight">
            ¡Toma el control real<br />de tu vehículo!
          </h2>
          <p className="text-sm text-white/80 leading-relaxed max-w-xs mx-auto">
            Esta es una función de demostración. Contrata Trackeo hoy para inmovilizar tu auto, recibir alertas en tiempo real y proteger tu inversión.
          </p>
        </div>

        {/* Body */}
        <div className="bg-white dark:bg-[#0F1525] px-8 py-6">
          {/* Features */}
          <div className="space-y-3 mb-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {f.text}
                </span>
              </div>
            ))}
          </div>

          {/* CTA principal */}
          <a
            href="https://trackeo.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:brightness-110 transition-all active:scale-[0.98]"
          >
            <ExternalLink className="w-4 h-4" />
            Ver Planes de Suscripción
          </a>

          {/* Link secundario */}
          <button
            onClick={onClose}
            className="w-full mt-3 py-2.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            Seguir explorando la demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoPaywallModal;
