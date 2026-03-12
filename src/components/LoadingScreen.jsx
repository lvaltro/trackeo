// src/components/LoadingScreen.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import logoTrackeo from '../assets/logofinal.png';

const LoadingScreen = ({ isDarkMode }) => {
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-black relative overflow-hidden flex flex-col items-center justify-center">

        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-10 pointer-events-none"></div>
        <style>{`
          .bg-grid-pattern {
            background-image:
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px);
            background-size: 40px 40px;
            color: inherit;
          }
          @keyframes heartbeat {
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(245, 158, 11, 0)); }
            50% { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.3)); }
          }
          .animate-heartbeat {
            animation: heartbeat 2s infinite ease-in-out;
          }
        `}</style>

        {/* Orbs */}
        <div className="hidden dark:block absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="hidden dark:block absolute bottom-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl animate-pulse"></div>

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="animate-heartbeat flex items-center justify-center gap-4 mb-10 p-4 rounded-xl">
            <img src={logoTrackeo} alt="Trackeo Logo" className="h-20 w-auto object-contain" />
            <div className="h-12 w-px bg-slate-300 dark:bg-slate-700"></div>
            <div className="flex flex-col items-start justify-center">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white leading-none tracking-tight">TRACKEO</h1>
              <p className="text-amber-600 dark:text-amber-500 text-xs font-bold tracking-[0.2em] mt-1">PERSONAS</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-lg rounded-full"></div>
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin relative z-10" />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium animate-pulse">
              Iniciando entorno seguro...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
