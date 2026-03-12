# Contexto: Agente de Migraciones

## Qué problema resuelve
Gestiona cambios en el schema de la base de datos de forma segura y reproducible. Evita drift entre el schema local, el VPS y Supabase.

## Cuándo usarlo
- Al agregar nuevas tablas o campos al sistema
- Al modificar tipos de datos o constraints existentes
- Al agregar índices para optimizar queries
- Cuando `prisma validate` o `prisma migrate status` reportan errores
- Antes de un deploy que incluye cambios de schema (`--migrate`)

## Qué riesgo mitiga
- **Pérdida de datos**: Migraciones destructivas sin respaldo
- **Schema drift**: Local y producción desalineados
- **Downtime**: Migraciones que bloquean tablas en producción
- **Incompatibilidad**: Código nuevo que espera campos que no existen en DB
- **Prisma version conflict**: Prisma 7.x rompiendo schema de 5.x

## Señales de activación
- `prisma validate` falla con errores de relación
- `prisma migrate status` muestra migraciones pendientes
- Nuevos módulos en `core/` requieren tablas que no existen
- Errores en VPS logs: "column does not exist" o "relation not found"
- Deploy con `--migrate` falla

## Estado actual del proyecto
- Prisma pinned a `~5.22.0` (NO usar 7.x)
- Schema tiene 25+ modelos SaaS (muchos no usados aún en runtime)
- Tablas standalone (maintenance_records, vehicle_documents, notifications, vehicle_weekly_stats) usan Supabase client directo, no PrismaClient
- Migraciones se aplican con `scripts/vps-migrate.sh` o `deploy.sh --migrate`
