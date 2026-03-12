// src/components/ProtectionDeactivateModal.jsx
// Modal de confirmación para DESACTIVAR la escolta virtual.
// Mismo patrón visual que EngineConfirmModal.

import { useEffect } from 'react';
import { ShieldOff, Clock, Loader2 } from 'lucide-react';

const ProtectionDeactivateModal = ({
  isOpen,
  protectionData,
  onConfirm,
  onCancel,
  isLoading,
  error,
}) => {
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

  // Calcular tiempo protegido
  const getProtectedDuration = () => {
    if (!protectionData?.activatedAt) return null;
    const diffMs = Date.now() - new Date(protectionData.activatedAt).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const remainMin = diffMin % 60;
    if (diffH > 0) return `${diffH}h ${remainMin}min`;
    return `${diffMin} minutos`;
  };

  const duration = getProtectedDuration();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={() => !isLoading && onCancel()}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-neutral-200/80 dark:border-white/[0.06]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícono */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <ShieldOff className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>

        {/* Título */}
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white text-center mb-2">
          Desactivar Escolta
        </h3>

        {/* Descripción */}
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-4">
          ¿Estás seguro de que quieres desactivar tu escolta virtual?
          Tus contactos dejarán de ver tu ubicación.
        </p>

        {/* Duración protegido */}
        {duration && (
          <div className="flex items-center justify-center gap-2 mb-5 p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.04]">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-300">
              Llevas protegido: <strong>{duration}</strong>
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-white/[0.06] hover:bg-neutral-200 dark:hover:bg-white/[0.1] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Desactivando...
              </>
            ) : (
              'Desactivar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtectionDeactivateModal;
