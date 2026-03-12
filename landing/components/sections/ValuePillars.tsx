"use client";

import { useRef } from "react";
import { DollarSign, Shield, BarChart, Zap } from "lucide-react";
import { useInView, motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { cn } from "@/components/ui/cn";

const pillars = [
  {
    icon: DollarSign,
    iconColor: "text-green-400",
    iconBg: "bg-green-500/10",
    title: "Ahorra sin esfuerzo",
    description:
      "Hasta $50.000/mes en combustible, multas y mantenimiento preventivo",
    stat: {
      value: 47850,
      label: "Ahorro promedio mensual",
      prefix: "$",
      trend: "+12%",
      trendColor: "text-green-400",
    },
  },
  {
    icon: Shield,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    title: "Protección total",
    description:
      "Antirrobo con corte de motor, geocercas y alertas en tiempo real",
    stat: {
      value: 98,
      label: "Tasa de recuperación de vehículos",
      suffix: "%",
      trend: "Líder en Chile",
      trendColor: "text-blue-400",
    },
  },
  {
    icon: BarChart,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10",
    title: "Control absoluto",
    description: "Visibilidad 24/7 de toda tu flota desde cualquier dispositivo",
    stat: {
      value: 1200,
      label: "Empresas confían en Trackeo",
      suffix: "+",
      trend: "En crecimiento",
      trendColor: "text-purple-400",
    },
  },
  {
    icon: Zap,
    iconColor: "text-[#ff8800]",
    iconBg: "bg-orange-500/10",
    title: "Eficiencia inteligente",
    description:
      "IA predice fallas, optimiza rutas y reduce costos operativos",
    stat: {
      value: 23,
      label: "Reducción promedio en consumo",
      suffix: "%",
      trend: "+5% vs año anterior",
      trendColor: "text-orange-400",
    },
  },
];

function PillarCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  stat,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  stat: {
    value: number;
    label: string;
    prefix?: string;
    suffix?: string;
    trend?: string;
    trendColor: string;
  };
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "group relative rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm",
        "transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/70"
      )}
    >
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            iconBg,
            iconColor
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-1">
            {stat.prefix && (
              <span className="text-2xl font-bold text-slate-100">
                {stat.prefix}
              </span>
            )}
            <AnimatedCounter
              value={stat.value}
              className="text-4xl font-bold text-slate-100"
            />
            {stat.suffix && (
              <span className="text-2xl font-bold text-slate-100">
                {stat.suffix}
              </span>
            )}
            {stat.trend && (
              <span className={cn("ml-2 text-sm", stat.trendColor)}>
                {stat.trend}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">{stat.label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function ValuePillars() {
  return (
    <section
      id="valor"
      className="relative border-t border-slate-800 bg-[#0a0a0a] py-24 px-4"
      aria-labelledby="value-title"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center">
          <h2
            id="value-title"
            className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl"
          >
            Mucho más que rastreo GPS
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Un gestor vehicular completo que ahorra dinero, protege tu inversión
            y optimiza cada viaje
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, i) => (
            <PillarCard key={pillar.title} {...pillar} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
