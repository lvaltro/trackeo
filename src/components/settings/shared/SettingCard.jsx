// src/components/settings/shared/SettingCard.jsx
// Card base reutilizable para todas las opciones de configuración
import React from 'react';
import { Lock } from 'lucide-react';

const SettingCard = ({ 
  title, 
  description, 
  icon: Icon, 
  action, 
  isPremium = false, 
  isLocked = false,
  badge,
  children,
  className = '',
  noPadding = false,
}) => {
  const locked = isPremium && isLocked;

  return (
    <div className={`
      relative bg-white dark:bg-white/[0.04] 
      rounded-2xl ${noPadding ? '' : 'p-5'} 
      border border-neutral-200/80 dark:border-white/[0.06]
      hover:shadow-md hover:border-neutral-300 dark:hover:border-white/[0.1]
      transition-all duration-200
      overflow-hidden
      ${className}
    `}>
      {/* Lock overlay para premium */}
      {locked && (
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-amber-500/5 to-orange-500/5 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 rounded-2xl">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Función Premium</p>
        </div>
      )}

      {/* Header con título e ícono */}
      {(title || Icon) && (
        <div className={`flex items-start justify-between ${noPadding ? 'px-5 pt-5' : ''} ${children ? 'mb-4' : ''}`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {Icon && (
              <div className="p-2 rounded-xl bg-neutral-100 dark:bg-white/[0.06] shrink-0">
                <Icon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" strokeWidth={2} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate">{title}</h3>
                {badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {badge}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-500 mt-0.5 leading-relaxed">{description}</p>
              )}
            </div>
          </div>
          {action && (
            <div className="shrink-0 ml-3">{action}</div>
          )}
        </div>
      )}

      {/* Contenido */}
      {children && (
        <div className={locked ? 'pointer-events-none select-none' : ''}>
          {children}
        </div>
      )}
    </div>
  );
};

export default SettingCard;
