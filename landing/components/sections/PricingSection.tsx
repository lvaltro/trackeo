"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/components/ui/cn";

const plans = [
  {
    id: "basico",
    name: "Básico",
    price: 9990,
    tagline: "Para tu vehículo personal",
    highlights: [
      "Posición GPS en tiempo real",
      "Alertas de velocidad y geocercas",
      "Historial de rutas — 30 días",
      "App móvil iOS y Android",
    ],
    details: [
      "1 vehículo · 1 usuario",
      "Viaje Seguro básico",
      "Soporte estándar por chat",
    ],
    limitations: [
      "Sin corte de motor",
      "Sin tráfico en tiempo real",
      "Sin análisis de conducción",
    ],
    device: "OBD2 Micodus — Plug & Play, sin instalación",
    cta: "Comenzar gratis",
    ctaUrl: "https://app.trackeo.cl/signup?plan=basico",
    recommended: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 19990,
    tagline: "Control total del vehículo",
    highlights: [
      "Corte de motor remoto",
      "Inmobilizador antirrobo",
      "Google Maps + tráfico real",
      "Análisis de conducción",
    ],
    details: [
      "1 vehículo · 3 usuarios",
      "Rutas optimizadas con IA",
      "Historial 90 días",
      "Dashboard personalizable",
    ],
    limitations: null,
    device: "Relay MV930G — Instalación profesional incluida",
    cta: "Elegir Pro",
    ctaUrl: "https://app.trackeo.cl/signup?plan=pro",
    recommended: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: 29990,
    tagline: "Visibilidad 360° completa",
    highlights: [
      "IA predictiva de fallas",
      "Monitoreo de combustible",
      "Soporte prioritario 24/7",
      "Historial 365 días",
    ],
    details: [
      "3 vehículos · 5 usuarios",
      "Mantenimiento automático",
      "Exportación de datos",
      "Todo lo del plan Pro",
    ],
    limitations: null,
    device: "Relay MV930G + Sensores — Kit completo",
    cta: "Ir a Premium",
    ctaUrl: "https://app.trackeo.cl/signup?plan=premium",
    recommended: true,
  },
  {
    id: "flotas",
    name: "Flotas",
    price: 49990,
    priceLabel: "desde",
    tagline: "Solución empresarial",
    highlights: [
      "Vehículos ilimitados",
      "API de integración",
      "Reportes personalizados",
      "Account manager dedicado",
    ],
    details: [
      "Usuarios ilimitados",
      "Optimización multi-parada",
      "SLA 99.9% garantizado",
      "Todo lo del plan Premium",
    ],
    limitations: null,
    device: "Compatible con todos los dispositivos",
    cta: "Contactar ventas",
    ctaUrl: "https://app.trackeo.cl/contacto",
    recommended: false,
  },
] as const;

type Plan = (typeof plans)[number];

function PricingCard({ plan, index }: { plan: Plan; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      className={cn(
        "relative flex flex-col rounded-2xl border p-7 transition-colors duration-300",
        plan.recommended
          ? [
              "border-amber-500/30 bg-[#100e08]",
              "shadow-[0_0_80px_-20px_rgba(245,158,11,0.2)]",
            ]
          : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12]"
      )}
    >
      {/* Recommended badge */}
      {plan.recommended && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 whitespace-nowrap rounded-b-xl bg-amber-500 px-5 py-1 text-[10px] font-bold text-black tracking-widest uppercase">
          Recomendado
        </div>
      )}

      {/* Header */}
      <div className="mb-5 mt-2">
        <h3 className="text-base font-semibold text-white">{plan.name}</h3>
        <p className="text-sm text-white/35 mt-0.5">{plan.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-9">
        {"priceLabel" in plan && plan.priceLabel && (
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-1">
            {plan.priceLabel}
          </p>
        )}
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "text-[2.6rem] font-bold tracking-tight leading-none",
              plan.recommended ? "text-amber-400" : "text-white"
            )}
          >
            ${plan.price.toLocaleString("es-CL")}
          </span>
          <span className="text-white/30 text-sm">/mes</span>
        </div>
      </div>

      {/* Highlights */}
      <ul className="space-y-3 mb-9 flex-1">
        {plan.highlights.map((h) => (
          <li key={h} className="flex items-center gap-2.5 text-sm text-white/65">
            <Check
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                plan.recommended ? "text-amber-400" : "text-white/35"
              )}
            />
            {h}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={plan.ctaUrl}
        className={cn(
          "block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 mb-5",
          plan.recommended
            ? "bg-amber-500 text-black hover:bg-amber-400"
            : "border border-white/10 text-white/60 hover:border-white/20 hover:text-white hover:bg-white/[0.05]"
        )}
      >
        {plan.cta}
      </Link>

      {/* Accordion toggle */}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center justify-center gap-1.5 w-full text-[11px] text-white/25 hover:text-white/45 transition-colors py-1 focus:outline-none"
      >
        Ver detalles técnicos
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-5 mt-4 border-t border-white/[0.06] space-y-4">
              {/* Included extras */}
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">
                  También incluye
                </p>
                <ul className="space-y-1.5">
                  {plan.details.map((d) => (
                    <li
                      key={d}
                      className="text-xs text-white/40 flex items-center gap-2"
                    >
                      <span className="h-px w-3 bg-white/15 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitations */}
              {"limitations" in plan && plan.limitations && (
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-widest mb-2">
                    No incluye
                  </p>
                  <ul className="space-y-1.5">
                    {plan.limitations.map((l) => (
                      <li
                        key={l}
                        className="text-xs text-white/30 flex items-center gap-2"
                      >
                        <X className="h-3 w-3 shrink-0 text-white/20" />
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Device */}
              <p className="text-[10px] text-white/20 pt-1 border-t border-white/[0.04]">
                {plan.device}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PricingSection() {
  return (
    <section
      id="planes"
      className="relative border-t border-white/[0.06] bg-[#0a0a0a] py-32 px-4"
      aria-labelledby="pricing-title"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.p
            className="text-xs text-amber-500/80 font-medium tracking-widest uppercase mb-4"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            Planes y precios
          </motion.p>
          <motion.h2
            id="pricing-title"
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            Un plan para cada necesidad
          </motion.h2>
          <motion.p
            className="mx-auto mt-4 max-w-xl text-base text-white/40"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            Desde protección personal hasta gestión de flotas empresariales.
            Hardware incluido, datos móviles M2M y plataforma completa.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          className="mt-14 text-center text-sm text-white/25"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          Prueba gratis 14 días &nbsp;·&nbsp; Sin tarjeta de crédito
          &nbsp;·&nbsp; Cancela cuando quieras
        </motion.p>
      </div>
    </section>
  );
}
