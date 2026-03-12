"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  useScroll,
  useTransform,
  motion,
  useSpring,
} from "framer-motion";
import {
  MapPin,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Navigation,
  Fuel,
  Battery,
  TrendingUp,
  FileText,
  AlertCircle,
  Car,
  History,
  Shield,
  Zap,
  BarChart3,
  Plus,
  AlertTriangle,
  Power,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";

/* ─────────────────────────────────────────── */
/*  Main export                                */
/* ─────────────────────────────────────────── */
export function HeroMapAnimation() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  /* Smooth spring for the map scale */
  const rawScale = useTransform(scrollYProgress, [0.18, 0.92], [1, 8]);
  const mapScale = useSpring(rawScale, { stiffness: 60, damping: 20, mass: 0.8 });

  /* Hero text */
  const textOpacity = useTransform(scrollYProgress, [0, 0.13], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.13], [0, -28]);

  /* Dashboard frame */
  const dashOpacity = useTransform(scrollYProgress, [0.1, 0.22], [0, 1]);
  const dashY = useTransform(scrollYProgress, [0.1, 0.22], [32, 0]);

  /* Map content layers */
  const chileOpacity = useTransform(scrollYProgress, [0.18, 0.42], [1, 0]);
  const cityOpacity = useTransform(
    scrollYProgress,
    [0.35, 0.5, 0.68, 0.78],
    [0, 1, 1, 0]
  );
  const streetOpacity = useTransform(scrollYProgress, [0.68, 0.82], [0, 1]);

  /* Location label */
  const santiagoBadgeOpacity = useTransform(scrollYProgress, [0.4, 0.55], [0, 1]);
  const vehiclePanelOpacity = useTransform(scrollYProgress, [0.8, 0.92], [0, 1]);

  return (
    <section
      ref={containerRef}
      className="relative h-[400vh]"
      aria-label="Hero - Dashboard Trackeo en vivo"
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-[#070b14]">

        {/* ── Fondo de puntos subtle ── */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, #334155 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-trackeo-orange/10 blur-[140px]" />

        {/* ── PHASE 1: Texto hero (desaparece rápido) ── */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center px-4 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-trackeo-orange/30 bg-trackeo-orange/10 px-4 py-1.5"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-trackeo-orange" />
            <span className="text-sm font-medium text-trackeo-orange">
              GPS en tiempo real · Trackeo.cl
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-slate-100 sm:text-6xl lg:text-7xl"
          >
            Tu vehículo,{" "}
            <span className="text-trackeo-orange">ahora es inteligente</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-6 max-w-xl text-lg text-slate-400 sm:text-xl"
          >
            Seguridad, ahorro y control total desde una sola plataforma
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Link
              href="https://app.trackeo.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-trackeo-orange px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-trackeo-orange-hover"
            >
              Ir a la Plataforma →
            </Link>
            <a
              href="#planes"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 px-7 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur-sm transition hover:border-slate-600 hover:bg-slate-800"
            >
              Ver Planes
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-sm text-slate-500"
          >
            ↓ Desplázate para ver el dashboard en acción
          </motion.p>
        </motion.div>

        {/* ── PHASE 2+: Dashboard mockup ── */}
        <motion.div
          style={{ opacity: dashOpacity, y: dashY }}
          className="absolute inset-3 z-20 overflow-hidden rounded-xl border border-slate-700/60 shadow-[0_0_80px_rgba(0,0,0,0.8)] sm:inset-5 lg:inset-8"
        >
          <div className="flex h-full bg-[#0d1117]">

            {/* ── Sidebar ── */}
            <Sidebar />

            {/* ── Main area ── */}
            <div className="flex min-w-0 flex-1 flex-col">

              {/* Top bar */}
              <TopBar />

              {/* Demo banner */}
              <div className="flex shrink-0 items-center justify-between gap-3 bg-trackeo-orange px-4 py-2">
                <span className="text-xs font-medium text-white">
                  Estás explorando una versión de demostración.
                </span>
                <button className="shrink-0 rounded-md bg-white px-3 py-1 text-xs font-semibold text-trackeo-orange transition hover:bg-slate-100">
                  Contratar Trackeo Ahora
                </button>
              </div>

              {/* Status bar */}
              <StatusBar />

              {/* Map area */}
              <div className="relative flex-1 overflow-hidden bg-[#141e2e]">
                {/* Zoom target: transformOrigin points to Santiago */}
                <motion.div
                  style={{
                    scale: mapScale,
                    transformOrigin: "62% 38%",
                  }}
                  className="absolute inset-0 will-change-transform"
                >
                  {/* Layer 1: Chile overview */}
                  <motion.div
                    style={{ opacity: chileOpacity }}
                    className="absolute inset-0"
                  >
                    <ChileOverlay />
                  </motion.div>

                  {/* Layer 2: City grid (Santiago) */}
                  <motion.div
                    style={{ opacity: cityOpacity }}
                    className="absolute inset-0"
                  >
                    <CityGrid />
                  </motion.div>

                  {/* Layer 3: Street level + vehicle */}
                  <motion.div
                    style={{ opacity: streetOpacity }}
                    className="absolute inset-0"
                  >
                    <StreetLevel />
                  </motion.div>
                </motion.div>

                {/* Map UI overlays (not zoomed) */}
                <MapControls />

                {/* Santiago badge */}
                <motion.div
                  style={{ opacity: santiagoBadgeOpacity }}
                  className="pointer-events-none absolute left-1/2 top-[35%] z-10 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="flex items-center gap-1.5 rounded-full border border-trackeo-orange/40 bg-[#0d1117]/90 px-3 py-1.5 text-xs font-semibold text-trackeo-orange shadow-lg backdrop-blur-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    Santiago, Chile
                  </div>
                </motion.div>

                {/* Vehicle live panel */}
                <motion.div
                  style={{ opacity: vehiclePanelOpacity }}
                  className="absolute bottom-3 left-3 z-10 w-52 rounded-xl border border-slate-700/80 bg-[#0d1117]/90 p-3 backdrop-blur-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      Camioneta Toyota Hilux
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-green-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                      Online
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-2">
                    {[
                      { label: "Velocidad", value: "45 km/h" },
                      { label: "Recorrido", value: "47.8 km" },
                      { label: "Batería", value: "12.8 V" },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <div className="text-[9px] text-slate-500">{label}</div>
                        <div className="text-[10px] font-semibold text-slate-200">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* ── Right panel ── */}
            <RightPanel />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────── */
/*  Dashboard sub-components                   */
/* ─────────────────────────────────────────── */

function Sidebar() {
  const menuGroups = [
    {
      label: "PRINCIPAL",
      items: [
        { icon: Car, label: "Mis Vehículos", active: true },
        { icon: Plus, label: "Añadir vehículo" },
        { icon: History, label: "Historial" },
        { icon: Navigation, label: "Rutas" },
        { icon: MapPin, label: "Geovallas" },
        { icon: Shield, label: "Protege mi camino" },
      ],
    },
    {
      label: "GESTIÓN",
      items: [
        { icon: AlertTriangle, label: "Alertas" },
        { icon: Settings, label: "Mantención" },
      ],
    },
    {
      label: "CONTROL",
      items: [
        { icon: Power, label: "Detener Motor" },
        { icon: Car, label: "Modo Estacionado" },
        { icon: SlidersHorizontal, label: "Configuraciones" },
      ],
    },
  ];

  return (
    <div className="hidden w-44 shrink-0 flex-col border-r border-slate-800 bg-[#0a0f1a] lg:flex xl:w-52">
      {/* Logo */}
      <div className="flex h-11 items-center gap-2 border-b border-slate-800 px-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-trackeo-orange text-[10px] font-bold text-white">
          T
        </div>
        <span className="text-xs font-bold text-slate-200">
          TRACKEO <span className="text-trackeo-orange">PERSONAS</span>
        </span>
      </div>

      {/* Menu groups */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-widest text-slate-600">
              {group.label}
            </p>
            {group.items.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition ${
                  active
                    ? "bg-trackeo-orange/10 text-trackeo-orange"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
                {active && <ChevronRight className="ml-auto h-3 w-3 shrink-0" />}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-trackeo-orange text-[10px] font-bold text-white">
            U
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold text-slate-200">
              Usuario Demo
            </p>
            <p className="truncate text-[9px] text-slate-500">demo@trackeo.cl</p>
          </div>
        </div>
        <div className="mt-2 flex cursor-pointer items-center gap-1 text-[9px] text-slate-500 hover:text-slate-400">
          <LogOut className="h-3 w-3" />
          Cerrar Sesión
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-800 bg-[#0d1117] px-3">
      <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
        <Car className="h-3.5 w-3.5 text-slate-400" />
        Camioneta Toyota Hilux
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      <div className="flex items-center gap-2">
        <button className="relative flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <Settings className="h-4 w-4" />
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-trackeo-orange/10 px-2.5 py-1.5 text-[10px] font-semibold text-trackeo-orange">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-trackeo-orange text-[9px] font-bold text-white">
            U
          </div>
          Usuario / MI CUENTA
        </button>
      </div>
    </div>
  );
}

function StatusBar() {
  const stats = [
    { icon: null, dot: "bg-green-400", label: "Online", value: null },
    { icon: Car, label: "Estado", value: "Detenido" },
    { icon: TrendingUp, label: "Ahorro", value: "$97k" },
    { icon: Navigation, label: "Recorrido", value: "47832 km" },
    { icon: Battery, label: "Batería", value: "12.8 V" },
  ];

  return (
    <div className="flex shrink-0 items-center gap-0 border-b border-slate-800 bg-[#0d1117]">
      {stats.map(({ icon: Icon, dot, label, value }, i) => (
        <div
          key={label}
          className={`flex flex-1 items-center justify-center gap-1.5 border-r border-slate-800 py-2 px-2 last:border-r-0 ${
            i === 0 ? "text-green-400" : "text-slate-300"
          }`}
        >
          {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
          {Icon && <Icon className="h-3 w-3 shrink-0 text-slate-500" />}
          <div className="text-center">
            {value ? (
              <>
                <div className="text-[11px] font-semibold leading-none">{value}</div>
                <div className="text-[9px] text-slate-500">{label}</div>
              </>
            ) : (
              <div className="text-[11px] font-semibold leading-none">{label}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MapControls() {
  return (
    <>
      {/* Zoom buttons */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-slate-700 bg-[#0d1117]/90 backdrop-blur-sm">
        <button className="flex h-7 w-7 items-center justify-center text-lg font-light text-slate-300 hover:bg-slate-800">
          +
        </button>
        <div className="h-px bg-slate-700" />
        <button className="flex h-7 w-7 items-center justify-center text-lg font-light text-slate-300 hover:bg-slate-800">
          −
        </button>
      </div>
      {/* Attribution */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-slate-600">
        © Trackeo · Santiago, Chile
      </div>
    </>
  );
}

function RightPanel() {
  return (
    <div className="hidden w-52 shrink-0 flex-col gap-0 overflow-y-auto border-l border-slate-800 bg-[#0a0f1a] xl:flex">
      {/* Ahorros */}
      <div className="border-b border-slate-800 p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Ahorros totales</span>
          <span className="flex items-center gap-1 text-[10px] text-green-400">
            <TrendingUp className="h-3 w-3" /> Tendencia
          </span>
        </div>
        <div className="text-2xl font-bold text-slate-100">97.329</div>
        <div className="text-[10px] text-slate-400">$/mes</div>
        <div className="mt-3 space-y-1.5">
          {[
            { icon: Fuel, label: "Combustible", value: "85.338" },
            { icon: Settings, label: "Mantención", value: "11.991" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <Icon className="h-3 w-3" />
                {label}
              </div>
              <span className="text-[10px] font-semibold text-slate-200">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Documentación */}
      <div className="border-b border-slate-800 p-4">
        <div className="mb-2 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-200">
            Documentación del Vehículo
          </span>
        </div>
        {[
          { label: "Revisión Técnica", date: "venció 14 dic 2024", badge: "Vencido", color: "bg-red-500/20 text-red-400" },
          { label: "Seguro", date: "vence 10 mar 2026", badge: "Por Vencer", color: "bg-yellow-500/20 text-yellow-400" },
          { label: "Permiso Circulación", date: "venció 30 nov 2025", badge: "Vencido", color: "bg-red-500/20 text-red-400" },
        ].map(({ label, date, badge, color }) => (
          <div key={label} className="mb-2 flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium text-slate-300">{label}</p>
              <p className="text-[9px] text-slate-600">{date}</p>
            </div>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${color}`}>
              {badge}
            </span>
          </div>
        ))}
        <button className="flex items-center gap-1 text-[10px] text-trackeo-orange">
          Ver todos <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Uso Semanal */}
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-200">Uso Semanal</p>
            <p className="text-[9px] text-slate-500">Kilómetros por día</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-green-400">
            <TrendingUp className="h-3 w-3" /> +12%
          </span>
        </div>
        <MiniLineChart />
      </div>
    </div>
  );
}

function MiniLineChart() {
  const points = [70, 105, 85, 130, 95, 120, 110];
  const max = 140;
  const w = 180;
  const h = 60;

  const pathD = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - (v / max) * h;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaD =
    pathD +
    ` L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8800" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ff8800" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaD}
        fill="url(#chartGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
      />
      <motion.path
        d={pathD}
        fill="none"
        stroke="#ff8800"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
    </svg>
  );
}

/* ─────────────────────────────────────────── */
/*  Map layers                                 */
/* ─────────────────────────────────────────── */

/** Layer 1: Overview of Chile + Santiago marker */
function ChileOverlay() {
  /* Simplified Chile polygon (approximate, portrait orientation) */
  const chilePoints =
    "200,30 215,55 225,90 230,130 225,180 220,220 215,260 218,300 215,340 210,380 205,420 195,460 180,490 165,510 145,510 140,490 150,460 155,420 155,380 158,340 155,300 158,260 155,220 150,180 145,130 148,90 155,55 170,30";

  return (
    <svg
      viewBox="0 0 400 550"
      className="absolute inset-0 h-full w-full"
      style={{ backgroundColor: "#141e2e" }}
      aria-hidden
    >
      {/* Ocean gradient */}
      <rect width="400" height="550" fill="#141e2e" />
      {/* Lat/lon grid */}
      {[...Array(8)].map((_, i) => (
        <line
          key={`h${i}`}
          x1="0" y1={i * 70} x2="400" y2={i * 70}
          stroke="#1e293b" strokeWidth="0.5"
        />
      ))}
      {[...Array(6)].map((_, i) => (
        <line
          key={`v${i}`}
          x1={i * 80} y1="0" x2={i * 80} y2="550"
          stroke="#1e293b" strokeWidth="0.5"
        />
      ))}
      {/* Neighboring countries hint */}
      <rect x="220" y="50" width="160" height="400" rx="4" fill="#192232" opacity="0.7" />
      {/* Bolivia/Peru hint */}
      <ellipse cx="280" cy="80" rx="60" ry="35" fill="#1a2a3a" opacity="0.5" />
      {/* Chile */}
      <polygon points={chilePoints} fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" opacity="0.9" />
      {/* Santiago highlight */}
      <circle cx="207" cy="290" r="10" fill="#ff8800" opacity="0.25" />
      <circle cx="207" cy="290" r="5" fill="#ff8800" opacity="0.7" />
      <motion.circle
        cx="207" cy="290" r="14"
        fill="none" stroke="#ff8800" strokeWidth="1"
        animate={{ r: [10, 22], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* City labels */}
      <text x="214" y="288" fontSize="7" fill="#94a3b8" fontFamily="monospace">Santiago</text>
      <text x="202" y="160" fontSize="6" fill="#64748b" fontFamily="monospace">La Serena</text>
      <text x="195" y="380" fontSize="6" fill="#64748b" fontFamily="monospace">Concepción</text>
      <text x="185" y="450" fontSize="6" fill="#64748b" fontFamily="monospace">Puerto Montt</text>
      <text x="240" y="80" fontSize="7" fill="#475569" fontFamily="monospace">Argentina</text>
      <text x="258" y="68" fontSize="6" fill="#475569" fontFamily="monospace">Bolivia</text>
    </svg>
  );
}

/** Layer 2: City-level grid (Santiago) */
function CityGrid() {
  return (
    <div
      className="absolute inset-0"
      style={{ backgroundColor: "#111827" }}
    >
      {/* Main street grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(90deg, #1e293b 1px, transparent 1px)",
            "linear-gradient(0deg,   #1e293b 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "40px 40px",
        }}
      />
      {/* Major avenues (thicker) */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: [
            "linear-gradient(90deg, #334155 2px, transparent 2px)",
            "linear-gradient(0deg,   #334155 2px, transparent 2px)",
          ].join(","),
          backgroundSize: "160px 160px",
        }}
      />
      {/* Park (Parque O'Higgins area) */}
      <div className="absolute left-[55%] top-[52%] h-16 w-20 rounded-sm bg-green-900/40 border border-green-800/30" />
      {/* Santiago center marker */}
      <div className="absolute left-[50%] top-[38%] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full border-2 border-trackeo-orange"
          style={{ width: 20, height: 20, top: -4, left: -4 }}
        />
        <div className="h-3 w-3 rounded-full bg-trackeo-orange shadow-[0_0_8px_#ff8800]" />
      </div>
      {/* Street names */}
      {[
        { x: "20%", y: "30%", label: "Av. Lib. Bernardo O'Higgins" },
        { x: "25%", y: "55%", label: "Av. Vicuña Mackenna" },
        { x: "60%", y: "22%", label: "Av. Andrés Bello" },
      ].map(({ x, y, label }) => (
        <div
          key={label}
          className="absolute text-[7px] text-slate-600"
          style={{ left: x, top: y }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

/** Layer 3: Street level with animated vehicle */
function StreetLevel() {
  /* Waypoints for vehicle animation */
  const waypoints = [
    { left: "35%", top: "55%" },
    { left: "48%", top: "55%" },
    { left: "48%", top: "42%" },
    { left: "58%", top: "42%" },
    { left: "58%", top: "35%" },
  ];

  return (
    <div
      className="absolute inset-0"
      style={{ backgroundColor: "#0f172a" }}
    >
      {/* Fine street grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(90deg, #1e293b 1px, transparent 1px)",
            "linear-gradient(0deg,   #1e293b 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "20px 20px",
        }}
      />
      {/* Main avenues */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(90deg, #2a3f5f 2px, transparent 2px)",
            "linear-gradient(0deg,   #2a3f5f 2px, transparent 2px)",
          ].join(","),
          backgroundSize: "80px 80px",
        }}
      />
      {/* Building blocks */}
      {[
        { l: "22%", t: "20%", w: 70, h: 50 },
        { l: "40%", t: "18%", w: 55, h: 40 },
        { l: "62%", t: "22%", w: 65, h: 60 },
        { l: "22%", t: "45%", w: 60, h: 55 },
        { l: "62%", t: "48%", w: 70, h: 45 },
        { l: "22%", t: "70%", w: 80, h: 40 },
        { l: "55%", t: "65%", w: 65, h: 50 },
      ].map(({ l, t, w, h }, i) => (
        <div
          key={i}
          className="absolute rounded-sm bg-[#192032] border border-[#1e293b]"
          style={{ left: l, top: t, width: w, height: h }}
        />
      ))}
      {/* Route path */}
      <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }} aria-hidden>
        <motion.polyline
          points="35%,55% 48%,55% 48%,42% 58%,42% 58%,35%"
          fill="none"
          stroke="#ff8800"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          style={{ vectorEffect: "non-scaling-stroke" } as React.CSSProperties}
        />
      </svg>
      {/* Animated vehicle */}
      <motion.div
        animate={{
          left: waypoints.map((w) => w.left),
          top: waypoints.map((w) => w.top),
        }}
        transition={{
          duration: 8,
          ease: "linear",
          repeat: Infinity,
          repeatDelay: 1,
          times: [0, 0.25, 0.5, 0.75, 1],
        }}
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="relative">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-trackeo-orange shadow-[0_0_12px_rgba(255,136,0,0.8)]">
            <Car className="h-4 w-4 text-white" />
          </div>
          <motion.div
            animate={{ scale: [1, 2], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-trackeo-orange"
          />
        </div>
      </motion.div>
    </div>
  );
}
