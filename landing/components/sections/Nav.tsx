"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/components/ui/cn";

const navLinks = [
  { href: "#valor", label: "Valor" },
  { href: "#plataforma", label: "Plataforma" },
  { href: "#planes", label: "Planes" },
  { href: "#funciones", label: "Funciones" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/80 bg-[#0a0a0a]/80 backdrop-blur-md"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-bold text-slate-100 transition hover:text-trackeo-orange"
        >
          Trackeo<span className="text-trackeo-orange">.cl</span>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-300 transition hover:text-slate-100"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="https://app.trackeo.cl"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "rounded-lg bg-[#ff8800] px-4 py-2 text-sm font-semibold text-white",
              "shadow-lg shadow-orange-500/25 transition hover:bg-[#ff9933]"
            )}
          >
            Ir a la Plataforma
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-800 bg-[#0a0a0a]/95 backdrop-blur-md">
          <div className="flex flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="https://app.trackeo.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 rounded-lg bg-[#ff8800] px-4 py-3 text-center font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Ir a la Plataforma
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
