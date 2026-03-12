"use client";

import { motion } from "framer-motion";

const APP_URL = "https://app.trackeo.cl";

export default function FinalCTA() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-graphite-900 via-graphite-950 to-graphite-950" />
      <div className="gradient-orb bg-amber-500/25 w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          Empieza hoy.
        </motion.h2>
        <motion.p
          className="text-lg text-zinc-400 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          Conecta tu vehículo en minutos y toma el control.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-10 py-4 rounded-xl bg-amber-500 text-graphite-950 font-bold text-lg hover:bg-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-graphite-950 shadow-lg shadow-amber-500/20"
          >
            Ir a la Plataforma
          </a>
        </motion.div>
      </div>
    </section>
  );
}
