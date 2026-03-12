# Skill: Prisma & Database Standards

## Principles

1. **Schema is source of truth** — `prisma/schema.prisma` defines the database structure
2. **Migrations are immutable** — Never edit an applied migration file
3. **Production is sacred** — Only `prisma migrate deploy` in production, never `dev` or `reset`
4. **Validate before apply** — Always run `prisma validate` before creating migrations

## Version Policy

- Prisma is pinned to `~5.22.0` in `server/package.json`
- Never allow `npx prisma` to pull a different major version
- Use `npx --no-install prisma` to enforce using the installed version
- Prisma 7.x is incompatible with the current schema format — do not upgrade without migration plan

## Schema Conventions

- Table names: snake_case plural (`maintenance_records`, `vehicle_documents`)
- Column names: snake_case (`created_at`, `vehicle_id`)
- Use `@map()` for Prisma field names → DB column names
- Primary keys: UUID (`@id @default(uuid()) @db.Uuid`)
- Timestamps: `createdAt DateTime @default(now()) @map("created_at")`
- All foreign keys must have explicit `@relation`

## Standalone Tables

These tables are managed by Prisma schema/migrations but accessed via Supabase client (not PrismaClient):
- `notifications` — user notification history
- `maintenance_records` — vehicle maintenance CRUD
- `vehicle_documents` — vehicle document management
- `vehicle_weekly_stats` — weekly driving statistics

This is intentional: Supabase client provides realtime capabilities and simpler server-side queries.

## Migration Workflow

```bash
# 1. Modify prisma/schema.prisma
# 2. Validate
npx --no-install prisma validate --schema prisma/schema.prisma

# 3. Create migration (LOCAL only)
npx --no-install prisma migrate dev --name descriptive_name --schema prisma/schema.prisma

# 4. Review generated SQL in prisma/migrations/<timestamp>_<name>/migration.sql

# 5. Deploy to VPS
bash scripts/deploy.sh --backend --migrate
# Or: ssh root@76.13.81.62 "bash /root/personas-trackeo/scripts/vps-migrate.sh"
```

## Indexing Guidelines

- Add indexes on columns used in WHERE clauses with high cardinality
- Add indexes on foreign key columns
- Composite indexes for multi-column queries: `@@index([organizationId, isRead])`
- Do not over-index — each index has write overhead

## Anti-Patterns

- Never use `prisma migrate reset` on production
- Never edit migration SQL files after they've been applied
- Never use `prisma db push` in production (skips migration history)
- Never store `DATABASE_URL` in source code
- Never run migrations during peak traffic hours
