# Trackeo — Next.js API (Ingestor + Worker)

When migrating to Next.js App Router, these routes implement the **async webhook pipeline**:

- **`POST /api/traccar`** — Ingestor (Node). Rate limit (Upstash) → validate payload → enqueue via modular queue (QStash), return 200 in <50ms.
- **`POST /api/worker/process`** — Worker (Node). Receives from QStash, verifies signature, writes to **device_positions** (every position) and **device_events** (alerts only).

## Environment variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `QSTASH_TOKEN` | Ingestor (queue) | Upstash QStash publish token |
| `QSTASH_CURRENT_SIGNING_KEY` | Worker | Verify QStash requests (Upstash dashboard) |
| `QSTASH_NEXT_SIGNING_KEY` | Worker | Key rotation |
| `UPSTASH_REDIS_REST_URL` | Ingestor (rate limit) | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Ingestor (rate limit) | Upstash Redis REST token |
| `SUPABASE_URL` | Worker | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker | Server-side Supabase client (bypass RLS) |
| `NEXT_PUBLIC_APP_URL` or `VERCEL_URL` | Ingestor | Base URL for Worker (e.g. `https://app.trackeo.cl`) |
| `QUEUE_PROVIDER` | Ingestor | Optional; default `qstash`. Future: `bullmq` to switch to BullMQ/Redis. |

## Dependencies

```bash
npm i @upstash/qstash @upstash/ratelimit @upstash/redis @supabase/supabase-js
```

## Queue abstraction

`app/lib/queue.ts` exposes `getQueue().publish(payload)`. Default implementation uses QStash. To switch to BullMQ/Redis later, add an adapter and set `QUEUE_PROVIDER=bullmq` (or extend the factory in `queue.ts`).

## Traccar webhook URL

Point Traccar to: `https://<your-next-domain>/api/traccar`
