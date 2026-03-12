"use client";

const APP_URL = "https://app.trackeo.cl";

export default function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-graphite-800/80 bg-graphite-950/80 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="font-semibold text-zinc-100">
          Trackeo<span className="text-amber-500">.cl</span>
        </a>
        <a
          href={APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-zinc-300 hover:text-amber-500 transition-colors"
        >
          Ir a la Plataforma
        </a>
      </nav>
    </header>
  );
}
