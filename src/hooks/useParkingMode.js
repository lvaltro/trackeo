// src/hooks/useParkingMode.js
// Hook centralizado para el "Modo Estacionamiento Inteligente".
// Gestiona: activación/desactivación de geofence de parking, detección de intrusión,
// persistencia en localStorage, y manejo optimista de UI.
//
// Estados: 'inactive' | 'activating' | 'active' | 'alert' | 'deactivating' | 'error'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { traccarService } from '../api/traccarApi';
import { useDemo } from '../context/DemoContext';

const STORAGE_KEY = 'trackeo_parking_mode';
const PARKING_RADIUS = 50; // metros
const AUTO_EXPIRE_HOURS = 12;
const DEBOUNCE_MS = 300;
const POLL_EVENTS_MS = 10000; // Polling de eventos cada 10s

// ─── Helpers de localStorage ───
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted */ }
  return fallback;
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage full */ }
}

/**
 * Hook: Modo Estacionamiento Inteligente
 * @param {number|null} vehicleId - ID del dispositivo activo
 * @param {object|null} vehiclePosition - { latitude, longitude } del vehículo activo
 * @param {string} vehicleName - Nombre del vehículo
 */
export function useParkingMode(vehicleId, vehiclePosition, vehicleName) {
  const { isDemoMode } = useDemo();

  // ═══ Estado principal ═══
  const [status, setStatus] = useState('inactive'); // 'inactive'|'activating'|'active'|'alert'|'deactivating'|'error'
  const [parkingData, setParkingData] = useState(null);
  // { geofenceId, latitude, longitude, radius, activatedAt, expiresAt, address, deviceId }
  const [errorMessage, setErrorMessage] = useState(null);
  const [intrusionEvent, setIntrusionEvent] = useState(null);
  // { timestamp, currentLat, currentLng }
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Refs para debounce y polling
  const debounceRef = useRef(null);
  const pollingRef = useRef(null);
  const lastToggleRef = useRef(0);

  // ═══ Restaurar estado desde localStorage al montar ═══
  // GUARD: En demo, no restaurar estado del usuario real
  useEffect(() => {
    if (isDemoMode) return;
    const saved = loadJSON(STORAGE_KEY, null);
    if (!saved) return;

    if (saved.expiresAt && Date.now() > new Date(saved.expiresAt).getTime()) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (saved.deviceId && vehicleId && saved.deviceId !== vehicleId) {
      return;
    }

    setParkingData(saved);
    setStatus('active');
  }, [vehicleId, isDemoMode]);

  // ═══ Auto-expiración ═══
  // GUARD: En demo, no ejecutar timers
  useEffect(() => {
    if (isDemoMode) return;
    if (status !== 'active' || !parkingData?.expiresAt) return;

    const checkExpiry = () => {
      if (Date.now() > new Date(parkingData.expiresAt).getTime()) {
        deactivate();
      }
    };

    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [status, parkingData, isDemoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══ Polling de eventos (detección de intrusión) ═══
  // GUARD: En demo, no hacer polling real
  useEffect(() => {
    if (isDemoMode) return;
    if (status !== 'active' || !vehicleId || !parkingData) return;

    const checkIntrusion = () => {
      if (!vehiclePosition?.latitude || !vehiclePosition?.longitude) return;
      if (!parkingData.latitude || !parkingData.longitude) return;

      // Calcular distancia Haversine entre posición actual y centro de parking
      const distance = haversineDistance(
        parkingData.latitude,
        parkingData.longitude,
        vehiclePosition.latitude,
        vehiclePosition.longitude
      );

      // Si salió del perímetro → ALERTA
      if (distance > parkingData.radius && !alertDismissed) {
        setIntrusionEvent({
          timestamp: new Date().toISOString(),
          currentLat: vehiclePosition.latitude,
          currentLng: vehiclePosition.longitude,
          distance: Math.round(distance),
        });
        setStatus('alert');
        triggerIntrusionFeedback();
      }
    };

    // Verificar inmediatamente
    checkIntrusion();

    // Y luego cada ciclo de polling
    pollingRef.current = setInterval(checkIntrusion, POLL_EVENTS_MS);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status, vehicleId, vehiclePosition, parkingData, alertDismissed]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══ ACTIVAR modo estacionamiento ═══
  const activate = useCallback(async () => {
    if (isDemoMode) return null;
    // Debounce: evitar doble-tap
    const now = Date.now();
    if (now - lastToggleRef.current < DEBOUNCE_MS) return;
    lastToggleRef.current = now;

    if (!vehicleId || !vehiclePosition?.latitude || !vehiclePosition?.longitude) {
      setErrorMessage('No se pudo obtener la ubicación del vehículo. Verifique que el GPS esté activo.');
      setStatus('error');
      // Vibración de error
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      return;
    }

    // Vibración háptica suave
    if (navigator.vibrate) navigator.vibrate(50);

    // UI optimista: mostrar activando
    setStatus('activating');
    setErrorMessage(null);
    setAlertDismissed(false);
    setIntrusionEvent(null);

    try {
      // Mínimo 200ms de skeleton loader (percepción)
      const minDelay = new Promise(r => setTimeout(r, 200));

      const lat = vehiclePosition.latitude;
      const lng = vehiclePosition.longitude;
      const timestamp = Date.now();
      const expiresAt = new Date(timestamp + AUTO_EXPIRE_HOURS * 60 * 60 * 1000).toISOString();

      // Crear geofence en Traccar (formato WKT)
      const geofencePayload = {
        name: `Parking_${timestamp}`,
        area: `CIRCLE (${lat} ${lng}, ${PARKING_RADIUS})`,
        attributes: {
          type: 'parking',
          autoExpire: `${AUTO_EXPIRE_HOURS}h`,
          createdBy: 'parkingMode',
        },
      };

      const [geofence] = await Promise.all([
        traccarService.createGeofence(geofencePayload),
        minDelay,
      ]);

      // Asignar geofence al dispositivo
      if (geofence?.id) {
        try {
          await traccarService.assignGeofenceToDevice(vehicleId, geofence.id);
        } catch (assignErr) {
          console.warn('[ParkingMode] No se pudo asignar geofence al dispositivo:', assignErr.message);
          // No es crítico, continuar
        }
      }

      // Guardar datos
      const data = {
        geofenceId: geofence?.id || null,
        latitude: lat,
        longitude: lng,
        radius: PARKING_RADIUS,
        activatedAt: new Date(timestamp).toISOString(),
        expiresAt,
        deviceId: vehicleId,
        deviceName: vehicleName,
      };

      setParkingData(data);
      setStatus('active');
      saveJSON(STORAGE_KEY, data);

      return data;
    } catch (err) {
      console.error('[ParkingMode] Error al activar:', err);
      setErrorMessage(
        err.status === 0
          ? 'Verifique su conexión a internet. Reintentando en 5s...'
          : err.status >= 500
            ? 'Servicio temporalmente no disponible. Contacte soporte.'
            : err.message || 'Error al activar modo estacionamiento'
      );
      setStatus('error');
      // Vibración de error
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      return null;
    }
  }, [vehicleId, vehiclePosition, vehicleName, isDemoMode]);

  // ═══ DESACTIVAR modo estacionamiento ═══
  const deactivate = useCallback(async () => {
    if (isDemoMode) return;
    const now = Date.now();
    if (now - lastToggleRef.current < DEBOUNCE_MS) return;
    lastToggleRef.current = now;

    if (navigator.vibrate) navigator.vibrate(50);

    setStatus('deactivating');

    try {
      // Eliminar geofence de Traccar
      if (parkingData?.geofenceId) {
        try {
          await traccarService.deleteGeofence(parkingData.geofenceId);
        } catch (err) {
          console.warn('[ParkingMode] No se pudo eliminar geofence:', err.message);
          // No bloquear la desactivación
        }
      }
    } finally {
      setParkingData(null);
      setIntrusionEvent(null);
      setAlertDismissed(false);
      setErrorMessage(null);
      setStatus('inactive');
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [parkingData, isDemoMode]);

  // ═══ TOGGLE (activar/desactivar) ═══
  const toggle = useCallback(() => {
    if (status === 'active' || status === 'alert') {
      return deactivate();
    }
    if (status === 'inactive' || status === 'error') {
      return activate();
    }
    // Si está activando/desactivando, ignorar
  }, [status, activate, deactivate]);

  // ═══ Dismiss alerta (mantener parking activo) ═══
  const dismissAlert = useCallback(() => {
    setAlertDismissed(true);
    setIntrusionEvent(null);
    setStatus('active');
  }, []);

  // ═══ Limpiar error ═══
  const clearError = useCallback(() => {
    setErrorMessage(null);
    if (status === 'error') setStatus('inactive');
  }, [status]);

  // ═══ Datos computados ═══
  const isActive = status === 'active' || status === 'alert';
  const isActivating = status === 'activating';
  const isAlert = status === 'alert';
  const isInactive = status === 'inactive';

  const timeActive = useMemo(() => {
    if (!parkingData?.activatedAt) return null;
    return parkingData.activatedAt;
  }, [parkingData]);

  return {
    // Estado
    status,
    isActive,
    isActivating,
    isAlert,
    isInactive,
    parkingData,
    errorMessage,
    intrusionEvent,

    // Acciones
    activate,
    deactivate,
    toggle,
    dismissAlert,
    clearError,

    // Info
    timeActive,
  };
}

// ═══ Utilidades ═══

/**
 * Calcular distancia entre dos coordenadas (Haversine).
 * @returns distancia en metros
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la tierra en metros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Feedback multi-sensorial de intrusión.
 */
function triggerIntrusionFeedback() {
  // Háptico: patrón agresivo [200, 100, 200, 100, 400] × 3
  if (navigator.vibrate) {
    const pattern = [200, 100, 200, 100, 400, 500, 200, 100, 200, 100, 400, 500, 200, 100, 200, 100, 400];
    navigator.vibrate(pattern);
  }

  // Push notification (si la app está en background)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('⚠️ INTRUSIÓN DETECTADA', {
        body: 'Tu vehículo abandonó la zona segura',
        icon: '/favicon.ico',
        tag: 'parking-intrusion',
        requireInteraction: true,
      });
    } catch { /* SW not available */ }
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

export default useParkingMode;
