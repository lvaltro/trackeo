'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMsg('El formato del correo no es válido.');
      return;
    }

    setStatus('sending');

    if (!supabase) {
      console.error('[Leads] Supabase no configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
      setErrorMsg('El formulario no está configurado. Por favor contacta al equipo.');
      setStatus('error');
      return;
    }

    const { error } = await supabase
      .from('leads')
      .insert([{ email: email.trim().toLowerCase() }]);

    if (!error) {
      setStatus('success');
      return;
    }

    // Código 23505 = unique_violation (email duplicado) — es esperado, no loguear como error
    if (error.code === '23505') {
      setErrorMsg('Ese correo ya está en la lista. Te avisamos solo por correo.');
    } else {
      // Errores inesperados: sí registrar en consola para depurar
      console.error('[Leads] Supabase error:', error.code, error.message, error.details);
      if (error.code === '42P01') {
        setErrorMsg('La tabla de registro no está lista. Avísanos si el problema continúa.');
      } else if (error.code === '42501' || error.message?.includes('row-level security')) {
        setErrorMsg('No tenemos permiso para guardar. Revisa la configuración de la base de datos.');
      } else if (process.env.NODE_ENV === 'development') {
        setErrorMsg(`Error: ${error.message || error.code}. Revisa la consola (F12).`);
      } else {
        setErrorMsg('Ocurrió un error inesperado. Intenta nuevamente.');
      }
    }
    setStatus('error');
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">
      {/* Video de Fondo con Overlay Oscuro */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover opacity-40"
      >
        <source src="/videoscroll.webm" type="video/webm" />
      </video>

      {/* Gradiente para profundidad */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/60 to-black" />

      {/* Contenido Principal */}
      <div className="relative z-10 text-center px-4">
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-xs font-medium tracking-widest text-amber-400 uppercase">Lanzamiento muy pronto</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
          Tu vehículo ahora, será <span className="text-amber-500">inteligente.</span>
        </h1>

        <div className="max-w-xl mx-auto mb-10 px-4 py-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <p className="text-lg md:text-xl text-slate-200 font-medium mb-1">
            Acceso anticipado y <span className="text-amber-400">descuento</span> a los primeros que ingresen su correo.
          </p>
          <p className="text-sm text-slate-400">
            Sin spam. Solo un aviso cuando esté listo.
          </p>
        </div>

        {/* Captura de Leads */}
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
            <div className="flex items-center gap-2 px-6 py-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Listo. Eres de los primeros: te avisamos por correo con tu acceso anticipado y descuento.
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col items-center gap-3 max-w-md mx-auto"
          >
            <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 w-full">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') { setStatus('idle'); setErrorMsg(''); }
                }}
                disabled={status === 'sending'}
                className="w-full px-5 py-3 rounded-xl bg-black/40 border border-amber-500/40 text-white placeholder:text-white/50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full sm:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-black font-bold rounded-xl transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {status === 'sending' ? 'Enviando...' : 'Notificarme'}
              </button>
            </div>

            {errorMsg && (
              <p className="text-sm text-red-400 text-center">{errorMsg}</p>
            )}
          </form>
        )}

        <div className="mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm font-medium tracking-[0.2em] uppercase">
          <span className="text-white/70 hover:text-amber-400/90 transition-colors">Seguridad</span>
          <span className="text-white/30 select-none">|</span>
          <span className="text-white/70 hover:text-amber-400/90 transition-colors">Control</span>
          <span className="text-white/30 select-none">|</span>
          <span className="text-white/70 hover:text-amber-400/90 transition-colors">Ahorro</span>
        </div>
      </div>
    </div>
  );
}
