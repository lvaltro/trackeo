# Checklist: Testing Backend

## Setup inicial

- [ ] vitest configurado para CommonJS (`server/vitest.config.js`)
- [ ] supertest instalado como devDependency
- [ ] Script `"test"` agregado en `server/package.json`
- [ ] `.env.test` creado con variables mock (no credenciales reales)
- [ ] Directorio `server/__tests__/` creado

## Tests mínimos requeridos

### Smoke (prioridad 1)
- [ ] Server arranca sin crash
- [ ] `GET /api/app/health` devuelve 200 con shape correcto
- [ ] Health response incluye: status, service, port, timestamp, build, db

### Core unit tests (prioridad 2)
- [ ] `core/notifications` — addNotification valida tipos
- [ ] `core/notifications` — cleanupOld elimina registros viejos
- [ ] `core/documents` — status calculation (ok, expiring, expired)
- [ ] `core/documents` — type validation
- [ ] `core/maintenance` — create valida campos requeridos
- [ ] `core/jobs/weeklyStats` — Haversine distance calculation
- [ ] `core/jobs/weeklyStats` — score formula

### API integration (prioridad 3)
- [ ] Endpoints sin auth devuelven datos (health, geocode, live-share/:token)
- [ ] Endpoints con auth devuelven 403 sin cookie
- [ ] POST con body inválido devuelve 400
- [ ] POST con body > 100kb devuelve 413
- [ ] Origin no permitido devuelve 403

## Ejecución

```bash
# Correr todos los tests
cd server && npm test

# Correr con coverage
cd server && npx vitest run --coverage

# Correr un test específico
cd server && npx vitest run __tests__/health.test.js
```

## Validación post-setup
- [ ] `npm test` ejecuta y reporta resultados
- [ ] Coverage > 0% (al menos smoke tests)
- [ ] Tests no dependen de servicios externos (todo mockeado)
- [ ] Tests pasan en < 10 segundos
