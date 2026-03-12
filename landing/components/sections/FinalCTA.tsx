"use client";

import Link from "next/link";

export function FinalCTA() {
  return (
    <section
      className="relative border-t border-slate-800 bg-[#0a0a0a] py-24 px-4"
      aria-labelledby="cta-title"
    >
      <div className="absolute inset-0 bg-gradient-radial from-trackeo-orange/10 via-transparent to-transparent opacity-50" />
      <div className="relative mx-auto max-w-3xl text-center">
        <h2
          id="cta-title"
          className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl lg:text-5xl"
        >
          Comienza a proteger tu vehículo hoy
        </h2>
        <p className="mt-6 text-lg text-slate-400">
          Prueba gratis 14 días. Sin tarjeta de crédito.
        </p>
        <Link
          href="https://app.trackeo.cl"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-block rounded-lg bg-[#ff8800] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#ff9933]"
        >
          Ir a la Plataforma →
        </Link>
      </div>
    </section>
  );
}
