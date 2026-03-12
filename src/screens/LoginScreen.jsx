// src/screens/LoginScreen.jsx
// Login con Supabase Auth (sin Traccar).
import React, { useState, useEffect } from "react";
import {
  User, Lock, ArrowRight, Eye, EyeOff, Moon, Sun,
  MapPin, Shield, Power, Route, Loader2, AlertTriangle, Binoculars,
  Download, Smartphone, X
} from "lucide-react";
import { supabase } from '@/lib/supabaseClient';
import TrackeoLogo from '../components/TrackeoLogo';
import { useDemo } from '../context/DemoContext';
import { mockUser } from '../utils/demoData';
import { usePWAInstall } from '../hooks/usePWAInstall';

/** Mapea el usuario de Supabase Auth al formato que espera la app (id, name, email). */
function mapSupabaseUser(supabaseUser) {
  if (!supabaseUser) return null;
  const meta = supabaseUser.user_metadata || {};
  const name = meta.name ?? meta.full_name ?? (supabaseUser.email?.split('@')[0]) ?? 'Usuario';
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name,
    avatar_url: meta.avatar_url ?? null,
  };
}

// ═══════════════════════════════════════════════════
// LOGIN SCREEN (Gradientes + Glassmorphism)
// Props: onLoginSuccess, isDark, onToggleTheme
// ═══════════════════════════════════════════════════

const LoginScreen = ({ onLoginSuccess, isDark, onToggleTheme }) => {
  // ─── Estado LOCAL (solo formulario, NO tema) ───
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  // ─── PWA Install ───
  const { isInstallable, installApp } = usePWAInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  // ─── Demo Mode ───
  const { enterDemo } = useDemo();

  const handleEnterDemo = () => {
    enterDemo();
    onLoginSuccess(mockUser);
  };

  // Animación de entrada
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  // ─── HANDLER: Submit del formulario (Supabase Auth) ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!supabase) {
        setError("Configuración de sesión no disponible. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
        setLoading(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        const msg = authError.message || '';
        if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
          setError("Correo o contraseña incorrectos. Revisa tus datos e intenta de nuevo.");
        } else if (msg.includes('Email not confirmed')) {
          setError("Confirma tu correo electrónico antes de iniciar sesión.");
        } else {
          setError(msg || "Error al iniciar sesión. Intenta de nuevo.");
        }
        setLoading(false);
        return;
      }

      // Sesión guardada automáticamente por Supabase (localStorage). Redirigir al dashboard.
      const userData = mapSupabaseUser(data.user);
      if (userData) onLoginSuccess(userData);
    } catch (err) {
      console.error('[Login]', err);
      setError("Error de conexión. Comprueba tu red e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ───
  return (
    <div className={`${isDark ? "dark" : ""}`}>
      <div className={`min-h-screen relative overflow-hidden transition-colors duration-700
        ${isDark ? 'bg-neutral-950' : 'bg-neutral-50'}`}>

        {/* ═══ CAPA 1: GRADIENTES DINÁMICOS ═══ */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full blur-[120px] transition-opacity duration-1000
            ${isDark ? 'bg-amber-500/10 opacity-60' : 'bg-amber-500/5 opacity-40'}`}
          />
          <div className={`absolute -bottom-24 -right-24 w-[600px] h-[600px] rounded-full blur-[120px] transition-opacity duration-1000
            ${isDark ? 'bg-orange-600/10 opacity-50' : 'bg-orange-600/5 opacity-30'}`}
          />
        </div>

        {/* ═══ CAPA 2: PATRÓN DE MALLA SUTIL ═══ */}
        <div
          className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(${isDark ? '#f59e0b' : '#0f172a'} 0.5px, transparent 0.5px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* ═══ CAPA 3: CONTENIDO ═══ */}
        <div className="relative z-10 min-h-screen flex">

          {/* ─── LADO IZQUIERDO: Hero text (Solo desktop) ─── */}
          <div className={`hidden lg:flex lg:w-[50%] flex-col justify-between p-12 xl:p-16 transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

            <div className="flex-1 flex flex-col justify-center max-w-lg">
              <div className="mb-8">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all
                  ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white border-neutral-200 shadow-sm'} mb-6`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className={`text-xs font-semibold tracking-wide ${isDark ? 'text-amber-400' : 'text-neutral-600'}`}>Servicio activo 24/7</span>
                </div>

                <h2
                  className={`text-4xl xl:text-5xl font-black leading-[1.1] mb-4 transition-colors duration-700
                    ${isDark ? 'text-white' : 'text-neutral-900'}`}
                  style={{ fontFamily: "'SF Pro Display', system-ui" }}
                >
                  Tu mundo,<br />
                  <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Siempre ubicado</span>
                </h2>

                <p className={`text-base leading-relaxed max-w-sm transition-colors duration-700
                  ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Personas y vehículos conectados en tiempo real. Tecnología GPS profesional al alcance de tu mano.
                </p>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: MapPin, text: "Ubicación en vivo" },
                  { icon: Shield, text: "Alertas instantáneas" },
                  { icon: Power, text: "Corte de motor" },
                  { icon: Route, text: "Historial de rutas" },
                ].map((f, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-500
                    ${isDark ? 'bg-white/5 border-white/10 text-white/80' : 'bg-white border-neutral-200 text-neutral-700 shadow-sm'}`}>
                    <f.icon className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-medium">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── LADO DERECHO: Formulario ─── */}
          <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">

            {/* Botón tema */}
            <button
              onClick={onToggleTheme}
              className={`absolute top-6 right-6 p-2.5 rounded-xl border shadow-lg hover:scale-105 transition-all z-50
                ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-neutral-200'}`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-neutral-700" />}
            </button>

            <div className={`w-full max-w-sm transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>

              {/* Logo centrado */}
              <div className="flex justify-center mb-8 transition-transform hover:scale-105 duration-300">
                <TrackeoLogo size="lg" dark={isDark} />
              </div>

              {/* ═══ GLASS CARD ═══ */}
              <div className={`rounded-3xl p-8 transition-all duration-500 border
                ${isDark
                  ? 'bg-neutral-900/50 backdrop-blur-xl border-white/[0.08] shadow-2xl shadow-black'
                  : 'bg-white shadow-xl shadow-neutral-200/50 border-neutral-100'
                }`}
              >
                {/* Título */}
                <div className="mb-6 text-center lg:text-left">
                  <h2 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-neutral-900'}`}>Bienvenido</h2>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Ingresa tus credenciales</p>
                </div>

                {/* Error */}
                {error && (
                  <div className={`mb-5 p-3.5 rounded-xl flex items-center gap-2 border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className={`block text-xs font-semibold mb-2 uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Email</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-amber-500 transition-colors" />
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
                        disabled={loading}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium transition-all outline-none border
                          ${isDark
                            ? 'bg-neutral-950/50 border-white/[0.1] text-white placeholder-neutral-500 focus:border-amber-500/50'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-amber-500/50'
                          } focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50`}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className={`block text-xs font-semibold mb-2 uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Contraseña</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-amber-500 transition-colors" />
                      <input
                        type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                        disabled={loading}
                        className={`w-full pl-11 pr-12 py-3 rounded-xl text-sm font-medium transition-all outline-none border
                          ${isDark
                            ? 'bg-neutral-950/50 border-white/[0.1] text-white placeholder-neutral-500 focus:border-amber-500/50'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-amber-500/50'
                          } focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50`}
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-amber-500 transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${remember ? "bg-amber-500 border-amber-500" : isDark ? "border-neutral-600" : "border-neutral-300"}`}
                        onClick={() => setRemember(!remember)}
                      >
                        {remember && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Recordarme</span>
                    </label>
                    <button type="button" className="text-xs text-amber-600 font-semibold hover:text-amber-500 transition-colors">¿Olvidaste tu contraseña?</button>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-60 transition-all active:scale-[0.98]"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Iniciar Sesión<ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>

                {/* ─── Botón Modo Demo ─── */}
                <div className="mt-5 pt-5 border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={handleEnterDemo}
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] border
                      ${isDark
                        ? 'border-white/10 text-neutral-300 hover:bg-white/5 hover:border-amber-500/30 hover:text-amber-400'
                        : 'border-neutral-200 text-neutral-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700'
                      } disabled:opacity-50`}
                  >
                    <Binoculars className="w-4 h-4" />
                    Explorar Demo Interactiva
                  </button>
                  <p className={`text-center text-[10px] mt-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    Sin registro · Datos simulados · 100% interactivo
                  </p>
                </div>
              </div>

              <p className={`text-center mt-8 text-[11px] ${isDark ? 'text-white/30' : 'text-neutral-400'}`}>
                © 2026 Trackeo System | Ccp, Chile
              </p>
            </div>
          </div>
        </div>

        {/* ═══ BANNER INSTALAR PWA ═══ */}
        {isInstallable && showInstallBanner && (
          <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-500 animate-slide-up
            ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
            <div className={`max-w-md mx-auto rounded-2xl p-4 border shadow-2xl backdrop-blur-xl flex items-center gap-4
              ${isDark
                ? 'bg-neutral-900/90 border-white/10 shadow-black/50'
                : 'bg-white/95 border-neutral-200 shadow-neutral-300/50'
              }`}
            >
              {/* Ícono */}
              <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Smartphone className="w-6 h-6 text-white" />
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Lleva Trackeo en tu celular
                </h4>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  Instala la app para alertas más rápidas
                </p>
              </div>

              {/* Botón Instalar */}
              <button
                onClick={installApp}
                className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar
              </button>

              {/* Botón cerrar */}
              <button
                onClick={() => setShowInstallBanner(false)}
                className={`shrink-0 p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-neutral-500' : 'hover:bg-neutral-100 text-neutral-400'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
