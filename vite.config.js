import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['vite.svg', 'pwa-192x192.svg'],
        manifest: {
          name: 'Trackeo.cl',
          short_name: 'Trackeo APP',
          description: 'Plataforma de rastreo y control en tiempo real para personas y vehículos',
          theme_color: '#f97316',
          background_color: '#0B0F19',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/svg+xml',
            },
            {
              src: 'pwa-192x192.png',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
            {
              src: 'pwa-192x192.png',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.trackeo\.cl\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5,
                },
              },
            },
          ],
        },
      }),
    ],
    base: '/',
    server: {
      proxy: {
        // Live Share → servidor backend local (más específico, va primero)
        '/api/live-share': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          // Si Express no está corriendo, NO dejar que caiga al proxy de Traccar
          configure: (proxy) => {
            proxy.on('error', (err, req, res) => {
              console.error('[Proxy] Express no disponible para', req.url, ':', err.message);
              if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Backend Express no disponible. Ejecuta: node server/index.js' }));
              }
            });
          },
        },
        // Backend Trackeo (notificaciones, etc.) → servidor Express local
        // Ruta /api/app/ es EXCLUSIVA nuestra, nunca colisiona con Traccar
        // ⚠️ CRÍTICO: el handler onError evita que al caer Express, la petición
        //    se reenvíe al proxy de /api (Traccar), causando errores 404.
        '/api/app': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err, req, res) => {
              console.error(
                `[Proxy] ❌ Express (puerto 3001) no disponible para ${req.url}\n` +
                `  Error: ${err.message}\n` +
                `  Solución: Abre otra terminal y ejecuta → node server/index.js`
              );
              if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  error: 'Backend Express no disponible. Ejecuta: node server/index.js',
                  hint: 'El servidor de notificaciones requiere un proceso separado en puerto 3001'
                }));
              }
            });
          },
        },
        // Geocodificación → servidor Express local
        '/api/geocode': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err, req, res) => {
              if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Backend Express no disponible.' }));
              }
            });
          },
        },
        // Proxy para desarrollo local → API Traccar de producción
        '/api': {
          target: 'https://api.trackeo.cl',
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: '',
          cookiePathRewrite: '/',
        },
      },
    },
  }
})
