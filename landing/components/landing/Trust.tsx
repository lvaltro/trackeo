"use client";

import { motion } from "framer-motion";

const POINTS = [
  {
    title: "Datos seguros",
    description: "Cifrado y almacenamiento en infraestructura confiable.",
  },
  {
    title: "Servidores confiables",
    description: "99.9% de disponibilidad. Tu flota visible cuando la necesitas.",
  },
  {
    title: "Escala contigo",
    description: "Desde 1 hasta 1.000 vehículos. La misma plataforma, sin límites.",
  },
];

export default function Trust() {
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
          Infraestructura en la que puedes confiar
        </motion.h2>
        <motion.p
          className="text-zinc-400 text-center mb-12 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Seguridad, disponibilidad y escalabilidad desde el primer vehículo.
        </motion.p>
        <div className="grid sm:grid-cols-3 gap-6">
          {POINTS.map((point, i) => (
            <motion.div
              key={point.title}
              className="p-5 rounded-xl bg-graphite-900/60 border border-graphite-700 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <h3 className="font-semibold text-zinc-200 mb-2">{point.title}</h3>
              <p className="text-sm text-zinc-500">{point.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
