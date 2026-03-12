// src/components/ParkingAlertModal.jsx
// Modal de alerta de intrusión a pantalla completa.
// Secuencia multi-sensorial: visual (shake + red pulse), audio, háptico.
// Acciones: Ver en mapa, Llamar emergencia, Inmovilizar vehículo, Silenciar.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  AlertTriangle, MapPin, Phone, PowerOff, VolumeX, Volume2,
  ShieldAlert, Navigation, Loader2, X,
} from 'lucide-react';

const ParkingAlertModal = ({
  isOpen,
  intrusionEvent,
  parkingData,
  vehicleName,
  onDismiss,
  onEngineStop,
  onViewOnMap,
  isLoadingEngine,
  engineStopped,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showConfirmEngine, setShowConfirmEngine] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const audioRef = useRef(null);
  const countdownRef = useRef(null);

  // ─── Prefiere reducir movimiento ───
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // ─── Audio de alerta ───
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    // Intentar reproducir sonido de alerta
    try {
      const audio = new Audio('/alert-siren.mp3');
      audio.loop = true;
      audio.volume = 0.8;
      audio.play().catch(() => {
        // Autoplay bloqueado por el navegador — no es crítico
        console.warn('[ParkingAlert] Autoplay de audio bloqueado por el navegador');
      });
      audioRef.current = audio;
    } catch {
      // Audio no disponible
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isOpen]);

  // ─── Mute/unmute ───
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // ─── Vibración repetida ───
  useEffect(() => {
    if (!isOpen || prefersReducedMotion) return;
    if (!navigator.vibrate) return;

    let count = 0;
    const maxRepeats = 3;

    const vibratePattern = () => {
      if (count >= maxRepeats) return;
      navigator.vibrate([200, 100, 200, 100, 400]);
      count++;
    };

    vibratePattern();
    const interval = setInterval(vibratePattern, 1500);
    return () => {
      clearInterval(interval);
      navigator.vibrate(0); // Detener vibración
    };
  }, [isOpen, prefersReducedMotion]);

  // ─── Countdown para corte de motor ───
  useEffect(() => {
    if (!showConfirmEngine) {
      setCountdown(3);
      return;
    }

    if (countdown <= 0) {
      onEngineStop();
      setShowConfirmEngine(false);
      return;
    }

    countdownRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(countdownRef.current);
  }, [showConfirmEngine, countdown, onEngineStop]);

  const handleCancelEngine = useCallback(() => {
    setShowConfirmEngine(false);
    setCountdown(3);
  }, []);

  // ─── Focus trap ───
  useEffect(() => {
    if (!isOpen) return;
    const handleTab = (e) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  const googleMapsUrl = intrusionEvent?.currentLat && intrusionEvent?.currentLng
    ? `https://www.google.com/maps/search/?api=1&query=${intrusionEvent.currentLat},${intrusionEvent.currentLng}`
    : '#';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="intrusion-alert-title"
      aria-describedby="intrusion-alert-desc"
    >
      {/* Backdrop rojo pulsante */}
      <div className={`absolute inset-0 ${prefersReducedMotion ? 'bg-red-600/95' : 'animate-pulse-red'}`} />

      {/* Modal */}
      <div
        className={`relative max-w-sm w-full mx-4 ${prefersReducedMotion ? '' : 'animate-shake'}`}
      >
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-2xl border border-red-300 dark:border-red-500/30">
          {/* Botón cerrar (silenciar alerta) */}
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            aria-label="Cerrar alerta"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Ícono principal */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className={`w-20 h-20 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center ${prefersReducedMotion ? '' : 'animate-bounce'}`}>
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              {/* Ondas de alarma */}
              {!prefersReducedMotion && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-red-400/50 animate-radar-ping" />
                  <div className="absolute inset-0 rounded-full border-2 border-red-400/30 animate-radar-ping-delay-1" />
                </>
              )}
            </div>
          </div>

          {/* Título */}
          <h2
            id="intrusion-alert-title"
            className="text-xl font-bold text-red-600 dark:text-red-400 text-center mb-2"
          >
            🚨 ALERTA
          </h2>

          <p
            id="intrusion-alert-desc"
            className="text-sm text-neutral-600 dark:text-neutral-300 text-center mb-1"
          >
            ¡{vehicleName || 'El vehículo'} salió del perímetro seguro!
          </p>

          {intrusionEvent?.distance && (
            <p className="text-xs text-red-500 text-center mb-4 font-medium">
              {intrusionEvent.distance}m fuera de la zona
            </p>
          )}

          {/* Ubicación actual */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] mb-4">
            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-neutral-400 font-semibold uppercase">Ubicación actual</p>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                {intrusionEvent?.currentLat?.toFixed(5)}, {intrusionEvent?.currentLng?.toFixed(5)}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-2.5">
            {/* Ver en mapa */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onViewOnMap}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md"
            >
              <Navigation className="w-4 h-4" />
              Ver en Mapa
            </a>

            {/* Inmovilizar vehículo */}
            {!showConfirmEngine ? (
              <button
                onClick={() => setShowConfirmEngine(true)}
                disabled={engineStopped || isLoadingEngine}
                className={`
                  w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all shadow-md
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${engineStopped
                    ? 'bg-neutral-500'
                    : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                  }
                `}
              >
                {isLoadingEngine ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : engineStopped ? (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    Motor Inmovilizado
                  </>
                ) : (
                  <>
                    <PowerOff className="w-4 h-4" />
                    Inmovilizar Vehículo
                  </>
                )}
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <p className="text-xs text-red-700 dark:text-red-300 text-center mb-2 font-medium">
                  ¿Confirmas inmovilizar el vehículo? Esta acción apagará el motor.
                </p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg">
                    {countdown}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEngine}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      onEngineStop();
                      setShowConfirmEngine(false);
                    }}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Confirmar Ahora
                  </button>
                </div>
              </div>
            )}

            {/* Llamar emergencia */}
            <a
              href="tel:133"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Llamar Emergencia (133)
            </a>
          </div>

          {/* Mute */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar alarma'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Sonido silenciado
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Silenciar alarma
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingAlertModal;
