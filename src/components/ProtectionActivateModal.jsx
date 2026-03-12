// src/components/ProtectionActivateModal.jsx
// Modal de confirmación para ACTIVAR la escolta virtual.
// Mismo patrón visual que EngineConfirmModal.

import { useEffect, useState } from 'react';
import { Shield, Clock, Loader2, Users, Settings } from 'lucide-react';

const DURATION_OPTIONS = [
  { value: 0.5, label: '30 min' },
  { value: 1, label: '1 hora' },
  { value: 2, label: '2 horas' },
  { value: 0, label: 'Hasta desactivar' },
];

const ProtectionActivateModal = ({
  isOpen,
  contacts = [],
  deviceName,
  onConfirm,
  onCancel,
  onGoToSettings,
  isLoading,
  error,
}) => {
  const [selectedDuration, setSelectedDuration] = useState(1);

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

  const hasContacts = contacts.length > 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={() => !isLoading && onCancel()}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-neutral-200/80 dark:border-white/[0.06] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícono */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mb-4">
          <Shield className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Título */}
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white text-center mb-2">
          Activar Escolta Virtual
        </h3>

        {/* Descripción */}
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-5">
          Tus contactos de emergencia recibirán tu ubicación en tiempo real
          mientras conduces.
        </p>

        {/* Duración */}
        <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
          <Clock className="w-3 h-3 inline mr-1" />
          Duración
        </label>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedDuration(opt.value)}
              className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                selectedDuration === opt.value
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                  : 'bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/[0.1]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Contactos */}
        {hasContacts ? (
          <>
            <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
              <Users className="w-3 h-3 inline mr-1" />
              Contactos que recibirán la alerta
            </label>
            <div className="space-y-2 mb-5">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.04]"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                      {formatPhone(c.phone)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mb-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 text-center">
            <p className="text-sm text-amber-800 dark:text-amber-400 font-medium mb-2">
              No tienes contactos de emergencia
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mb-3">
              Configura al menos un contacto para poder enviarle tu ubicación.
            </p>
            <button
              type="button"
              onClick={onGoToSettings}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Configurar contactos
            </button>
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
            onClick={() => onConfirm(selectedDuration === 0 ? 8 : selectedDuration)}
            disabled={isLoading || !hasContacts}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Activando...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Activar Escolta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Formatear teléfono para mostrar ───
function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('56')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

export default ProtectionActivateModal;
