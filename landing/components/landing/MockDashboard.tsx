"use client";

import { useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

type Phase = "map" | "routes" | "alerts";

function useScrollPhase(containerRef: React.RefObject<HTMLElement | null>) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const phase = useTransform(scrollYProgress, (v) => {
    if (v < 0.33) return "map";
    if (v < 0.66) return "routes";
    return "alerts";
  });

  return phase;
}

export default function MockDashboard({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const phase = useScrollPhase(containerRef);
  const [phaseValue, setPhaseValue] = useState<Phase>("map");
  useMotionValueEvent(phase, "change", setPhaseValue);

  return (
    <div className="sticky top-24 w-full max-w-[420px] mx-auto lg:max-w-md">
      <motion.div
        className="rounded-xl border border-graphite-600 bg-graphite-900/95 shadow-2xl overflow-hidden backdrop-blur"
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-graphite-700 bg-graphite-800/80">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono flex-1 text-center">
            app.trackeo.cl
          </span>
        </div>

        <div className="relative min-h-[320px]">
          <motion.div
            className="absolute inset-0 p-3 flex flex-col"
            initial={false}
            animate={{ opacity: phaseValue === "map" ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: phaseValue === "map" ? "auto" : "none" }}
          >
            <PhaseMap />
          </motion.div>
          <motion.div
            className="absolute inset-0 p-3 flex flex-col"
            initial={false}
            animate={{ opacity: phaseValue === "routes" ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: phaseValue === "routes" ? "auto" : "none" }}
          >
            <PhaseRoutes />
          </motion.div>
          <motion.div
            className="absolute inset-0 p-3 flex flex-col"
            initial={false}
            animate={{ opacity: phaseValue === "alerts" ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: phaseValue === "alerts" ? "auto" : "none" }}
          >
            <PhaseAlerts />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function PhaseMap() {
  return (
    <>
      <div className="text-[10px] text-amber-500 font-medium mb-2">Mapa en vivo</div>
      <div className="flex-1 rounded-lg bg-graphite-800 border border-graphite-600 overflow-hidden relative">
        {/* Simple map grid */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-b border-graphite-600"
              style={{ top: `${(i + 1) * 16}%` }}
            />
          ))}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute h-full border-r border-graphite-600"
              style={{ left: `${(i + 1) * 20}%` }}
            />
          ))}
        </div>
        {/* Vehicle dot */}
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50"
          style={{ left: "45%", top: "40%" }}
          animate={{
            scale: [1, 1.2, 1],
            boxShadow: [
              "0 0 0 0 rgba(245, 158, 11, 0.4)",
              "0 0 0 12px rgba(245, 158, 11, 0)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="absolute bottom-2 left-2 right-2 h-1.5 rounded-full bg-graphite-700">
          <motion.div
            className="h-full rounded-full bg-amber-500/80"
            initial={{ width: "30%" }}
            animate={{ width: ["30%", "70%", "30%"] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[9px] text-zinc-500">
        <span>Latencia &lt;2s</span>
        <span>Actualizado ahora</span>
      </div>
    </>
  );
}

function PhaseRoutes() {
  return (
    <>
      <div className="text-[10px] text-amber-500 font-medium mb-2">Historial de rutas</div>
      <div className="flex-1 rounded-lg bg-graphite-800 border border-graphite-600 p-2 space-y-2 overflow-hidden">
        {[
          { label: "Hoy 08:00 - 12:45", percent: 92 },
          { label: "Ayer 14:20 - 18:30", percent: 78 },
          { label: "Lun 09:15 - 17:00", percent: 65 },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-400 flex-shrink-0 w-24 truncate">
              {r.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-graphite-700 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-amber-500/80"
                initial={{ width: 0 }}
                animate={{ width: `${r.percent}%` }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              />
            </div>
            <span className="text-[9px] text-zinc-500 w-6">{r.percent}%</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[9px] text-zinc-500">Telemetría exacta por tramo</div>
    </>
  );
}

function PhaseAlerts() {
  return (
    <>
      <div className="text-[10px] text-amber-500 font-medium mb-2">Alertas y geocercas</div>
      <div className="flex-1 rounded-lg bg-graphite-800 border border-graphite-600 p-2 space-y-2 overflow-hidden">
        {[
          { type: "entrada", text: "Casa — Entrada", time: "Hace 5 min", ok: true },
          { type: "salida", text: "Oficina — Salida", time: "Hace 2 h", ok: false },
          { type: "geocerca", text: "Zona segura activa", time: "Ahora", ok: true },
        ].map((a, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2 py-1.5 px-2 rounded bg-graphite-700/50"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                a.ok ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className="text-[9px] text-zinc-300 flex-1 truncate">{a.text}</span>
            <span className="text-[8px] text-zinc-500">{a.time}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-2 text-[9px] text-zinc-500">Alertas personalizadas · Geocercas</div>
    </>
  );
}
