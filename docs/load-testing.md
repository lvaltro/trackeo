# Load testing — Trackeo

Basic load-testing guide for the webhook ingestor and worker pipeline. Uses [k6](https://k6.io/) (no extra services).

## Prerequisites

- Install k6: `winget install k6` (Windows) or [k6 install](https://k6.io/docs/get-started/installation/).
- Ingestor URL (e.g. `https://<your-domain>/api/traccar`) and a valid Traccar-style JSON body.

## Success criteria

| Metric | Target |
|--------|--------|
| Ingestor p99 latency | < 100 ms |
| Error rate | 0% |
| All messages processed by worker | 100% (verify via logs or DB after run) |

## k6 script example

Save as `scripts/load-test-ingestor.js` (or similar):

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    // 50–100 virtual users, ramping up and steady
    constant_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },
        { duration: "1m", target: 50 },
        { duration: "30s", target: 100 },
        { duration: "2m", target: 100 },
      ],
      gracefulRampDown: "20s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],   // <1% errors (target 0%)
    http_req_duration: ["p(99)<100"], // p99 < 100ms for ingestor
  },
};

const INGESTOR_URL = __ENV.INGESTOR_URL || "https://your-app.vercel.app/api/traccar";

const samplePayload = {
  device: { uniqueId: "LOAD-TEST-001", id: 1 },
  event: { type: "positionUpdate", serverTime: new Date().toISOString() },
  position: {
    latitude: -33.45,
    longitude: -70.66,
    speed: 0,
    serverTime: new Date().toISOString(),
  },
};

export default function () {
  const res = http.post(
    INGESTOR_URL,
    JSON.stringify(samplePayload),
    { headers: { "Content-Type": "application/json" } }
  );
  check(res, { "status is 200 or 429": (r) => r.status === 200 || r.status === 429 });
  if (res.status !== 200 && res.status !== 429) {
    console.warn("Unexpected status: " + res.status + " body: " + res.body);
  }
  sleep(0.5); // optional: avoid hammering
}
```

## Running the test

```bash
# Default URL (set in script or override)
k6 run scripts/load-test-ingestor.js

# Override ingestor URL
k6 run -e INGESTOR_URL=https://app.trackeo.cl/api/traccar scripts/load-test-ingestor.js
```

## Verifying worker processing

- After the run, check that all messages were processed:
  - **Logs**: `worker_processed` and `worker_error` structured logs (e.g. in Vercel / your log aggregator).
  - **Database**: Count new rows in `device_positions` for the test device (e.g. `LOAD-TEST-001` if it exists in `devices`, or ignore 200 “device not found” as success).
- Rate limit (429) is acceptable under load; count them separately from 5xx/4xx errors for “0% error rate” (only non-2xx/429 count as failures if you choose).

## Notes

- Use a dedicated test device `uniqueId` and optionally remove or filter test data after runs.
- For 0% error rate, ensure the environment (QStash, Upstash Redis, Supabase) is healthy and within limits before the test.
