"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  useScroll,
  useTransform,
  motion,
  useSpring,
  MotionValue,
} from "framer-motion";

/* ─────────────────────────────────────────────────────
   Icons
───────────────────────────────────────────────────── */
function ShieldIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────
   VideoBackground
   Full-screen video with scroll-driven scale + opacity
───────────────────────────────────────────────────── */
function VideoBackground({
  videoScale,
  videoOpacity,
}: {
  videoScale: MotionValue<number>;
  videoOpacity: MotionValue<number>;
}) {
  return (
    <motion.div
      className="absolute inset-0 will-change-transform"
      style={{ scale: videoScale, opacity: videoOpacity }}
    >
      <video
        className="absolute inset-0 h-full w-full"
        style={{ objectFit: "cover" }}
        src="/videoscroll.webm"
        autoPlay
        muted
        loop
        playsInline
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   VignetteOverlay
   Radial + linear gradients so video bleeds into bg
───────────────────────────────────────────────────── */
function VignetteOverlay() {
  return (
    <>
      {/* Heavy radial vignette — clear center, fades to #0a0a0a at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 58% at 50% 48%, transparent 18%, rgba(10,10,10,0.52) 62%, #0a0a0a 96%)",
        }}
      />
      {/* Top dark bar (nav readability) */}
      <div
        className="absolute inset-x-0 top-0 h-28 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(10,10,10,0.65), transparent)",
        }}
      />
      {/* Bottom fade into next section */}
      <div
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, #0a0a0a)",
        }}
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────
   FloatingCardGPS — Card 1 (left side, faster parallax)
   "GPS: Signal Strong" with green blinking dot
───────────────────────────────────────────────────── */
function FloatingCardGPS({ y }: { y: MotionValue<number> }) {
  return (
    <motion.div
      className="absolute left-[6%] top-[30%] hidden sm:block will-change-transform"
      style={{ y }}
      aria-hidden
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: "rgba(8, 18, 26, 0.75)",
          border: "1px solid rgba(52, 211, 153, 0.28)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow:
            "0 20px 52px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Blinking green dot */}
        <motion.div
          className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0"
          animate={{ opacity: [1, 0.25, 1], scale: [1, 0.8, 1] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
          style={{ boxShadow: "0 0 10px rgba(52,211,153,0.85)" }}
        />
        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] text-emerald-400 uppercase leading-none">
            GPS
          </p>
          <p className="text-[12px] font-semibold text-white mt-0.5 leading-none">
            Signal Strong
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   FloatingCardStatus — Card 2 (right side, slower parallax)
   "Status: Protected" with amber shield icon
───────────────────────────────────────────────────── */
function FloatingCardStatus({ y }: { y: MotionValue<number> }) {
  return (
    <motion.div
      className="absolute right-[6%] top-[42%] hidden sm:block will-change-transform"
      style={{ y }}
      aria-hidden
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: "rgba(20, 10, 6, 0.75)",
          border: "1px solid rgba(255, 122, 0, 0.30)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow:
            "0 20px 52px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Amber shield icon with glow */}
        <motion.span
          className="text-[#FF7A00] flex-shrink-0"
          style={{ filter: "drop-shadow(0 0 6px rgba(255,122,0,0.75))" }}
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ShieldIcon />
        </motion.span>
        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] text-[#FF7A00] uppercase leading-none">
            Status
          </p>
          <p className="text-[12px] font-semibold text-white mt-0.5 leading-none">
            Protected
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   HeroContent — headline, subtitle, CTAs
───────────────────────────────────────────────────── */
function HeroContent({
  opacity,
  y,
}: {
  opacity: MotionValue<number>;
  y: MotionValue<number>;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center will-change-[opacity,transform]"
      style={{ opacity, y }}
    >
      <p className="mb-4 text-[9px] font-bold tracking-[0.32em] text-slate-400 uppercase">
        Trackeo Systems
      </p>

      <h1
        className="text-[2.6rem] sm:text-5xl lg:text-[3.8rem] font-bold text-white tracking-tight leading-[1.07] max-w-2xl"
        style={{
          textShadow:
            "0 2px 28px rgba(0,0,0,0.8), 0 0 100px rgba(0,0,0,0.5)",
        }}
      >
        Tu vehiculo,{" "}
        <span
          className="text-[#FF7A00]"
          style={{ textShadow: "0 0 56px rgba(255,122,0,0.60)" }}
        >
          ahora es inteligente.
        </span>
      </h1>

      <p
        className="mt-5 text-slate-300 text-[1rem] sm:text-lg max-w-md leading-relaxed"
        style={{ textShadow: "0 1px 14px rgba(0,0,0,0.9)" }}
      >
        Gestion y seguridad para lo que mas te importa
      </p>

      <div className="mt-9 flex items-center gap-3 flex-wrap justify-center">
        <Link
          href="https://trackeo.cl/"
          className="inline-flex items-center px-7 py-3 rounded-xl bg-[#FF7A00] text-white font-semibold text-sm tracking-wide transition-all duration-200 hover:bg-[#ff8f20] hover:scale-[1.02] active:scale-[0.97]"
          style={{
            boxShadow:
              "0 0 36px rgba(255,122,0,0.48), 0 4px 18px rgba(0,0,0,0.45)",
          }}
        >
          Comenzar ahora
        </Link>
        <Link
          href="https://app.trackeo.cl/"
          className="inline-flex items-center gap-1.5 px-7 py-3 rounded-xl text-slate-200 font-semibold text-sm tracking-wide border border-white/[0.12] transition-all duration-200 hover:border-white/[0.24] hover:text-white"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          Ver Plataforma
          <span className="text-slate-400 text-xs">→</span>
        </Link>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   ScrollCue
───────────────────────────────────────────────────── */
function ScrollCue({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 0.08], [1, 0]);

  return (
    <motion.div
      style={{ opacity }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
    >
      <span className="text-[9px] tracking-[0.3em] text-slate-500 uppercase">
        Scroll
      </span>
      <motion.div
        className="w-px h-7 bg-gradient-to-b from-slate-400 to-transparent"
        animate={{ opacity: [0.3, 0.85, 0.3] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   HeroVideoScroll — main export
   200vh scroll container → sticky 100vh viewport
   
   Scroll-driven transforms:
   • Video scale  : 1.0 → 1.1  (subtle zoom-in)
   • Video opacity: 1.0 → 0.3  (smooth fade to next section)
   • Text         : 1.0 → 0    (disappears after 30% scroll)
   • Card 1 (GPS) : faster parallax (−140px)
   • Card 2 (Status): slower parallax (−70px)
───────────────────────────────────────────────────── */
export function HeroVideoScroll() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 82,
    damping: 26,
    mass: 0.5,
  });

  // Video scroll transforms
  const videoScale = useTransform(progress, [0, 1], [1.0, 1.1]);
  const videoOpacity = useTransform(progress, [0, 0.85], [1, 0.3]);

  // Hero text
  const textOpacity = useTransform(progress, [0, 0.28], [1, 0]);
  const textY = useTransform(progress, [0, 0.28], [0, -44]);

  // Floating cards parallax — different speeds for depth effect
  const card1Y = useTransform(progress, [0, 1], [0, -140]); // faster
  const card2Y = useTransform(progress, [0, 1], [0, -70]);  // slower

  return (
    <section
      ref={containerRef}
      className="relative h-[200vh]"
      id="hero"
      aria-label="Hero – Trackeo Personas"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* 1. Video de fondo con zoom por scroll */}
        <VideoBackground videoScale={videoScale} videoOpacity={videoOpacity} />

        {/* 2. Vignette — funde bordes con #0a0a0a */}
        <VignetteOverlay />

        {/* 3. Floating cards con parallax (z-index sobre video, debajo del texto) */}
        <FloatingCardGPS y={card1Y} />
        <FloatingCardStatus y={card2Y} />

        {/* 4. Contenido del Hero sobre todo */}
        <HeroContent opacity={textOpacity} y={textY} />

        {/* 5. Scroll cue */}
        <ScrollCue progress={progress} />
      </div>
    </section>
  );
}
