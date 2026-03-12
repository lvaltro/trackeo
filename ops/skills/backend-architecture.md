# Skill: Backend Architecture Standards

## Principles

1. **Separation of concerns** — HTTP routing in `server/`, business logic in `core/`
2. **No framework in core** — `core/` must never import Express, HTTP, or request objects
3. **CommonJS everywhere** — Both `server/` and `core/` use CommonJS (`"type": "commonjs"`)
4. **Supabase for data** — All CRUD operations use `@supabase/supabase-js` with service role key
5. **Stateless where possible** — Only `live-share` uses in-memory state

## Module Structure

```
server/          → Express app, HTTP routing, middleware
  index.js       → Entrypoint: loads middleware, mounts routes, starts server
  .env           → Environment variables (gitignored)
  ecosystem.config.js → PM2 configuration

core/            → Pure business logic (no HTTP, no Express)
  geocoding/     → Reverse geocoding with cache and rate-limited queue
  live-share/    → In-memory session store for temporary location sharing
  notifications/ → Supabase CRUD for user notifications
  maintenance/   → Supabase CRUD for maintenance records
  documents/     → Supabase CRUD for vehicle documents + expiration logic
  jobs/          → Scheduled tasks (weekly stats, document reminders)
```

## Conventions

### Route Handlers
```javascript
app.get('/api/app/resource/:id', async (req, res) => {
  // 1. Auth check
  const user = await verifyTraccarSession(req);
  if (!user) return res.status(403).json({ error: 'No autenticado.' });

  // 2. Input validation
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID requerido.' });

  // 3. Business logic (delegated to core/)
  try {
    const result = await coreModule.operation(id);
    if (!result) return res.status(404).json({ error: 'No encontrado.' });
    return res.json(result);
  } catch (err) {
    logError('Context', 'Description', err.message);
    return res.status(500).json({ error: 'Error genérico para el usuario.' });
  }
});
```

### Core Modules
```javascript
// core/module/index.js
'use strict';
const { createClient } = require('@supabase/supabase-js');

const TABLE = 'table_name';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  return createClient(url, key);
}

// Export pure functions that operate on data
module.exports = { list, create, update, remove };
```

### Error Responses
| Status | Meaning | When to use |
|--------|---------|-------------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST that creates a resource |
| 400 | Bad Request | Invalid input, missing required fields |
| 403 | Forbidden | Auth failed or ownership violation |
| 404 | Not Found | Resource doesn't exist |
| 410 | Gone | Resource expired (e.g., live-share token) |
| 413 | Payload Too Large | Body exceeds limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Unexpected server error |
| 502 | Bad Gateway | Upstream service error (Nominatim, Traccar) |

### Naming
- Files: camelCase (`weeklyStats.js`, `liveShare.js`)
- DB tables: snake_case (`maintenance_records`, `vehicle_documents`)
- DB columns: snake_case (`created_at`, `vehicle_id`)
- JS variables: camelCase
- Constants: UPPER_SNAKE_CASE (`DAILY_MS`, `TABLE`)
- Routes: kebab-case (`/api/live-share`, `/api/app/weekly-stats`)

## Environment Variables

Required in `server/.env`:
| Variable | Purpose |
|----------|---------|
| `TRACCAR_API_URL` | Traccar API base URL |
| `TRACCAR_ADMIN_EMAIL` | Admin email for device position fetching |
| `TRACCAR_ADMIN_PASSWORD` | Admin password for Basic auth |
| `APP_URL` | Public app URL for generating links |
| `GEOCODE_PORT` | HTTP listening port (default 3001) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) |

## Anti-Patterns

- Never import Express or `req`/`res` in `core/` modules
- Never make HTTP calls from `core/` (except to Supabase and Nominatim via established patterns)
- Never store state in module-level variables (except geocoding cache and live-share store)
- Never use `var` — use `const` by default, `let` when reassignment is needed
- Never use callbacks — use async/await consistently
- Never catch errors silently — always log with `logError()`
