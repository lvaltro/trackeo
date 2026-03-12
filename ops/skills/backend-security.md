# Skill: Backend Security Standards

## Principles

1. **Defense in depth** — Multiple layers, never rely on a single control
2. **Least privilege** — Each component gets minimum permissions needed
3. **Fail secure** — On error, deny access rather than allow
4. **No security through obscurity** — Assume attackers know the code

## HTTP Security

- Helmet.js is mandatory on all Express apps
- CORS must use an explicit allowlist — never fallback to `*`
- `express.json()` must always have a `limit` (100kb default)
- Rate limiting is required on all `/api/` routes
- Health check endpoints are excluded from rate limiting

## Authentication

- Traccar session (JSESSIONID cookie) is the auth mechanism
- `verifyTraccarSession(req)` must be called on every protected endpoint
- Never cache session results — always verify with Traccar on each request
- Return 403 (not 401) for failed auth — consistent with existing API
- Never expose session tokens in logs or error messages

## Secrets Management

- All secrets live in `server/.env` — never in source code
- `.env` is excluded from git (`.gitignore`) and rsync (`deploy.sh`)
- Use `dotenv` with `path` option — never parse .env manually
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never send to frontend
- `TRACCAR_ADMIN_PASSWORD` is server-only — used for Basic auth to Traccar API

## Input Validation

- Validate at API boundaries (Express routes), not in core modules
- Use explicit type coercion (`parseFloat`, `Number`, `parseInt`)
- Reject invalid input with 400 and descriptive error message
- Never pass raw user input to database queries (Supabase client handles parameterization)
- Validate enum values against explicit allowlists

## Error Handling

- Never expose stack traces or internal error details to clients
- Log full error details server-side (context, message, stack)
- Return generic error messages to clients with appropriate HTTP status codes
- Use async error handling — never let unhandled promise rejections crash the process
