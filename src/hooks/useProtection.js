// src/hooks/useProtection.js
// Hook centralizado para el sistema "Protege mi Camino".
// Gestiona: estado de protección, contactos de emergencia, zona segura,
// notificaciones locales de protección, y acciones de pánico.
//
// TODO: Migrar contactos y zona segura a backend cuando esté disponible.
// TODO: Integrar con Evolution API (Semana 5) para alertas automáticas de WhatsApp.

import { useState, useEffect, useCallback } from 'react';
import { useDemo } from '../context/DemoContext';
import { createShare, cancelShare } from '../api/liveShareApi';

const STORAGE_KEY = 'trackeo_protection';
const CONTACTS_KEY = 'trackeo_emergency_contacts';
const NOTIFICATIONS_KEY = 'trackeo_protection_notifications';
const SAFEZONE_KEY = 'trackeo_safe_zone';

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

export function useProtection() {
  const { isDemoMode } = useDemo();

  // ═══════════════════════════════════════════════════
  // Estado de protección (escolta activa / inactiva)
  // GUARD: En demo, no leer localStorage del usuario real.
  // ═══════════════════════════════════════════════════
  const [isProtected, setIsProtected] = useState(() => {
    if (isDemoMode) return false;
    const data = loadJSON(STORAGE_KEY, null);
    if (!data) return false;
    if (data.expiresAt && Date.now() > new Date(data.expiresAt).getTime()) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
  });

  const [protectionData, setProtectionData] = useState(() => {
    if (isDemoMode) return null;
    const data = loadJSON(STORAGE_KEY, null);
    if (data?.expiresAt && Date.now() > new Date(data.expiresAt).getTime()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  });

  // ═══════════════════════════════════════════════════
  // Contactos de emergencia (máximo 5)
  // ═══════════════════════════════════════════════════
  const [contacts, setContacts] = useState(() => isDemoMode ? [] : loadJSON(CONTACTS_KEY, []));

  // ═══════════════════════════════════════════════════
  // Notificaciones de protección (historial local)
  // ═══════════════════════════════════════════════════
  const [notifications, setNotifications] = useState(() => isDemoMode ? [] : loadJSON(NOTIFICATIONS_KEY, []));

  // ═══════════════════════════════════════════════════
  // Zona segura personal
  // ═══════════════════════════════════════════════════
  const [safeZone, setSafeZone] = useState(() => isDemoMode ? {
    address: '', lat: null, lng: null, radius: 200,
    nightAlertEnabled: false, nightStart: '22:00', nightEnd: '06:00',
  } : loadJSON(SAFEZONE_KEY, {
    address: '',
    lat: null,
    lng: null,
    radius: 200,
    nightAlertEnabled: false,
    nightStart: '22:00',
    nightEnd: '06:00',
  }));

  // GUARD: En demo, no sincronizar con localStorage
  useEffect(() => { if (!isDemoMode) saveJSON(CONTACTS_KEY, contacts); }, [contacts, isDemoMode]);
  useEffect(() => { if (!isDemoMode) saveJSON(NOTIFICATIONS_KEY, notifications); }, [notifications, isDemoMode]);
  useEffect(() => { if (!isDemoMode) saveJSON(SAFEZONE_KEY, safeZone); }, [safeZone, isDemoMode]);

  // GUARD: En demo, no verificar expiración
  useEffect(() => {
    if (isDemoMode) return;
    if (!isProtected || !protectionData?.expiresAt) return;
    const interval = setInterval(() => {
      if (Date.now() > new Date(protectionData.expiresAt).getTime()) {
        setIsProtected(false);
        setProtectionData(null);
        localStorage.removeItem(STORAGE_KEY);
        addNotification('escort_deactivated', 'Escolta expirada automáticamente');
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isProtected, protectionData, isDemoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════
  // Gestión de notificaciones
  // ═══════════════════════════════════════════════════
  const addNotification = useCallback((type, message) => {
    const notification = {
      id: Date.now().toString(),
      type, // 'escort_activated', 'escort_deactivated', 'panic', 'zone_exit'
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [notification, ...prev].slice(0, 50));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ═══════════════════════════════════════════════════
  // Activar protección (escolta)
  // ═══════════════════════════════════════════════════
  const activateProtection = useCallback(async (deviceId, deviceName, userName, duration) => {
    if (isDemoMode) return null;
    const response = await createShare({ deviceId, deviceName, duration, userName });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error ${response.status}`);
    }

    const data = await response.json();

    const protData = {
      token: data.token,
      url: data.url,
      activatedAt: new Date().toISOString(),
      expiresAt: data.expiresAt,
      deviceId,
      deviceName,
      duration,
    };

    setIsProtected(true);
    setProtectionData(protData);
    saveJSON(STORAGE_KEY, protData);

    addNotification('escort_activated', `Escolta activada para ${deviceName}`);

    return data;
  }, [addNotification, isDemoMode]);

  // ═══════════════════════════════════════════════════
  // Desactivar protección
  // ═══════════════════════════════════════════════════
  const deactivateProtection = useCallback(async () => {
    if (isDemoMode) return;
    if (protectionData?.token) {
      try {
        await cancelShare(protectionData.token);
      } catch (e) { /* ignore */ }
    }

    setIsProtected(false);
    setProtectionData(null);
    localStorage.removeItem(STORAGE_KEY);

    addNotification('escort_deactivated', 'Escolta desactivada');
  }, [protectionData, addNotification, isDemoMode]);

  // ═══════════════════════════════════════════════════
  // Alerta de pánico
  // ═══════════════════════════════════════════════════
  const triggerPanic = useCallback(async (deviceId, deviceName, userName) => {
    if (isDemoMode) return null;
    // Vibración de emergencia
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);

    const response = await createShare({ deviceId, deviceName, duration: 1, userName });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error ${response.status}`);
    }

    const data = await response.json();

    addNotification('panic', `🚨 Alerta de pánico enviada — ${deviceName}`);

    // Auto-activar escolta si no estaba activa
    if (!isProtected) {
      const protData = {
        token: data.token,
        url: data.url,
        activatedAt: new Date().toISOString(),
        expiresAt: data.expiresAt,
        deviceId,
        deviceName,
        duration: 1,
      };
      setIsProtected(true);
      setProtectionData(protData);
      saveJSON(STORAGE_KEY, protData);
    }

    return data;
  }, [addNotification, isProtected, isDemoMode]);

  // ═══════════════════════════════════════════════════
  // Gestión de contactos de emergencia
  // ═══════════════════════════════════════════════════
  const addContact = useCallback((name, phone) => {
    if (contacts.length >= 5) return false;
    const newContact = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.replace(/\s/g, ''),
      addedAt: new Date().toISOString(),
    };
    setContacts(prev => [...prev, newContact]);
    return true;
  }, [contacts]);

  const removeContact = useCallback((id) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  const editContact = useCallback((id, name, phone) => {
    setContacts(prev => prev.map(c =>
      c.id === id ? { ...c, name: name.trim(), phone: phone.replace(/\s/g, '') } : c
    ));
  }, []);

  // ═══════════════════════════════════════════════════
  // Gestión de zona segura
  // ═══════════════════════════════════════════════════
  const updateSafeZone = useCallback((updates) => {
    setSafeZone(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    // Estado
    isProtected,
    protectionData,
    contacts,
    notifications,
    unreadCount,
    safeZone,
    // Acciones de protección
    activateProtection,
    deactivateProtection,
    triggerPanic,
    // Contactos
    addContact,
    removeContact,
    editContact,
    // Zona segura
    updateSafeZone,
    // Notificaciones
    addNotification,
    markAsRead,
    markAllAsRead,
  };
}
