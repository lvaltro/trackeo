// src/screens/DashboardLayout.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Moon, Sun, Car, BarChart3, Route, MapPin, AlertTriangle,
  Wrench, ParkingCircle, Settings, LogOut,
  Bell, ChevronDown, Plus, Menu, X, Gauge, Radio, MapPinned,
  Battery, TrendingUp, Loader2, ShieldCheck, Clipboard, ExternalLink
} from "lucide-react";
import { traccarService } from '../api/traccarApi';        // ← src/api/
import MapView from '../components/MapView';                // ← src/components/
import HistoryView from '../components/HistoryView';        // ← src/components/
import TrackeoLogo from '../components/TrackeoLogo';        // ← src/components/
import UserDropdown from '../components/UserDropdown';
import ProfileModal from '../components/ProfileModal';
import NotificationsDropdown from '../components/NotificationsDropdown';
import useCounter from '../hooks/useCounter';               // ← src/hooks/
import { useVehicleTracker } from '../hooks/useVehicleTracker';
import { reverseGeocode, getShortAddress } from '../api/geocodeApi';
import { useEngineControl } from '../hooks/useEngineControl';
import EngineToggleButton from '../components/EngineToggleButton';
import EngineConfirmModal from '../components/EngineConfirmModal';
import EngineStatusToast from '../components/EngineStatusToast';
import AddVehicleModal from '../components/AddVehicleModal';
import LiveSharePanel from '../components/LiveSharePanel';
import GeofencesView from '../components/GeofencesView';
import { useNotifications } from '../hooks/useNotifications';
import { useProtection } from '../hooks/useProtection';
import ProtectionSettingsPanel from '../components/ProtectionSettingsPanel';
import ProtectionActivateModal from '../components/ProtectionActivateModal';
import ProtectionDeactivateModal from '../components/ProtectionDeactivateModal';
import FloatingActionButton from '../components/FloatingActionButton';
import ActivityFeed from '../components/ActivityFeed';
import MaintenanceDashboard from '../components/MaintenanceDashboard';
import WeeklyUsageWidget from '../components/WeeklyUsageWidget';
import SavingsWidget from '../components/dashboard/SavingsWidget';
import VehicleDocumentsCard from '../components/dashboard/VehicleDocumentsCard';
import UpgradeSection from '../components/UpgradeSection';
import { useParkingMode } from '../hooks/useParkingMode';
import ParkingModeController from '../components/ParkingModeController';
import ParkingAlertModal from '../components/ParkingAlertModal';
import SettingsLayout from '../components/settings/SettingsLayout';
import { useDemo } from '../context/DemoContext';
import { mockDevices, mockGeofences, mockNotifications } from '../utils/demoData';

// ═══════════════════════════════════════════════════
// DATOS VISUALES (WeeklyUsageWidget + UpgradeSection)
// ═══════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
// SUB-COMPONENTES DEL DASHBOARD
// ═══════════════════════════════════════════════════

// ─── Sidebar Menu Item ───
const SidebarItem = ({ icon: Icon, label, active, onClick, danger = false }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? "bg-gradient-to-r from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/10" : danger ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5" : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.03]"}`}>
    <Icon className="w-4 h-4" />
    <span>{label}</span>
    {active && <ChevronDown className="w-3 h-3 ml-auto opacity-50 -rotate-90" />}
  </button>
);

// ─── Formatear tiempo transcurrido (para tarjeta Velocidad detenida) ───
function formatTimeAgo(dateValue) {
  if (dateValue == null) return '—';
  const date = typeof dateValue === 'string' ? new Date(dateValue) : new Date(Number(dateValue));
  if (Number.isNaN(date.getTime())) return '—';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffH === 1) return 'Hace 1 hora';
  if (diffH < 24) return `Hace ${diffH} horas`;
  if (diffD === 1) return 'Hace 1 día';
  return `Hace ${diffD} días`;
}

// ─── KPI Strip — Barra de estado (Gestión Inteligente de Activos) ───
const KpiStrip = ({ activeVehicle, kmCount, fuelSaved = 0, maintenanceSaved = 0 }) => {
  const isOffline = activeVehicle?.status === 'offline' || activeVehicle?.status === 'unknown';
  const lastUpdate = activeVehicle?.lastUpdate ? new Date(activeVehicle.lastUpdate) : null;
  const minutesSinceUpdate = lastUpdate ? (Date.now() - lastUpdate) / 60000 : Infinity;
  const isStale = minutesSinceUpdate > 10;
  const speed = Number(activeVehicle?.speed ?? 0) || 0;
  const speedLabel = isOffline || isStale ? 'Sin datos' : speed > 1 ? `${Math.round(speed)} km/h` : 'Detenido';
  const statusLabel = activeVehicle?.status === 'online' ? 'Online' : 'Desconectado';
  const attrs = activeVehicle?.attributes ?? {};
  const rawVoltage = attrs.power ?? attrs.voltage ?? attrs.batteryVoltage ?? attrs.battery;
  const voltageFromApi = rawVoltage != null && rawVoltage !== '' ? Number(rawVoltage) : null;
  const pct = attrs.batteryLevel != null ? Number(attrs.batteryLevel) : 100;
  const voltage = voltageFromApi != null && !Number.isNaN(voltageFromApi) ? voltageFromApi : (11 + (pct / 100) * 1.6);
  const batteryLabel = (isOffline || isStale) ? '—' : `${Number(voltage).toFixed(1)} V`;
  const totalSaved = fuelSaved + maintenanceSaved;
  const savedFormatted = totalSaved >= 1000 ? `$${(totalSaved / 1000).toFixed(0)}k` : `$${totalSaved}`;

  const items = [
    { icon: Radio, value: statusLabel, label: 'Estado', color: activeVehicle?.status === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
    { icon: Gauge, value: speedLabel, label: 'Velocidad', color: 'text-neutral-700 dark:text-neutral-300' },
    { icon: TrendingUp, value: savedFormatted, label: 'Ahorro', color: 'text-amber-600 dark:text-amber-400' },
    { icon: Route, value: `${Math.floor(kmCount)} km`, label: 'Recorrido', color: 'text-neutral-700 dark:text-neutral-300' },
    { icon: Battery, value: batteryLabel, label: 'Batería', color: 'text-neutral-700 dark:text-neutral-300' },
  ];

  return (
    <div className="flex items-stretch max-h-16 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.08] overflow-x-auto shrink-0">
      {items.map(({ icon: Icon, value, label, color }) => (
        <div key={label} className="flex items-center gap-2 px-4 min-w-[100px] sm:min-w-0 sm:flex-1 justify-center border-r border-slate-200 dark:border-white/[0.08] last:border-r-0">
          <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" strokeWidth={2} />
          <div className="min-w-0 flex flex-col items-center sm:items-start">
            <span className={`text-sm font-bold truncate max-w-full ${color}`}>{value}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate max-w-full">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
///// cambiado gps card por gemini

const GpsCard = ({
  latitude,
  longitude,
  onCopy, // Simplifiqué el nombre de la prop para ser consistente
}) => {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  // Verificación robusta de coordenadas (evita 0,0 o null)
  const hasCoords = latitude && longitude && latitude !== 0;

  // Efecto para obtener la dirección (Geocoding centralizado con cache)
  useEffect(() => {
    if (!hasCoords) {
      setAddress(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchAddress = async () => {
      try {
        const data = await reverseGeocode(latitude, longitude);
        const shortAddr = getShortAddress(data);
        if (isMounted) setAddress(shortAddr);
      } catch (error) {
        if (isMounted) setAddress('Ubicación aproximada');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAddress();

    return () => { isMounted = false; };
  }, [latitude, longitude, hasCoords]);

  // URL de Google Maps
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : '#';

  // Función de Copiado
  const handleCopyClick = () => {
    if (!hasCoords) return;
    const textToCopy = address || `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => onCopy?.())
      .catch(() => onCopy?.('error'));
  };

  return (
    <div className="relative group rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02]
      bg-white dark:bg-[#131B2C]
      border border-slate-100 dark:border-white/[0.06]
      shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none
      hover:shadow-lg group-hover:shadow-blue-500/5 dark:hover:border-white/10
      cursor-default h-full flex flex-col justify-between">
      
      {/* HEADER: Icono y Título */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/10">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-500" strokeWidth={2} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Ubicación Actual
          </span>
        </div>
        
        {/* Botón Copiar */}
        <button
          type="button"
          onClick={handleCopyClick}
          disabled={!hasCoords}
          className="p-1.5 text-neutral-400 hover:text-blue-500 transition-colors disabled:opacity-30 rounded-md hover:bg-slate-50 dark:hover:bg-white/5"
          title="Copiar dirección"
        >
          <Clipboard className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      {/* BODY: Dirección (Altura Fija controlada) */}
      <div className="flex items-center h-12 mb-1">
        {loading ? (
          <div className="flex items-center text-neutral-400 text-xs animate-pulse">
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            Buscando calle...
          </div>
        ) : (
          <p className="text-sm font-bold text-neutral-900 dark:text-white leading-tight line-clamp-2" title={address}>
            {address || 'Sin señal GPS'}
          </p>
        )}
      </div>

      {/* FOOTER: Botón Google Maps */}
      <div className="mt-auto pt-2 border-t border-slate-100 dark:border-white/[0.06]">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide
            bg-blue-50 text-blue-600 hover:bg-blue-100 
            dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20
            transition-colors ${!hasCoords ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <ExternalLink className="w-3 h-3" />
          Ver en Google Maps
        </a>
      </div>
    </div>
  );
};

// ─── Widget de Uso Semanal + Sección de Upgrade ───
// (ver src/components/WeeklyUsageWidget.jsx y src/components/UpgradeSection.jsx)

// ═══════════════════════════════════════════════════
// DASHBOARD LAYOUT (Componente principal)
// Props: user, isDark, onToggleTheme, onLogout
// ═══════════════════════════════════════════════════

const DashboardLayout = ({ user, isDark, onToggleTheme, onLogout }) => {
  // ═══════════════════════════════════════════════════
  // ⚠️ TODOS LOS HOOKS AL PRINCIPIO (antes de cualquier return)
  // ═══════════════════════════════════════════════════
  
  // Demo Mode
  const { isDemoMode, exitDemo, showPaywall } = useDemo();

  // Handler de logout que también sale del demo.
  // En demo: llama exitDemo() + skipLocalStorage para NO destruir sesión real en caché.
  const handleDemoAwareLogout = () => {
    if (isDemoMode) {
      exitDemo();
      onLogout({ skipLocalStorage: true });
      return;
    }
    onLogout();
  };

  // Estados locales
  const [activeMenu, setActiveMenu] = useState("mis-vehiculos");
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [protectionLoading, setProtectionLoading] = useState(false);
  const [protectionError, setProtectionError] = useState(null);

  // Motor de datos: polling cada 3s a Traccar, vehicles ya fusionados (devices + positions)
  const { vehicles: realVehicles = [], loading: realLoading, error } = useVehicleTracker();

  // En modo demo: usar datos falsos en vez de datos reales de Traccar
  const vehicles = isDemoMode ? mockDevices : realVehicles;
  const loadingVehicles = isDemoMode ? false : realLoading;

  // Variables derivadas (siempre se ejecutan, no dependen de returns condicionales)
  const isInitialLoad = loadingVehicles && vehicles.length === 0;
  const vehiclesList = Array.isArray(vehicles) ? vehicles : [];
  const activeVehicle = vehiclesList.find((v) => v.id === selectedVehicleId) ?? vehiclesList[0];

  // Control de motor: hook compartido por sidebar, desktop y mobile
  const { engineStopped, isLoading: isLoadingEngine, error: engineError, stopEngine, startEngine } = useEngineControl(activeVehicle?.id);

  // Sistema de notificaciones: toasts + historial
  const { notify, notifications: notifList, unreadCount, loading: loadingNotifications, toastSuccess, toastError, markRead, markAllRead, refresh: refreshNotifications } = useNotifications();

  // Sistema de protección "Protege mi Camino"
  const {
    isProtected, protectionData, contacts: protContacts,
    notifications: protNotifications, unreadCount: protUnreadCount, safeZone,
    activateProtection, deactivateProtection, triggerPanic,
    addContact, removeContact, editContact, updateSafeZone,
    markAsRead: markProtectionRead, markAllAsRead: markAllProtectionRead,
  } = useProtection();

  // Modo Estacionamiento Inteligente
  const parkingVehiclePosition = useMemo(() => {
    if (!activeVehicle?.latitude || !activeVehicle?.longitude) return null;
    return { latitude: activeVehicle.latitude, longitude: activeVehicle.longitude };
  }, [activeVehicle?.latitude, activeVehicle?.longitude]);

  const {
    status: parkingStatus,
    isActive: isParkingActive,
    isActivating: isParkingActivating,
    isAlert: isParkingAlert,
    parkingData,
    errorMessage: parkingError,
    intrusionEvent,
    activate: activateParking,
    deactivate: deactivateParking,
    toggle: toggleParking,
    dismissAlert: dismissParkingAlert,
    clearError: clearParkingError,
  } = useParkingMode(activeVehicle?.id, parkingVehiclePosition, activeVehicle?.name);

  // Estado para mostrar/ocultar panel parking
  const [showParkingPanel, setShowParkingPanel] = useState(false);

  // Contadores animados (compatibles con formato del hook: speed/latitude en la raíz)
  const kmCount = useCounter(
    activeVehicle?.attributes?.totalDistance
      ? activeVehicle.attributes.totalDistance / 1000
      : 0,
    1500
  );

  // Animación de entrada
  useEffect(() => { 
    setTimeout(() => setMounted(true), 100); 
  }, []);

  // Al salir de Historial, limpiar ruta del mapa
  useEffect(() => {
    if (activeMenu !== 'historial') setRouteData(null);
  }, [activeMenu]);

  // NOTA: El manejo de 401 ahora es global en App.jsx via el evento 'auth:expired'
  // que dispara apiClient.js automáticamente. No se necesita lógica de 401 aquí.

  // Funciones handlers (con intercepción demo)
  const handleEngineClick = () => {
    if (isDemoMode) { showPaywall(); return; }
    setShowEngineModal(true);
  };
  const handleEngineConfirm = async () => {
    const action = engineStopped ? 'start' : 'stop';
    const success = engineStopped ? await startEngine() : await stopEngine();
    if (success) {
      setShowEngineModal(false);
      const mensaje = action === 'stop'
        ? `🔴 Motor de "${activeVehicle?.name}" apagado remotamente`
        : `🟢 Motor de "${activeVehicle?.name}" reactivado`;
      notify({
        tipo: 'motor',
        mensaje,
        dispositivo: activeVehicle?.name || null,
      });
    }
  };

  const handleIrAlAuto = () => alert("Abriendo navegación...");

  // ─── Parking: toggle desde FAB ───
  const handleParkingFromFab = () => {
    if (isDemoMode) { showPaywall(); return; }
    if (isParkingActive || isParkingAlert) {
      // Si está activo, mostrar el panel
      setShowParkingPanel(true);
    } else {
      // Si está inactivo, mostrar panel y activar
      setShowParkingPanel(true);
    }
  };

  // ─── Parking: corte motor de emergencia ───
  const handleParkingEngineStop = async () => {
    const success = await stopEngine();
    if (success) {
      notify({
        tipo: 'motor',
        mensaje: `🔴 Motor de "${activeVehicle?.name}" apagado (Modo Parking)`,
        dispositivo: activeVehicle?.name || null,
      });
    }
  };

  // ─── Parking: toggle con notificación ───
  const handleParkingToggle = async () => {
    if (isParkingActive || isParkingAlert) {
      await deactivateParking();
      notify({
        tipo: 'geovalla',
        mensaje: `🅿️ Modo estacionamiento desactivado para ${activeVehicle?.name}`,
        dispositivo: activeVehicle?.name || null,
        leido: true,
      });
      setShowParkingPanel(false);
    } else {
      const result = await activateParking();
      if (result) {
        notify({
          tipo: 'geovalla',
          mensaje: `🅿️ Modo estacionamiento activado para ${activeVehicle?.name}`,
          dispositivo: activeVehicle?.name || null,
        });
      }
    }
  };

  // ─── Protección: abrir modal según estado ───
  const handleProtege = () => {
    if (isDemoMode) { showPaywall(); return; }
    if (isProtected) {
      setShowDeactivateModal(true);
    } else {
      setProtectionError(null);
      setShowActivateModal(true);
    }
  };

  // Confirmar activar escolta
  const handleActivateConfirm = async (duration) => {
    if (!activeVehicle) return;
    setProtectionLoading(true);
    setProtectionError(null);
    try {
      const data = await activateProtection(
        activeVehicle.id,
        activeVehicle.name,
        user?.name || 'Cliente',
        duration
      );
      setShowActivateModal(false);
      notify({
        tipo: 'sistema',
        mensaje: `🛡️ Escolta activada para ${activeVehicle.name}`,
        dispositivo: activeVehicle.name,
        esAlerta: true,
      });
      // Abrir WhatsApp con primer contacto
      if (protContacts.length > 0 && data?.url) {
        const message = encodeURIComponent(
          `📍 Estoy compartiendo mi ubicación en vivo contigo.\n\n` +
          `Sigue mi recorrido aquí:\n${data.url}\n\n` +
          `— ${user?.name || 'Cliente'} vía Trackeo`
        );
        window.open(`https://wa.me/${protContacts[0].phone}?text=${message}`, '_blank');
      }
    } catch (err) {
      setProtectionError(err.message || 'Error al activar escolta');
    } finally {
      setProtectionLoading(false);
    }
  };

  // Confirmar desactivar escolta
  const handleDeactivateConfirm = async () => {
    setProtectionLoading(true);
    setProtectionError(null);
    try {
      await deactivateProtection();
      setShowDeactivateModal(false);
      notify({
        tipo: 'sistema',
        mensaje: '⬜ Escolta desactivada',
        dispositivo: activeVehicle?.name || null,
      });
    } catch (err) {
      setProtectionError(err.message || 'Error al desactivar escolta');
    } finally {
      setProtectionLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════
  // ⚠️ RETURN CONDICIONAL - DESPUÉS DE TODOS LOS HOOKS
  // ═══════════════════════════════════════════════════
  
  if (isInitialLoad) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Conectando con el satélite...</p>
        </div>
      </div>
    );
  }


  // ─── RENDER ───
  return (
    <div className={`${isDark ? "dark" : ""}`}>
      <div className={`flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-all duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>

        {/* Overlay móvil */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ═══ COLUMNA IZQUIERDA: SIDEBAR (fijo) ═══ */}
        <aside className={`flex-shrink-0 fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col h-screen transition-transform duration-300 ease-out bg-white dark:bg-[#0F1525] border-r border-slate-200/80 dark:border-white/[0.06] ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}>

          <div className="p-5 flex justify-between items-center">
            <TrackeoLogo size="sm" dark={isDark} />
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-neutral-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider px-3 mb-2 mt-2">Principal</p>
            <SidebarItem icon={Car} label="Mis Vehículos" active={activeMenu === "mis-vehiculos"} onClick={() => setActiveMenu("mis-vehiculos")} />
            <SidebarItem icon={Plus} label="Añadir vehículo" onClick={() => isDemoMode ? showPaywall() : setShowAddVehicle(true)} />
            <SidebarItem icon={BarChart3} label="Historial" active={activeMenu === "historial"} onClick={() => setActiveMenu("historial")} />
            <SidebarItem icon={Route} label="Rutas" active={activeMenu === "rutas"} onClick={() => setActiveMenu("rutas")} />
            <SidebarItem icon={MapPinned} label="Geovallas" active={activeMenu === "geovallas"} onClick={() => setActiveMenu("geovallas")} />
            <SidebarItem icon={ShieldCheck} label="Protege mi camino" active={activeMenu === "protege"} onClick={() => setActiveMenu("protege")} />

            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider px-3 mb-2 mt-5">Gestión</p>
            <SidebarItem icon={AlertTriangle} label="Alertas" active={activeMenu === "alertas"} onClick={() => setActiveMenu("alertas")} />
            <SidebarItem icon={Wrench} label="Mantención" active={activeMenu === "mantencion"} onClick={() => setActiveMenu("mantencion")} />

            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider px-3 mb-2 mt-5">Control</p>
            <EngineToggleButton variant="sidebar" engineStopped={engineStopped} onClick={handleEngineClick} isLoading={isDemoMode ? false : isLoadingEngine} />
            <SidebarItem icon={ParkingCircle} label="Modo Estacionado" active={showParkingPanel} onClick={() => isDemoMode ? showPaywall() : setShowParkingPanel(!showParkingPanel)} />
            <SidebarItem icon={Settings} label="Configuraciones" active={activeMenu === "config"} onClick={() => setActiveMenu("config")} />
          </nav>

          <div className="p-4 border-t border-slate-200/80 dark:border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">{user.name ? user.name.charAt(0) : 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{user.name}</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-500 truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={handleDemoAwareLogout} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 rounded-lg transition-colors">
              <LogOut className="w-3.5 h-3.5" />Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* ═══ ÁREA DE CONTENIDO PRINCIPAL (columna vertical) ═══ */}
        <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0">

          {/* ═══ A) CABECERA FIJA — NO HACE SCROLL (Navbar + HeaderStats) ═══ */}
          <div className="shrink-0 z-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 pb-4">
            {/* Navbar: selector vehículo, notificaciones, tema, perfil */}
            <header className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                  <Menu className="w-6 h-6" />
                </button>

                {/* Selector de vehículo */}
                <div className="relative">
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-[#131B2C] border border-slate-200/60 dark:border-white/[0.06] hover:border-orange-500/50 transition-all cursor-pointer">
                    <div className={`w-2.5 h-2.5 rounded-full ${activeVehicle?.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                    <Car className="w-5 h-5 text-amber-500" />
                    {loadingVehicles ? (
                      <span className="text-sm font-bold text-neutral-500">Cargando...</span>
                    ) : (
                      <select
                        value={selectedVehicleId ?? activeVehicle?.id ?? ''}
                        onChange={e => setSelectedVehicleId(Number(e.target.value))}
                        className="appearance-none bg-transparent text-base font-bold text-neutral-900 dark:text-white pr-8 cursor-pointer outline-none min-w-[140px]"
                      >
                        {vehicles.map(v => <option key={v.id} value={v.id} className="bg-white dark:bg-neutral-900">{v.name}</option>)}
                      </select>
                    )}
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Lado derecho */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      const willOpen = !showNotifications;
                      setShowNotifications(willOpen);
                      setShowUserMenu(false);
                      if (willOpen) refreshNotifications();
                    }}
                    className="p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-white/5 relative group transition-all"
                  >
                    <Bell className="w-6 h-6 text-neutral-500 dark:text-neutral-400 group-hover:scale-110 transition-transform" />
                    {(unreadCount + protUnreadCount) > 0 && (
                      <span className="absolute top-2 right-2 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 rounded-full border-2 border-white dark:border-[#0F1525] text-[9px] font-bold text-white leading-none px-1">
                        {(unreadCount + protUnreadCount) > 9 ? '9+' : (unreadCount + protUnreadCount)}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <NotificationsDropdown
                      notifications={notifList}
                      unreadCount={unreadCount}
                      loading={loadingNotifications}
                      onMarkRead={markRead}
                      onMarkAllRead={markAllRead}
                      onClose={() => setShowNotifications(false)}
                      protectionNotifications={protNotifications}
                      protectionUnreadCount={protUnreadCount}
                      onMarkProtectionRead={markProtectionRead}
                      onMarkAllProtectionRead={markAllProtectionRead}
                    />
                  )}
                </div>

                <button onClick={onToggleTheme} className="p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-white/5 group transition-all">
                  {isDark
                    ? <Sun className="w-6 h-6 text-amber-500 group-hover:rotate-90 transition-transform" />
                    : <Moon className="w-6 h-6 text-neutral-500 group-hover:-rotate-12 transition-transform" />
                  }
                </button>

                <div className="h-8 w-px bg-neutral-200 dark:bg-white/10 mx-2 hidden md:block" />

                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu((prev) => !prev);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-white/5 border border-transparent hover:border-neutral-200 dark:hover:border-white/10 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                      <span className="text-white font-bold text-sm">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white leading-none">{user.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-neutral-500 font-medium mt-1 uppercase tracking-wider">Mi Cuenta</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-neutral-400 hidden md:block group-hover:translate-y-0.5 transition-transform" />
                  </button>
                  {showUserMenu && (
                    <UserDropdown
                      user={user}
                      onClose={() => setShowUserMenu(false)}
                      onEditProfile={() => setShowProfile(true)}
                      onLogout={handleDemoAwareLogout}
                    />
                  )}
                </div>
              </div>
            </div>
            </header>

            {/* Banner de demostración */}
            {isDemoMode && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 flex items-center justify-center gap-3 shadow-md">
                <span className="text-sm font-semibold text-white">
                  Estás explorando una versión de demostración.
                </span>
                <a
                  href="https://trackeo.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-orange-600 hover:bg-orange-50 transition-colors shadow-sm whitespace-nowrap"
                >
                  Contratar Trackeo Ahora
                </a>
              </div>
            )}

            {/* Toast de motor apagado */}
            <EngineStatusToast
              deviceName={activeVehicle?.name ?? ''}
              isVisible={engineStopped}
              onRestore={handleEngineClick}
            />

            {/* HeaderStats (tarjetas KPI) — solo en Mis Vehículos */}
            {activeMenu === 'mis-vehiculos' && activeVehicle && (
              <KpiStrip
                activeVehicle={activeVehicle}
                kmCount={kmCount}
                fuelSaved={85400}
                maintenanceSaved={12000}
              />
            )}
          </div>

          {/* B) CUERPO — hace scroll */}
          <div className="flex-1 flex overflow-hidden relative min-h-0">

            {!activeVehicle ? (
              <div className="flex flex-col items-center justify-center flex-1 text-neutral-500 p-4">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-amber-500" />
                <p>Cargando información...</p>
              </div>
            ) : activeMenu === 'mis-vehiculos' ? (
              <>
                {/* Columna Central: Mapa + Banner (scroll independiente) */}
                <div className="flex-1 flex flex-col overflow-y-auto scroll-smooth min-w-0">
                  <div className="min-h-[600px] flex-1 p-4">
                    <div className="rounded-2xl overflow-hidden bg-slate-900 h-full min-h-[600px] relative">
                      <MapView
                        vehicles={vehicles}
                        selectedVehicle={activeVehicle}
                        isDarkMode={isDark}
                        routeData={null}
                        parkingData={parkingData}
                        parkingStatus={parkingStatus}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 p-4 pb-24 w-full">
                    <UpgradeSection />
                  </div>
                </div>
                {/* Columna Derecha: Widgets laterales */}
                <aside className="w-[400px] shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar hidden lg:block">
                  <div className="p-4 flex flex-col gap-4">
                    <SavingsWidget fuelSaved={85400} maintenanceSaved={12000} />
                    <VehicleDocumentsCard
                      documents={[
                        { type: 'Revisión Técnica', expirationDate: '2024-12-15' },
                        { type: 'Seguro', expirationDate: new Date(Date.now() + 15 * 864e5) },
                        { type: 'Permiso Circulación', expirationDate: '2025-12-01' },
                      ]}
                    />
                    <WeeklyUsageWidget isDark={isDark} />
                  </div>
                </aside>
              </>
            ) : activeMenu === 'historial' ? (
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
                <HistoryView
                  deviceId={activeVehicle.id}
                  deviceName={activeVehicle.name}
                  onRouteLoaded={(data) => setRouteData(data?.path ?? null)}
                  isDark={isDark}
                />
                <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#131B2C] border border-slate-100 dark:border-white/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none h-80 relative z-0 mt-4">
                  <MapView
                    vehicles={[]}
                    selectedVehicle={activeVehicle}
                    isDarkMode={isDark}
                    routeData={routeData}
                  />
                </div>
              </div>
            ) : activeMenu === 'rutas' ? (
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <LiveSharePanel
                  activeVehicle={activeVehicle}
                  vehicles={vehiclesList}
                  userName={user?.name || 'Cliente'}
                  isDark={isDark}
                />
              </div>
            ) : activeMenu === 'geovallas' ? (
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <GeofencesView
                vehicles={vehiclesList}
                activeVehicle={activeVehicle}
                isDark={isDark}
                onNotify={notify}
                isDemoMode={isDemoMode}
                onDemoPaywall={showPaywall}
                demoGeofences={isDemoMode ? mockGeofences : null}
              />
              </div>
            ) : activeMenu === 'protege' ? (
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <ProtectionSettingsPanel
                isProtected={isProtected}
                protectionData={protectionData}
                contacts={protContacts}
                notifications={protNotifications}
                safeZone={safeZone}
                activeVehicle={activeVehicle}
                userName={user?.name || 'Cliente'}
                isDark={isDark}
                onActivate={activateProtection}
                onDeactivate={async () => {
                  await deactivateProtection();
                  notify({ tipo: 'sistema', mensaje: '⬜ Escolta desactivada', dispositivo: activeVehicle?.name || null });
                }}
                onPanic={triggerPanic}
                onAddContact={addContact}
                onRemoveContact={removeContact}
                onEditContact={editContact}
                onUpdateSafeZone={updateSafeZone}
                onMarkAsRead={markProtectionRead}
              />
              </div>
            ) : activeMenu === 'alertas' ? (
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <ActivityFeed
                notifications={notifList}
                unreadCount={unreadCount}
                loading={loadingNotifications}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                protectionNotifications={protNotifications}
                protectionUnreadCount={protUnreadCount}
                onMarkProtectionRead={markProtectionRead}
                onMarkAllProtectionRead={markAllProtectionRead}
                onEngineControl={handleEngineClick}
              />
              </div>
            ) : activeMenu === 'mantencion' ? (
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <MaintenanceDashboard
                  activeVehicle={activeVehicle}
                  isDark={isDark}
                />
              </div>
            ) : activeMenu === 'config' ? (
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <SettingsLayout
                user={user}
                isDark={isDark}
                vehicles={vehiclesList}
                onNotify={notify}
                userPlan="pro"
              />
              </div>
            ) : null}

          </div>
        </div>

        {showProfile && (
          <ProfileModal user={user} onClose={() => setShowProfile(false)} onNotify={notify} />
        )}

        {/* Modal de confirmación para parar/activar motor */}
        <EngineConfirmModal
          isOpen={showEngineModal}
          action={engineStopped ? 'start' : 'stop'}
          deviceName={activeVehicle?.name ?? ''}
          onConfirm={handleEngineConfirm}
          onCancel={() => setShowEngineModal(false)}
          isLoading={isLoadingEngine}
          error={engineError}
        />

        {/* Modal Añadir Vehículo */}
        <AddVehicleModal
          isOpen={showAddVehicle}
          onClose={() => setShowAddVehicle(false)}
          userName={user?.name || 'Cliente'}
        />

        {/* Modales de Protección */}
        <ProtectionActivateModal
          isOpen={showActivateModal}
          contacts={protContacts}
          deviceName={activeVehicle?.name ?? ''}
          onConfirm={handleActivateConfirm}
          onCancel={() => { setShowActivateModal(false); setProtectionError(null); }}
          onGoToSettings={() => { setShowActivateModal(false); setActiveMenu('protege'); }}
          isLoading={protectionLoading}
          error={protectionError}
        />

        <ProtectionDeactivateModal
          isOpen={showDeactivateModal}
          protectionData={protectionData}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => { setShowDeactivateModal(false); setProtectionError(null); }}
          isLoading={protectionLoading}
          error={protectionError}
        />

        {/* ═══ Parking Mode: Panel Controller (bottom-sheet) ═══ */}
        {showParkingPanel && (
          <ParkingModeController
            status={parkingStatus}
            isActive={isParkingActive}
            isActivating={isParkingActivating}
            isAlert={isParkingAlert}
            parkingData={parkingData}
            errorMessage={parkingError}
            onToggle={handleParkingToggle}
            onClearError={clearParkingError}
            onEngineStop={handleParkingEngineStop}
            activeVehicle={activeVehicle}
            isDark={isDark}
            engineStopped={engineStopped}
            isLoadingEngine={isLoadingEngine}
          />
        )}

        {/* ═══ Parking Mode: Alerta de Intrusión (fullscreen takeover) ═══ */}
        <ParkingAlertModal
          isOpen={isParkingAlert && !!intrusionEvent}
          intrusionEvent={intrusionEvent}
          parkingData={parkingData}
          vehicleName={activeVehicle?.name}
          onDismiss={dismissParkingAlert}
          onEngineStop={handleParkingEngineStop}
          onViewOnMap={() => {}}
          isLoadingEngine={isLoadingEngine}
          engineStopped={engineStopped}
        />

        {/* ═══ FAB aislado: posición fija a la pantalla, fuera de grid/flex ═══ */}
        <div className="fixed bottom-6 right-6 z-50 shadow-xl">
          <FloatingActionButton
            isProtected={isProtected}
            engineStopped={engineStopped}
            isParkingActive={isParkingActive}
            isDark={isDark}
            onProtect={handleProtege}
            onCenterVehicle={handleIrAlAuto}
            onEngineControl={handleEngineClick}
            onParkingMode={handleParkingFromFab}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
