# Arquitectura de Producción — Trackeo.cl

## Infraestructura

- **VPS:** Hostinger — IP 76.13.81.62
- **OS:** Ubuntu 22.04 LTS
- **Traccar Server:** Última versión estable (revisar con `traccar --version` en el VPS) en puerto 8082
- **Base de datos:** MySQL (puerto 3306 por defecto)
- **Nginx:** Reverse proxy para subdominios

## Dominios y Routing

| Subdominio | Propósito |
|---|---|
| `trackeo.cl` | Landing / marketing (carpeta landing/) |
| `app.trackeo.cl` | Nginx → proxy_pass `localhost:3001` (proceso PM2 `app-trackeo`) |
| `personas.trackeo.cl` | Legado, redirige a app.trackeo.cl |
| `api.trackeo.cl` | Proxy Nginx → Traccar API (localhost:8082) |

## Procesos PM2 en el VPS

| Nombre | Puerto | Descripción |
|---|---|---|
| `app-trackeo` | 3001 | Servidor Express (server/index.js) |

## Directorio raíz en el VPS

```
/root/personas-trackeo/   ← PROJECT_ROOT
  server/                 ← Express (app-trackeo en PM2)
  core/                   ← Lógica de dominio (importada por server/)
  scripts/                ← cleanup-notifications.js, deploy.sh
  dist/                   ← Build del frontend React
```

## Flujo de Request en Producción

```
1. Browser → https://app.trackeo.cl
   → Nginx proxy_pass → http://localhost:3001
   → Express sirve la app (y/o archivos estáticos de dist/)

2. Browser → https://api.trackeo.cl/api/*
   → Nginx proxy_pass → http://localhost:8082/api/*
   → Cookie JSESSIONID viaja en cada request (credentials: include)
```

## Flujo de Autenticación

```
1. POST https://api.trackeo.cl/api/session
   → Body: email=xxx&password=xxx (form-urlencoded)
   → Traccar responde 200 + Set-Cookie: JSESSIONID=abc123

2. Todas las requests subsecuentes llevan la cookie automáticamente
   → GET /api/devices → Cookie: JSESSIONID=abc123 → 200 OK
   → GET /api/positions → Cookie: JSESSIONID=abc123 → 200 OK

3. Si la cookie expira o es inválida:
   → Cualquier request → 401 Unauthorized
   → apiClient.js dispara evento 'auth:expired'
   → App.jsx escucha el evento → limpia estado → redirige a /login
```

## Estructura del Proyecto

```
src/
├── api/
│   ├── apiClient.js        # Cliente HTTP centralizado (timeout, retry, interceptor 401)
│   ├── traccarApi.js        # Capa de servicio Traccar (login, devices, positions, reports)
│   └── geocodeApi.js        # Geocodificación inversa con cache y rate limiting
├── hooks/
│   ├── useVehicleTracker.js # Polling cada 10s con AbortController
│   ├── useTraccarSocket.js  # [TODO] Migración a WebSocket
│   └── useCounter.js        # Animación de contadores
├── screens/
│   ├── DashboardLayout.jsx  # Pantalla principal del dashboard
│   ├── LoginScreen.jsx      # Pantalla de login (activa)
│   └── InstallerScreen.jsx  # Pantalla de instalación de GPS
├── components/
│   ├── MapView.jsx          # Mapa Leaflet con posiciones
│   ├── HistoryView.jsx      # Vista de historial de rutas
│   ├── TrackeoLogo.jsx      # Logotipo SVG
│   └── LoadingScreen.jsx    # Pantalla de carga
├── utils/
│   └── mapUtils.js          # Utilidades de procesamiento de rutas
├── App.jsx                  # Router principal + manejo global de auth
└── main.jsx                 # Entry point
```

## Seguridad

### Implementado
- [x] Cookie JSESSIONID manejada por el servidor (no en JavaScript)
- [x] `credentials: 'include'` en todas las peticiones
- [x] Interceptor global de 401 (sesión expirada)
- [x] No se guardan credenciales (email/password) en localStorage
- [x] CORS dinámico con whitelist de orígenes
- [x] `.env` en `.gitignore`

### Pendiente / Riesgos Aceptados
- [ ] Verificar que Traccar configura `HttpOnly` en la cookie JSESSIONID
- [ ] Verificar configuración `SameSite=Lax` en la cookie
- [ ] Configurar `Secure=true` en la cookie (requiere HTTPS en Traccar o en Nginx)
- [ ] Implementar CSRF token si se requiere
- [ ] Rate limiting en el endpoint de login (prevenir brute force)

## Performance

### Implementado
- [x] Polling cada 10s (reducido de 3s — ahorra 70% de requests)
- [x] AbortController cancela peticiones al desmontar componentes
- [x] Cache de geocodificación (5 min TTL, evita llamadas repetidas a Nominatim)
- [x] Rate limiting en geocodificación (1 req/s — cumple política Nominatim)
- [x] Retry automático con backoff exponencial (errores 5xx y de red)

### Futuro
- [ ] Migrar de polling a WebSocket (wss://api.trackeo.cl/api/socket)
- [ ] Service Worker para cache offline de tiles del mapa
- [ ] Lazy loading de componentes pesados (MapView, HistoryView)

## Deploy

Script: `scripts/deploy.sh`. Requiere `rsync` y SSH sin contraseña al VPS.

```bash
bash scripts/deploy.sh              # Frontend + backend (completo)
bash scripts/deploy.sh --frontend   # Solo frontend (más rápido, cambios en src/)
bash scripts/deploy.sh --backend    # Solo backend (cambios en server/ o core/)
```

### Setup inicial (una sola vez)

**1. Generar y subir clave SSH:**
```bash
ssh-keygen -t ed25519 -C "trackeo-deploy"   # Enter para todo (sin passphrase)
ssh-copy-id root@76.13.81.62                 # Pide contraseña por última vez
ssh root@76.13.81.62 "echo OK"               # Verificar: debe responder sin contraseña
```

**2. Instalar rsync en el VPS** (si no está):
```bash
ssh root@76.13.81.62 "apt install rsync -y"
```

**3. Instalar PM2 en el VPS** (gestor de procesos Node.js):
```bash
ssh root@76.13.81.62 "npm install -g pm2 && pm2 startup systemd -u root --hp /root"
# Ejecutar el comando que PM2 imprime (para arrancar automáticamente al reiniciar)
```

**4. Variables de entorno en el VPS:**
```bash
ssh root@76.13.81.62 "cat > /opt/trackeo/backend/server/.env << 'EOF'
TRACCAR_API_URL=https://api.trackeo.cl
TRACCAR_ADMIN_EMAIL=admin@trackeo.cl
TRACCAR_ADMIN_PASSWORD=TU_PASSWORD
APP_URL=https://app.trackeo.cl
GEOCODE_PORT=3001
EOF"
```

**5. Primer deploy:**
```bash
bash scripts/deploy.sh
```

### Estructura en el VPS

```
/opt/trackeo/backend/
  server/         ← server/index.js + package.json (Express)
  core/           ← core/geocoding/, core/live-share/, core/notifications/
  scripts/        ← scripts/cleanup-notifications.js
/var/www/app.trackeo.cl/   ← dist/ (frontend estático)
```

### Verificar estado del backend en el VPS

```bash
ssh root@76.13.81.62 "pm2 status"
ssh root@76.13.81.62 "pm2 logs trackeo-backend --lines 50"
curl https://app.trackeo.cl/api/app/health
```

## Configuración de Nginx (Sugerida)

```nginx
# api.trackeo.cl → Traccar
server {
    listen 443 ssl;
    server_name api.trackeo.cl;

    ssl_certificate /etc/letsencrypt/live/api.trackeo.cl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.trackeo.cl/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (para futuro)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# app.trackeo.cl → Frontend React + Backend Express
server {
    listen 443 ssl;
    server_name app.trackeo.cl;

    ssl_certificate /etc/letsencrypt/live/app.trackeo.cl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.trackeo.cl/privkey.pem;

    root /var/www/app.trackeo.cl;
    index index.html;

    # Backend Express: TODO lo que vaya bajo /api/app/ (notificaciones, etc.)
    # ⚠️ IMPORTANTE: esta ruta NO colisiona con Traccar (/api/notifications es de Traccar)
    location /api/app/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend Express: Live Share (Viaje Seguro)
    location /api/live-share {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend Express: Geocodificación
    location /api/geocode {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend React (SPA fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
