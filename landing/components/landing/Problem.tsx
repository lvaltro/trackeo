"use client";

import { motion } from "framer-motion";

const PAINS = [
  {
    title: "Robo de vehículos",
    description: "Sin visibilidad en tiempo real, recuperar tu auto se vuelve una carrera contra el tiempo.",
  },
  {
    title: "Falta de control de activos",
    description: "No sabes dónde están tus vehículos ni cómo se utilizan. Costos ocultos y riesgos.",
  },
  {
    title: "Apps lentas o inestables",
    description: "Plataformas que se caen o tardan minutos en cargar. Cuando importa, fallan.",
  },
];

export default function Problem() {
  return (
    <section className="py-20 px-4 border-t border-graphite-800">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-zinc-100 text-center mb-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          El problema
        </motion.h2>
        <motion.p
          className="text-zinc-400 text-center mb-12 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Miles de conductores y empresas enfrentan lo mismo cada día.
        </motion.p>
        <div className="grid sm:grid-cols-3 gap-6">
          {PAINS.map((pain, i) => (
            <motion.div
              key={pain.title}
              className="p-5 rounded-xl bg-graphite-900/80 border border-graphite-700"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <h3 className="font-semibold text-zinc-200 mb-2">{pain.title}</h3>
              <p className="text-sm text-zinc-500">{pain.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
