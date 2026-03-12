"use client";

import { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, motion, useSpring, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ShieldAlert,
  Truck,
  BarChart3,
  Bell,
  Zap,
  Navigation,
  Fuel,
  TrendingUp,
  TrendingDown,
  Car,
  Activity,
  Clock,
  AlertTriangle,
} from "lucide-react";

/* ─────────────────────────────────────────── */
/*  Phase definitions                          */
/* ─────────────────────────────────────────── */
const phases = [
  {
    phase: "01",
    title: "Ubicación en tiempo real",
    description:
      "Mapa interactivo con rutas, geocercas y tráfico en vivo. Sabe exactamente dónde está tu vehículo, segundo a segundo.",
    icon: MapPin,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    accent: "#22c55e",
  },
  {
    phase: "02",
    title: "Alertas inteligentes",
    description:
      "Notificaciones instantáneas por velocidad, geocercas, encendido y corte de motor. Control total en tu teléfono.",
    icon: ShieldAlert,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    accent: "#ef4444",
  },
  {
    phase: "03",
    title: "Gestión de flotas",
    description:
      "Visibilidad total de todos tus vehículos en tiempo real. Estados, rutas y reportes centralizados.",
    icon: Truck,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    accent: "#3b82f6",
  },
  {
    phase: "04",
    title: "Analítica e inteligencia",
    description:
      "IA que predice fallas, optimiza combustible y genera reportes automáticos. Ahorra dinero sin hacer nada.",
    icon: BarChart3,
    color: "text-trackeo-orange",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    accent: "#ff8800",
  },
];

/* ─────────────────────────────────────────── */
/*  Main export                                */
/* ─────────────────────────────────────────── */
export function DashboardStoryScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activePhase, setActivePhase] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.8", "end 0.2"],
  });

  const rawProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const smoothProgress = useSpring(rawProgress, { stiffness: 80, damping: 20 });

  /* Progress bar height (0% → 100%) */
  const progressHeight = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  /* Sync active phase with scroll */
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const idx = Math.min(
        phases.length - 1,
        Math.floor(v * phases.length)
      );
      setActivePhase(idx < 0 ? 0 : idx);
    });
    return unsubscribe;
  }, [scrollYProgress]);

  return (
    <section
      id="plataforma"
      ref={sectionRef}
      className="relative border-t border-slate-800 bg-[#0a0a0a] px-4 py-24"
      aria-labelledby="dashboard-title"
    >
      {/* Section header */}
      <div className="mx-auto max-w-7xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-3 text-sm font-semibold uppercase tracking-widest text-trackeo-orange"
        >
          La plataforma en acción
        </motion.p>
        <motion.h2
          id="dashboard-title"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl"
        >
          Todo lo que necesitas, en un solo lugar
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-4 max-w-2xl text-lg text-slate-400"
        >
          Un tour por las 4 capacidades principales de Trackeo
        </motion.p>
      </div>

      {/* Content: progress bar + phases */}
      <div className="relative mx-auto mt-20 max-w-7xl">
        <div className="flex gap-8 lg:gap-16">

          {/* ── Vertical progress bar (sticky) ── */}
          <div className="hidden flex-col items-center lg:flex">
            <div className="sticky top-1/2 -translate-y-1/2">
              <div className="relative flex flex-col items-center">
                {/* Track */}
                <div className="relative h-64 w-0.5 rounded-full bg-slate-800">
                  {/* Fill */}
                  <motion.div
                    style={{ height: progressHeight }}
                    className="absolute top-0 w-full origin-top rounded-full bg-trackeo-orange"
                  />
                  {/* Phase dots */}
                  {phases.map((p, i) => {
                    const topPct = (i / (phases.length - 1)) * 100;
                    const isActive = i <= activePhase;
                    return (
                      <motion.div
                        key={p.phase}
                        animate={{
                          scale: isActive ? 1 : 0.7,
                          backgroundColor: isActive ? "#ff8800" : "#1e293b",
                          borderColor: isActive ? "#ff8800" : "#334155",
                        }}
                        transition={{ duration: 0.3 }}
                        className="absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2"
                        style={{ top: `calc(${topPct}% - 6px)` }}
                      />
                    );
                  })}
                </div>

                {/* Phase labels */}
                <div className="absolute -right-28 top-0 flex h-64 flex-col justify-between">
                  {phases.map((p, i) => (
                    <motion.span
                      key={p.phase}
                      animate={{
                        color: i <= activePhase ? "#ff8800" : "#475569",
                        fontWeight: i === activePhase ? 700 : 400,
                      }}
                      transition={{ duration: 0.3 }}
                      className="text-xs"
                    >
                      {p.phase}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Phase blocks ── */}
          <div className="flex-1 space-y-40">
            {phases.map((phase, i) => {
              const demos = [
                MapPhaseDemo,
                AlertPhaseDemo,
                FleetPhaseDemo,
                AnalyticsPhaseDemo,
              ];
              const Demo = demos[i];
              const Icon = phase.icon;

              return (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-80px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="grid gap-12 lg:grid-cols-2 lg:items-center"
                >
                  {/* Text side */}
                  <div className={i % 2 === 0 ? "lg:order-1" : "lg:order-2"}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${phase.bg} ${phase.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest ${phase.color}`}>
                        Fase {phase.phase}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-100 lg:text-3xl">
                      {phase.title}
                    </h3>
                    <p className="mt-4 text-slate-400 leading-relaxed">{phase.description}</p>

                    {/* Feature bullets */}
                    <div className="mt-6 space-y-2">
                      {getPhaseBullets(i).map((bullet) => (
                        <div key={bullet} className="flex items-center gap-2 text-sm text-slate-300">
                          <div className={`h-1.5 w-1.5 rounded-full bg-current ${phase.color}`} />
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Demo side */}
                  <div className={i % 2 === 0 ? "lg:order-2" : "lg:order-1"}>
                    <div className="relative">
                      <Demo />
                      {/* Glow */}
                      <div
                        className="absolute -inset-2 -z-10 rounded-2xl blur-xl opacity-20"
                        style={{ backgroundColor: phase.accent }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function getPhaseBullets(i: number): string[] {
  return [
    ["Actualizaciones cada 5 segundos", "Google Maps + tráfico real", "Geocercas personalizables"],
    ["Alertas por SMS y push", "Corte remoto de motor", "Historial de eventos"],
    ["Hasta vehículos ilimitados", "Reportes por conductor", "Análisis de eficiencia"],
    ["IA predictiva de fallas", "Optimización de combustible", "Reportes automáticos"],
  ][i];
}

/* ─────────────────────────────────────────── */
/*  Demo 1: Mapa en tiempo real               */
/* ─────────────────────────────────────────── */
function MapPhaseDemo() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#0d1117] shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-xs font-semibold text-slate-300">Online · Santiago, Chile</span>
        </div>
        <span className="text-[10px] text-slate-500">47.832 km recorrido</span>
      </div>

      {/* Map area */}
      <div className="relative h-52 overflow-hidden bg-[#111827]">
        {/* Street grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: [
              "linear-gradient(90deg,#1e293b 1px,transparent 1px)",
              "linear-gradient(0deg,#1e293b 1px,transparent 1px)",
            ].join(","),
            backgroundSize: "28px 28px",
          }}
        />
        {/* Major roads */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: [
              "linear-gradient(90deg,#2a3f5f 2px,transparent 2px)",
              "linear-gradient(0deg,#2a3f5f 2px,transparent 2px)",
            ].join(","),
            backgroundSize: "112px 112px",
          }}
        />
        {/* Route SVG */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 208" aria-hidden>
          <motion.path
            d="M 60 160 L 60 100 L 180 100 L 180 60 L 340 60"
            stroke="#ff8800" strokeWidth="3" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="10 5"
            initial={{ pathLength: 0, opacity: 0.8 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
          />
        </svg>
        {/* Geofence */}
        <motion.div
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute right-[18%] top-[20%] h-14 w-14 rounded-full border-2 border-dashed border-green-500/60 bg-green-500/5"
        />
        <div className="absolute right-[26%] top-[15%] text-[9px] text-green-500/80">Geocerca</div>
        {/* Vehicle */}
        <motion.div
          animate={{
            left: ["15%", "15%", "45%", "45%", "85%"],
            top: ["77%", "48%", "48%", "29%", "29%"],
          }}
          transition={{ duration: 7, ease: "linear", repeat: Infinity, repeatDelay: 1, times: [0, 0.25, 0.5, 0.75, 1] }}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-trackeo-orange shadow-[0_0_10px_rgba(255,136,0,0.6)]">
            <Car className="h-4 w-4 text-white" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-trackeo-orange"
          />
        </motion.div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-3 divide-x divide-slate-800 border-t border-slate-800">
        {[
          { icon: Navigation, label: "Velocidad", value: "45 km/h", color: "text-green-400" },
          { icon: Clock, label: "Tiempo viaje", value: "23 min", color: "text-blue-400" },
          { icon: Fuel, label: "Combustible", value: "87%", color: "text-trackeo-orange" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center py-3">
            <Icon className={`mb-1 h-4 w-4 ${color}`} />
            <div className="text-sm font-bold text-slate-200">{value}</div>
            <div className="text-[10px] text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Demo 2: Alertas                           */
/* ─────────────────────────────────────────── */
function AlertPhaseDemo() {
  const [alertIndex, setAlertIndex] = useState(0);
  const alerts = [
    { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/15 border-red-500/40", title: "⚡ Exceso de velocidad", desc: "95 km/h en zona de 60 km/h — Rancagua Sur", time: "Hace 2 min" },
    { icon: MapPin, color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/40", title: "📍 Salida de geocerca", desc: "Vehículo salió del área 'Empresa' — Las Condes", time: "Hace 8 min" },
    { icon: Car, color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/40", title: "🔑 Motor encendido", desc: "Ignición detectada — Providencia, Santiago", time: "Hace 15 min" },
  ];
  const current = alerts[alertIndex];
  const Icon = current.icon;

  useEffect(() => {
    const t = setInterval(() => setAlertIndex((p) => (p + 1) % alerts.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#0d1117] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <span className="text-xs font-semibold text-slate-300">Panel de Alertas</span>
        <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
          3 activas
        </span>
      </div>

      {/* Alert banner (animated) */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={alertIndex}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-3 rounded-lg border p-3 ${current.bg}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${current.color}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${current.color}`}>{current.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-400 truncate">{current.desc}</p>
            </div>
            <span className="text-[10px] text-slate-500 shrink-0">{current.time}</span>
          </motion.div>
        </AnimatePresence>

        {/* Alert index dots */}
        <div className="mt-2 flex justify-center gap-1.5">
          {alerts.map((_, i) => (
            <div key={i} className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${i === alertIndex ? "bg-trackeo-orange" : "bg-slate-700"}`} />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2 border-t border-slate-800 p-4">
        {[
          { icon: Zap, label: "Cortar Motor", sub: "Acción remota", color: "border-red-500/30 bg-red-500/10 text-red-400" },
          { icon: Bell, label: "Notificar", sub: "Enviar alerta", color: "border-trackeo-orange/30 bg-orange-500/10 text-trackeo-orange" },
        ].map(({ icon: Icon, label, sub, color }) => (
          <div key={label} className={`flex items-center gap-2.5 rounded-lg border p-3 ${color}`}>
            <Icon className="h-4 w-4 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold">{label}</p>
              <p className="text-[9px] text-slate-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status row */}
      <div className="flex justify-around border-t border-slate-800 px-4 py-3">
        {[
          { label: "Estado motor", value: "Encendido", color: "text-green-400" },
          { label: "Última posición", value: "Santiago Centro", color: "text-slate-200" },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className="text-[9px] text-slate-500">{label}</p>
            <p className={`text-xs font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Demo 3: Flota                             */
/* ─────────────────────────────────────────── */
const fleetVehicles = [
  { id: 1, name: "Hilux #01", status: "moving" as const, speed: 45, driver: "C. Rojas", km: "12.4" },
  { id: 2, name: "Transit #02", status: "stopped" as const, speed: 0, driver: "M. López", km: "8.7" },
  { id: 3, name: "Sprinter #03", status: "moving" as const, speed: 62, driver: "A. Vera", km: "19.1" },
  { id: 4, name: "Ranger #04", status: "idle" as const, speed: 0, driver: "K. Silva", km: "3.2" },
  { id: 5, name: "Hilux #05", status: "moving" as const, speed: 38, driver: "P. Muñoz", km: "15.6" },
  { id: 6, name: "Boxer #06", status: "stopped" as const, speed: 0, driver: "J. Pérez", km: "6.9" },
];

const statusConfig = {
  moving: { label: "En movimiento", dot: "bg-green-400 animate-pulse", text: "text-green-400" },
  stopped: { label: "Detenido", dot: "bg-red-400", text: "text-red-400" },
  idle: { label: "Inactivo", dot: "bg-yellow-400", text: "text-yellow-400" },
};

function FleetPhaseDemo() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#0d1117] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <div>
          <p className="text-xs font-semibold text-slate-200">Vista de Flota</p>
          <p className="text-[10px] text-slate-500">6 vehículos · 3 activos</p>
        </div>
        <div className="flex gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-400" />3 mov.</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />2 det.</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />1 inac.</span>
        </div>
      </div>

      {/* Vehicle grid */}
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        {fleetVehicles.map((v, i) => {
          const cfg = statusConfig[v.status];
          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-200 truncate">{v.name}</span>
                <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
              </div>
              <p className={`text-[10px] font-medium ${cfg.text}`}>
                {v.status === "moving" ? `${v.speed} km/h` : cfg.label}
              </p>
              <p className="text-[9px] text-slate-600">{v.driver}</p>
              <p className="text-[9px] text-slate-500">{v.km} km hoy</p>
            </motion.div>
          );
        })}
      </div>

      {/* Summary bar */}
      <div className="flex justify-around border-t border-slate-800 px-4 py-2.5">
        {[
          { label: "Total km hoy", value: "66.9" },
          { label: "Velocidad prom.", value: "41 km/h" },
          { label: "Eficiencia", value: "94%" },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-xs font-bold text-slate-200">{value}</div>
            <div className="text-[9px] text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Demo 4: Analítica e inteligencia          */
/* ─────────────────────────────────────────── */
function AnalyticsPhaseDemo() {
  const weekKm = [
    { day: "L", km: 85 },
    { day: "M", km: 120 },
    { day: "X", km: 95 },
    { day: "J", km: 140 },
    { day: "V", km: 110 },
    { day: "S", km: 60 },
    { day: "D", km: 30 },
  ];
  const maxKm = 140;

  const fuelLine = [72, 68, 74, 65, 70, 67, 63, 71, 66, 62, 68, 64];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#0d1117] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <span className="text-xs font-semibold text-slate-300">Dashboard Analítico</span>
        <span className="text-[10px] text-slate-500">Últimos 7 días</span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 divide-x divide-slate-800 border-b border-slate-800">
        {[
          { label: "Ahorro total", value: "$97.329", sub: "este mes", trend: "+12%", up: true },
          { label: "Km recorridos", value: "640", sub: "esta semana", trend: "+8%", up: true },
          { label: "Consumo", value: "8.4 L", sub: "por 100 km", trend: "-5%", up: false },
        ].map(({ label, value, sub, trend, up }) => (
          <div key={label} className="p-3 text-center">
            <p className="text-[9px] text-slate-500">{label}</p>
            <p className="text-sm font-bold text-slate-100">{value}</p>
            <p className="text-[9px] text-slate-500">{sub}</p>
            <span className={`flex items-center justify-center gap-0.5 text-[10px] font-semibold ${up ? "text-green-400" : "text-blue-400"}`}>
              {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {trend}
            </span>
          </div>
        ))}
      </div>

      {/* Bar chart: km por día */}
      <div className="px-4 pt-3 pb-1">
        <p className="mb-2 text-[10px] font-semibold text-slate-400">Kilómetros por día</p>
        <div className="flex items-end gap-1.5 h-20">
          {weekKm.map(({ day, km }, i) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${(km / maxKm) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.07 }}
                className="w-full rounded-t-sm"
                style={{ backgroundColor: km === maxKm ? "#ff8800" : "#1e40af88" }}
              />
              <span className="text-[9px] text-slate-500">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line chart: consumo */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-semibold text-slate-400">Tendencia de consumo (L/100km)</p>
          <span className="text-[10px] text-blue-400">▾ Mejorando</span>
        </div>
        <MiniSparkline data={fuelLine} color="#3b82f6" />
      </div>

      {/* AI insight */}
      <div className="flex items-start gap-3 border-t border-slate-800 bg-orange-500/5 px-4 py-3">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-trackeo-orange/20">
          <Activity className="h-3.5 w-3.5 text-trackeo-orange" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-trackeo-orange">IA Predictiva</p>
          <p className="text-[10px] text-slate-400">
            Cambio de aceite recomendado en ~1.200 km · Filtro de aire al 78% de vida útil
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Shared chart helpers                       */
/* ─────────────────────────────────────────── */
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const w = 300;
  const h = 36;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return [x, y] as [number, number];
  });

  const pathD = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const areaD = pathD + ` L ${w} ${h} L 0 ${h} Z`;

  const gradId = `spark-${color.replace("#", "")}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 36 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaD}
        fill={`url(#${gradId})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      />
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
    </svg>
  );
}
