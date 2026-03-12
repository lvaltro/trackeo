// src/hooks/useNotifications.js
// Hook centralizado de notificaciones de Trackeo.
// Toast instantáneo (sonner) + persistencia en backend propio (/api/app/).
//
// FLUJO DE DATOS (prioridad):
//   1. Al montar → mostrar cache de localStorage INSTANTÁNEAMENTE (visual)
//   2. Fetch al backend → REEMPLAZA el cache con datos reales
//   3. Guardar datos reales en localStorage para el próximo F5
//
// REGLA DE NEGOCIO:
//   - Acciones del usuario (geovalla, motor, perfil) → leido=true → sin badge rojo.
//   - Alertas de seguridad (futuras alertas GPS) → leido=false → con badge rojo.

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  checkBackendHealth,
} from '../api/notificationApi';
import { useDemo } from '../context/DemoContext';
import { mockNotifications as demoNotifications } from '../utils/demoData';

// ─── LocalStorage keys (solo cache visual) ───
const LS_KEY = 'trackeo_notifications_cache';
const LS_UNREAD_KEY = 'trackeo_notifications_unread';

// ─── Estilos de Toast (Trackeo brand) ───
const TOAST_STYLE = {
  borderRadius: '16px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
  fontSize: '13px',
  fontWeight: '600',
  padding: '14px 20px',
};

const SUCCESS_STYLE = {
  ...TOAST_STYLE,
  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
  color: '#fff',
  border: 'none',
};

const ERROR_STYLE = {
  ...TOAST_STYLE,
  background: '#ef4444',
  color: '#fff',
  border: 'none',
};

const INFO_STYLE = {
  ...TOAST_STYLE,
  background: '#1a1a1a',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.1)',
};

// ─── Helpers de localStorage ───
function loadCache() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* corrupted cache */ }
  return [];
}

function loadUnreadCache() {
  try {
    const raw = localStorage.getItem(LS_UNREAD_KEY);
    if (raw != null) return Math.max(0, parseInt(raw) || 0);
  } catch { /* ignore */ }
  return 0;
}

function saveCache(notifications, unread) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(notifications.slice(0, 50)));
    localStorage.setItem(LS_UNREAD_KEY, String(unread));
  } catch { /* storage full */ }
}

// IDs temporales negativos para actualizaciones optimistas
let optimisticIdCounter = -1;

/**
 * Hook de notificaciones con hidratación desde localStorage + backend real.
 */
export function useNotifications() {
  const { isDemoMode } = useDemo();

  // ─── Estado inicial: desde cache para que F5 no muestre vacío ───
  const [notifications, setNotifications] = useState(loadCache);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(loadUnreadCache);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const mountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // GUARD: En demo, no persistir en localStorage del usuario real
  useEffect(() => {
    if (isDemoMode) return;
    saveCache(notifications, unreadCount);
  }, [notifications, unreadCount, isDemoMode]);

  // ─── Cargar notificaciones del backend (FUENTE PRIMARIA) ───
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications(50);
      if (!mountedRef.current) return;

      if (Array.isArray(data)) {
        setNotifications(data);
        const unread = data.filter(n => !n.leido).length;
        setUnreadCount(unread);
        hasFetchedRef.current = true;
        setBackendAvailable(true);
        console.log(`[useNotifications] ✅ Cargadas ${data.length} notificaciones del backend (${unread} no leídas)`);
      }
    } catch (err) {
      console.warn('[useNotifications] ⚠️ Error cargando del backend:', err.message);
      if (mountedRef.current) setBackendAvailable(false);
      // NO limpiar — el cache de localStorage mantiene datos visibles
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // ─── Fetch inicial con retry inteligente ───
  // GUARD: En demo, no hacer fetch al backend real.
  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const retryDelays = [0, 3000, 8000];

    async function tryFetch(attempt) {
      if (cancelled || attempt >= retryDelays.length) {
        if (!cancelled) setLoading(false);
        return;
      }

      const delay = retryDelays[attempt];
      if (delay > 0) {
        await new Promise(r => setTimeout(r, delay));
      }
      if (cancelled) return;

      try {
        setLoading(true);
        const data = await getNotifications(50);
        if (cancelled) return;

        if (Array.isArray(data)) {
          setNotifications(data);
          const unread = data.filter(n => !n.leido).length;
          setUnreadCount(unread);
          hasFetchedRef.current = true;
          setBackendAvailable(true);
          setLoading(false);
          console.log(`[useNotifications] ✅ Fetch inicial exitoso (intento ${attempt + 1}): ${data.length} notificaciones`);
          return;
        }
      } catch (err) {
        console.warn(`[useNotifications] Intento ${attempt + 1}/${retryDelays.length} fallido:`, err.message);
        if (!cancelled) {
          setBackendAvailable(false);
          setLoading(false);
        }
      }

      tryFetch(attempt + 1);
    }

    tryFetch(0);
    return () => { cancelled = true; };
  }, [isDemoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refrescar cada 60 segundos — GUARD: desactivar en demo
  useEffect(() => {
    if (isDemoMode) return;
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isDemoMode]);

  // ═══════════════════════════════════════════════════
  // notify() — Acción del usuario: Toast + guardar en backend
  // ═══════════════════════════════════════════════════
  const notify = useCallback(async ({ tipo, mensaje, dispositivo, silent = false, esAlerta = false }) => {
    // 1. Toast instantáneo (siempre funciona, sin depender del backend)
    if (!silent) {
      toast.success(mensaje, { style: SUCCESS_STYLE, duration: 3500 });
    }

    // 2. Actualización optimista en la lista local
    const optimisticId = optimisticIdCounter--;
    const isRead = !esAlerta;
    const optimisticNotif = {
      id: optimisticId,
      tipo,
      mensaje,
      dispositivo: dispositivo || null,
      leido: isRead,
      fuente: esAlerta ? 'alerta' : 'usuario',
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };

    setNotifications(prev => [optimisticNotif, ...prev]);
    if (!isRead) setUnreadCount(prev => prev + 1);

    // 3. Persistir en backend (la parte CRÍTICA)
    try {
      const saved = await createNotification({ tipo, mensaje, dispositivo, leido: isRead });
      if (!mountedRef.current) return;

      // Reemplazar optimista con la respuesta real del servidor
      setNotifications(prev => prev.map(n => (n.id === optimisticId ? saved : n)));
      setBackendAvailable(true);
      console.log(`[useNotifications] ✅ Notificación guardada en BD: #${saved.id} [${tipo}]`);
    } catch (err) {
      console.error(
        `[useNotifications] ❌ ERROR guardando notificación en backend:\n` +
        `  Tipo: ${tipo}\n` +
        `  Mensaje: ${mensaje}\n` +
        `  Error: ${err.message}\n` +
        `  ⚠️ La notificación solo existe en localStorage, se perderá en incógnito.`
      );
      if (mountedRef.current) setBackendAvailable(false);
      // El optimista se queda visible localmente
    }
  }, []);

  // ─── Solo toast (sin guardar en historial) ───
  const toastSuccess = useCallback((mensaje) => {
    toast.success(mensaje, { style: SUCCESS_STYLE, duration: 3500 });
  }, []);

  const toastError = useCallback((mensaje) => {
    toast.error(mensaje, { style: ERROR_STYLE, duration: 4000 });
  }, []);

  const toastInfo = useCallback((mensaje) => {
    toast(mensaje, { style: INFO_STYLE, duration: 3000 });
  }, []);

  // ─── Marcar como leída ───
  const markRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, leido: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    if (id < 0) return; // ID optimista, no está en backend
    try {
      await markAsRead(id);
    } catch (err) {
      console.warn('[useNotifications] Error marcando leída:', err.message);
    }
  }, []);

  // ─── Marcar todas como leídas ───
  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
    setUnreadCount(0);
    try {
      await markAllAsRead();
    } catch (err) {
      console.warn('[useNotifications] Error marcando todas leídas:', err.message);
    }
  }, []);

  // GUARD: En demo, retornar notificaciones mock y funciones no-op (sin tocar backend ni localStorage)
  if (isDemoMode) {
    const demoUnread = demoNotifications.filter(n => !n.leido).length;
    return {
      notifications: demoNotifications,
      unreadCount: demoUnread,
      loading: false,
      backendAvailable: true,
      notify: ({ mensaje, silent }) => { if (!silent) toast.success(mensaje, { style: SUCCESS_STYLE, duration: 3500 }); },
      toastSuccess,
      toastError,
      toastInfo,
      markRead: () => {},
      markAllRead: () => {},
      refresh: () => {},
    };
  }

  return {
    notifications,
    unreadCount,
    loading,
    backendAvailable,
    notify,
    toastSuccess,
    toastError,
    toastInfo,
    markRead,
    markAllRead,
    refresh: fetchNotifications,
  };
}
