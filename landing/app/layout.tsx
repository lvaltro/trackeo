import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trackeo.cl — Gestor inteligente de vehículos y flotas",
  description:
    "Seguridad, gestión y monitoreo inteligente desde una sola plataforma. Control total de tu vehículo en tiempo real.",
  keywords: [
    "gestión de flotas",
    "rastreo vehicular",
    "GPS Chile",
    "monitoreo vehículos",
    "telemetría",
    "geocercas",
  ],
  openGraph: {
    title: "Trackeo.cl — Gestor inteligente de vehículos",
    description:
      "Seguridad, gestión y monitoreo inteligente. Control total de tu vehículo en tiempo real.",
    type: "website",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] font-sans text-slate-100">
        {children}
      </body>
    </html>
  );
}
