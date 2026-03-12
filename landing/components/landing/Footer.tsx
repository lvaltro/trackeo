"use client";

const APP_URL = "https://app.trackeo.cl";

export default function Footer() {
  return (
    <footer className="py-10 px-4 border-t border-graphite-800">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-zinc-500 text-sm">
          © {new Date().getFullYear()} Trackeo.cl — Gestor inteligente de vehículos.
        </span>
        <div className="flex items-center gap-6">
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-400 hover:text-amber-500 transition-colors"
          >
            Plataforma
          </a>
          <a
            href="#equipos"
            className="text-sm text-zinc-400 hover:text-amber-500 transition-colors"
          >
            Equipos
          </a>
        </div>
      </div>
    </footer>
  );
}
