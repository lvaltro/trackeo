"use client";

import { motion } from "framer-motion";

const APP_URL = "https://app.trackeo.cl";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Ambient orbs */}
      <div className="gradient-orb bg-amber-500/30 w-[400px] h-[400px] -top-40 -right-40" />
      <div className="gradient-orb bg-amber-600/20 w-[300px] h-[300px] top-1/2 -left-20" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.p
          className="text-amber-500 text-sm font-medium tracking-wider uppercase mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Gestor inteligente de vehículos
        </motion.p>
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-100 tracking-tight leading-[1.1] mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Control total de tu vehículo.{" "}
          <span className="text-amber-500">Inteligencia en tiempo real.</span>
        </motion.h1>
        <motion.p
          className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Mucho más que un GPS. Seguridad, gestión y monitoreo inteligente desde
          una sola plataforma.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-amber-500 text-graphite-950 font-semibold hover:bg-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-graphite-950"
          >
            Ir a la Plataforma
          </a>
          <a
            href="#equipos"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-lg border border-graphite-600 text-zinc-200 font-medium hover:bg-graphite-800 hover:border-graphite-500 transition-colors"
          >
            Conocer los equipos
          </a>
        </motion.div>
      </div>
    </section>
  );
}
