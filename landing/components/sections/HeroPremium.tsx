"use client";

import { useRef, useMemo } from "react";
import {
  useScroll,
  useTransform,
  motion,
  useSpring,
  MotionValue,
} from "framer-motion";
import Link from "next/link";

/* ─────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────── */
interface LayerProps {
  progress: MotionValue<number>;
}

/* ─────────────────────────────────────────────────────
   Chile SVG Path — stroke-only minimal vector outline
   ViewBox: 0 0 110 375
   Santiago ≈ cx=52 cy=148
───────────────────────────────────────────────────── */
const CHILE_PATH = `
  M55,4
  C53,14 51,24 50,34
  C49,44 48,54 47,64
  C46,74 45,82 44,92
  C43,102 41,112 39,122
  C37,132 35,140 33,150
  C31,160 29,168 27,178
  C25,188 23,198 21,210
  C19,222 17,234 15,246
  C13,258 11,270 10,280
  C9,290 9,300 10,310
  C12,320 15,328 19,336
  C24,344 30,350 37,354
  C43,358 50,360 57,358
  C63,356 68,350 70,344
  C72,338 70,330 68,324
  C65,316 61,308 59,300
  C57,290 57,280 58,270
  C60,258 63,248 65,236
  C67,224 67,212 66,200
  C65,188 63,176 62,164
  C61,152 61,140 61,128
  C61,116 61,104 61,92
  C61,80 60,68 59,56
  C58,44 57,32 56,20
  C55,12 55,8 55,4
  Z
`;

/* Safely over-estimated path length for strokeDasharray */
const CHILE_PATH_LENGTH = 1050;

/* ─────────────────────────────────────────────────────
   1. BackgroundLayer
   Radial gradient + noise texture + technical grid
───────────────────────────────────────────────────── */
function BackgroundLayer({ progress }: LayerProps) {
  const opacity = useTransform(progress, [0, 0.15], [0, 1]);

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 will-change-[opacity]"
    >
      {/* Base + radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 65% at 58% 44%, rgba(18,40,90,0.55) 0%, rgba(11,15,20,0) 68%), #0B0F14",
        }}
      />

      {/* Right-side secondary glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 40% at 80% 50%, rgba(255,122,0,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Noise texture via SVG filter */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.028]"
        aria-hidden
      >
        <defs>
          <filter id="hero-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.68"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#hero-noise)" />
      </svg>

      {/* Technical grid */}
      <TechGrid />
    </motion.div>
  );
}

function TechGrid() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.052]"
      aria-hidden
      style={{ willChange: "opacity" }}
    >
      <defs>
        <pattern
          id="cell-sm"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="rgba(80,160,255,1)"
            strokeWidth="0.4"
          />
        </pattern>
        <pattern
          id="cell-lg"
          width="200"
          height="200"
          patternUnits="userSpaceOnUse"
        >
          <rect width="200" height="200" fill="url(#cell-sm)" />
          <path
            d="M 200 0 L 0 0 0 200"
            fill="none"
            stroke="rgba(80,160,255,1)"
            strokeWidth="0.9"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cell-lg)" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────
   2. ChileVectorLayer + 3. GPSPoint (co-located in SVG)
   draw animation via strokeDashoffset
───────────────────────────────────────────────────── */
function ChileMapLayer({ progress }: LayerProps) {
  const outlineOpacity = useTransform(progress, [0.18, 0.32], [0, 1]);
  const strokeDashoffset = useTransform(
    progress,
    [0.2, 0.5],
    [CHILE_PATH_LENGTH, 0]
  );
  const gpsOpacity = useTransform(progress, [0.5, 0.64], [0, 1]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        viewBox="0 0 110 375"
        className="h-[74%] w-auto"
        style={{
          filter: "drop-shadow(0 0 14px rgba(50,120,240,0.16))",
          willChange: "transform",
        }}
        aria-hidden
      >
        {/* Wide glow stroke */}
        <motion.path
          d={CHILE_PATH}
          fill="none"
          stroke="rgba(80,150,255,0.12)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: CHILE_PATH_LENGTH,
            strokeDashoffset,
            opacity: outlineOpacity,
            willChange: "stroke-dashoffset",
          }}
        />

        {/* Primary outline */}
        <motion.path
          d={CHILE_PATH}
          fill="none"
          stroke="rgba(56,118,210,0.62)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: CHILE_PATH_LENGTH,
            strokeDashoffset,
            opacity: outlineOpacity,
            willChange: "stroke-dashoffset",
          }}
        />

        {/* GPS group — Santiago ≈ (52, 148) */}
        <motion.g style={{ opacity: gpsOpacity }}>
          {/* Concentric pulse rings */}
          {[22, 14, 7].map((r, i) => (
            <motion.circle
              key={r}
              cx="52"
              cy="148"
              r={r}
              fill="none"
              stroke="#FF7A00"
              strokeWidth="0.55"
              animate={{
                r: [r * 0.45, r * 1.65],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2.8,
                delay: i * 0.72,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Amber glow halo */}
          <circle cx="52" cy="148" r="11" fill="rgba(255,122,0,0.1)" />
          <circle cx="52" cy="148" r="6" fill="rgba(255,122,0,0.18)" />

          {/* Core dot */}
          <motion.circle
            cx="52"
            cy="148"
            r="3.2"
            fill="#FF7A00"
            animate={{
              r: [3, 3.6, 3],
              opacity: [1, 0.78, 1],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* White center pinpoint */}
          <circle cx="52" cy="148" r="1.1" fill="white" opacity={0.92} />
        </motion.g>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   4. FloatingCardUI — glassmorphism panel
───────────────────────────────────────────────────── */
interface CardRow {
  label: string;
  value: string;
  dot?: boolean;
  amber?: boolean;
  green?: boolean;
}

const CARD_DATA: CardRow[] = [
  { label: "VEHÍCULO", value: "Changan CS5", dot: true },
  { label: "UBICACIÓN", value: "Santiago, CL" },
  { label: "VELOCIDAD", value: "62 km/h", amber: true },
  { label: "SEÑAL", value: "Estable", green: true },
];

function FloatingCardUI({ progress }: LayerProps) {
  const opacity = useTransform(progress, [0.73, 0.88], [0, 1]);
  const y = useTransform(progress, [0.73, 0.88], [22, 0]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="hidden sm:block absolute right-[5%] lg:right-[9%] top-1/2 -translate-y-1/2 will-change-[opacity,transform]"
    >
      <div
        className="rounded-2xl p-5 w-[210px]"
        style={{
          background: "rgba(10, 16, 28, 0.80)",
          border: "1px solid rgba(56,118,210,0.22)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          boxShadow:
            "0 20px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Live badge */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.055]">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] flex-shrink-0"
            animate={{ opacity: [1, 0.28, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-[9px] font-bold tracking-[0.22em] text-[#FF7A00] uppercase">
            En vivo
          </span>
          <span className="ml-auto font-mono text-[9px] text-slate-500">
            GPS·L1
          </span>
        </div>

        {/* Data rows */}
        <div className="space-y-[10px]">
          {CARD_DATA.map(({ label, value, dot, amber, green }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[9px] tracking-[0.16em] text-slate-500 uppercase">
                {label}
              </span>
              <span
                className={`text-[11px] font-medium leading-none ${
                  amber
                    ? "text-[#FF7A00]"
                    : green
                    ? "text-emerald-400"
                    : "text-slate-200"
                }`}
              >
                {dot && (
                  <span className="inline-block w-[5px] h-[5px] rounded-full bg-blue-400 mr-1.5 mb-px align-middle" />
                )}
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* GPS signal bar */}
        <div className="mt-4 pt-3 border-t border-white/[0.055]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] tracking-widest text-slate-600 uppercase">
              Señal GPS
            </span>
            <span className="font-mono text-[9px] text-slate-400">93%</span>
          </div>
          <div className="h-[3px] rounded-full bg-slate-800/80 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #FF7A00 0%, #ffb347 100%)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: "93%" }}
              transition={{ duration: 2.4, delay: 0.9, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   Data Particles — subtle ambient data points
   Deterministic positions (avoids SSR/client mismatch)
───────────────────────────────────────────────────── */
function DataParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        x: 4 + ((i * 4.37) % 92),
        y: 4 + ((i * 7.13) % 92),
        delay: (i * 0.41) % 5.2,
        duration: 7 + ((i * 0.93) % 7),
        size: i % 4 === 0 ? 1.5 : 1,
        maxOpacity: i % 5 === 0 ? 0.3 : 0.15,
      })),
    []
  );

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            willChange: "transform, opacity",
          }}
          animate={{
            y: [-12, 12, -12],
            opacity: [0, p.maxOpacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   5. HeroContent — headline + CTAs (centrado inferior)
───────────────────────────────────────────────────── */
function HeroContent({ progress }: LayerProps) {
  const opacity = useTransform(
    progress,
    [0, 0.1, 0.56, 0.68],
    [1, 1, 1, 0]
  );
  const y = useTransform(progress, [0, 0.16], [0, -26]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-[9vh] px-6 text-center will-change-[opacity,transform]"
    >
      <p className="mb-3 text-[9px] font-bold tracking-[0.28em] text-slate-500 uppercase">
        Trackeo Personas
      </p>

      <h1 className="text-[2.4rem] sm:text-5xl lg:text-[3.6rem] font-bold text-white tracking-tight leading-[1.07] max-w-2xl">
        Tu vehiculo,.{" "}
        <span
          className="text-[#FF7A00]"
          style={{ textShadow: "0 0 48px rgba(255,122,0,0.38)" }}
        >
          Ahora es inteligente.
        </span>
      </h1>

      <p className="mt-4 text-slate-400 text-[0.95rem] sm:text-lg max-w-sm sm:max-w-md leading-relaxed">
        Gestion y seguridad para lo que más valoras.
      </p>

      <div className="mt-8 flex items-center gap-3 flex-wrap justify-center">
        <Link
          href="https://trackeo.cl/"
          className="inline-flex items-center px-7 py-3 rounded-xl bg-[#FF7A00] text-white font-semibold text-sm tracking-wide transition-all duration-200 hover:bg-[#ff8f20] hover:scale-[1.02] active:scale-[0.97]"
          style={{
            boxShadow: "0 0 32px rgba(255,122,0,0.38), 0 4px 14px rgba(0,0,0,0.35)",
          }}
        >
          Comenzar ahora
        </Link>
        <Link
          href="https://app.trackeo.cl/"
          className="inline-flex items-center gap-1.5 px-7 py-3 rounded-xl text-slate-300 font-semibold text-sm tracking-wide border border-white/[0.09] transition-all duration-200 hover:border-white/[0.18] hover:text-white"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          Ver Plataforma
          <span className="text-slate-500 text-xs">→</span>
        </Link>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   Scroll Cue
───────────────────────────────────────────────────── */
function ScrollCue({ progress }: LayerProps) {
  const opacity = useTransform(progress, [0, 0.07], [1, 0]);

  return (
    <motion.div
      style={{ opacity }}
      className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
    >
      <span className="text-[9px] tracking-[0.28em] text-slate-600 uppercase">
        Scroll
      </span>
      <motion.div
        className="w-px h-7 bg-gradient-to-b from-slate-600 to-transparent"
        animate={{ opacity: [0.28, 0.7, 0.28] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   HeroPremium — main export
   300vh scroll container → sticky 100vh viewport
───────────────────────────────────────────────────── */
export function HeroPremium() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  /* Smooth spring — prevents jitter at scroll extremes */
  const progress = useSpring(scrollYProgress, {
    stiffness: 82,
    damping: 26,
    mass: 0.5,
  });

  return (
    <section
      ref={containerRef}
      className="relative h-[300vh] bg-[#0B0F14]"
      id="hero"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Layer order: back → front */}
        <BackgroundLayer progress={progress} />
        <DataParticles />
        <ChileMapLayer progress={progress} />
        <FloatingCardUI progress={progress} />
        <HeroContent progress={progress} />
        <ScrollCue progress={progress} />
      </div>
    </section>
  );
}
