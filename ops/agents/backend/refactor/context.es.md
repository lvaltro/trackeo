# Contexto: Agente de Refactoring

## Qué problema resuelve
Mejora la estructura interna del código sin cambiar su comportamiento externo. Reduce deuda técnica, facilita testing y hace el código más mantenible para futuros cambios.

## Cuándo usarlo
- Cuando `server/index.js` supera las 500 líneas (actualmente ~640)
- Antes de agregar nuevos grupos de endpoints (para no agrandar el monolito)
- Cuando hay duplicación evidente entre rutas (mismo patrón auth + try/catch)
- Cuando se necesita agregar tests unitarios (requiere módulos extraíbles)
- Después de estabilizar producción (no refactorear mientras hay bugs activos)

## Qué riesgo mitiga
- **Regresiones**: Código monolítico es difícil de testear → bugs silenciosos
- **Onboarding lento**: Nuevo desarrollador no puede navegar 600+ líneas
- **Merge conflicts**: Todos los cambios tocan el mismo archivo
- **Testing imposible**: Sin módulos separados, no hay unit tests posibles
- **Feature creep**: Sin estructura, cada feature nueva empeora el monolito

## Señales de activación
- `server/index.js` supera 700 líneas
- Se necesita agregar un nuevo grupo de endpoints (ej: /api/app/alerts)
- Se quiere implementar tests unitarios para rutas específicas
- Hay 3+ endpoints con el mismo patrón de auth + try/catch + logError
- Un bug en una ruta requiere entender todo el archivo para diagnosticar

## Estructura objetivo (referencia)
```
server/
  index.js              → Solo startup + middleware + mount routers
  middleware/
    auth.js             → verifyTraccarSession()
    errorHandler.js     → Global error middleware
  routes/
    geocode.js          → GET /api/geocode/*
    liveShare.js        → /api/live-share/*
    notifications.js    → /api/app/notifications/*
    maintenance.js      → /api/app/maintenance/*
    documents.js        → /api/app/documents/*
    weeklyStats.js      → /api/app/weekly-stats/* + jobs
    health.js           → GET /api/app/health
```
