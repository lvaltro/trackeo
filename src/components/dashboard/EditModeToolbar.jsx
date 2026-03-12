// ═══════════════════════════════════════════════════
// EditModeToolbar — Barra de herramientas del modo edición
// Aparece fija arriba cuando se activa el modo edición
// ═══════════════════════════════════════════════════
import React from 'react';
import { Save, RotateCcw, X, Plus, LayoutGrid } from 'lucide-react';

/**
 * EditModeToolbar
 * @param {Object}    props
 * @param {() => void} props.onSave      - Guardar diseño
 * @param {() => void} props.onCancel    - Cancelar cambios
 * @param {() => void} props.onReset     - Restablecer diseño por defecto
 * @param {() => void} props.onAddWidget - Abrir catálogo de widgets
 */
const EditModeToolbar = ({ onSave, onCancel, onReset, onAddWidget }) => {
  return (
    <div className="
      fixed top-4 left-1/2 -translate-x-1/2 z-[60]
      bg-slate-900/95 border border-slate-700 rounded-2xl
      shadow-2xl shadow-black/40 backdrop-blur-xl
      px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-4
      animate-slide-in-top
      max-w-[95vw]
    ">
      
      {/* Status indicator */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse-ring-orange flex-shrink-0" />
        <div className="flex items-center gap-1.5 min-w-0">
          <LayoutGrid className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span className="text-slate-300 text-sm font-medium hidden sm:inline whitespace-nowrap">
            Modo Edición
          </span>
        </div>
      </div>
      
      <div className="h-6 w-px bg-slate-700 flex-shrink-0" />
      
      {/* Botón Añadir Widget */}
      <button
        onClick={onAddWidget}
        className="
          px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700
          text-slate-300 hover:text-slate-100
          rounded-lg transition-colors
          flex items-center gap-1.5 text-sm whitespace-nowrap
        "
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Añadir</span>
      </button>
      
      {/* Botón Restablecer */}
      <button
        onClick={onReset}
        className="
          px-2.5 sm:px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200
          hover:bg-slate-800 rounded-lg transition-colors
          flex items-center gap-1.5 whitespace-nowrap
        "
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Restablecer</span>
      </button>
      
      <div className="h-6 w-px bg-slate-700 flex-shrink-0" />
      
      {/* Botón Cancelar */}
      <button
        onClick={onCancel}
        className="
          px-2.5 sm:px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200
          hover:bg-slate-800 rounded-lg transition-colors
          flex items-center gap-1.5 whitespace-nowrap
        "
      >
        <X className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Cancelar</span>
      </button>
      
      {/* Botón Guardar */}
      <button
        onClick={onSave}
        className="
          px-3 sm:px-4 py-1.5 bg-orange-500 hover:bg-orange-600
          text-white rounded-lg font-medium text-sm
          transition-all hover:shadow-lg hover:shadow-orange-500/50
          flex items-center gap-1.5 whitespace-nowrap
        "
      >
        <Save className="w-4 h-4" />
        <span>Guardar</span>
      </button>
    </div>
  );
};

export default EditModeToolbar;
