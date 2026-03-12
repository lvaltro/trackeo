# Contexto: Agente de Observabilidad

## Qué problema resuelve
Detecta problemas de salud del backend en producción antes de que afecten a los usuarios. Analiza logs, métricas de PM2 y estado del sistema para identificar patrones de error.

## Cuándo usarlo
- Rutinariamente (diario o semanal) como chequeo de salud
- Después de cada deploy a producción
- Cuando usuarios reportan errores o lentitud
- Cuando PM2 muestra restarts inesperados
- Cuando el health check falla o reporta `db.ok: false`
- Antes de escalar (agregar más tráfico o features)

## Qué riesgo mitiga
- **Downtime silencioso**: Backend caído sin que nadie se entere
- **Memory leaks**: Consumo de memoria creciente hasta crash
- **Error storms**: Errores repetitivos que saturan logs y degradan performance
- **Config drift**: ecosystem.config.js no coincide con el proceso corriendo
- **Disk full**: Logs que crecen sin rotación hasta llenar disco

## Señales de activación
- PM2 muestra `restarts > 0` o `status: errored`
- Health check devuelve `db.ok: false`
- Logs de error tienen más de 50 líneas en las últimas 24h
- Memoria del proceso > 150mb (normal es ~56mb)
- Disco > 80% usado
- `NODE_ENV` no es `production`

## Stack actual
- **Proceso**: PM2 fork mode, 1 instancia
- **Logs**: `server/logs/pm2-error.log`, `server/logs/pm2-out.log`, `server/logs/error.log`
- **Health**: `GET /api/app/health` — devuelve status, build info, db ping
- **Config**: `server/ecosystem.config.js` — restart_delay 3s, max_restarts 5
- **VPS**: 4GB RAM, 48GB disco, Ubuntu, Node 20.20.0
