# Checklist: Hardening Backend

## Pre-cambios (verificar antes)

- [ ] `server/index.js` — helmet está activo: `app.use(helmet())`
- [ ] `server/index.js` — rate limiter configurado en `/api/`
- [ ] `server/index.js` — `express.json({ limit: '100kb' })` con límite
- [ ] `server/index.js` — CORS rechaza origins no autorizados con 403
- [ ] `server/.env` — no hay secretos hardcodeados en código fuente
- [ ] `npm audit` — 0 vulnerabilidades high/critical

## Post-cambios (verificar después)

### Local
- [ ] `node server/index.js` arranca sin errores
- [ ] `curl http://localhost:3001/api/app/health` devuelve 200
- [ ] Response headers incluyen: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security
- [ ] Request desde origin no autorizado devuelve 403
- [ ] POST con body > 100kb devuelve 413

### VPS
- [ ] `pm2 describe app-trackeo` muestra status: online
- [ ] `pm2 logs app-trackeo --lines 20 --nostream` sin errores
- [ ] `curl -s http://localhost:3001/api/app/health` devuelve 200
- [ ] `curl -I https://app.trackeo.cl/api/app/health` incluye headers de seguridad

## Comandos de validación

```bash
# Local
npm audit
node -e "require('./server/index.js')" # debe arrancar sin crash

# VPS
ssh root@76.13.81.62 "pm2 status"
ssh root@76.13.81.62 "curl -s http://localhost:3001/api/app/health"
ssh root@76.13.81.62 "curl -I http://localhost:3001/api/app/health 2>/dev/null | grep -iE 'x-frame|x-content|strict'"
```
