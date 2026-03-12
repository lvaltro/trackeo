// src/components/settings/shared/SaveIndicator.jsx
// Indicador visual de estado de guardado: idle, saving, saved, error
import React, { useEffect, useState } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';

const SaveIndicator = ({ status = 'idle' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true);
    }
    if (status === 'saved') {
      const timer = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible || status === 'idle') return null;

  const configs = {
    saving: {
      icon: Loader2,
      text: 'Guardando...',
      className: 'text-amber-600 dark:text-amber-400',
      iconClass: 'animate-spin',
    },
    saved: {
      icon: Check,
      text: 'Guardado',
      className: 'text-emerald-600 dark:text-emerald-400',
      iconClass: '',
    },
    error: {
      icon: AlertCircle,
      text: 'Error al guardar',
      className: 'text-red-500 dark:text-red-400',
      iconClass: '',
    },
  };

  const config = configs[status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 transition-all duration-300 ${config.className}`}>
      <Icon className={`w-3.5 h-3.5 ${config.iconClass}`} />
      <span className="text-[11px] font-semibold">{config.text}</span>
    </div>
  );
};

export default SaveIndicator;
