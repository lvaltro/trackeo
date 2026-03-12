// ═══════════════════════════════════════════════════
// SortableCard — Tarjeta sortable con drag & drop
// Wrapper que envuelve cualquier widget para hacerlo reordenable
// ═══════════════════════════════════════════════════
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, X } from 'lucide-react';

/**
 * SortableCard
 * @param {Object}  props
 * @param {string}  props.id         - ID único del widget
 * @param {boolean} props.isEditMode - Si estamos en modo edición
 * @param {boolean} props.isVisible  - Si el widget es visible
 * @param {string}  props.className  - Clases CSS extra para el contenedor
 * @param {() => void} props.onToggleVisibility - Toggle visibilidad
 * @param {() => void} props.onRemove - Remover widget
 * @param {React.ReactNode} props.children - Contenido del widget
 */
const SortableCard = ({
  id,
  isEditMode = false,
  isVisible = true,
  className = '',
  onToggleVisibility,
  onRemove,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isVisible ? 1 : 0.4,
    zIndex: isDragging ? 50 : 'auto',
  };

  if (!isVisible && !isEditMode) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group
        ${isEditMode ? 'animate-wiggle cursor-grab active:cursor-grabbing' : ''}
        ${isDragging ? 'scale-105 shadow-2xl shadow-orange-500/20' : ''}
        transition-shadow duration-200
        ${className}
      `}
      {...attributes}
      {...(isEditMode ? listeners : {})}
    >
      {/* Controles de edición (solo en modo edición) */}
      {isEditMode && (
        <div className="absolute -top-2 -right-2 z-20 flex items-center gap-1">
          {/* Toggle visibilidad */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility?.();
            }}
            className="p-1.5 bg-slate-800 border border-slate-600 rounded-lg 
              hover:bg-slate-700 transition-colors shadow-lg"
            title={isVisible ? 'Ocultar widget' : 'Mostrar widget'}
          >
            {isVisible ? (
              <Eye className="w-3 h-3 text-slate-300" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-500" />
            )}
          </button>
        </div>
      )}

      {/* Indicador de arrastre */}
      {isEditMode && (
        <div className="absolute top-1/2 -left-3 -translate-y-1/2 z-20
          p-1 bg-slate-800/90 border border-slate-600 rounded-lg
          opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
        >
          <GripVertical className="w-3 h-3 text-slate-400" />
        </div>
      )}

      {/* Borde de edición */}
      {isEditMode && (
        <div className="absolute inset-0 border-2 border-dashed border-orange-500/40 rounded-2xl pointer-events-none z-10" />
      )}

      {children}
    </div>
  );
};

export default SortableCard;
