# Estructura del VPS - Trackeo.cl

**IP del Servidor:** 76.13.81.62
**Usuario:** root
**Directorio Raíz:** /root/personas-trackeo

## Componentes Instalados

- **PM2:** Gestiona el proceso `app-trackeo` (Puerto 3001).
- **Nginx:** Configurado como Proxy Inverso para:
  - `trackeo.cl` → Carpeta de Landing.
  - `app.trackeo.cl` → localhost:3001.
- **Servicios Externos:** Conexiones activas a Supabase y Traccar.

## Flujo de Sincronización

Los cambios locales se suben mediante `scripts/deploy.sh` y se reinician via SSH con PM2.
