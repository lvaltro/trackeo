# Checklist: Migraciones de Base de Datos

## Pre-migración

### Local
- [ ] `npx prisma validate --schema prisma/schema.prisma` — sin errores
- [ ] `npx prisma migrate status --schema prisma/schema.prisma` — sin migraciones pendientes
- [ ] Schema change no elimina campos con datos en producción
- [ ] Nuevo migration file creado con nombre descriptivo
- [ ] SQL de migración revisado manualmente

### VPS
- [ ] `DATABASE_URL` en `server/.env` apunta a la DB correcta
- [ ] Prisma CLI version es `~5.22.x` (no 7.x)
- [ ] Backup de tablas afectadas si la migración es destructiva

## Aplicar migración

```bash
# Local — crear migración
npx prisma migrate dev --name descripcion_del_cambio --schema prisma/schema.prisma

# VPS — aplicar en producción
bash scripts/deploy.sh --backend --migrate
# O manualmente:
ssh root@76.13.81.62 "bash /root/personas-trackeo/scripts/vps-migrate.sh"
```

## Post-migración

### Local
- [ ] `npx prisma migrate status` muestra todo aplicado
- [ ] `npx prisma validate` pasa limpio
- [ ] Server arranca sin errores de DB

### VPS
- [ ] `ssh root@76.13.81.62 "cd /root/personas-trackeo && npx prisma migrate status --schema prisma/schema.prisma"` — todo aplicado
- [ ] Health check: `curl -s http://localhost:3001/api/app/health` — `db.ok: true`
- [ ] PM2 sin errores: `pm2 logs app-trackeo --lines 20 --nostream`
- [ ] Tablas nuevas accesibles: verificar con query Supabase

## Rollback
```bash
# Si la migración falla en VPS, NO hacer rollback automático.
# Diagnosticar primero:
ssh root@76.13.81.62 "cd /root/personas-trackeo && npx prisma migrate status --schema prisma/schema.prisma"
# Si es necesario revertir, crear una nueva migración inversa.
```
