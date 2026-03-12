"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import MockDashboard from "./MockDashboard";

const FEATURES = [
  {
    phase: "map",
    title: "Mapa en tiempo real con latencia ultra baja",
    description:
      "Ubicación actualizada en segundos. Cuando necesitas saber dónde está tu vehículo, la respuesta ya está ahí.",
  },
  {
    phase: "routes",
    title: "Historial de rutas y telemetría exacta",
    description:
      "Cada tramo registrado. Velocidad, detenciones y recorridos para análisis y cumplimiento.",
  },
  {
    phase: "alerts",
    title: "Alertas personalizadas y Geocercas",
    description:
      "Avisos al entrar o salir de zonas. Modo Viaje Seguro y enlaces de seguimiento compartibles para que otros vean el trayecto en vivo.",
  },
];

export default function Features({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <section
      ref={containerRef as React.RefObject<HTMLElement>}
      className="py-20 px-4 border-t border-graphite-800"
    >
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-zinc-100 text-center mb-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          La solución: una plataforma que sí responde
        </motion.h2>
        <motion.p
          className="text-zinc-400 text-center mb-16 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Todo lo que necesitas para gestionar y proteger tu vehículo o flota, en un solo lugar.
        </motion.p>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="space-y-16 lg:space-y-24 order-2 lg:order-1">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.phase}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <h3 className="text-xl font-semibold text-zinc-100 mb-2">
                  {f.title}
                </h3>
                <p className="text-zinc-500">{f.description}</p>
              </motion.div>
            ))}
          </div>
          <div className="lg:sticky lg:top-24 order-1 lg:order-2">
            <MockDashboard containerRef={containerRef} />
          </div>
        </div>
      </div>
    </section>
  );
}
