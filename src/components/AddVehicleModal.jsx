// src/components/AddVehicleModal.jsx
// Modal "Añadir Vehículo" con dos opciones: Nuevo Equipo y Vincular Existente.
// Patrón de overlay/cierre copiado de EngineConfirmModal.

import { useEffect } from 'react';
import { X, ShieldCheck, Users, Check } from 'lucide-react';

// ═══════════════════════════════════════════════════
// CONFIGURACIÓN — Cambiar estos valores
// ═══════════════════════════════════════════════════
const TRACKEO_PHONE = '56912345678'; // REEMPLAZAR con número real de Trackeo

// ─── Ícono WhatsApp (SVG inline) ───
const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const AddVehicleModal = ({ isOpen, onClose, userName }) => {
  // Cerrar con Escape (patrón EngineConfirmModal)
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // === TARJETA 1: Nuevo Equipo ===
  const handleCotizar = () => {
    const message = encodeURIComponent(
      `Hola Trackeo, soy ${userName}. Quiero cotizar un nuevo equipo GPS con instalación para otro vehículo.`
    );
    window.open(`https://wa.me/${TRACKEO_PHONE}?text=${message}`, '_blank');
  };

  // === TARJETA 2: Vincular Vehículo Existente ===
  const handleSolicitarAcceso = () => {
    const message = encodeURIComponent(
      `Hola Trackeo, soy ${userName}. Necesito que me vinculen a un vehículo existente.\n\nPatente del vehículo: \nNombre del titular: \nMi relación: (familiar / supervisor / otro)`
    );
    window.open(`https://wa.me/${TRACKEO_PHONE}?text=${message}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay semitransparente oscuro */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 max-w-[620px] w-full mx-4 shadow-2xl border border-neutral-200/80 dark:border-white/[0.06] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white text-center mb-1 pr-8">
          Añadir Vehículo a tu Cuenta
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-6">
          Elige cómo quieres agregar un vehículo
        </p>

        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ─── Tarjeta 1: Nuevo Equipo ─── */}
          <div className="flex flex-col border border-neutral-200/80 dark:border-white/[0.06] rounded-xl p-4 md:p-6 hover:shadow-lg transition-shadow bg-white dark:bg-white/[0.04]">
            {/* Ícono */}
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>

            {/* Título y descripción */}
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
              Nuevo Equipo
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
              Adquiere un nuevo equipo GPS con instalación certificada para proteger otro vehículo.
            </p>

            {/* Benefits */}
            <ul className="space-y-2 mb-6 flex-1">
              {['Corte de motor', 'Alertas WhatsApp', 'Instalación incluida'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Botón WhatsApp */}
            <button
              onClick={handleCotizar}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#25D366] hover:bg-[#1da851] transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Cotizar Ahora
            </button>
          </div>

          {/* ─── Tarjeta 2: Vincular Existente ─── */}
          <div className="flex flex-col border border-neutral-200/80 dark:border-white/[0.06] rounded-xl p-4 md:p-6 hover:shadow-lg transition-shadow bg-white dark:bg-white/[0.04]">
            {/* Ícono */}
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>

            {/* Título y descripción */}
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
              Vincular Vehículo Existente
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
              Si eres familiar o supervisor, solicita acceso a un vehículo que ya cuenta con Trackeo.
            </p>

            {/* Benefits */}
            <ul className="space-y-2 mb-6 flex-1">
              {['Vista en tiempo real', 'Historial de recorridos', 'Alertas compartidas'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Botón Solicitar Acceso */}
            <button
              onClick={handleSolicitarAcceso}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-600 transition-colors"
            >
              Solicitar Acceso
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AddVehicleModal;
