# Checklist: Refactoring Backend

## Pre-refactor

- [ ] No hay bugs activos en producción que dependan del código a refactorear
- [ ] `git status` limpio — todos los cambios commiteados
- [ ] Branch dedicado creado: `refactor/descripcion`
- [ ] Health check funciona: `curl http://localhost:3001/api/app/health`
- [ ] Snapshot de respuestas de todos los endpoints (para comparar después)

## Durante el refactor

- [ ] Cada cambio es behavior-preserving (misma entrada → misma salida)
- [ ] Server arranca después de cada paso
- [ ] No se agregan dependencias nuevas sin aprobación
- [ ] Imports resuelven correctamente (verificar paths relativos)
- [ ] No hay imports circulares

## Post-refactor

### Local
- [ ] `node server/index.js` arranca sin errores ni warnings
- [ ] Health check: 200
- [ ] Todos los endpoints responden igual que antes del refactor
- [ ] `git diff --stat` muestra solo los archivos esperados
- [ ] Ningún archivo nuevo tiene más de 200 líneas

### Validación de endpoints
```bash
# Probar cada grupo de rutas (requiere server corriendo)
curl -s http://localhost:3001/api/app/health
curl -s http://localhost:3001/api/geocode/reverse?lat=-33.45&lon=-70.66
# Los endpoints con auth necesitan cookie JSESSIONID válida
```

### VPS (post-deploy)
- [ ] `pm2 describe app-trackeo` — online, 0 restarts
- [ ] `pm2 logs app-trackeo --err --lines 20 --nostream` — sin errores
- [ ] Health check externo: `curl -s https://app.trackeo.cl/api/app/health`
- [ ] Frontend funciona correctamente (probar desde app.trackeo.cl)
