// src/components/settings/shared/PremiumBadge.jsx
// Badge para indicar features premium/pro
import React from 'react';
import { Sparkles, Lock } from 'lucide-react';

const PremiumBadge = ({ plan = 'premium', locked = false, size = 'sm' }) => {
  const configs = {
    pro: {
      label: 'Pro',
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
      icon: Sparkles,
    },
    premium: {
      label: 'Premium',
      bg: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
      icon: locked ? Lock : Sparkles,
    },
  };

  const config = configs[plan] || configs.premium;
  const Icon = config.icon;

  return (
    <span className={`
      inline-flex items-center gap-1 
      ${size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'}
      font-bold uppercase tracking-wider
      rounded-full border
      ${config.bg} ${config.text}
    `}>
      <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {config.label}
    </span>
  );
};

export default PremiumBadge;
