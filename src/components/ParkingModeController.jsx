// src/components/ParkingModeController.jsx
// Panel flotante bottom-sheet para controlar el Modo Estacionamiento Inteligente.
// Glassmorphism, toggle animado, geocodificación inversa, stepper de activación.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ParkingCircle, MapPin, Shield, ShieldCheck, ShieldAlert,
  Loader2, PowerOff, CheckCircle2, AlertTriangle, X, Clock,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { reverseGeocode, getShortAddress } from '../api/geocodeApi';

// ─── Formatear tiempo relativo ───
function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

// ─── Toggle Switch animado ───
const ParkingToggle = ({ checked, onChange, disabled, isActivating }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={checked ? 'Desactivar modo estacionamiento' : 'Activar modo estacionamiento'}
    disabled={disabled}
    onClick={onChange}
    className={`
      relative w-14 h-7 rounded-full transition-all duration-300 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-110
      ${checked
        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30'
        : 'bg-neutral-300 dark:bg-neutral-600'
      }
    `}
  >
    <span
      className={`
        absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md
        transition-all duration-300 ease-out flex items-center justify-center
        ${checked ? 'translate-x-7' : 'translate-x-0'}
      `}
    >
      {isActivating ? (
        <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
      ) : checked ? (
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Shield className="w-3.5 h-3.5 text-neutral-400" />
      )}
    </span>
  </button>
);

// ─── Stepper de activación ───
const ActivationStepper = ({ step }) => {
  const steps = [
    { label: 'Ubicando', icon: MapPin },
    { label: 'Creando zona', icon: Shield },
    { label: 'Activado', icon: CheckCircle2 },
  ];

  return (
    <div className="flex items-center justify-center gap-2 py-3" role="progressbar" aria-valuenow={step} aria-valuemin={0} aria-valuemax={2}>
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isActive = i === step;
        const isDone = i < step;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className={`w-8 h-0.5 rounded-full transition-colors duration-500 ${isDone ? 'bg-emerald-500' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                ${isDone ? 'bg-emerald-500 text-white scale-100' : ''}
                ${isActive ? 'bg-emerald-500/20 text-emerald-500 scale-110 animate-pulse' : ''}
                ${!isDone && !isActive ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400' : ''}
              `}>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`}>
                {s.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ═══ Componente Principal ═══
const ParkingModeController = ({
  // Estado del hook
  status,
  isActive,
  isActivating,
  isAlert,
  parkingData,
  errorMessage,
  // Acciones
  onToggle,
  onClearError,
  onEngineStop,
  // Contexto
  activeVehicle,
  isDark,
  engineStopped,
  isLoadingEngine,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [address, setAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [activationStep, setActivationStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // ─── Geocodificación reversa de la ubicación de parking ───
  useEffect(() => {
    if (!parkingData?.latitude || !parkingData?.longitude) {
      setAddress(null);
      return;
    }

    let isMounted = true;
    setLoadingAddress(true);

    const fetchAddr = async () => {
      try {
        const data = await reverseGeocode(parkingData.latitude, parkingData.longitude);
        if (isMounted) setAddress(getShortAddress(data));
      } catch {
        if (isMounted) setAddress('Ubicación aproximada');
      } finally {
        if (isMounted) setLoadingAddress(false);
      }
    };

    fetchAddr();
    return () => { isMounted = false; };
  }, [parkingData?.latitude, parkingData?.longitude]);

  // ─── Simular stepper durante activación ───
  useEffect(() => {
    if (!isActivating) {
      setActivationStep(0);
      return;
    }

    setActivationStep(0);
    const t1 = setTimeout(() => setActivationStep(1), 150);
    const t2 = setTimeout(() => setActivationStep(2), 350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isActivating]);

  // ─── Mostrar checkmark de success post-activación ───
  useEffect(() => {
    if (status === 'active' && !showSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expandir cuando está activo
  useEffect(() => {
    if (isActive || isAlert) setExpanded(true);
  }, [isActive, isAlert]);

  // Manejar toggle con feedback
  const handleToggle = useCallback(() => {
    onToggle();
  }, [onToggle]);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  return (
    <>
      {/* ═══ Banner Superior (cuando está activo) ═══ */}
      {isActive && !isAlert && (
        <div
          className={`fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 shadow-lg ${
            prefersReducedMotion ? '' : 'animate-slide-down'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-center gap-3 max-w-lg mx-auto">
            <ShieldCheck className={`w-5 h-5 ${prefersReducedMotion ? '' : 'animate-pulse-soft'}`} />
            <div className="text-center">
              <p className="text-sm font-semibold">Vehículo en Perímetro Seguro</p>
              <p className="text-xs text-white/80 flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3" />
                Monitoreo activo • {parkingData?.radius || 50}m
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Banner de Alerta (cuando hay intrusión) ═══ */}
      {isAlert && (
        <div
          className={`fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-3 shadow-lg ${
            prefersReducedMotion ? '' : 'animate-pulse-red'
          }`}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-center gap-3 max-w-lg mx-auto">
            <ShieldAlert className={`w-5 h-5 ${prefersReducedMotion ? '' : 'animate-bounce'}`} />
            <div className="text-center">
              <p className="text-sm font-bold">⚠️ VEHÍCULO FUERA DEL PERÍMETRO</p>
              <p className="text-xs text-white/90">Movimiento detectado fuera de la zona segura</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Panel Flotante Bottom-Sheet ═══ */}
      <div
        className={`fixed bottom-0 inset-x-0 z-40 transition-all duration-300 ease-out ${
          prefersReducedMotion ? '' : 'animate-slide-up'
        }`}
      >
        <div className={`
          mx-auto max-w-lg
          bg-white/90 dark:bg-gray-900/90 backdrop-blur-md
          border-t-2 rounded-t-2xl shadow-2xl
          ${isActive ? 'border-t-emerald-500' : isAlert ? 'border-t-red-500' : 'border-t-neutral-200 dark:border-t-neutral-700'}
          transition-colors duration-500
        `}>
          {/* Drag handle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex flex-col items-center pt-3 pb-1 cursor-pointer focus:outline-none"
            aria-label={expanded ? 'Colapsar panel' : 'Expandir panel'}
          >
            <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600 mb-2" />
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-neutral-400" />
            )}
          </button>

          <div className="px-5 pb-5">
            {/* Header con toggle */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-xl transition-colors duration-300
                  ${isActive ? 'bg-emerald-100 dark:bg-emerald-500/15' : isAlert ? 'bg-red-100 dark:bg-red-500/15' : 'bg-neutral-100 dark:bg-neutral-800'}
                `}>
                  <ParkingCircle className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : isAlert ? 'text-red-600 dark:text-red-400' : 'text-neutral-500'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Modo Estacionamiento
                  </h3>
                  {isActive && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(parkingData?.activatedAt)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {showSuccess && (
                  <CheckCircle2 className={`w-5 h-5 text-emerald-500 ${prefersReducedMotion ? '' : 'animate-success-check'}`} />
                )}
                <ParkingToggle
                  checked={isActive || isAlert}
                  onChange={handleToggle}
                  disabled={isActivating || status === 'deactivating'}
                  isActivating={isActivating}
                />
              </div>
            </div>

            {/* Stepper de activación */}
            {isActivating && (
              <ActivationStepper step={activationStep} />
            )}

            {/* Error */}
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400 flex-1">{errorMessage}</p>
                <button onClick={onClearError} className="text-red-400 hover:text-red-600" aria-label="Cerrar error">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Contenido expandido */}
            {expanded && (isActive || isAlert) && (
              <div className={`space-y-3 transition-all duration-300 ${prefersReducedMotion ? '' : 'animate-slide-up'}`}>
                {/* Ubicación */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03]">
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mb-0.5">
                      Última ubicación segura
                    </p>
                    {loadingAddress ? (
                      <div className="flex items-center gap-2 text-neutral-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-xs">Buscando dirección...</span>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {address || 'Ubicación registrada'}
                      </p>
                    )}
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {formatTimeAgo(parkingData?.activatedAt)}
                    </p>
                  </div>
                </div>

                {/* Botón Corte Motor Preventivo */}
                <button
                  onClick={onEngineStop}
                  disabled={!isActive || isLoadingEngine || engineStopped}
                  aria-label="Corte motor preventivo"
                  className={`
                    w-full px-4 py-3.5 rounded-xl font-semibold text-sm text-white
                    flex items-center justify-center gap-3
                    shadow-lg hover:shadow-xl
                    transform active:scale-95
                    transition-all duration-200
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
                      Enviando comando...
                    </>
                  ) : engineStopped ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Motor Inmovilizado
                    </>
                  ) : (
                    <>
                      <PowerOff className="w-4 h-4" />
                      Corte Motor Preventivo
                    </>
                  )}
                </button>

                {/* Info del radio */}
                <p className="text-[10px] text-center text-neutral-400 dark:text-neutral-500">
                  Zona segura: radio de {parkingData?.radius || 50}m alrededor del vehículo
                </p>
              </div>
            )}

            {/* Estado inactivo - mensaje breve */}
            {!isActive && !isActivating && !isAlert && !errorMessage && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-1">
                Activa el modo para proteger tu vehículo estacionado
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ParkingModeController;
