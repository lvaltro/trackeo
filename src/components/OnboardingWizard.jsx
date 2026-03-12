// src/components/OnboardingWizard.jsx
// ═══════════════════════════════════════════════════
// ONBOARDING WIZARD — First-Time User Experience
// Flujo de 3 pasos: Piloto → Máquina → Protege tu Camino
// Full-screen overlay con framer-motion transitions
// ═══════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Phone, Sun, Moon, Car, Gauge, Calendar,
  UserPlus, Plus, Trash2, ArrowRight, ArrowLeft,
  Check, Shield, Crown, Truck, X, ChevronDown, Zap
} from 'lucide-react';
import { traccarService } from '../api/traccarApi';
import { createNotification } from '../api/notificationApi';

// ─── Constantes ───
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 280 : -280,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -280 : 280,
    opacity: 0,
  }),
};

// ═══════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// Props: user, isDark, onSetTheme, onComplete
// ═══════════════════════════════════════════════════

export default function OnboardingWizard({ user, isDark, onSetTheme, onComplete }) {
  // ─── Estado de navegación ───
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishPhase, setFinishPhase] = useState('loading');
  const [errors, setErrors] = useState({});

  // ─── Paso 1: El Piloto ───
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(isDark ? 'dark' : 'light');

  // ─── Paso 2: La Máquina ───
  const [vehicleAlias, setVehicleAlias] = useState('');
  const [odometer, setOdometer] = useState('');
  const [prtMonth, setPrtMonth] = useState('');

  // ─── Paso 3: Contactos de confianza ───
  const [contacts, setContacts] = useState([{ name: '', phone: '' }]);

  // ─── Datos del plan ───
  const plan = user?.attributes?.plan || 'basic';
  const isFlotas = plan === 'flotas';
  const maxContacts = plan === 'pro' ? 3 : plan === 'flotas' ? 5 : 1;

  // ═══ HANDLERS ═══

  /** Cambiar tema en tiempo real (inmediato y persistente) */
  const handleThemeSelect = useCallback((theme) => {
    setSelectedTheme(theme);
    onSetTheme(theme === 'dark');
  }, [onSetTheme]);

  /** Limpiar error de un campo al escribir */
  const clearError = (field) => setErrors(prev => {
    const next = { ...prev };
    delete next[field];
    return next;
  });

  // ═══ VALIDACIÓN ═══

  const validateStep1 = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'El correo es obligatorio';
    else if (!EMAIL_REGEX.test(email)) errs.email = 'Formato de correo inválido';
    if (!phone.trim() || phone.replace(/\s/g, '').length < 8)
      errs.phone = 'Ingresa un número de teléfono válido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!vehicleAlias.trim()) {
      errs.vehicleAlias = isFlotas
        ? 'El nombre de la flota es obligatorio'
        : 'El alias del vehículo es obligatorio';
    }
    if (!isFlotas && odometer && isNaN(Number(odometer))) {
      errs.odometer = 'Ingresa un número válido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ═══ NAVEGACIÓN ═══

  const goNext = () => {
    let valid = false;
    if (step === 1) valid = validateStep1();
    else if (step === 2) valid = validateStep2();
    else valid = true;

    if (!valid) return;

    if (step === 3) {
      handleFinish();
      return;
    }

    setDirection(1);
    setErrors({});
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setErrors({});
    setStep(s => s - 1);
  };

  // ═══ CONTACTOS ═══

  const addContact = () => {
    if (contacts.length < maxContacts) {
      setContacts(prev => [...prev, { name: '', phone: '' }]);
    }
  };

  const removeContact = (index) => {
    if (contacts.length > 1) {
      setContacts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateContact = (index, field, value) => {
    setContacts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ═══ FINALIZACIÓN ═══

  const handleFinish = async () => {
    setIsFinishing(true);
    setFinishPhase('loading');

    try {
      const validContacts = contacts.filter(c => c.name.trim() || c.phone.trim());

      const updatedAttributes = {
        ...(user.attributes || {}),
        onboardingCompleted: true,
        isFirstLogin: false,
        vehicleAlias,
        ...(isFlotas ? {} : {
          odometer: odometer ? parseInt(odometer, 10) : null,
          prtMonth: prtMonth || null,
        }),
        emergencyContacts: validContacts,
        theme: selectedTheme,
      };

      const updatedUser = {
        ...user,
        email,
        phone: `+56${phone.replace(/\s/g, '')}`,
        attributes: updatedAttributes,
      };

      // Guardar en Traccar
      await traccarService.updateUser(user.id, updatedUser);

      // Crear notificación de configuración completada
      try {
        await createNotification({
          tipo: 'sistema',
          mensaje: '✅ Configuración inicial completada — tu cuenta Trackeo está lista.',
        });
      } catch (notifErr) {
        console.warn('[Onboarding] No se pudo crear notificación:', notifErr);
      }

      // Espera visual del spinner (1.5s)
      await new Promise(r => setTimeout(r, 1500));
      setFinishPhase('done');
      await new Promise(r => setTimeout(r, 700));

      onComplete(updatedUser);
    } catch (err) {
      console.error('[Onboarding] Error al finalizar:', err);
      const fallbackUser = {
        ...user,
        email,
        phone: `+56${phone.replace(/\s/g, '')}`,
        attributes: { ...(user.attributes || {}), onboardingCompleted: true, isFirstLogin: false },
      };
      setFinishPhase('done');
      await new Promise(r => setTimeout(r, 500));
      onComplete(fallbackUser);
    }
  };

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="fixed inset-0 z-[9999] bg-neutral-50 dark:bg-neutral-950 transition-colors duration-500 flex flex-col">

        {/* ─── Gradientes ambientales ─── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[140px] transition-opacity duration-1000 ${isDark ? 'bg-amber-500/[0.07]' : 'bg-amber-400/[0.08]'}`} />
          <div className={`absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full blur-[140px] transition-opacity duration-1000 ${isDark ? 'bg-orange-600/[0.05]' : 'bg-orange-500/[0.06]'}`} />
        </div>

        {/* ─── Barra de progreso superior ─── */}
        {!isFinishing && (
          <div className="relative h-1 bg-neutral-200/80 dark:bg-neutral-800/50 shrink-0 z-10">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-r-full"
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        )}

        {/* ─── Contenido principal ─── */}
        {isFinishing ? (
          /* ═══ PANTALLA DE CARGA / ÉXITO ═══ */
          <div className="flex-1 flex items-center justify-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center gap-8"
            >
              {finishPhase === 'loading' ? (
                <>
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-radar-ping" />
                    <div className="absolute inset-3 rounded-full border-2 border-amber-500/20 animate-radar-ping-delay-1" />
                    <div className="absolute inset-6 rounded-full border-2 border-orange-500/10 animate-radar-ping-delay-2" />
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                      <Gauge className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-semibold text-neutral-800 dark:text-neutral-100">
                      Preparando tu Dashboard...
                    </p>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-500">
                      Guardando tu configuración
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                  >
                    <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  </motion.div>
                  <p className="text-xl sm:text-2xl font-semibold text-neutral-800 dark:text-neutral-100">
                    ¡Todo listo!
                  </p>
                </>
              )}
            </motion.div>
          </div>
        ) : (
          <>
            {/* ═══ INDICADOR DE PASO ═══ */}
            <div className="shrink-0 pt-5 pb-2 text-center relative z-10">
              <motion.p
                key={`step-${step}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-semibold tracking-widest uppercase text-neutral-400 dark:text-neutral-600"
              >
                Paso {step} de 3
              </motion.p>
            </div>

            {/* ═══ CONTENIDO DEL PASO (scrollable) ═══ */}
            <div className="flex-1 overflow-y-auto relative z-10 no-scrollbar">
              <div className="max-w-lg mx-auto px-5 sm:px-8 py-4 sm:py-6">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >

                    {/* ════════════════════════════════════ */}
                    {/* PASO 1: EL PILOTO                   */}
                    {/* ════════════════════════════════════ */}
                    {step === 1 && (
                      <div className="space-y-6">
                        {/* Header */}
                        <div>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/10 mb-4">
                            <Car className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Paso 1</span>
                          </div>
                          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                            El Piloto
                          </h1>
                          <p className="mt-1.5 text-neutral-500 dark:text-neutral-400 text-sm sm:text-base">
                            Configura tu perfil y personaliza tu experiencia
                          </p>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Correo Electrónico
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-400 dark:text-neutral-500" />
                            <input
                              type="email"
                              value={email}
                              onChange={e => { setEmail(e.target.value); clearError('email'); }}
                              placeholder="tu@correo.com"
                              className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm transition-all duration-200
                                ${errors.email
                                  ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/30'
                                  : 'border-neutral-200 dark:border-neutral-800 focus:ring-amber-500/30 focus:border-amber-500'
                                }
                                bg-white dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100
                                placeholder:text-neutral-400 dark:placeholder:text-neutral-600
                                focus:outline-none focus:ring-2`}
                            />
                          </div>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">
                            Para enviarte reportes de tu vehículo y novedades
                          </p>
                          {errors.email && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.email}</p>}
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Teléfono
                          </label>
                          <div className="flex">
                            <div className="flex items-center px-3.5 rounded-l-xl border border-r-0 border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/80">
                              <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium select-none">+56</span>
                            </div>
                            <input
                              type="tel"
                              value={phone}
                              onChange={e => { setPhone(e.target.value.replace(/[^0-9\s]/g, '')); clearError('phone'); }}
                              placeholder="9 1234 5678"
                              className={`flex-1 pl-3 pr-4 py-3 rounded-r-xl border text-sm transition-all duration-200
                                ${errors.phone
                                  ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/30'
                                  : 'border-neutral-200 dark:border-neutral-800 focus:ring-amber-500/30 focus:border-amber-500'
                                }
                                bg-white dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100
                                placeholder:text-neutral-400 dark:placeholder:text-neutral-600
                                focus:outline-none focus:ring-2`}
                            />
                          </div>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">
                            Para recibir notificaciones y alertas críticas por WhatsApp
                          </p>
                          {errors.phone && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.phone}</p>}
                        </div>

                        {/* Selector de tema */}
                        <div className="space-y-2.5">
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Modo Visual
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {/* Tarjeta CLARO */}
                            <button
                              type="button"
                              onClick={() => handleThemeSelect('light')}
                              className={`relative group p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-300 text-left
                                ${selectedTheme === 'light'
                                  ? 'border-amber-500 shadow-lg shadow-amber-500/10 bg-white dark:bg-neutral-900'
                                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700'
                                }`}
                            >
                              {/* Mini preview */}
                              <div className="w-full aspect-[4/3] rounded-lg bg-neutral-100 mb-3 p-2 overflow-hidden">
                                <div className="w-full h-1.5 rounded-full bg-neutral-200 mb-1.5" />
                                <div className="flex gap-1.5 h-[calc(100%-10px)]">
                                  <div className="w-1/4 rounded bg-neutral-200" />
                                  <div className="flex-1 space-y-1 pt-0.5">
                                    <div className="w-full h-1.5 rounded-full bg-neutral-200" />
                                    <div className="w-3/4 h-1.5 rounded-full bg-amber-300/60" />
                                    <div className="w-1/2 h-1.5 rounded-full bg-neutral-200" />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Sun className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Modo Claro</span>
                              </div>
                              {selectedTheme === 'light' && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
                                >
                                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                </motion.div>
                              )}
                            </button>

                            {/* Tarjeta OSCURO */}
                            <button
                              type="button"
                              onClick={() => handleThemeSelect('dark')}
                              className={`relative group p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-300 text-left
                                ${selectedTheme === 'dark'
                                  ? 'border-amber-500 shadow-lg shadow-amber-500/10 bg-white dark:bg-neutral-900'
                                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700'
                                }`}
                            >
                              {/* Mini preview dark */}
                              <div className="w-full aspect-[4/3] rounded-lg bg-neutral-800 mb-3 p-2 overflow-hidden">
                                <div className="w-full h-1.5 rounded-full bg-neutral-700 mb-1.5" />
                                <div className="flex gap-1.5 h-[calc(100%-10px)]">
                                  <div className="w-1/4 rounded bg-neutral-700" />
                                  <div className="flex-1 space-y-1 pt-0.5">
                                    <div className="w-full h-1.5 rounded-full bg-neutral-700" />
                                    <div className="w-3/4 h-1.5 rounded-full bg-amber-500/40" />
                                    <div className="w-1/2 h-1.5 rounded-full bg-neutral-700" />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Modo Oscuro</span>
                              </div>
                              {selectedTheme === 'dark' && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
                                >
                                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                </motion.div>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ════════════════════════════════════ */}
                    {/* PASO 2: LA MÁQUINA                  */}
                    {/* ════════════════════════════════════ */}
                    {step === 2 && (
                      <div className="space-y-6">
                        {/* Header */}
                        <div>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/10 mb-4">
                            {isFlotas
                              ? <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              : <Car className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            }
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Paso 2</span>
                          </div>
                          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                            {isFlotas ? 'Tu Flota' : 'La Máquina'}
                          </h1>
                          <p className="mt-1.5 text-neutral-500 dark:text-neutral-400 text-sm sm:text-base">
                            {isFlotas
                              ? 'Configura la información principal de tu flota'
                              : 'Cuéntanos sobre tu vehículo para personalizar tu experiencia'
                            }
                          </p>
                        </div>

                        {/* Alias / Nombre flota */}
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {isFlotas ? 'Nombre de la Flota' : '¿Cómo llamas a este vehículo?'}
                          </label>
                          <div className="relative">
                            {isFlotas
                              ? <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-400 dark:text-neutral-500" />
                              : <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-400 dark:text-neutral-500" />
                            }
                            <input
                              type="text"
                              value={vehicleAlias}
                              onChange={e => { setVehicleAlias(e.target.value); clearError('vehicleAlias'); }}
                              placeholder={isFlotas ? 'Ej: Flota Santiago Norte' : 'Ej: Joyita, Camioneta Trabajo'}
                              className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm transition-all duration-200
                                ${errors.vehicleAlias
                                  ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/30'
                                  : 'border-neutral-200 dark:border-neutral-800 focus:ring-amber-500/30 focus:border-amber-500'
                                }
                                bg-white dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100
                                placeholder:text-neutral-400 dark:placeholder:text-neutral-600
                                focus:outline-none focus:ring-2`}
                            />
                          </div>
                          {errors.vehicleAlias && <p className="text-xs text-red-500 dark:text-red-400">{errors.vehicleAlias}</p>}
                        </div>

                        {/* Odómetro (solo si NO es flotas) */}
                        {!isFlotas && (
                          <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Kilometraje actual
                            </label>
                            <div className="relative">
                              <Gauge className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-400 dark:text-neutral-500" />
                              <input
                                type="text"
                                inputMode="numeric"
                                value={odometer}
                                onChange={e => { setOdometer(e.target.value.replace(/[^0-9]/g, '')); clearError('odometer'); }}
                                placeholder="Ej: 45000"
                                className={`w-full pl-11 pr-14 py-3 rounded-xl border text-sm transition-all duration-200
                                  ${errors.odometer
                                    ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/30'
                                    : 'border-neutral-200 dark:border-neutral-800 focus:ring-amber-500/30 focus:border-amber-500'
                                  }
                                  bg-white dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100
                                  placeholder:text-neutral-400 dark:placeholder:text-neutral-600
                                  focus:outline-none focus:ring-2`}
                              />
                              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400 dark:text-neutral-500 select-none">km</span>
                            </div>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500">
                              Vital para predecir tus próximos mantenimientos
                            </p>
                            {errors.odometer && <p className="text-xs text-red-500 dark:text-red-400">{errors.odometer}</p>}
                          </div>
                        )}

                        {/* Mes de PRT (solo si NO es flotas) */}
                        {!isFlotas && (
                          <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Mes de Revisión Técnica (PRT)
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-400 dark:text-neutral-500" />
                              <select
                                value={prtMonth}
                                onChange={e => setPrtMonth(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800
                                  bg-white dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100
                                  focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500
                                  transition-all duration-200 text-sm appearance-none cursor-pointer"
                              >
                                <option value="" className="text-neutral-400">Seleccionar mes...</option>
                                {MONTHS.map((m, i) => (
                                  <option key={i} value={m}>{m}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                            </div>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500">
                              Te avisaremos antes de que venza para evitar multas
                            </p>
                          </div>
                        )}

                        {/* Nota informativa para flotas */}
                        {isFlotas && (
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 dark:bg-blue-500/5 border border-blue-500/10">
                            <Zap className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              El kilometraje y revisión técnica se configurarán por cada vehículo individual en el panel de gestión de flota.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ════════════════════════════════════ */}
                    {/* PASO 3: PROTEGE TU CAMINO            */}
                    {/* ════════════════════════════════════ */}
                    {step === 3 && (
                      <div className="space-y-6">
                        {/* Header */}
                        <div>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/10 mb-4">
                            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Paso 3</span>
                          </div>
                          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                            Protege tu Camino
                          </h1>
                          <p className="mt-1.5 text-neutral-500 dark:text-neutral-400 text-sm sm:text-base">
                            Añade contactos de confianza para emergencias y alertas de seguridad
                          </p>
                        </div>

                        {/* Lista de contactos */}
                        <div className="space-y-3">
                          {contacts.map((contact, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.08 }}
                              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center">
                                    <UserPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                                    Contacto {i + 1}
                                  </span>
                                </div>
                                {contacts.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeContact(i)}
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              {/* Nombre */}
                              <input
                                type="text"
                                value={contact.name}
                                onChange={e => updateContact(i, 'name', e.target.value)}
                                placeholder="Nombre del contacto"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800
                                  bg-neutral-50 dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100
                                  placeholder:text-neutral-400 dark:placeholder:text-neutral-600
                                  focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500
                                  transition-all duration-200 text-sm"
                              />

                              {/* Teléfono */}
                              <div className="flex">
                                <div className="flex items-center px-3 rounded-l-lg border border-r-0 border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/80">
                                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium select-none">+56</span>
                                </div>
                                <input
                                  type="tel"
                                  value={contact.phone}
                                  onChange={e => updateContact(i, 'phone', e.target.value.replace(/[^0-9\s]/g, ''))}
                                  placeholder="9 1234 5678"
                                  className="flex-1 pl-3 pr-3.5 py-2.5 rounded-r-lg border border-neutral-200 dark:border-neutral-800
                                    bg-neutral-50 dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100
                                    placeholder:text-neutral-400 dark:placeholder:text-neutral-600
                                    focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500
                                    transition-all duration-200 text-sm"
                                />
                              </div>
                            </motion.div>
                          ))}

                          {/* Botón añadir contacto */}
                          {contacts.length < maxContacts && (
                            <motion.button
                              type="button"
                              onClick={addContact}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="w-full py-3 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800
                                hover:border-amber-500/50 dark:hover:border-amber-500/30
                                text-neutral-400 dark:text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400
                                flex items-center justify-center gap-2 transition-all duration-200 text-sm font-medium"
                            >
                              <Plus className="w-4 h-4" />
                              Añadir contacto
                            </motion.button>
                          )}

                          {/* Badge upgrade (plan basic) */}
                          {plan === 'basic' && (
                            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/10">
                              <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                                Upgrade a <span className="font-bold">Pro</span> para añadir más contactos de seguridad
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* ═══ NAVEGACIÓN INFERIOR ═══ */}
            <div className="shrink-0 border-t border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-sm relative z-10">
              <div className="max-w-lg mx-auto px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-3">
                {/* Botón Atrás */}
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                      text-neutral-600 dark:text-neutral-400
                      hover:bg-neutral-100 dark:hover:bg-neutral-800/50
                      transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                  </button>
                ) : (
                  <div />
                )}

                {/* Botón Siguiente / Finalizar */}
                <button
                  type="button"
                  onClick={goNext}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg
                    ${step === 3
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] px-8 py-3'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.98]'
                    }`}
                >
                  {step === 3 ? (
                    <>
                      <Zap className="w-4 h-4" />
                      Iniciar Motor
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
