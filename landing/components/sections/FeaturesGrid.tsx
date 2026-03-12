"use client";

import { useRef } from "react";
import {
  MapPin,
  Zap,
  Bell,
  BarChart3,
  Shield,
  Fuel,
  Route,
  Smartphone,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/components/ui/cn";

const features = [
  {
    icon: MapPin,
    title: "GPS en tiempo real",
    description: "Ubicación exacta. Actualizada cada pocos segundos.",
    size: "large", // 2 cols
    accent: true,
  },
  {
    icon: Shield,
    title: "Corte de motor",
    description: "Inmoviliza tu vehículo desde el teléfono.",
    size: "normal",
    accent: false,
  },
  {
    icon: Zap,
    title: "IA predictiva",
    description: "Detecta fallas antes de que ocurran.",
    size: "normal",
    accent: false,
  },
  {
    icon: Bell,
    title: "Alertas inteligentes",
    description: "Geocercas, velocidad e ignición en tiempo real.",
    size: "normal",
    accent: false,
  },
  {
    icon: Smartphone,
    title: "App móvil",
    description: "Control total desde iOS y Android.",
    size: "normal",
    accent: false,
  },
  {
    icon: Fuel,
    title: "Monitoreo de combustible",
    description: "Nivel, consumo y detección de anomalías.",
    size: "normal",
    accent: false,
  },
  {
    icon: Route,
    title: "Rutas optimizadas",
    description: "IA + tráfico en vivo para ahorrar tiempo y dinero.",
    size: "normal",
    accent: false,
  },
  {
    icon: BarChart3,
    title: "Reportes y análisis",
    description: "Comportamiento de conducción, historial y KPIs.",
    size: "normal",
    accent: false,
  },
] as const;

type Feature = (typeof features)[number];

function BentoCard({
  feature,
  index,
  isInView,
}: {
  feature: Feature;
  index: number;
  isInView: boolean;
}) {
  const Icon = feature.icon;
  const isLarge = feature.size === "large";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.38, delay: index * 0.06 }}
      className={cn(
        "group relative rounded-2xl border p-6 overflow-hidden transition-colors duration-300",
        isLarge ? "sm:col-span-2" : "col-span-1",
        feature.accent
          ? "border-amber-500/20 bg-[#0f0d08] hover:border-amber-500/30"
          : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12] hover:bg-white/[0.035]"
      )}
    >
      {/* Subtle ambient for large accent card */}
      {feature.accent && (
        <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Icon */}
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl mb-5",
            feature.accent
              ? "bg-amber-500/15 text-amber-400"
              : "bg-white/[0.06] text-white/50 group-hover:text-white/70 transition-colors"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        {/* Text */}
        <h3
          className={cn(
            "font-semibold leading-tight",
            isLarge ? "text-lg" : "text-sm",
            feature.accent ? "text-amber-100" : "text-white/85"
          )}
        >
          {feature.title}
        </h3>
        <p
          className={cn(
            "mt-2 leading-relaxed",
            isLarge ? "text-sm max-w-xs" : "text-xs",
            "text-white/40"
          )}
        >
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

export function FeaturesGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="funciones"
      ref={ref}
      className="relative border-t border-white/[0.06] bg-[#0a0a0a] py-32 px-4"
      aria-labelledby="features-title"
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            className="text-xs text-amber-500/80 font-medium tracking-widest uppercase mb-4"
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
          >
            Funciones
          </motion.p>
          <motion.h2
            id="features-title"
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            Todo lo que necesitas en una sola plataforma
          </motion.h2>
          <motion.p
            className="mx-auto mt-4 max-w-xl text-base text-white/40"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            Seguridad, ahorro y control total — desde el primer vehículo.
          </motion.p>
        </div>

        {/* Bento grid — 3 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <BentoCard
              key={feature.title}
              feature={feature}
              index={i}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
