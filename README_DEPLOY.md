# Trackeo.cl — Guía Operativa de Deploy

## Arquitectura del sistema

```
Internet → Nginx (app.trackeo.cl)
              ├── /api/app/*   → 127.0.0.1:3001  (Express / PM2: app-trackeo)
              ├── /api/geocode → 127.0.0.1:3001
              ├── /api/live-share → 127.0.0.1:3001
              └── /*           → /var/www/app.trackeo.cl/ (frontend estático)

VPS: root@76.13.81.62
Proyecto: /root/personas-trackeo/
  ├── server/          Express backend (CommonJS)
  │   ├── index.js     Entry point
  │   ├── .env         Secrets — SOLO existe en VPS, nunca en repo
  │   └── ecosystem.config.js  Configuración PM2
  ├── core/            Lógica de dominio (sin HTTP)
  ├── scripts/         Scripts de ops
  └── prisma/          Schema + migraciones
```

---

## Comandos de deploy

### Backend (más común)

```bash
# Deploy normal — rsync + npm install + pm2 restart + health check
bash scripts/deploy.sh --backend

# Con migraciones Prisma
bash scripts/deploy.sh --backend --migrate

# Con logs limpios
bash scripts/deploy.sh --backend --flush-logs

# Debug verbose (imprime cada comando)
bash scripts/deploy.sh --backend --debug
```

### Frontend

```bash
# Build local + rsync → /var/www/app.trackeo.cl + reload Nginx
bash scripts/deploy.sh --frontend
```

### Ambos

```bash
bash scripts/deploy.sh --frontend --backend
```

### Verificar infra

```bash
# Auditoría completa (local → SSH → VPS → checks → health externo)
bash scripts/vps-sanity-check.sh

# Solo en el VPS (si ya estás dentro)
bash /root/personas-trackeo/scripts/vps-sanity-check.sh --local
```

---

## Gestión del .env en VPS

El `.env` **nunca** se sube desde el repo. Vive solo en `/root/personas-trackeo/server/.env`.

### Ver variables sin exponer valores

```bash
ssh root@76.13.81.62 "grep -oP '^[A-Z_]+' /root/personas-trackeo/server/.env"
```

### Agregar o modificar una variable

```bash
ssh root@76.13.81.62
nano /root/personas-trackeo/server/.env
# Guardar: Ctrl+O Enter, Salir: Ctrl+X

# Luego reiniciar para que PM2 cargue el nuevo valor:
pm2 restart app-trackeo --update-env
pm2 save --force
```

### Variables requeridas

| Variable | Descripción |
|---|---|
| `TRACCAR_API_URL` | URL interna de Traccar (`https://api.trackeo.cl`) |
| `APP_URL` | URL pública del frontend (`https://app.trackeo.cl`) |
| `GEOCODE_PORT` | Puerto del backend (`3001`) |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasa RLS) |
| `DATABASE_URL` | Connection string PostgreSQL — solo para migraciones Prisma |
| `TRACCAR_ADMIN_EMAIL` | Admin Traccar (para Live Share) |
| `TRACCAR_ADMIN_PASSWORD` | Password admin Traccar |

### Obtener DATABASE_URL para migraciones

En Supabase → Project Settings → Database → Connection string → URI:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

Agrégala al .env del VPS:
```bash
echo 'DATABASE_URL=postgresql://postgres:...' >> /root/personas-trackeo/server/.env
```

---

## Gestión de PM2

```bash
# Ver estado
pm2 status
pm2 show app-trackeo

# Ver logs en tiempo real
pm2 logs app-trackeo

# Ver últimas N líneas (sin follow)
pm2 logs app-trackeo --lines 50 --nostream

# Reiniciar
pm2 restart app-trackeo --update-env

# Recargar (zero-downtime si el proceso lo soporta)
pm2 reload app-trackeo --update-env

# Iniciar desde cero (si el proceso no existe)
cd /root/personas-trackeo/server
pm2 start ecosystem.config.js
pm2 save --force

# Vaciar logs
pm2 flush app-trackeo

# Guardar lista de procesos (para que sobrevivan reinicios del VPS)
pm2 save --force

# Recuperar procesos tras reinicio del VPS
pm2 resurrect
```

---

## Troubleshooting

### 502 Bad Gateway en `app.trackeo.cl`

El backend no responde. Diagnóstico:

```bash
ssh root@76.13.81.62

# 1. Ver estado PM2
pm2 status
# ¿app-trackeo está "errored" o "stopped"?

# 2. Ver logs de error
pm2 logs app-trackeo --lines 50 --nostream

# 3. Verificar puerto
ss -tlnp | grep 3001

# 4. Reiniciar
pm2 restart app-trackeo --update-env

# 5. Si sigue fallando: probar manualmente
cd /root/personas-trackeo/server
node index.js
# ¿Hay error de sintaxis? ¿Falta variable de entorno?
```

### EADDRINUSE (puerto 3001 ya en uso)

```bash
ssh root@76.13.81.62

# Ver qué proceso ocupa el puerto
ss -tlnp | grep 3001
# O:
lsof -i :3001

# Si hay un proceso zombie/legacy:
pm2 list           # buscar procesos extra
pm2 delete trackeo-api  # eliminar legacy si existe
pm2 save --force

# Si es un proceso huérfano de node:
kill $(lsof -t -i :3001)
pm2 restart app-trackeo --update-env
```

### PM2 proceso en estado "errored"

```bash
ssh root@76.13.81.62
pm2 logs app-trackeo --lines 100 --nostream

# Causas comunes:
# 1. Variable de entorno faltante → editar server/.env + pm2 restart --update-env
# 2. Error de sintaxis en código → revisar el último deploy
# 3. Módulo npm faltante → cd server && npm install --omit=dev

# Probar manualmente para ver el error completo:
cd /root/personas-trackeo/server
node index.js
```

### Health check falla tras deploy

```bash
# 1. Ver qué pasa en el backend
ssh root@76.13.81.62 "pm2 logs app-trackeo --lines 30 --nostream"

# 2. Auditoría completa
bash scripts/vps-sanity-check.sh

# 3. Ver si Nginx tiene el proxy correcto
ssh root@76.13.81.62 "nginx -T | grep -A5 'location /api'"
```

### Nginx no sirve el frontend actualizado

```bash
# Verificar que los archivos están en el lugar correcto
ssh root@76.13.81.62 "ls -la /var/www/app.trackeo.cl/ | head -10"

# Reload Nginx
ssh root@76.13.81.62 "nginx -t && systemctl reload nginx"

# Si hay caché del browser: Ctrl+Shift+R (hard refresh)
```

### Logs de PM2 muy grandes

```bash
ssh root@76.13.81.62
pm2 flush app-trackeo           # vaciar logs actuales
pm2 install pm2-logrotate       # instalar rotación automática (una vez)
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
```

### Migraciones Prisma fallan

```bash
# Ejecutar manualmente con output completo
ssh root@76.13.81.62 "bash /root/personas-trackeo/scripts/vps-migrate.sh"

# Si falla con "table already exists" / "already applied":
# El script automáticamente hace migrate resolve --applied para la migración baseline.
# Si el problema persiste, conectar directamente a Supabase y ver tabla _prisma_migrations.

# Verificar que DATABASE_URL está en .env del VPS
ssh root@76.13.81.62 "grep -c '^DATABASE_URL=' /root/personas-trackeo/server/.env"
```

---

## Flujo de un deploy típico

```bash
# 1. Hacer cambios en local
# 2. Probar localmente (npm run dev + cd server && node index.js)

# 3. Deploy backend
bash scripts/deploy.sh --backend

# 4. Si hay nuevas migraciones:
bash scripts/deploy.sh --backend --migrate

# 5. Verificar
bash scripts/vps-sanity-check.sh

# 6. Si algo falla:
ssh root@76.13.81.62 "pm2 logs app-trackeo --lines 50 --nostream"
```

---

## Comandos SSH rápidos

```bash
# Conectar al VPS
ssh root@76.13.81.62

# Ver logs en tiempo real desde local
ssh root@76.13.81.62 "pm2 logs app-trackeo --lines 0"

# Health check rápido
curl -s https://app.trackeo.cl/api/app/health | python3 -m json.tool

# Estado PM2 desde local
ssh root@76.13.81.62 "pm2 status"
```
