// src/components/settings/shared/ToggleSwitch.jsx
// Toggle switch animado con estados: ON, OFF, LOADING, DISABLED
import React from 'react';
import { Loader2 } from 'lucide-react';

const ToggleSwitch = ({ enabled, onChange, loading = false, disabled = false, size = 'md' }) => {
  const sizes = {
    sm: { track: 'w-9 h-5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-4.5 h-4.5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-5.5 h-5.5', translate: 'translate-x-7' },
  };

  const s = sizes[size] || sizes.md;
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => !isDisabled && onChange?.(!enabled)}
      className={`
        relative inline-flex items-center shrink-0 rounded-full 
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-2 
        dark:focus:ring-offset-[#151515]
        ${s.track}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${enabled 
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm shadow-amber-500/30' 
          : 'bg-neutral-300 dark:bg-neutral-700'
        }
        ${loading ? 'animate-pulse' : ''}
      `}
    >
      <span
        className={`
          inline-flex items-center justify-center rounded-full bg-white shadow-md
          transition-transform duration-300 ease-in-out
          ${size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5.5 h-5.5' : 'w-[18px] h-[18px]'}
          ${enabled ? s.translate : 'translate-x-0.5'}
        `}
      >
        {loading && (
          <Loader2 className="w-2.5 h-2.5 text-amber-500 animate-spin" />
        )}
      </span>
    </button>
  );
};

export default ToggleSwitch;
