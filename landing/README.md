# Trackeo.cl — Landing

Landing de marketing para Trackeo.cl (Next.js 14 App Router, Tailwind, Framer Motion).

## Cómo correr

```bash
cd landing
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Build y deploy

```bash
npm run build
npm start
```

Para Vercel: apunta el proyecto a la carpeta `landing` o despliega solo esta carpeta como proyecto Next.js.

## Estructura

- `app/layout.tsx` — Layout y metadata (Server Component)
- `app/page.tsx` — Página principal (importa cliente)
- `components/landing/` — Hero, Problem, Features (con mock dashboard por scroll), Hardware, Pricing, Trust, FinalCTA, Footer, Nav

El mock dashboard en la sección de features cambia de estado (Mapa → Historial de rutas → Alertas y geocercas) según el scroll.
