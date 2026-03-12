// src/components/ProtectionSettingsPanel.jsx
// Panel de configuración de "Protege mi Camino" — se muestra en el sidebar.
// Contiene: estado actual, contactos, zona segura, botón de pánico, historial.
//
// TODO: Migrar contactos a backend (actualmente localStorage).
// TODO: Integrar zona segura con Evolution API para alertas automáticas WhatsApp.

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Shield, ShieldOff, Copy, Check, Clock, Users, Plus,
  Pencil, Trash2, MapPin, AlertTriangle, Loader2, X,
} from 'lucide-react';

// ─── Ícono WhatsApp (SVG inline) ───
const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ─── Formatear teléfono para mostrar ───
function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('56')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

// ─── Formatear tiempo relativo ───
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

// ─── Formatear fecha corta ───
function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

// ─── Formatear tiempo restante ───
function formatTimeRemaining(expiresAt) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expirado';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes} min`;
}

// ─── Ícono por tipo de notificación ───
const NOTIF_ICONS = {
  escort_activated: { emoji: '🛡️', label: 'Escolta activada' },
  escort_deactivated: { emoji: '⬜', label: 'Escolta desactivada' },
  panic: { emoji: '🚨', label: 'Pánico enviado' },
  zone_exit: { emoji: '📍', label: 'Salida de zona' },
};

// ═══════════════════════════════════════════════════════════
// CONSTANTE PARA PÁNICO
// ═══════════════════════════════════════════════════════════
const PANIC_HOLD_DURATION = 3000;

const ProtectionSettingsPanel = ({
  isProtected,
  protectionData,
  contacts,
  notifications,
  safeZone,
  activeVehicle,
  userName,
  isDark,
  onActivate,
  onDeactivate,
  onPanic,
  onAddContact,
  onRemoveContact,
  onEditContact,
  onUpdateSafeZone,
  onMarkAsRead,
}) => {
  // ─── Estados locales ───
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [panicProgress, setPanicProgress] = useState(0);
  const [isPanicActive, setIsPanicActive] = useState(false);
  const [panicResult, setPanicResult] = useState(null);
  const [panicLoading, setPanicLoading] = useState(false);
  const panicTimerRef = useRef(null);
  const panicStartRef = useRef(null);
  const panicRafRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (panicTimerRef.current) clearTimeout(panicTimerRef.current);
      if (panicRafRef.current) cancelAnimationFrame(panicRafRef.current);
    };
  }, []);

  // ═══════════════════════════════════════════════════
  // CONTACTOS
  // ═══════════════════════════════════════════════════
  const handleSaveContact = () => {
    const cleanPhone = contactPhone.replace(/\s/g, '').replace(/^\+/, '');
    if (!contactName.trim() || cleanPhone.length < 9) return;

    // Agregar código de país si falta
    const phone = cleanPhone.startsWith('56') ? cleanPhone : `56${cleanPhone}`;

    if (editingContact) {
      onEditContact(editingContact, contactName.trim(), phone);
      setEditingContact(null);
    } else {
      const result = onAddContact(contactName.trim(), phone);
      if (!result) return; // máximo alcanzado
    }
    setContactName('');
    setContactPhone('');
    setShowAddContact(false);
  };

  const handleStartEdit = (contact) => {
    setEditingContact(contact.id);
    setContactName(contact.name);
    setContactPhone(formatPhone(contact.phone));
    setShowAddContact(true);
  };

  const handleCancelContact = () => {
    setShowAddContact(false);
    setEditingContact(null);
    setContactName('');
    setContactPhone('');
  };

  const handleDeleteContact = (id) => {
    onRemoveContact(id);
    setDeleteConfirm(null);
  };

  // ═══════════════════════════════════════════════════
  // COPIAR LINK
  // ═══════════════════════════════════════════════════
  const handleCopyLink = async () => {
    if (!protectionData?.url) return;
    try {
      await navigator.clipboard.writeText(protectionData.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch { /* ignore */ }
  };

  // ═══════════════════════════════════════════════════
  // ENVIAR A CONTACTO POR WHATSAPP
  // ═══════════════════════════════════════════════════
  const handleSendToContact = (contact, url) => {
    const message = encodeURIComponent(
      `📍 Estoy compartiendo mi ubicación en vivo contigo.\n\n` +
      `Sigue mi recorrido aquí:\n${url}\n\n` +
      `— ${userName} vía Trackeo`
    );
    window.open(`https://wa.me/${contact.phone}?text=${message}`, '_blank');
  };

  // ═══════════════════════════════════════════════════
  // BOTÓN DE PÁNICO (mantener 3 seg)
  // ═══════════════════════════════════════════════════
  const updatePanicProgress = useCallback(() => {
    if (!panicStartRef.current) return;
    const elapsed = Date.now() - panicStartRef.current;
    const progress = Math.min(elapsed / PANIC_HOLD_DURATION, 1);
    setPanicProgress(progress);

    if (progress < 1) {
      panicRafRef.current = requestAnimationFrame(updatePanicProgress);
    }
  }, []);

  const handlePressStart = useCallback(() => {
    if (contacts.length === 0 || panicLoading) return;
    panicStartRef.current = Date.now();
    setPanicProgress(0);
    setIsPanicActive(true);

    panicRafRef.current = requestAnimationFrame(updatePanicProgress);

    panicTimerRef.current = setTimeout(async () => {
      setIsPanicActive(false);
      setPanicProgress(1);
      setPanicLoading(true);

      try {
        const data = await onPanic(
          activeVehicle?.id,
          activeVehicle?.name || 'Vehículo',
          userName
        );

        setPanicResult(data);

        // Abrir WhatsApp con el primer contacto
        if (contacts.length > 0 && data?.url) {
          const message = encodeURIComponent(
            `🚨 ALERTA DE EMERGENCIA 🚨\n\n` +
            `${userName} ha activado su alerta de pánico.\n\n` +
            `📍 Ubicación en tiempo real:\n${data.url}\n\n` +
            `⚠️ Por favor contactar inmediatamente.\n` +
            `Hora: ${new Date().toLocaleTimeString('es-CL')}\n` +
            `— Trackeo Sistema de Seguridad`
          );
          window.open(`https://wa.me/${contacts[0].phone}?text=${message}`, '_blank');
        }
      } catch (err) {
        console.error('[Panic] Error:', err);
      } finally {
        setPanicLoading(false);
      }
    }, PANIC_HOLD_DURATION);
  }, [contacts, panicLoading, activeVehicle, userName, onPanic, updatePanicProgress]);

  const handlePressEnd = useCallback(() => {
    if (panicTimerRef.current) {
      clearTimeout(panicTimerRef.current);
      panicTimerRef.current = null;
    }
    if (panicRafRef.current) {
      cancelAnimationFrame(panicRafRef.current);
      panicRafRef.current = null;
    }
    panicStartRef.current = null;
    setIsPanicActive(false);
    setPanicProgress(0);
  }, []);

  // ═══════════════════════════════════════════════════
  // ZONA SEGURA
  // ═══════════════════════════════════════════════════
  const handleUseVehicleLocation = () => {
    if (activeVehicle?.latitude && activeVehicle?.longitude) {
      onUpdateSafeZone({
        lat: activeVehicle.latitude,
        lng: activeVehicle.longitude,
        address: `Ubicación actual de ${activeVehicle.name}`,
      });
    }
  };

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Protege mi Camino</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Configura tu sistema de seguridad personal
            </p>
          </div>
        </div>
      </div>

      {/* ═══ ESTADO ACTUAL ═══ */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-5">
        <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
          Estado actual
        </h3>

        {isProtected && protectionData ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Escolta activa — {protectionData.deviceName}
              </span>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
              <p>Desde: {new Date(protectionData.activatedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · Expira en: {formatTimeRemaining(protectionData.expiresAt)}</p>
            </div>
            {/* Link */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.04]">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate flex-1">
                {protectionData.url}
              </p>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/[0.1] transition-colors flex-shrink-0"
              >
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </button>
            </div>
            {/* Acciones */}
            <div className="flex gap-2">
              {contacts.length > 0 && (
                <button
                  onClick={() => handleSendToContact(contacts[0], protectionData.url)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1da851] transition-colors"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  Enviar a contacto
                </button>
              )}
              <button
                onClick={onDeactivate}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                <ShieldOff className="w-3.5 h-3.5" />
                Desactivar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03]">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Sin protección activa
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Usa el botón "Protege mi camino" abajo para activar tu escolta.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ CONTACTOS DE EMERGENCIA ═══ */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Contactos de emergencia ({contacts.length}/5)
          </h3>
        </div>

        {/* Lista de contactos */}
        {contacts.length > 0 && (
          <div className="space-y-2 mb-3">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.04]"
              >
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">👤</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{formatPhone(c.phone)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleStartEdit(c)}
                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/[0.1] transition-colors text-neutral-400 hover:text-amber-500"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {deleteConfirm === c.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-neutral-500 bg-neutral-200 dark:bg-white/[0.1] hover:bg-neutral-300 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(c.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-neutral-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulario agregar/editar contacto */}
        {showAddContact ? (
          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value.slice(0, 30))}
                placeholder="Ej: Mamá"
                className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/[0.1] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                maxLength={30}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => {
                  // Solo permitir números, espacios y +
                  const val = e.target.value.replace(/[^\d\s+]/g, '');
                  setContactPhone(val);
                }}
                placeholder="+56 9 1234 5678"
                className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/[0.1] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancelContact}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-white/[0.06] hover:bg-neutral-200 dark:hover:bg-white/[0.1] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveContact}
                disabled={!contactName.trim() || contactPhone.replace(/\D/g, '').length < 9}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingContact ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : contacts.length < 5 ? (
          <button
            onClick={() => setShowAddContact(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar contacto de emergencia
          </button>
        ) : null}
      </div>

      {/* ═══ ZONA SEGURA PERSONAL ═══ */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-5">
        <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          Zona segura personal
        </h3>

        <div className="space-y-4">
          {/* Dirección */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Dirección de referencia
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={safeZone.address}
                onChange={(e) => onUpdateSafeZone({ address: e.target.value })}
                placeholder="Ej: Pasaje 32, San Pedro de la Paz"
                className="flex-1 px-3 py-2 rounded-lg text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/[0.1] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                onClick={handleUseVehicleLocation}
                disabled={!activeVehicle?.latitude}
                className="px-3 py-2 rounded-lg text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                title="Usar ubicación actual del vehículo"
              >
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Usar GPS
              </button>
            </div>
            {safeZone.lat && (
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                📍 {Number(safeZone.lat).toFixed(4)}, {Number(safeZone.lng).toFixed(4)}
              </p>
            )}
          </div>

          {/* Radio */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Radio: {safeZone.radius}m
            </label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={safeZone.radius}
              onChange={(e) => onUpdateSafeZone({ radius: Number(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none bg-neutral-200 dark:bg-white/[0.1] accent-amber-500"
            />
            <div className="flex justify-between text-[9px] text-neutral-400 dark:text-neutral-500 mt-1">
              <span>100m</span>
              <span>1000m</span>
            </div>
          </div>

          {/* Descripción */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.04]">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Cuando tu vehículo salga de esta zona fuera de horario, tus contactos recibirán una alerta automática.
            </p>
          </div>

          {/* Horario nocturno */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">Horario:</span>
            <input
              type="time"
              value={safeZone.nightStart}
              onChange={(e) => onUpdateSafeZone({ nightStart: e.target.value })}
              className="px-2 py-1 rounded-lg text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/[0.1] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <span className="text-xs text-neutral-400">a</span>
            <input
              type="time"
              value={safeZone.nightEnd}
              onChange={(e) => onUpdateSafeZone({ nightEnd: e.target.value })}
              className="px-2 py-1 rounded-lg text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/[0.1] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Toggle alerta nocturna */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.04]">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Activar alerta nocturna
              </label>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                Próximamente
              </span>
            </div>
            <button
              onClick={() => onUpdateSafeZone({ nightAlertEnabled: !safeZone.nightAlertEnabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                safeZone.nightAlertEnabled
                  ? 'bg-amber-500'
                  : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  safeZone.nightAlertEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ ALERTA DE PÁNICO ═══ */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-5">
        <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Alerta de pánico
        </h3>

        <div className="flex flex-col items-center">
          {/* Botón de pánico circular */}
          <div className="relative mb-4">
            {/* Anillo de progreso SVG */}
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              {/* Fondo del anillo */}
              <circle
                cx="60" cy="60" r="52"
                stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                strokeWidth="8"
                fill="none"
              />
              {/* Progreso */}
              {panicProgress > 0 && (
                <circle
                  cx="60" cy="60" r="52"
                  stroke="#ef4444"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - panicProgress)}`}
                  strokeLinecap="round"
                  className="transition-none"
                />
              )}
            </svg>
            {/* Botón interior */}
            <button
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              disabled={contacts.length === 0 || panicLoading}
              className={`absolute inset-0 m-auto w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all select-none ${
                contacts.length === 0
                  ? 'bg-neutral-200 dark:bg-neutral-700 cursor-not-allowed'
                  : isPanicActive
                    ? 'bg-red-700 scale-95 shadow-inner'
                    : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 active:scale-95'
              }`}
              title={contacts.length === 0 ? 'Agrega contactos de emergencia primero' : 'Mantener 3 segundos'}
            >
              {panicLoading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <>
                  <span className="text-lg">🚨</span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wide mt-0.5">Pánico</span>
                  <span className="text-[8px] text-white/70 mt-0.5">Mantener 3s</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center max-w-xs leading-relaxed">
            Envía ubicación exacta + alerta a <strong>todos</strong> tus contactos de emergencia por WhatsApp.
          </p>

          {contacts.length === 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
              Agrega contactos de emergencia primero
            </p>
          )}

          {/* Resultado del pánico */}
          {panicResult && (
            <div className="mt-4 w-full p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200/50 dark:border-red-500/10 space-y-2">
              <p className="text-xs font-bold text-red-600 dark:text-red-400">
                🚨 Alerta enviada
              </p>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-white/[0.04]">
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono truncate flex-1">
                  {panicResult.url}
                </p>
              </div>
              {contacts.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {contacts.slice(1).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        const message = encodeURIComponent(
                          `🚨 ALERTA DE EMERGENCIA 🚨\n\n` +
                          `${userName} ha activado su alerta de pánico.\n\n` +
                          `📍 Ubicación en tiempo real:\n${panicResult.url}\n\n` +
                          `⚠️ Por favor contactar inmediatamente.\n` +
                          `Hora: ${new Date().toLocaleTimeString('es-CL')}\n` +
                          `— Trackeo Sistema de Seguridad`
                        );
                        window.open(`https://wa.me/${c.phone}?text=${message}`, '_blank');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-white bg-[#25D366] hover:bg-[#1da851] transition-colors"
                    >
                      <WhatsAppIcon className="w-3 h-3" />
                      Enviar a {c.name}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setPanicResult(null)}
                className="text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-3 h-3 inline mr-0.5" />
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ HISTORIAL DE ALERTAS ═══ */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-5">
        <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Historial de alertas
        </h3>

        {notifications.length === 0 ? (
          <div className="py-6 text-center">
            <Shield className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              Aún no has usado la escolta virtual.
            </p>
            <p className="text-[11px] text-neutral-300 dark:text-neutral-600 mt-1">
              Actívala desde el botón inferior para empezar.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.slice(0, 20).map((n) => {
              const iconInfo = NOTIF_ICONS[n.type] || { emoji: '📋', label: 'Evento' };
              const isUnread = !n.read;

              return (
                <div
                  key={n.id}
                  onClick={() => isUnread && onMarkAsRead?.(n.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${
                    isUnread
                      ? 'bg-amber-50/50 dark:bg-amber-500/[0.03] hover:bg-amber-50 dark:hover:bg-amber-500/[0.06]'
                      : 'hover:bg-neutral-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="text-sm flex-shrink-0">{iconInfo.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug truncate ${
                      isUnread
                        ? 'font-bold text-neutral-900 dark:text-white'
                        : 'font-medium text-neutral-600 dark:text-neutral-400'
                    }`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {formatShortDate(n.timestamp)}
                    </p>
                  </div>
                  {isUnread && (
                    <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Info de seguridad ─── */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 p-4">
        <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
          <strong>Privacidad:</strong> Tus contactos de emergencia se guardan solo en tu dispositivo.
          Los links de ubicación son temporales y expiran automáticamente.
          Nunca se comparten datos técnicos del GPS.
        </p>
      </div>
    </div>
  );
};

export default ProtectionSettingsPanel;
