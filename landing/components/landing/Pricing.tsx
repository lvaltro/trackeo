"use client";

import { motion } from "framer-motion";

const APP_URL = "https://app.trackeo.cl";

const INCLUDES = [
  "Datos móviles M2M incluidos",
  "Acceso total a la plataforma web y móvil",
  "Soporte técnico",
  "Actualizaciones continuas",
];

export default function Pricing() {
  return (
    <section className="py-20 px-4 border-t border-graphite-800">
      <div className="max-w-2xl mx-auto text-center">
        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          Compra el equipo una vez. Conéctate para siempre.
        </motion.h2>
        <motion.p
          className="text-zinc-400 mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Suscripción SaaS clara. Sin sorpresas.
        </motion.p>

        <motion.div
          className="rounded-2xl border border-graphite-600 bg-graphite-900/80 p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-4xl font-bold text-zinc-100">$5.000</span>
            <span className="text-zinc-500">CLP / mes</span>
          </div>
          <p className="text-sm text-amber-500 font-medium mb-6">
            Siempre conectado. Siempre protegido.
          </p>
          <ul className="space-y-3 text-left max-w-xs mx-auto">
            {INCLUDES.map((item, i) => (
              <li key={item} className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="text-amber-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.p
          className="text-zinc-500 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Sin permanencia. Cancela cuando quieras. El hardware sigue siendo tuyo.
        </motion.p>
      </div>
    </section>
  );
}
