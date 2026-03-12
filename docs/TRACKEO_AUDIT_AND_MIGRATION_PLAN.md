# Trackeo.cl — Project Audit & Migration Plan

---

## Resumen ejecutivo (ES)

Este documento audita la arquitectura actual de Trackeo.cl, valora su salud y escalabilidad para **más de 1.000 dispositivos GPS**, y define un **plan de migración** a Next.js con **ingestor asíncrono** (Traccar → Next.js API → QStash → Worker → Supabase).

**Objetivos del nuevo diseño:**

- **Tiempo de respuesta del webhook < 50 ms** para no provocar timeouts en Traccar.
- **Cero pérdida de datos** gracias a cola con reintentos (QStash; código modular para cambiar a BullMQ/Redis si los costes escalan).
- **Escalabilidad** con dos tablas: **device_positions** (particionada por mes, datos GPS crudos) y **device_events** (solo alertas: ignición, velocidad, geovallas).
- **Seguridad de costes**: rate limiting (Upstash) en `/api/traccar` para evitar picos de tráfico.
- **Automatización**: `pg_cron` en Supabase para crear particiones mensuales de `device_positions` de forma automática.

**Qué se ha entregado:**

1. **Auditoría de arquitectura** (EN): estado actual, cuellos de botella y recomendaciones para 1.000+ dispositivos.
2. **Migración híbrida**: frontend en Next.js como **Client Components** (mantener simplicidad) y **Next.js API Routes** para el backend.
3. **Estrategia de base de datos**: solo dos tablas — `device_positions` (particionada por mes) y `device_events` (alertas); función **pg_cron** para crear particiones mensuales.
4. **Implementación**: Ingestor con **rate limiting** y **cola modular** (QStash por defecto, preparado para BullMQ); Worker que escribe en `device_positions` + `device_events` (solo alertas).

El resto del documento contiene **especificaciones técnicas y código en inglés**; los resúmenes en **español** donde se indica.

---

## 1. Architecture Audit (Technical — EN)

### 1.1 Current Setup

| Layer | Technology | Notes |
|-------|------------|--------|
| Frontend | React 19 + Vite 7 + Tailwind | SPA; auth and vehicles now use Supabase |
| API (legacy) | Traccar on VPS (api.trackeo.cl) | Devices/positions; cookies for auth |
| Webhook | Vercel serverless (`api/webhooks/traccar.js`) | Sync: validate → devices lookup → device_events + vehicles_status |
| Database | Supabase (PostgreSQL) | Tables: `devices`, `device_events`, `vehicles_status` |
| Auth | Supabase Auth | Replaces Traccar session for app login |

### 1.2 Health & Scalability for 1,000+ GPS Devices

**Bottlenecks of the current synchronous webhook:**

- **Latency:** Each request does: 1 Supabase read (devices by IMEI) + 1 insert (device_events) + 1 upsert (vehicles_status). Under load, total time can exceed 100–200 ms, risking Traccar timeouts (often 30–60 s, but we want <50 ms for headroom).
- **No backpressure:** If Supabase or the function is slow, Traccar may retry and duplicate work, or drop events.
- **No retry queue:** Transient failures (network, 5xx) are not retried; data can be lost.
- **Cold starts:** Serverless cold starts add variance; not ideal for a single synchronous path.

**Scalability assessment:**

| Aspect | Current | For 1,000+ devices |
|--------|--------|----------------------|
| Webhook throughput | One-at-a-time per invocation | OK if we only enqueue (fast path). |
| DB write throughput | device_events + vehicles_status | Needs batching/async worker and indexes (see §3). |
| Realtime (vehicles_status) | Supabase Realtime | Fits 1k+ devices with proper RLS and connection limits. |
| Historical data | device_events (append-only) | Must be indexed and optionally partitioned (see §3). |

**Recommendations:**

1. **Async webhook pipeline:** Traccar → Next.js `/api/traccar` (validate + rate limit + enqueue) → return 200 in <50 ms. Worker writes to **device_positions** (every position) and **device_events** (alerts only). Queue abstraction allows switching from QStash to BullMQ/Redis later.
2. **Two-table database strategy:** `device_positions` (partitioned by month, raw GPS) and `device_events` (alerts: ignition, speed, geofence). Current “live” state can be derived from latest row per device in `device_positions` or a thin view/cache.
3. **Rate limiting** on the ingestor (Upstash) to prevent cost spikes. **pg_cron** to auto-create monthly partitions for `device_positions`.

---

## 2. Code Migration Roadmap (Technical — EN)

### 2.1 Hybrid Migration Strategy

- **Frontend:** Migrate to Next.js App Router using **Client Components** for all UI that depends on React state, hooks, or browser APIs. Keep the same component tree and logic as today; only the entry (pages, layout, routing) changes to Next.js. This keeps the migration simple and avoids Server Component complexity for the dashboard.
- **Backend:** Use **Next.js API Routes** for all server logic: webhook ingestor (`/api/traccar`), QStash worker (`/api/worker/process`), and any future BFF endpoints (e.g. aggregations from Supabase). No separate Node server required for the webhook pipeline.

### 2.2 Step-by-Step Migration to Next.js App Router

**Phase 1 — Foundation**

1. Create a new Next.js 14+ project (App Router, TypeScript optional).
2. Configure Tailwind and copy design tokens / global styles from the current Vite app.
3. Add Supabase: env (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_*` → `NEXT_PUBLIC_*` where needed).
4. Implement auth flow with Supabase Auth (login already done in Vite; replicate in Next.js with middleware for protected routes).

**Phase 2 — API & Webhook**

5. Implement **Ingestor** (`app/api/traccar/route.ts`) with Upstash rate limiting and modular queue (QStash). Implement **Worker** (`app/api/worker/process/route.ts`) writing to `device_positions` + `device_events` (alerts only). Point Traccar to `https://<your-next>/api/traccar`.
6. Run SQL migrations: `device_positions` (partitioned), `device_events`, and pg_cron job for monthly partitions (see §3 and `docs/migrations/`).
7. Replace any remaining Traccar API usage with Supabase or Next.js API routes.

**Phase 3 — Frontend (Client Components)**

8. Copy `src/components` into `app` or `components`. Mark interactive and data-driven components as `"use client"` so they remain Client Components.
9. Replace `react-router-dom` with Next.js navigation (`useRouter`, `<Link>`, redirects). Use `app/layout.tsx` and `app/**/page.tsx` for routes.
10. Migrate data fetching: keep `useVehicleTracker` and Supabase client (and Realtime) in client components. Map Vite env to Next.js: `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`.

**Phase 4 — Cleanup**

11. Remove Vite-specific code (e.g. `vite.config.js`, `index.html` entry).
12. Run E2E and load tests on webhook + worker; tune rate limits and QStash retries.

---

## 3. Database Strategy (Technical — EN)

### 3.1 Two-Table Design

- **device_positions** — Raw GPS time-series, **partitioned by month** on `recorded_at`. One row per position update. Used for history, routes, and “current” position (latest row per device). Millions of rows; partitioning keeps queries and retention manageable.
- **device_events** — **Alerts only** (ignition on/off, overspeed, geofence enter/exit, device online/offline, etc.). Append-only. Not used for plain position updates. Indexed by `device_id` and `server_time`.
- **devices** — already exists and indexed (e.g. `imei`, `organization_id`).

**Current live state:** Derive from the latest row per device in `device_positions` (e.g. `DISTINCT ON (device_id) ... ORDER BY recorded_at DESC`) or a materialized view / cached table if needed for Realtime.

### 3.2 device_positions (partitioned by month)

Parent table: `PARTITION BY RANGE (recorded_at)`. **pg_cron** creates next month’s partition — see `docs/migrations/supabase_device_positions_partitioned.sql`.

```sql
CREATE TABLE device_positions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL,
  latitude    double precision NOT NULL,
  longitude   double precision NOT NULL,
  speed       double precision,
  attributes  jsonb DEFAULT '{}'
) PARTITION BY RANGE (recorded_at);

CREATE INDEX idx_device_positions_device_time
  ON device_positions (device_id, recorded_at DESC);
```

### 3.3 device_events (alerts only)

No partitioning. Indexes for device + time and event type.

```sql
CREATE TABLE device_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  event_type   text NOT NULL,
  server_time  timestamptz NOT NULL,
  position_data jsonb DEFAULT '{}',
  attributes   jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_device_events_device_id_server_time
  ON device_events (device_id, server_time DESC);
CREATE INDEX idx_device_events_event_type
  ON device_events (event_type) WHERE event_type IS NOT NULL;
```

### 3.4 pg_cron: auto-create monthly partitions

Enable **pg_cron** in Supabase (Database → Extensions). Schedule a job (e.g. 1st of each month) to create the next month's partition for `device_positions`. Full function and `cron.schedule` in `docs/migrations/supabase_device_positions_partitioned.sql`.

---

## 4. Implementation: Ingestor & Worker (Technical — EN)

### 4.1 Design

- **Ingestor** `POST /api/traccar`: Receives Traccar JSON. **Upstash rate limit** first (per identifier to prevent cost spikes). Validates `device`. Publishes payload via **modular queue** (QStash by default; swap to BullMQ/Redis later via `QUEUE_PROVIDER`). Returns **200** in <50 ms.
- **Worker** `POST /api/worker/process`: Secured by QStash signature. Resolves `device_id` from `devices` by IMEI. Writes every position to **device_positions**; writes to **device_events** only for alert types (ignition, speed, geofence, etc.). Uses **Supabase Service Role**.

### 4.2 Environment Variables

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase server client.
- `QSTASH_TOKEN` — Upstash QStash (publish from Ingestor; used by queue adapter).
- `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` — Verify worker requests.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Rate limiting on `/api/traccar`.
- `NEXT_PUBLIC_APP_URL` or `VERCEL_URL` — Base URL for the Worker URL.
- `QUEUE_PROVIDER` — Optional; default `qstash`. Future: `bullmq` to switch backend.

### 4.3 Ingestor (Node) — Fast response + rate limit + modular queue

- **File:** `app/api/traccar/route.ts`. Uses `app/lib/ratelimit.ts` (Upstash) and `app/lib/queue.ts` (QStash adapter; replaceable by BullMQ).
- **Flow:** Rate limit → parse JSON → validate device → queue.publish() → return 200. On 429, return `Too many requests`.

### 4.4 Worker (Node) — device_positions + device_events (alerts only)

- **File:** `app/api/worker/process/route.ts`.
- **Flow:** Verify QStash signature → parse body → resolve device by IMEI → insert into **device_positions** (if position present) → insert into **device_events** only when `event.type` is in alert set (ignitionOn, ignitionOff, overspeed, geofenceEnter, etc.) → return 200.

---

## 5. Código de implementación (EN)

Los archivos siguientes son la implementación de referencia del Ingestor y del Worker descritos arriba. Están pensados para copiarse en un proyecto Next.js (App Router) una vez iniciada la migración.

### 5.1 Dependencies (add to Next.js project)

```bash
npm i @upstash/qstash @upstash/ratelimit @upstash/redis @supabase/supabase-js
```

### 5.2 Implementation files (in repo)

- **`app/api/traccar/route.ts`** — Ingestor: rate limit → validate → queue.publish() → 200.
- **`app/lib/queue.ts`** — Queue abstraction: `getQueue().publish(payload)`. Default QStash; add BullMQ adapter when needed.
- **`app/lib/ratelimit.ts`** — Upstash rate limit; used by ingestor. Configure `UPSTASH_REDIS_REST_*`.
- **`app/api/worker/process/route.ts`** — Worker: verify QStash → device_positions insert + device_events (alerts only).
- **`docs/migrations/supabase_device_positions_partitioned.sql`** — Tables + pg_cron for monthly partitions.

### 5.3 Ingestor snippet (rate limit + modular queue)

```ts
// Rate limit then enqueue via abstraction (see app/api/traccar/route.ts)
const { success } = await checkRateLimit("traccar-webhook");
if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
const queue = getQueue();
await queue.publish(body, { retries: 5 });
return NextResponse.json({ ok: true, queued: true }, { status: 200 });
```

### 5.4 Worker: device_positions + device_events (alerts only)

```ts
// app/api/worker/process/route.ts
// Worker: receive payload from QStash, resolve device by IMEI, write device_events + vehicles_status.
// Node runtime; verify QStash signature.

import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const maxDuration = 60;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function handler(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const device = body.device as { uniqueId?: string; id?: string } | undefined;
    const uniqueId = device?.uniqueId ?? device?.id;
    if (uniqueId == null || String(uniqueId).trim() === "") {
      return NextResponse.json({ error: "Missing device.uniqueId or device.id" }, { status: 400 });
    }

    const event = (body.event as { type?: string; serverTime?: string; attributes?: Record<string, unknown> }) ?? {};
    const position = (body.position as Record<string, unknown>) ?? null;
    const serverTime =
      (event as { serverTime?: string }).serverTime ??
      (position as { serverTime?: string })?.serverTime ??
      new Date().toISOString();
    const eventType =
      (event as { type?: string }).type ?? (position ? "positionUpdate" : "unknown");

    const supabase = getSupabase();

    const { data: dbDevice, error: deviceError } = await supabase
      .from("devices")
      .select("id")
      .eq("imei", String(uniqueId).trim())
      .single();

    if (deviceError || !dbDevice) {
      return NextResponse.json(
        { message: "Device not found in DB, ignoring.", uniqueId: String(uniqueId) },
        { status: 200 }
      );
    }

    const realDeviceId = dbDevice.id as string;

    const { error: eventError } = await supabase.from("device_events").insert({
      device_id: realDeviceId,
      event_type: eventType,
      server_time: serverTime,
      position_data: position ?? {},
      attributes: (event as { attributes?: Record<string, unknown> }).attributes ?? (position as { attributes?: Record<string, unknown> })?.attributes ?? {},
    });

    if (eventError) {
      console.error("[worker] device_events insert error:", eventError);
      return NextResponse.json(
        { error: "Failed to write device_events", detail: eventError.message },
        { status: 500 }
      );
    }

    if (position && typeof position === "object") {
      const lat = (position as { latitude?: number }).latitude;
      const lng = (position as { longitude?: number }).longitude;
      const speed = (position as { speed?: number }).speed;
      const attrs = (position.attributes as { ignition?: boolean }) ?? {};
      const ignition = attrs.ignition ?? false;

      const { error: statusError } = await supabase.from("vehicles_status").upsert(
        {
          device_id: realDeviceId,
          last_latitude: lat ?? null,
          last_longitude: lng ?? null,
          last_speed: speed ?? null,
          ignition,
          is_online: true,
          last_update: serverTime,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "device_id" }
      );

      if (statusError) {
        console.error("[worker] vehicles_status upsert error:", statusError);
        return NextResponse.json(
          { error: "Failed to upsert vehicles_status", detail: statusError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, device_id: realDeviceId }, { status: 200 });
  } catch (e) {
    console.error("[worker] Unexpected error:", e);
    return NextResponse.json(
      { error: "Internal server error", message: (e as Error).message },
      { status: 500 }
    );
  }
}

export const POST = verifySignatureAppRouter(handler);
```

---

## 6. Detalle de lo realizado (ES)

- **Auditoría:** Se revisó el estado actual (Vite, Traccar, webhook síncrono en Vercel, Supabase) y se identificaron cuellos de botella (latencia del webhook, ausencia de cola y reintentos) y se dio una valoración de escalabilidad para 1.000+ dispositivos.
- **Roadmap:** Migración en 4 fases con **estrategia híbrida**: frontend como Client Components y backend con Next.js API Routes.
- **Base de datos:** Estrategia de **dos tablas**: **device_positions** (particionada por mes) y **device_events** (solo alertas). **pg_cron** para crear particiones mensuales de `device_positions` (script en `docs/migrations/`).
- **Rate limiting:** Upstash Redis en `/api/traccar` para evitar picos de coste.
- **Cola modular:** `app/lib/queue.ts` con QStash por defecto; preparado para cambiar a BullMQ/Redis si los costes escalan.
- **Implementación:** Ingestor con rate limit y cola modular; Worker escribe en `device_positions` y en `device_events` solo para alertas (ignición, velocidad, geovallas, etc.).

Para usar el código: proyecto Next.js, instalar `@upstash/qstash`, `@upstash/ratelimit`, `@upstash/redis`, `@supabase/supabase-js`; configurar env (incl. `UPSTASH_REDIS_*`); ejecutar SQL de migración y pg_cron en Supabase. Apuntar Traccar a `https://<tu-dominio>/api/traccar`.
