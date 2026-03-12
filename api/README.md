# api/

Esta carpeta existe como convención de estructura. Los puntos de entrada HTTP reales están en:

- **`server/index.js`** — Express en puerto 3001 (geocodificación, live-share, notificaciones)
- **`app/api/`** — Next.js API routes para el pipeline de webhooks Traccar (QStash/Upstash)

No mover las rutas Express aquí: el framework Next.js controla `app/api/` y el server Express corre como proceso separado.
