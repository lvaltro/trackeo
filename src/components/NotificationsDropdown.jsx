// src/components/NotificationsDropdown.jsx
// Dropdown de la campanita — consume API real de notificaciones.

import React, { useRef, useEffect } from 'react';
import { MapPinned, Zap, Wrench, AlertTriangle, User, Bell, CheckCheck, Loader2, Shield, ShieldOff } from 'lucide-react';

// ─── Mapa de iconos por tipo de notificación ───
const ICON_MAP = {
  geovalla: {
    icon: MapPinned,
    bg: 'bg-amber-100 dark:bg-amber-500/20',
    color: 'text-amber-600 dark:text-amber-400',
  },
  motor: {
    icon: Zap,
    bg: 'bg-red-100 dark:bg-red-500/20',
    color: 'text-red-600 dark:text-red-400',
  },
  mantenimiento: {
    icon: Wrench,
    bg: 'bg-blue-100 dark:bg-blue-500/20',
    color: 'text-blue-600 dark:text-blue-400',
  },
  alerta: {
    icon: AlertTriangle,
    bg: 'bg-orange-100 dark:bg-orange-500/20',
    color: 'text-orange-600 dark:text-orange-400',
  },
  perfil: {
    icon: User,
    bg: 'bg-violet-100 dark:bg-violet-500/20',
    color: 'text-violet-600 dark:text-violet-400',
  },
  sistema: {
    icon: Bell,
    bg: 'bg-neutral-100 dark:bg-neutral-500/20',
    color: 'text-neutral-600 dark:text-neutral-400',
  },
  // ─── Tipos de protección "Protege mi Camino" ───
  escort_activated: {
    icon: Shield,
    bg: 'bg-emerald-100 dark:bg-emerald-500/20',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  escort_deactivated: {
    icon: ShieldOff,
    bg: 'bg-neutral-100 dark:bg-neutral-500/20',
    color: 'text-neutral-500 dark:text-neutral-400',
  },
  panic: {
    icon: AlertTriangle,
    bg: 'bg-red-100 dark:bg-red-500/20',
    color: 'text-red-600 dark:text-red-400',
  },
  zone_exit: {
    icon: MapPinned,
    bg: 'bg-red-100 dark:bg-red-500/20',
    color: 'text-red-600 dark:text-red-400',
  },
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
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

const NotificationsDropdown = ({
  notifications = [],
  unreadCount = 0,
  loading = false,
  onMarkRead,
  onMarkAllRead,
  onClose,
  // ─── Notificaciones de protección (opcionales) ───
  protectionNotifications = [],
  protectionUnreadCount = 0,
  onMarkProtectionRead,
  onMarkAllProtectionRead,
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Combinar notificaciones del backend + protección, ordenar por fecha desc
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

  const allNotifications = [...notifications, ...protMapped].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalUnread = unreadCount + protectionUnreadCount;
  const isEmpty = allNotifications.length === 0;

  // Handler para marcar leída según el tipo
  const handleMarkRead = (notif) => {
    if (notif._isProtection) {
      onMarkProtectionRead?.(notif._protectionId);
    } else {
      onMarkRead?.(notif.id);
    }
  };

  const handleMarkAllReadCombined = () => {
    onMarkAllRead?.();
    onMarkAllProtectionRead?.();
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-neutral-200/80 dark:border-white/[0.08] shadow-xl shadow-black/10 dark:shadow-black/40 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Notificaciones</h3>
          {totalUnread > 0 && (
            <span className="text-[10px] font-bold text-white bg-red-500 rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
          {loading && (
            <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          )}
        </div>
        {totalUnread > 0 && (
          <button
            onClick={handleMarkAllReadCombined}
            className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors uppercase tracking-wide"
          >
            <CheckCheck className="w-3 h-3" />
            Marcar leídas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="max-h-[360px] overflow-y-auto">
        {isEmpty && loading ? (
          /* Skeleton de carga — solo si no hay datos en cache */
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Cargando historial...</p>
          </div>
        ) : isEmpty ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-400 dark:text-neutral-500">Sin notificaciones</p>
            <p className="text-[11px] text-neutral-300 dark:text-neutral-600 mt-1">
              Las acciones que realices aparecerán aquí
            </p>
          </div>
        ) : (
          allNotifications.map((n) => {
            const config = ICON_MAP[n.tipo] || ICON_MAP.sistema;
            const Icon = config.icon;
            const isUnread = !n.leido;

            return (
              <div
                key={n.id}
                onClick={() => isUnread && handleMarkRead(n)}
                className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer border-b border-neutral-50 dark:border-white/[0.03] last:border-b-0 ${
                  isUnread
                    ? 'bg-amber-50/50 dark:bg-amber-500/[0.03] hover:bg-amber-50 dark:hover:bg-amber-500/[0.06]'
                    : 'hover:bg-neutral-50 dark:hover:bg-white/[0.03]'
                }`}
              >
                <div className={`p-2 rounded-xl ${config.bg} shrink-0 mt-0.5`}>
                  <Icon className={`w-4 h-4 ${config.color}`} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  {n.dispositivo && (
                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">
                      {n.dispositivo}
                    </p>
                  )}
                  <p className={`text-xs leading-snug ${
                    isUnread
                      ? 'font-bold text-neutral-900 dark:text-white'
                      : 'font-medium text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {n.mensaje}
                  </p>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                    {formatTimeAgo(n.createdAt)}
                  </p>
                </div>
                {isUnread && (
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {allNotifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-neutral-100 dark:border-white/[0.06]">
          <p className="text-[10px] text-center text-neutral-400 dark:text-neutral-500">
            {allNotifications.length} notificación{allNotifications.length !== 1 ? 'es' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
