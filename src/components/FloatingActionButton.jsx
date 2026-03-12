// src/components/FloatingActionButton.jsx
// "Trackeo Smart Dial" — FAB premium con framer-motion, lucide-react y tooltips.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  X,
  Zap,
  ZapOff,
  MapPin,
  ParkingCircle,
} from 'lucide-react';

/* ────────────────────────────────────────────
   Tooltip elegante (aparece a la izquierda)
   ──────────────────────────────────────────── */
const Tooltip = ({ label, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, x: 8, scale: 0.85 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 8, scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none"
      >
        <div className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap
                        bg-slate-900/90 text-white backdrop-blur-sm
                        shadow-lg shadow-black/20 border border-white/10">
          {label}
          {/* Flecha */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-1.5
                          w-3 h-3 rotate-45 bg-slate-900/90 border-r border-t border-white/10" />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ────────────────────────────────────────────
   Botón hijo individual
   ──────────────────────────────────────────── */
const ChildButton = ({ icon: Icon, label, bg, onClick, index, isOpen }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const longPressTimer = useRef(null);

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => setShowTooltip(true), 400);
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
    setShowTooltip(false);
  };

  return (
    <motion.div
      className="relative flex items-center justify-end"
      variants={{
        closed: {
          opacity: 0,
          y: 20,
          scale: 0.3,
          filter: 'blur(4px)',
        },
        open: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
        },
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 22,
        delay: index * 0.06,
      }}
    >
      <Tooltip label={label} visible={showTooltip} />
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center
                    text-white shadow-lg shadow-black/25 transition-colors
                    ring-1 ring-white/10 ${bg}`}
        aria-label={label}
      >
        <Icon size={20} strokeWidth={2.2} />
      </motion.button>
    </motion.div>
  );
};

/* ────────────────────────────────────────────
   Componente principal: Trackeo Smart Dial
   ──────────────────────────────────────────── */
const FloatingActionButton = ({
  isProtected,
  onProtect,
  onCenterVehicle,
  onEngineControl,
  onParkingMode,
  engineStopped,
  isParkingActive,
  isDark,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef(null);

  // Cerrar al hacer clic/touch fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fabRef.current && !fabRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  const handleAction = useCallback(
    (action) => () => {
      action();
      setIsOpen(false);
    },
    []
  );

  // Color y estilo del FAB según estado
  const getFabRingColor = () => {
    if (engineStopped) return 'shadow-red-500/40';
    if (isParkingActive) return 'shadow-teal-500/40';
    if (isProtected) return 'shadow-emerald-500/40';
    return 'shadow-orange-500/40';
  };

  const getFabBg = () => {
    if (engineStopped) return 'bg-red-500 hover:bg-red-600';
    if (isParkingActive) return 'bg-teal-500 hover:bg-teal-600';
    if (isProtected) return 'bg-emerald-500 hover:bg-emerald-600';
    return 'bg-orange-500 hover:bg-orange-600';
  };

  // Definición de acciones hijas
  const actions = [
    {
      icon: engineStopped ? ZapOff : Zap,
      label: engineStopped ? 'Activar Motor' : 'Parar Motor',
      bg: engineStopped
        ? 'bg-emerald-600 hover:bg-emerald-700'
        : 'bg-red-600 hover:bg-red-700',
      onClick: handleAction(onEngineControl),
    },
    {
      icon: isProtected ? ShieldCheck : Shield,
      label: isProtected ? 'Desactivar Protección' : 'Protección',
      bg: isProtected
        ? 'bg-emerald-500 hover:bg-emerald-600'
        : 'bg-orange-500 hover:bg-orange-600',
      onClick: handleAction(onProtect),
    },
    {
      icon: MapPin,
      label: 'Centrar Vehículo',
      bg: 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600',
      onClick: handleAction(onCenterVehicle),
    },
    {
      icon: ParkingCircle,
      label: isParkingActive ? 'Desactivar Parking' : 'Modo Parking',
      bg: isParkingActive
        ? 'bg-teal-500 hover:bg-teal-600'
        : 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600',
      onClick: handleAction(onParkingMode),
    },
  ];

  return (
    <>
      {/* ═══ Overlay con desenfoque ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ═══ Contenedor del Smart Dial ═══ */}
      <div
        ref={fabRef}
        className="fixed bottom-5 right-5 md:bottom-7 md:right-7 z-40 flex flex-col items-center gap-3"
      >
        {/* ── Botones hijos ── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="flex flex-col items-center gap-3"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
                closed: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
              }}
            >
              {[...actions].reverse().map((action, i) => (
                <ChildButton
                  key={action.label}
                  icon={action.icon}
                  label={action.label}
                  bg={action.bg}
                  onClick={action.onClick}
                  index={i}
                  isOpen={isOpen}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FAB Principal ── */}
        <div className="relative">
          {/* Anillo de pulso (solo cuando cerrado) */}
          {!isOpen && (
            <div
              className={`absolute inset-0 rounded-full animate-fab-pulse-ring ${
                engineStopped
                  ? 'bg-red-500/30'
                  : isParkingActive
                  ? 'bg-teal-500/30'
                  : isProtected
                  ? 'bg-emerald-500/30'
                  : 'bg-orange-500/30'
              }`}
            />
          )}

          <motion.button
            onClick={toggle}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center
                        text-white shadow-xl ${getFabRingColor()} transition-colors duration-300
                        ring-2 ring-white/15 ${isOpen ? 'bg-slate-800 hover:bg-slate-700' : getFabBg()}`}
            aria-label="Menú de acciones"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <X size={26} strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="shield"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  {engineStopped ? (
                    <Zap size={26} strokeWidth={2.2} />
                  ) : isParkingActive ? (
                    <ParkingCircle size={26} strokeWidth={2.2} />
                  ) : (
                    <Shield size={26} strokeWidth={2.2} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </>
  );
};

export default FloatingActionButton;
