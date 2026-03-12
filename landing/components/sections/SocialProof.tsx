"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Quote } from "lucide-react";

const stats = [
  { value: 1200, label: "Vehículos protegidos", suffix: "+" },
  { value: 98, label: "Tasa de recuperación", suffix: "%" },
  { value: 47850, label: "Ahorro promedio/mes", prefix: "$" },
];

const testimonials = [
  {
    quote:
      "Desde que tenemos Trackeo en la flota, el robo de combustible bajó a cero y sabemos exactamente dónde está cada camión.",
    author: "Rodrigo M.",
    role: "Dueño de transporte, Santiago",
  },
  {
    quote:
      "La tranquilidad de poder cortar el motor si me roban el auto no tiene precio. Lo recomiendo para cualquier padre.",
    author: "Carolina L.",
    role: "Particular, Viña del Mar",
  },
];

export function SocialProof() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative border-t border-slate-800 bg-[#0a0a0a] py-24 px-4"
      aria-labelledby="social-title"
    >
      <div className="mx-auto max-w-7xl">
        <h2
          id="social-title"
          className="text-center text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl"
        >
          Confían en Trackeo
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-slate-400">
          Empresas y particulares que ya protegen sus vehículos con nosotros
        </p>

        <div className="mt-16 flex flex-wrap justify-center gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-slate-100">
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix ?? ""}
                  suffix={stat.suffix ?? ""}
                />
              </div>
              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
            >
              <Quote className="h-8 w-8 text-slate-600" aria-hidden />
              <p className="mt-3 text-slate-300">{t.quote}</p>
              <footer className="mt-4">
                <p className="font-semibold text-slate-100">{t.author}</p>
                <p className="text-sm text-slate-500">{t.role}</p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
