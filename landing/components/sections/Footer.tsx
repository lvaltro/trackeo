"use client";

import Link from "next/link";

const footerLinks = [
  { href: "https://app.trackeo.cl", label: "Plataforma" },
  { href: "#planes", label: "Planes" },
  { href: "#valor", label: "Valor" },
  { href: "#funciones", label: "Funciones" },
];

export function Footer() {
  return (
    <footer
      className="border-t border-slate-800 bg-[#0a0a0a] py-12 px-4"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <Link
          href="/"
          className="text-lg font-bold text-slate-100 transition hover:text-trackeo-orange"
        >
          Trackeo<span className="text-trackeo-orange">.cl</span>
        </Link>
        <nav aria-label="Enlaces del pie">
          <ul className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-slate-400 transition hover:text-slate-200"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Trackeo Systems. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
