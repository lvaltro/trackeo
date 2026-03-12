// src/components/ActivityFeed.jsx
// Feed de Actividad Inteligente — Timeline profesional con cards expandibles,
// filtros rápidos, glow para no leídas, swipe to dismiss en móvil,
// mini-mapa y acciones contextuales.

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  MapPinned, Zap, Wrench, AlertTriangle, User, Bell, Shield, ShieldOff,
  CheckCheck, Loader2, Phone, Power, MapPin, Clock, Filter, X, ChevronDown,
  Gauge, Radio, Archive, Eye, Siren, Activity,
} from 'lucide-react';

// ═══════════════════════════════════════════════════
// CONSTANTES Y CONFIGURACIÓN
// ═══════════════════════════════════════════════════

// Mapeo de tipos a configuración visual
const TYPE_CONFIG = {
  geovalla: {
    icon: MapPinned,
    label: 'Geovalla',
    severity: 'warning',
    category: 'seguridad',
  },
  motor: {
    icon: Zap,
    label: 'Motor',
    severity: 'danger',
    category: 'motor',
  },
  mantenimiento: {
    icon: Wrench,
    label: 'Mantención',
    severity: 'warning',
    category: 'mantenimiento',
  },
  alerta: {
    icon: AlertTriangle,
    label: 'Alerta',
    severity: 'danger',
    category: 'seguridad',
  },
  perfil: {
    icon: User,
    label: 'Perfil',
    severity: 'info',
    category: 'sistema',
  },
  sistema: {
    icon: Bell,
    label: 'Sistema',
    severity: 'info',
    category: 'sistema',
  },
  escort_activated: {
    icon: Shield,
    label: 'Escolta',
    severity: 'success',
    category: 'seguridad',
  },
  escort_deactivated: {
    icon: ShieldOff,
    label: 'Escolta',
    severity: 'info',
    category: 'seguridad',
  },
  panic: {
    icon: Siren,
    label: 'Pánico',
    severity: 'danger',
    category: 'seguridad',
  },
  zone_exit: {
    icon: MapPinned,
    label: 'Zona',
    severity: 'danger',
    category: 'seguridad',
  },
  velocidad: {
    icon: Gauge,
    label: 'Velocidad',
    severity: 'warning',
    category: 'velocidad',
  },
};

// Colores de severidad
const SEVERITY_COLORS = {
  danger: {
    border: 'border-l-red-500',
    dot: 'bg-red-500',
    glow: 'shadow-red-500/30',
    bg: 'bg-red-50 dark:bg-red-500/5',
    iconBg: 'bg-red-100 dark:bg-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  },
  warning: {
    border: 'border-l-amber-500',
    dot: 'bg-amber-500',
    glow: 'shadow-amber-500/30',
    bg: 'bg-amber-50 dark:bg-amber-500/5',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  },
  success: {
    border: 'border-l-emerald-500',
    dot: 'bg-emerald-500',
    glow: 'shadow-emerald-500/30',
    bg: 'bg-emerald-50 dark:bg-emerald-500/5',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  info: {
    border: 'border-l-blue-500',
    dot: 'bg-blue-500',
    glow: 'shadow-blue-500/30',
    bg: 'bg-blue-50 dark:bg-blue-500/5',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  },
};

// Filtros disponibles
const FILTERS = [
  { id: 'todas', label: 'Todas', icon: Filter },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
  { id: 'motor', label: 'Motor', icon: Zap },
  { id: 'velocidad', label: 'Velocidad', icon: Gauge },
  { id: 'mantenimiento', label: 'Mantención', icon: Wrench },
];

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffH === 1) return 'Hace 1 hora';
  if (diffH < 24) return `Hace ${diffH}h`;
  if (diffD === 1) return 'Hace 1 día';
  return `Hace ${diffD} días`;
}

// Agrupa notificaciones por día
function groupByDate(notifications) {
  const groups = {};
  for (const n of notifications) {
    const key = formatDate(n.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return Object.entries(groups);
}

// Genera URL de mini-mapa estático OSM
function getMiniMapUrl(lat, lng) {
  if (!lat || !lng) return null;
  return `https://static-maps.yandex.ru/v1?ll=${lng},${lat}&z=15&size=400,200&l=map&pt=${lng},${lat},pm2rdm`;
}

// ═══════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════

// ─── Filter Pills ───
const FilterPills = ({ activeFilter, onFilterChange }) => (
  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
    {FILTERS.map((f) => {
      const active = activeFilter === f.id;
      const Icon = f.icon;
      return (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
            active
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-lg shadow-amber-500/25'
              : 'bg-white dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400 border-neutral-200/80 dark:border-white/[0.08] hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {f.label}
        </button>
      );
    })}
  </div>
);

// ─── Swipeable Card Wrapper (móvil) ───
const SwipeableCard = ({ children, onDismiss, id }) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, -100, 0], [0, 0.5, 1]);
  const bgOpacity = useTransform(x, [-200, -80, 0], [1, 0.8, 0]);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Fondo de "archivar" que se revela al deslizar */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end px-6 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"
        style={{ opacity: bgOpacity }}
      >
        <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
          <Archive className="w-5 h-5" />
          <span className="text-xs font-semibold">Archivar</span>
        </div>
      </motion.div>

      <motion.div
        style={{ x, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -120) {
            onDismiss(id);
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// ─── Mini-Mapa Preview (imagen estática) ───
const MiniMapPreview = ({ lat, lng }) => {
  if (!lat || !lng) {
    return (
      <div className="w-full h-32 rounded-xl bg-neutral-100 dark:bg-white/[0.04] flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-5 h-5 text-neutral-300 dark:text-neutral-600 mx-auto mb-1" />
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Sin ubicación</p>
        </div>
      </div>
    );
  }

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.003},${lng + 0.005},${lat + 0.003}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="w-full h-32 rounded-xl overflow-hidden border border-neutral-200/50 dark:border-white/[0.06] relative">
      <iframe
        src={osmUrl}
        className="w-full h-full border-0"
        title="Ubicación de la alerta"
        loading="lazy"
      />
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-black/70 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-black/90 transition-colors shadow-sm backdrop-blur-sm"
      >
        Abrir en Maps
      </a>
    </div>
  );
};

// ─── Acciones Contextuales ───
const ContextActions = ({ tipo, deviceName, onEngineControl }) => {
  const isSecurityAlert = ['alerta', 'panic', 'zone_exit'].includes(tipo);
  const isMotorAlert = tipo === 'motor';

  if (!isSecurityAlert && !isMotorAlert) return null;

  return (
    <div className="flex items-center gap-2 mt-3">
      {isSecurityAlert && (
        <>
          <a
            href="tel:133"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-colors shadow-sm shadow-red-500/25"
          >
            <Phone className="w-3.5 h-3.5" />
            Emergencias (133)
          </a>
          {onEngineControl && (
            <button
              onClick={onEngineControl}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 dark:bg-white/10 text-white text-[11px] font-bold hover:bg-neutral-800 dark:hover:bg-white/20 transition-colors"
            >
              <Power className="w-3.5 h-3.5" />
              Corte Motor
            </button>
          )}
        </>
      )}
      {isMotorAlert && onEngineControl && (
        <button
          onClick={onEngineControl}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/25"
        >
          <Power className="w-3.5 h-3.5" />
          Control de Motor
        </button>
      )}
    </div>
  );
};

// ─── Timeline Dot (punto de la línea de tiempo) ───
const TimelineDot = ({ severity, isUnread, isLast }) => {
  const colors = SEVERITY_COLORS[severity] || SEVERITY_COLORS.info;
  return (
    <div className="flex flex-col items-center relative">
      <div className={`relative z-10 w-3 h-3 rounded-full ${colors.dot} ${isUnread ? 'ring-4 ring-current/10' : ''} transition-all`}>
        {isUnread && (
          <div className={`absolute inset-0 rounded-full ${colors.dot} animate-ping opacity-40`} />
        )}
      </div>
      {!isLast && (
        <div className="w-px flex-1 min-h-[20px] bg-neutral-200 dark:bg-white/[0.08] mt-1" />
      )}
    </div>
  );
};

// ─── Alert Card (tarjeta individual) ───
const AlertCard = ({ alert, isExpanded, onToggle, onMarkRead, onDismiss, onEngineControl, isMobile }) => {
  const config = TYPE_CONFIG[alert.tipo] || TYPE_CONFIG.sistema;
  const severity = SEVERITY_COLORS[config.severity] || SEVERITY_COLORS.info;
  const Icon = config.icon;
  const isUnread = !alert.leido;

  // Parsear lat/lng del mensaje si contiene coordenadas
  const coordMatch = alert.mensaje?.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  const lat = coordMatch ? parseFloat(coordMatch[1]) : null;
  const lng = coordMatch ? parseFloat(coordMatch[2]) : null;

  const cardContent = (
    <motion.div
      layout
      className={`relative border-l-[3px] ${severity.border} rounded-2xl bg-white dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden transition-shadow duration-300 ${
        isUnread
          ? `animate-feed-glow ${severity.glow}`
          : ''
      } hover:shadow-md dark:hover:shadow-black/20`}
    >
      {/* Card Header - Siempre visible */}
      <div
        className="flex items-start gap-3 px-4 py-3.5 cursor-pointer"
        onClick={() => {
          onToggle(alert.id);
          if (isUnread) onMarkRead(alert);
        }}
      >
        {/* Icono */}
        <div className={`p-2 rounded-xl ${severity.iconBg} shrink-0 mt-0.5`}>
          <Icon className={`w-4 h-4 ${severity.iconColor}`} strokeWidth={2} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${severity.badge}`}>
              {config.label}
            </span>
            {alert.dispositivo && (
              <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 truncate">
                {alert.dispositivo}
              </span>
            )}
          </div>
          <p className={`text-sm leading-snug mt-1 ${
            isUnread
              ? 'font-bold text-neutral-900 dark:text-white'
              : 'font-medium text-neutral-600 dark:text-neutral-400'
          }`}>
            {alert.mensaje}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500">
              <Clock className="w-3 h-3" />
              {formatTime(alert.createdAt)}
            </span>
            <span className="text-[10px] text-neutral-300 dark:text-neutral-600">
              {formatTimeAgo(alert.createdAt)}
            </span>
          </div>
        </div>

        {/* Indicadores lado derecho */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isUnread && (
            <div className={`w-2.5 h-2.5 rounded-full ${severity.dot}`} />
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
          </motion.div>
        </div>
      </div>

      {/* Card Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-neutral-100 dark:border-white/[0.04]">
              {/* Mini-Mapa */}
              <MiniMapPreview lat={lat} lng={lng} />

              {/* Acciones Contextuales */}
              <ContextActions
                tipo={alert.tipo}
                deviceName={alert.dispositivo}
                onEngineControl={onEngineControl}
              />

              {/* Info adicional */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  {new Date(alert.createdAt).toLocaleString('es-CL')}
                </span>
                {isUnread && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMarkRead(alert); }}
                    className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    Marcar leída
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Envolver con swipe si es móvil
  if (isMobile) {
    return (
      <SwipeableCard id={alert.id} onDismiss={onDismiss}>
        {cardContent}
      </SwipeableCard>
    );
  }

  return cardContent;
};

// ─── Smart Digest (Resumen inteligente del día) ───
const SmartDigest = ({ alerts }) => {
  const todayAlerts = alerts.filter(a => {
    const d = new Date(a.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const criticalCount = todayAlerts.filter(a => {
    const config = TYPE_CONFIG[a.tipo];
    return config?.severity === 'danger';
  }).length;
  const totalToday = todayAlerts.length;

  // Safety score (100 - penalties)
  const safetyScore = Math.max(0, Math.min(100,
    100 - (criticalCount * 15) - (todayAlerts.filter(a => TYPE_CONFIG[a.tipo]?.severity === 'warning').length * 5)
  ));

  const getScoreColor = (s) => {
    if (s >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20';
    if (s >= 60) return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20';
  };

  // Generar resumen
  const summary = (() => {
    if (totalToday === 0) return 'Todo tranquilo hoy. No se registraron eventos.';
    const speedAlerts = todayAlerts.filter(a => a.tipo === 'velocidad');
    const securityAlerts = todayAlerts.filter(a => ['alerta', 'panic', 'zone_exit'].includes(a.tipo));
    const parts = [];
    if (criticalCount > 0) parts.push(`${criticalCount} alerta${criticalCount > 1 ? 's' : ''} crítica${criticalCount > 1 ? 's' : ''}`);
    if (speedAlerts.length > 0) parts.push(`${speedAlerts.length} de velocidad`);
    if (securityAlerts.length > 0) parts.push(`${securityAlerts.length} de seguridad`);
    return `Hoy: ${parts.join(', ')}. ${totalToday} evento${totalToday > 1 ? 's' : ''} registrado${totalToday > 1 ? 's' : ''}.`;
  })();

  if (totalToday === 0 && alerts.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-2xl p-4 border border-blue-100 dark:border-blue-500/10">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-white dark:bg-white/[0.04] shadow-sm shrink-0">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-neutral-900 dark:text-white mb-1">Resumen del día</p>
          <p className="text-[12px] text-neutral-600 dark:text-neutral-400 leading-relaxed">{summary}</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getScoreColor(safetyScore)}`}>
                <span className="text-sm font-black">{safetyScore}</span>
              </div>
              <div>
                <p className="text-[9px] text-neutral-400 uppercase tracking-wider font-bold">Score</p>
                <p className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Seguridad</p>
              </div>
            </div>
            {criticalCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-500/20">
                  <span className="text-sm font-black text-red-600 dark:text-red-400">{criticalCount}</span>
                </div>
                <div>
                  <p className="text-[9px] text-neutral-400 uppercase tracking-wider font-bold">Críticas</p>
                  <p className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Hoy</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: ActivityFeed
// ═══════════════════════════════════════════════════

const ActivityFeed = ({
  notifications = [],
  unreadCount = 0,
  loading = false,
  onMarkRead,
  onMarkAllRead,
  // Protección
  protectionNotifications = [],
  protectionUnreadCount = 0,
  onMarkProtectionRead,
  onMarkAllProtectionRead,
  // Acciones
  onEngineControl,
}) => {
  const [activeFilter, setActiveFilter] = useState('todas');
  const [expandedId, setExpandedId] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  // ─── Combinar notificaciones ───
  const allNotifications = useMemo(() => {
    const protMapped = protectionNotifications.map(n => ({
      id: `prot_${n.id}`,
      _protectionId: n.id,
      tipo: n.type,
      mensaje: n.message,
      dispositivo: null,
      leido: n.read,
      createdAt: n.timestamp,
      _isProtection: true,
    }));

    return [...notifications, ...protMapped]
      .filter(n => !dismissedIds.has(n.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, protectionNotifications, dismissedIds]);

  // ─── Filtrar ───
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'todas') return allNotifications;
    return allNotifications.filter(n => {
      const config = TYPE_CONFIG[n.tipo];
      return config?.category === activeFilter;
    });
  }, [allNotifications, activeFilter]);

  // ─── Agrupar por fecha ───
  const groupedNotifications = useMemo(() => groupByDate(filteredNotifications), [filteredNotifications]);

  const totalUnread = unreadCount + protectionUnreadCount;

  // ─── Handlers ───
  const handleToggle = useCallback((id) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const handleMarkRead = useCallback((notif) => {
    if (notif._isProtection) {
      onMarkProtectionRead?.(notif._protectionId);
    } else {
      onMarkRead?.(notif.id);
    }
  }, [onMarkRead, onMarkProtectionRead]);

  const handleMarkAllRead = useCallback(() => {
    onMarkAllRead?.();
    onMarkAllProtectionRead?.();
  }, [onMarkAllRead, onMarkAllProtectionRead]);

  const handleDismiss = useCallback((id) => {
    setDismissedIds(prev => new Set([...prev, id]));
  }, []);

  const isEmpty = filteredNotifications.length === 0;

  return (
    <div className="space-y-5">
      {/* ─── Header del Feed ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            Feed de Actividad
            {totalUnread > 0 && (
              <span className="text-xs font-bold text-white bg-red-500 rounded-full px-2.5 py-0.5 min-w-[22px] text-center animate-pulse">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
            {loading && (
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            )}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Bitácora inteligente de tu vehículo
          </p>
        </div>
        {totalUnread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-colors border border-amber-200/50 dark:border-amber-500/20"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas leídas
          </button>
        )}
      </div>

      {/* ─── Smart Digest ─── */}
      <SmartDigest alerts={allNotifications} />

      {/* ─── Filter Pills ─── */}
      <FilterPills activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* ─── Timeline Feed ─── */}
      <div className="space-y-6">
        {isEmpty && loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-sm text-neutral-400 dark:text-neutral-500">Cargando actividad...</p>
          </div>
        ) : isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
            </div>
            <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              {activeFilter === 'todas' ? 'Sin actividad reciente' : `Sin alertas de ${activeFilter}`}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Las alertas y eventos aparecerán aquí en tiempo real
            </p>
          </motion.div>
        ) : (
          groupedNotifications.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-neutral-200/80 dark:bg-white/[0.06]" />
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  {items.length} evento{items.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Timeline Items */}
              <div className="space-y-0">
                {items.map((alert, idx) => {
                  const config = TYPE_CONFIG[alert.tipo] || TYPE_CONFIG.sistema;
                  const isLast = idx === items.length - 1;

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.3 }}
                      className="flex gap-3"
                    >
                      {/* Timeline Line + Dot */}
                      <div className="flex flex-col items-center pt-5 shrink-0">
                        <TimelineDot
                          severity={config.severity}
                          isUnread={!alert.leido}
                          isLast={isLast}
                        />
                      </div>

                      {/* Card */}
                      <div className="flex-1 pb-3 min-w-0">
                        <AlertCard
                          alert={alert}
                          isExpanded={expandedId === alert.id}
                          onToggle={handleToggle}
                          onMarkRead={handleMarkRead}
                          onDismiss={handleDismiss}
                          onEngineControl={onEngineControl}
                          isMobile={isMobile}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Footer Stats ─── */}
      {allNotifications.length > 0 && (
        <div className="flex items-center justify-center gap-4 pt-2 pb-4">
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
            {allNotifications.length} evento{allNotifications.length !== 1 ? 's' : ''} en los últimos 7 días
          </span>
          {dismissedIds.size > 0 && (
            <button
              onClick={() => setDismissedIds(new Set())}
              className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Restaurar archivados ({dismissedIds.size})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
