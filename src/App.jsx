// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { supabase } from "./lib/supabaseClient";
import LoginScreen from "./screens/LoginScreen";
import DashboardLayout from "./screens/DashboardLayout";
import InstallerScreen from "./screens/InstallerScreen";
import LiveTrackingPublic from "./screens/LiveTrackingPublic";
import OnboardingWizard from "./components/OnboardingWizard";
import { DemoProvider } from "./context/DemoContext";

/** Mapea usuario de Supabase Auth al formato de la app (id, name, email). */
function mapSupabaseUser(supabaseUser) {
  if (!supabaseUser) return null;
  const meta = supabaseUser.user_metadata || {};
  const name = meta.name ?? meta.full_name ?? (supabaseUser.email?.split("@")[0]) ?? "Usuario";
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name,
    avatar_url: meta.avatar_url ?? null,
  };
}

// ═══════════════════════════════════════════════════
// APP.JSX — CONTROLADOR PRINCIPAL CON REACT ROUTER
// Maneja: estado global (user, theme), rutas y redirecciones
// ═══════════════════════════════════════════════════

export default function App() {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const navigate = useNavigate();

  // ─── EFECTO: RESTAURAR TEMA desde localStorage ───
  useEffect(() => {
    const savedTheme = localStorage.getItem("trackeo-theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    } else {
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDark(systemPrefersDark);
    }
  }, []);

  // ─── EFECTO: RESTAURAR SESIÓN desde Supabase Auth ───
  useEffect(() => {
    if (!supabase) {
      setIsRestoringSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setIsRestoringSession(false);
    });
  }, []);

  // ─── HANDLER: Cambiar tema y persistir ───
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("trackeo-theme", newTheme ? "dark" : "light");
  };

  /** Setear tema directamente (para el onboarding) */
  const setTheme = (dark) => {
    setIsDark(dark);
    localStorage.setItem("trackeo-theme", dark ? "dark" : "light");
  };

  // ─── HANDLER: Login exitoso (guarda usuario y redirige al dashboard) ───
  const handleLogin = (userData) => {
    setUser(userData);
    // Si el usuario necesita onboarding, no navegar aún — el wizard se mostrará
    const needsOnboarding = userData?.attributes?.isFirstLogin === true
      || !userData?.attributes?.onboardingCompleted;
    if (!needsOnboarding) {
      navigate("/dashboard", { replace: true });
    }
  };

  // ─── HANDLER: Onboarding completado ───
  const handleOnboardingComplete = (updatedUser) => {
    setUser(updatedUser);
    navigate("/dashboard", { replace: true });
  };

  // ─── HANDLER: Cerrar sesión (Supabase + estado local) ───
  // options.skipLocalStorage: true cuando viene del demo mode (no cerrar sesión real)
  const handleLogout = async (options = {}) => {
    if (!options?.skipLocalStorage && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    navigate("/login", { replace: true });
  };

  // ─── LISTENER GLOBAL: Sesión expirada (401 desde apiClient) ───
  useEffect(() => {
    const handleAuthExpired = async () => {
      console.warn('[Auth] Sesión expirada — redirigiendo al login');
      if (supabase) await supabase.auth.signOut();
      setUser(null);
      navigate("/login", { replace: true });
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [navigate]);

  // ─── Detectar si el usuario necesita onboarding ───
  const needsOnboarding = user
    && (user?.attributes?.isFirstLogin === true || !user?.attributes?.onboardingCompleted);

  // ─── RENDER: Esperar restauración de sesión ───
  if (isRestoringSession) return null;

  // ─── RENDER: Onboarding Wizard (bloquea toda la app) ───
  if (needsOnboarding) {
    return (
      <DemoProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              borderRadius: '16px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              fontSize: '13px',
              fontWeight: '600',
            },
          }}
          richColors expand={false} closeButton
        />
        <OnboardingWizard
          user={user}
          isDark={isDark}
          onSetTheme={setTheme}
          onComplete={handleOnboardingComplete}
        />
      </DemoProvider>
    );
  }

  return (
    <DemoProvider>
    {/* Toast global — posición inferior centro, estilo Trackeo */}
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          fontSize: '13px',
          fontWeight: '600',
        },
      }}
      richColors
      expand={false}
      closeButton
    />
    <Routes>
      {/* Raíz: redirige a dashboard si hay usuario, si no a login */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Login: si ya hay usuario, redirige a dashboard */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginScreen
              onLoginSuccess={handleLogin}
              isDark={isDark}
              onToggleTheme={toggleTheme}
            />
          )
        }
      />

      {/* Dashboard: ruta protegida; si no hay usuario → login */}
      <Route
        path="/dashboard"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : (
            <DashboardLayout
              user={user}
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onLogout={handleLogout}
            />
          )
        }
      />

      {/* Instalador: accesible por URL para pruebas (ej. localhost:5173/installer) */}
      <Route path="/installer" element={<InstallerScreen />} />

      {/* Viaje Seguro: página pública de ubicación en vivo (sin autenticación) */}
      <Route path="/live/:token" element={<LiveTrackingPublic />} />
    </Routes>
    </DemoProvider>
  );
}
