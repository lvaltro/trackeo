# Contexto: Agente de Testing

## Qué problema resuelve
Actualmente el backend tiene 0 tests. Cualquier cambio puede romper funcionalidad existente sin que nadie lo detecte hasta que un usuario reporte el error en producción.

## Cuándo usarlo
- Después de completar el refactor de rutas (prerequisito: código modular)
- Antes de agregar features complejas (para tener red de seguridad)
- Cuando se corrige un bug (escribir test que lo reproduce, luego fixear)
- Periódicamente para aumentar cobertura

## Qué riesgo mitiga
- **Regresiones silenciosas**: Cambio en un endpoint rompe otro
- **Deploy ciego**: Sin tests, cada deploy es un acto de fe
- **Refactor inseguro**: No se puede refactorear sin tests que validen comportamiento
- **Bugs recurrentes**: Sin test de regresión, el mismo bug puede volver

## Señales de activación
- Se va a hacer un refactor grande (modularizar routes)
- Un bug en producción se repitió (necesita test de regresión)
- Se agrega un endpoint nuevo (debe tener test desde el inicio)
- Se quiere implementar CI/CD (requiere tests automatizados)
- Cobertura de tests es 0% (estado actual)

## Prioridad de tests sugerida
1. **Smoke tests** — server arranca, health responde 200
2. **Core unit tests** — notifications CRUD, documents expiration logic, weekly stats calculation
3. **API integration tests** — endpoints con auth mock, verificar status codes y response shapes
4. **Edge cases** — rate limiting, CORS blocking, body size limit, expired tokens

## Stack sugerido
- **Runner**: vitest (ya está en el proyecto para frontend)
- **HTTP testing**: supertest
- **Mocks**: vitest built-in mocking
- **Config**: `server/vitest.config.js` separado (CommonJS compatibility)
