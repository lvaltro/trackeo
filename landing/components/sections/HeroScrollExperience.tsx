"use client";

import { useRef } from "react";
import Link from "next/link";
import { useScroll, useTransform, motion, useSpring } from "framer-motion";

export function HeroScrollExperience() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const deviceY = useTransform(scrollYProgress, [0, 0.3, 0.6], [0, 80, 220]);
  const deviceRotate = useTransform(scrollYProgress, [0, 0.3], [0, -12]);
  const deviceScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.45]);
  const dashboardOpacity = useTransform(scrollYProgress, [0.25, 0.45], [0, 1]);
  const dashboardScale = useTransform(scrollYProgress, [0.25, 0.45], [0.85, 1]);
  const carOpacity = useTransform(scrollYProgress, [0.15, 0.35], [0, 1]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.15], [0, -30]);

  const deviceYSmooth = useSpring(deviceY, { stiffness: 100, damping: 30, mass: 0.5 });
  const deviceRotateSmooth = useSpring(deviceRotate, { stiffness: 80, damping: 25 });

  return (
    <section
      ref={containerRef}
      className="relative min-h-[300vh]"
      aria-label="Hero - Tu vehículo inteligente"
    >
      <div className="sticky top-0 flex min-h-screen w-full items-center justify-center overflow-hidden">
        {/* Fondo con glow naranja (accent dashboard) */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-radial from-trackeo-orange/10 via-transparent to-transparent"
          style={{ opacity: 0.6 }}
        />
        <div className="absolute top-1/4 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-trackeo-orange/20 blur-[120px]" />

        {/* Wireframe del auto (SVG) - vista superior con punto central OBD2 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: carOpacity }}
        >
          <svg
            viewBox="0 0 600 500"
            className="h-[280px] w-[560px] max-w-[90vw] text-slate-600"
            aria-hidden
          >
            <defs>
              <pattern id="car-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
              </pattern>
            </defs>
            {/* Car outline (vista superior simplificada) */}
            <rect
              x="140"
              y="180"
              width="320"
              height="140"
              rx="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.7"
            />
            {/* Windshield / cabina */}
            <rect
              x="200"
              y="120"
              width="200"
              height="75"
              rx="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.5"
            />
            {/* Ruedas */}
            {[
              { cx: 180, cy: 180 },
              { cx: 420, cy: 180 },
              { cx: 180, cy: 320 },
              { cx: 420, cy: 320 },
            ].map((wheel, i) => (
              <circle
                key={i}
                cx={wheel.cx}
                cy={wheel.cy}
                r="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.6"
              />
            ))}
            {/* Punto central (conexión OBD2) */}
            <circle cx="300" cy="250" r="12" fill="none" stroke="#ff8800" strokeWidth="2" opacity="0.9" />
            <circle cx="300" cy="250" r="4" fill="#ff8800" opacity="0.8" />
          </svg>
        </motion.div>

        {/* Dispositivo OBD2 (mockup con glow, CONECTADO, conector y pulsos) */}
        <motion.div
          className="absolute z-10 flex items-center justify-center will-change-transform"
          style={{
            y: deviceYSmooth,
            rotate: deviceRotateSmooth,
            scale: deviceScale,
          }}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-6 rounded-2xl bg-trackeo-orange/20 blur-2xl" />
            {/* Pulse rings */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-trackeo-orange/30"
              animate={{ scale: [1, 1.4, 1.4], opacity: [0.4, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-trackeo-orange/20"
              animate={{ scale: [1, 1.6, 1.6], opacity: [0.3, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            {/* Device card (simulated OBD2) */}
            <div className="relative flex h-28 w-40 flex-col overflow-hidden rounded-xl border border-slate-600 bg-slate-900/95 shadow-2xl backdrop-blur-sm">
              {/* Top display area */}
              <div className="flex h-8 items-center justify-center border-b border-slate-700 bg-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">OBD2</span>
              </div>
              {/* Main body */}
              <div className="flex flex-1 flex-col items-center justify-center gap-1 px-2 py-2">
                <span className="text-[9px] font-semibold text-green-400">CONECTADO</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-green-500/80"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
              {/* Connector visualization */}
              <div className="flex justify-center gap-0.5 border-t border-slate-700 bg-slate-800/60 px-2 py-1.5">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-2 w-1 rounded-sm bg-slate-600"
                    style={{ width: 4 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard UI que emerge al hacer scroll */}
        <motion.div
          className="absolute bottom-[12%] left-1/2 w-[min(92vw,720px)] -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-md"
          style={{
            opacity: dashboardOpacity,
            scale: dashboardScale,
          }}
        >
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg bg-slate-800/80 p-3">
              <div className="mb-2 h-2 w-20 rounded bg-slate-600" />
              <div className="h-24 rounded bg-slate-800" />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex gap-2">
                <div className="h-10 flex-1 rounded bg-green-500/20 border border-green-500/30" />
                <div className="h-10 flex-1 rounded bg-slate-700" />
              </div>
              <div className="h-16 rounded bg-slate-800" />
            </div>
          </div>
        </motion.div>

        {/* Texto overlay (se desvanece al hacer scroll) */}
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4"
          style={{ opacity: textOpacity, y: textY }}
        >
          <h1 className="max-w-3xl text-center text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl lg:text-6xl">
            Tu vehículo, ahora es{" "}
            <span className="text-trackeo-orange">inteligente</span>
          </h1>
          <p className="mt-4 max-w-xl text-center text-lg text-slate-400 sm:text-xl">
            Seguridad, ahorro y control desde una sola plataforma
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="https://app.trackeo.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[#ff8800] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#ff9933]"
            >
              Ir a la Plataforma →
            </Link>
            <a
              href="#planes"
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:border-slate-600"
            >
              Ver Planes
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
