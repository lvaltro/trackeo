// src/components/EngineStatusToast.jsx
// Barra de alerta persistente cuando el motor está apagado.
// Se muestra debajo del Navbar. NO desaparece sola.

import { AlertTriangle, Power } from 'lucide-react';

const EngineStatusToast = ({ deviceName, isVisible, onRestore }) => {
  if (!isVisible) return null;

  return (
    <div className="w-full bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/20 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 truncate">
            Vehículo inmovilizado — <span className="font-bold">{deviceName}</span>: motor apagado
          </p>
        </div>
        <button
          onClick={onRestore}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
        >
          <Power className="w-3 h-3" />
          Restaurar motor
        </button>
      </div>
    </div>
  );
};

export default EngineStatusToast;
