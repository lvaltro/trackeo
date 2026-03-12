"use client";

import { motion } from "framer-motion";

const BLOCKS = [
  {
    id: "equipos",
    badge: "Personal",
    title: "OBD2 Autoinstalable",
    subtitle: "Plug & Play",
    description: "Ideal para particulares. Conectas, configuras en la app y listo. Sin instalación técnica.",
    price: "$89.900",
    priceNote: "CLP",
    cta: "Ver en la plataforma",
    href: "https://app.trackeo.cl",
    highlight: false,
  },
  {
    badge: "Pro / Flotas",
    title: "Instalación Profesional (Teltonika FMC003)",
    subtitle: "Instalación oculta",
    description:
      "Telemetría avanzada, instalación oculta y duradera. Ideal para flotas y empresas que exigen precisión.",
    price: "Consultar",
    priceNote: "",
    cta: "Cotizar",
    href: "https://app.trackeo.cl",
    highlight: true,
  },
];

export default function Hardware() {
  return (
    <section id="equipos" className="py-20 px-4 border-t border-graphite-800">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-zinc-100 text-center mb-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          Hardware como habilitador
        </motion.h2>
        <motion.p
          className="text-zinc-400 text-center mb-12 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Elige cómo conectar tu vehículo. Una vez conectado, la misma plataforma para todos.
        </motion.p>

        <div className="grid sm:grid-cols-2 gap-6">
          {BLOCKS.map((block, i) => (
            <motion.div
              key={block.title}
              id={i === 0 ? "equipos" : undefined}
              className={`relative p-6 rounded-xl border ${
                block.highlight
                  ? "border-amber-500/50 bg-graphite-900/90"
                  : "border-graphite-700 bg-graphite-900/60"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              {block.highlight && (
                <div className="absolute top-0 right-0 rounded-bl-lg bg-amber-500/20 px-2 py-1 text-[10px] font-medium text-amber-500">
                  Recomendado flotas
                </div>
              )}
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                {block.badge}
              </span>
              <h3 className="text-lg font-semibold text-zinc-100 mt-1 mb-0.5">
                {block.title}
              </h3>
              <p className="text-sm text-amber-500/90 mb-3">{block.subtitle}</p>
              <p className="text-sm text-zinc-500 mb-4">{block.description}</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold text-zinc-100">
                  {block.price}
                </span>
                {block.priceNote && (
                  <span className="text-sm text-zinc-500">{block.priceNote}</span>
                )}
              </div>
              <a
                href={block.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  block.highlight
                    ? "bg-amber-500 text-graphite-950 hover:bg-amber-400"
                    : "border border-graphite-600 text-zinc-200 hover:bg-graphite-800"
                }`}
              >
                {block.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
