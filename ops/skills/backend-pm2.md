# Skill: PM2 Operations Standards

## Principles

1. **Config as code** — Always use `ecosystem.config.js`, never ad-hoc `pm2 start`
2. **Save after changes** — Always `pm2 save` after start/delete/restart
3. **Logs in project** — Logs go to `server/logs/`, not `~/.pm2/logs/`
4. **Production env** — `NODE_ENV=production` must always be set

## ecosystem.config.js

Location: `server/ecosystem.config.js`

Key settings:
- `name: 'app-trackeo'` — process identifier
- `script: 'index.js'` — entrypoint
- `cwd: '/root/personas-trackeo/server'` — working directory on VPS
- `exec_mode: 'fork'` — single instance (upgrade to `cluster` when ready)
- `env: { NODE_ENV: 'production' }` — production environment
- `restart_delay: 3000` — wait 3s before restart
- `max_restarts: 5` — max restarts before stopping
- `min_uptime: '10s'` — must stay up 10s to count as stable

## Common Operations

```bash
# Start (first time or after delete)
pm2 start /root/personas-trackeo/server/ecosystem.config.js
pm2 save

# Restart (after deploy)
pm2 restart app-trackeo --update-env
pm2 save

# Delete and recreate (config changes)
pm2 delete app-trackeo
pm2 start /root/personas-trackeo/server/ecosystem.config.js
pm2 save

# View status
pm2 describe app-trackeo
pm2 status

# View logs
pm2 logs app-trackeo --lines 50 --nostream
pm2 logs app-trackeo --err --lines 30 --nostream

# Flush logs (after backup or rotation)
pm2 flush app-trackeo
```

## Legacy Process

- `trackeo-api` is a legacy process name — must not exist
- `deploy.sh` automatically removes it if found
- Detection: `pm2 show trackeo-api`

## Log Management

- Error log: `server/logs/pm2-error.log`
- Output log: `server/logs/pm2-out.log`
- Application errors: `server/logs/error.log` (written by `logError()`)
- Log format includes timestamps: `YYYY-MM-DD HH:mm:ss Z`
- Logs are merged: `merge_logs: true`
- Manual rotation: `pm2 flush app-trackeo` (clears PM2 logs)

## Anti-Patterns

- Never start with `pm2 start index.js --name app-trackeo` — use ecosystem.config.js
- Never use `pm2 restart` without `--update-env` after .env changes
- Never forget `pm2 save` after changes — process list won't survive reboot
- Never use `pm2 kill` unless you want to stop ALL PM2 processes
- Never run multiple instances without persistent session storage (live-share is in-memory)

## Health Verification

After any PM2 operation:
```bash
pm2 describe app-trackeo | grep -E "status|restarts|uptime|node env|memory"
curl -s http://localhost:3001/api/app/health
```

Expected: status online, 0 restarts, NODE_ENV production, health 200.
