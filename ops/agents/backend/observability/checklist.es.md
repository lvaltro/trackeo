# Checklist: Observabilidad Backend

## Health check rápido (1 minuto)

```bash
ssh root@76.13.81.62 "curl -s http://localhost:3001/api/app/health | node -e \"process.stdin.on('data',d=>{const h=JSON.parse(d);console.log('Status:',h.status,'| DB:',h.db.ok,'| Build:',h.build?.builtAt||'unknown')})\""
```

- [ ] `status: ok`
- [ ] `db.ok: true`
- [ ] `build.builtAt` tiene fecha reciente

## PM2 y proceso

- [ ] `pm2 describe app-trackeo` — status: online
- [ ] Restarts: 0 (o número bajo estable)
- [ ] Memory: < 150mb
- [ ] NODE_ENV: production
- [ ] Log paths apuntan a `server/logs/` (no a `~/.pm2/logs/`)
- [ ] Uptime: coherente con último deploy

```bash
ssh root@76.13.81.62 "pm2 describe app-trackeo | grep -E 'status|restarts|uptime|memory|node env|error log|out log'"
```

## Logs

- [ ] Error log sin errores nuevos recurrentes
- [ ] Output log muestra startup limpio
- [ ] Sin stack traces de crashes

```bash
# Últimos errores
ssh root@76.13.81.62 "pm2 logs app-trackeo --err --lines 30 --nostream"

# Últimas salidas
ssh root@76.13.81.62 "pm2 logs app-trackeo --out --lines 30 --nostream"

# Tamaño de logs (verificar que no crecen sin control)
ssh root@76.13.81.62 "du -sh /root/personas-trackeo/server/logs/"
```

## Sistema

- [ ] Disco < 80%: `ssh root@76.13.81.62 "df -h /"`
- [ ] Memoria disponible > 500mb: `ssh root@76.13.81.62 "free -m | head -2"`
- [ ] No hay procesos zombie de Node: `ssh root@76.13.81.62 "ps aux | grep node | grep -v grep"`

## DB (Supabase)

- [ ] Health endpoint reporta `db.ok: true`
- [ ] Queries no timeout (verificar logs por "timeout" o "ECONNREFUSED")
- [ ] Tablas accesibles: notifications, maintenance_records, vehicle_documents, vehicle_weekly_stats
