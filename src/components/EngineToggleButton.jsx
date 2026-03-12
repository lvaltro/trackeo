// src/components/EngineToggleButton.jsx
// Botón reutilizable que alterna entre "Parar Motor" (rojo) y "Activar Motor" (verde).
// Tres variantes: sidebar, desktop, mobile — copiando clases Tailwind EXACTAS del proyecto.

import { Power, StopCircle, Loader2 } from 'lucide-react';

const EngineToggleButton = ({ engineStopped, onClick, isLoading, variant = 'desktop' }) => {
  // ─── Variante SIDEBAR ─── (copia exacta de SidebarItem)
  if (variant === 'sidebar') {
    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          engineStopped
            ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/5'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.03]'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : engineStopped ? (
          <Power className="w-4 h-4 text-emerald-500" />
        ) : (
          <StopCircle className="w-4 h-4" />
        )}
        <span>{engineStopped ? 'Activar Motor' : 'Detener Motor'}</span>
      </button>
    );
  }

  // ─── Variante MOBILE ─── (copia exacta del FAB floating actual)
  if (variant === 'mobile') {
    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`flex items-center gap-2.5 ${
          engineStopped ? 'bg-emerald-600' : 'bg-red-600'
        } text-white px-4 py-3 rounded-2xl shadow-2xl font-bold text-sm whitespace-nowrap`}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
        {engineStopped ? 'Activar Motor' : 'Parar Motor'}
      </button>
    );
  }

  // ─── Variante DESKTOP ─── (copia exacta del botón grid de acciones, solo cambia color)
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`group relative overflow-hidden py-4 px-5 rounded-2xl font-bold text-sm text-white ${
        engineStopped
          ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
          : 'bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-500/20 hover:shadow-red-500/30'
      } flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70`}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
      <span>{engineStopped ? 'Activar Motor' : 'Parar Motor'}</span>
    </button>
  );
};

export default EngineToggleButton;
