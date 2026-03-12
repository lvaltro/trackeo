# Servidor de geocodificación — Trackeo.cl

Backend mínimo que expone **GET /api/geocode/reverse?lat=&lon=** usando el servicio de geocodificación (caché + cola Nominatim 1 req/s).

## Cómo ejecutarlo

```bash
cd server
npm install
npm start
```

El servidor queda en **http://localhost:3001**. El frontend (Vite) redirige `/api/geocode` a este puerto mediante proxy.

## Uso

Con el frontend en marcha (`npm run dev`), abre un vehículo en el mapa, haz clic en el marcador y pulsa **"Ver dirección"**. La primera vez puede tardar ~1 s (Nominatim); las coordenadas cercanas salen de caché al instante.

## Variables de entorno

- `GEOCODE_PORT`: puerto del servidor (por defecto 3001).
