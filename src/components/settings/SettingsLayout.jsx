// src/components/settings/SettingsLayout.jsx
// Container principal del sistema de configuraciones con navegación por tabs
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Car, Bell, Shield, CreditCard, Settings2, 
  Search, X, ArrowLeft, ChevronRight 
} from 'lucide-react';
import ProfileSettings from './tabs/ProfileSettings';
import VehicleSettings from './tabs/VehicleSettings';
import NotificationSettings from './tabs/NotificationSettings';
import SecuritySettings from './tabs/SecuritySettings';
import BillingSettings from './tabs/BillingSettings';
import AdvancedSettings from './tabs/AdvancedSettings';
import PremiumBadge from './shared/PremiumBadge';

// ─── Definición de tabs ───
const SETTINGS_TABS = [
  { id: 'profile', label: 'Perfil', icon: User, badge: null, premium: false },
  { id: 'vehicles', label: 'Vehículos', icon: Car, badge: null, premium: false },
  { id: 'notifications', label: 'Notificaciones', icon: Bell, badge: null, premium: false },
  { id: 'security', label: 'Seguridad', icon: Shield, badge: null, premium: false },
  { id: 'billing', label: 'Plan & Facturación', icon: CreditCard, badge: null, premium: false },
  { id: 'advanced', label: 'Avanzado', icon: Settings2, badge: null, premium: true },
];

// ─── Mapa de componentes por tab ───
const TAB_COMPONENTS = {
  profile: ProfileSettings,
  vehicles: VehicleSettings,
  notifications: NotificationSettings,
  security: SecuritySettings,
  billing: BillingSettings,
  advanced: AdvancedSettings,
};

const SettingsLayout = ({ user, isDark, vehicles = [], onNotify, userPlan = 'pro' }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);
  const tabsRef = useRef(null);

  // Número de vehículos como badge
  const tabsWithBadges = SETTINGS_TABS.map(tab => {
    if (tab.id === 'vehicles' && vehicles.length > 0) {
      return { ...tab, badge: String(vehicles.length) };
    }
    if (tab.id === 'billing') {
      return { ...tab, badge: userPlan === 'premium' ? 'Premium' : 'Pro' };
    }
    return tab;
  });

  // Focus en buscador al abrir
  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K → buscar
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      // Escape → cerrar búsqueda
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  const ActiveComponent = TAB_COMPONENTS[activeTab];
  const activeTabData = tabsWithBadges.find(t => t.id === activeTab);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-neutral-900 dark:text-white">Configuraciones</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            Gestiona tu perfil, vehículos, notificaciones y seguridad
          </p>
        </div>

        {/* Buscador */}
        <div className="relative">
          {showSearch ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.08] shadow-sm w-64 transition-all">
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar configuración..."
                className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none"
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                <X className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/[0.04] transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Buscar</span>
              <kbd className="hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.06] text-neutral-400 border border-neutral-200 dark:border-white/[0.08]">
                ⌘K
              </kbd>
            </button>
          )}
        </div>
      </div>

      {/* Layout responsive: sidebar en desktop, tabs horizontales en mobile */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* ═══ Sidebar de tabs (desktop) / Scroll horizontal (mobile) ═══ */}
        
        {/* Mobile: tabs horizontales con scroll */}
        <div className="lg:hidden">
          <div 
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {tabsWithBadges.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium 
                    whitespace-nowrap snap-start shrink-0
                    transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/15 shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.04] border border-transparent'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' 
                        : 'bg-neutral-200 dark:bg-white/[0.08] text-neutral-500 dark:text-neutral-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.premium && <PremiumBadge plan="premium" locked={userPlan !== 'premium'} size="sm" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop: sidebar vertical */}
        <div className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            {tabsWithBadges.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/15 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.03] border border-transparent'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' 
                        : 'bg-neutral-200 dark:bg-white/[0.08] text-neutral-500 dark:text-neutral-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.premium && <PremiumBadge plan="premium" locked={userPlan !== 'premium'} size="sm" />}
                  {isActive && <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />}
                </button>
              );
            })}

            {/* Info de plan en sidebar */}
            <div className="mt-4 pt-4 border-t border-neutral-200/80 dark:border-white/[0.06]">
              <div className="px-3.5 py-3 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Plan {userPlan === 'premium' ? 'Premium' : 'Pro'}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-500 mt-0.5">
                  {userPlan === 'premium' ? 'Todas las funciones activas' : 'Actualiza para más funciones'}
                </p>
              </div>
            </div>
          </nav>
        </div>

        {/* ═══ Área de contenido ═══ */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <activeTabData.icon className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-neutral-900 dark:text-white">{activeTabData?.label}</span>
          </div>

          {/* Componente activo */}
          <div className="animate-[fadeIn_200ms_ease-out]">
            {ActiveComponent && (
              <ActiveComponent
                user={user}
                isDark={isDark}
                vehicles={vehicles}
                onNotify={onNotify}
                userPlan={userPlan}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
