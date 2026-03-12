// src/components/EngineConfirmModal.jsx
// Modal de confirmación para parar/activar motor.
// Dos modos: 'stop' (rojo) y 'start' (verde).

import { useEffect } from 'react';
import { AlertTriangle, Power, Loader2 } from 'lucide-react';

const EngineConfirmModal = ({ isOpen, action, deviceName, onConfirm, onCancel, isLoading, error }) => {
  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const isStop = action === 'stop';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={() => !isLoading && onCancel()}
    >
      {/* Overlay semitransparente oscuro */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-neutral-200/80 dark:border-white/[0.06]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icono */}
        <div
          className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
            isStop
              ? 'bg-red-100 dark:bg-red-500/10'
              : 'bg-emerald-100 dark:bg-emerald-500/10'
          }`}
        >
          {isStop ? (
            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
          ) : (
            <Power className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>

        {/* Título */}
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white text-center mb-2">
          {isStop ? 'Apagar Motor' : 'Restaurar Motor'}
        </h3>

        {/* Descripción */}
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-6">
          {isStop
            ? `¿Estás seguro de que deseas apagar el motor de ${deviceName}? Esta acción detendrá el vehículo.`
            : `¿Deseas restaurar el motor de ${deviceName}?`}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-white/[0.06] hover:bg-neutral-200 dark:hover:bg-white/[0.1] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${
              isStop ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EngineConfirmModal;
