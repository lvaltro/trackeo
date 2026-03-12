# Ops — Sistema de Agentes Operativos

Sistema estructurado de agentes y estándares para gestionar el backend de Trackeo.cl de forma profesional, reproducible y escalable.

## Estructura

```
ops/
  agents/                    Agentes especializados por dominio
    backend/
      hardening/             Seguridad HTTP, rate limiting, CORS, headers
      migrations/            Prisma schema, migraciones, DB health
      observability/         PM2, logs, health checks, alertas
      refactor/              Modularización, deuda técnica, estructura
      testing/               Tests unitarios, integración, smoke tests

  skills/                    Estándares y buenas prácticas (sin prompts)
    backend-security.md      Reglas de seguridad HTTP y auth
    backend-prisma.md        Convenciones de Prisma, migraciones, DB
    backend-pm2.md           Operaciones PM2, logs, ecosystem.config.js
    backend-architecture.md  Arquitectura server/core, convenciones de código
```

## Anatomía de un agente

Cada agente tiene 3 archivos:

| Archivo | Idioma | Propósito |
|---------|--------|-----------|
| `prompt.en.md` | English | Instrucciones de ejecución para Claude/AI — role, scope, safety constraints, step-by-step plan |
| `context.es.md` | Español | Documentación para el humano — qué problema resuelve, cuándo usarlo, señales de activación |
| `checklist.es.md` | Español | Lista operativa — verificaciones pre/post, comandos de validación |

## Cómo invocar un agente

### Opción 1: Prompt directo
Copia el contenido de `prompt.en.md` al inicio de tu conversación con Claude:

```
[Pegar contenido de ops/agents/backend/hardening/prompt.en.md]

Now audit the backend at /mnt/c/Users/autom/personas-trackeo/server/
```

### Opción 2: Referencia por ruta
Pide a Claude que lea el prompt:

```
Lee ops/agents/backend/observability/prompt.en.md y ejecútalo contra el backend actual.
```

### Opción 3: Contexto combinado
Para operaciones complejas, combina agente + skill:

```
Lee ops/agents/backend/migrations/prompt.en.md y ops/skills/backend-prisma.md.
Necesito agregar una tabla "geofence_events" al schema.
```

## Cómo combinar agentes

### Secuencia recomendada para un deploy seguro:
1. **observability** → verificar estado actual del sistema
2. **hardening** → auditar seguridad antes del cambio
3. **migrations** → aplicar cambios de schema si los hay
4. **testing** → verificar que nada se rompió
5. **observability** → confirmar salud post-deploy

### Secuencia para refactoring:
1. **testing** → crear tests para el código actual (red de seguridad)
2. **refactor** → modularizar con tests como respaldo
3. **testing** → verificar que los tests siguen pasando
4. **observability** → deploy y monitoreo

## Skills vs Agents

| | Skills | Agents |
|---|--------|--------|
| **Propósito** | Definen reglas y estándares | Ejecutan tareas específicas |
| **Contenido** | Principios, convenciones, anti-patterns | Role, scope, execution plan |
| **Uso** | Referencia permanente, aplican siempre | Se invocan bajo demanda |
| **Ejemplo** | "Prisma siempre se pinea a ~5.22.0" | "Audita el schema y crea una migración" |

## Plan de expansión

### Fase actual: Backend
- [x] hardening
- [x] migrations
- [x] observability
- [x] refactor
- [x] testing

### Fase siguiente: DevOps
```
ops/agents/devops/
  deploy/          Pipeline de deploy, rollback, blue-green
  monitoring/      UptimeRobot, alertas, dashboards
  infrastructure/  Nginx, SSL, firewall, backups
```

### Fase futura: Frontend
```
ops/agents/frontend/
  performance/     Bundle size, lazy loading, Core Web Vitals
  accessibility/   WCAG compliance, screen reader testing
  refactor/        Component architecture, state management
```

### Fase avanzada: AI Agents
```
ops/agents/ai/
  anomaly-detection/   Detectar patrones anómalos en device_positions
  auto-remediation/    Restart automático basado en health check patterns
  cost-optimization/   Analizar uso de Supabase y optimizar queries
```
