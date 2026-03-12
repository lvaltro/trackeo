/**
 * TRACKEO — Queue abstraction for webhook payloads.
 *
 * Implementations: QStash (default). Swap to BullMQ/Redis later by adding
 * a new adapter and switching QUEUE_PROVIDER or the factory below.
 *
 * QStash retry behavior:
 * - retries: 10 — up to 10 delivery attempts before giving up.
 * - retryDelay: "exponential" — backoff between attempts (e.g. 1s, 2s, 4s...) to avoid thundering herd.
 * - timeout: "60s" — each attempt waits up to 60s for the worker to respond; then QStash retries.
 * TODO: Dead-letter strategy — after all retries fail, consider forwarding to a DLQ URL or logging
 * to a persistent store for manual replay. Not implemented yet.
 */

export type QueuePayload = Record<string, unknown>;

export interface QueueAdapter {
  /** Publish a single payload to the worker URL. Returns message id or similar. */
  publish(payload: QueuePayload, options?: { retries?: number }): Promise<string | void>;
}

/** QStash implementation. Env: QSTASH_TOKEN, worker URL from getWorkerUrl(). */
function createQStashAdapter(workerUrl: string): QueueAdapter {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error("QSTASH_TOKEN is required for QStash adapter");

  // Dynamic import to allow Edge runtime (QStash client is fetch-based)
  return {
    async publish(payload: QueuePayload, options?: { retries?: number }) {
      const { Client } = await import("@upstash/qstash");
      const client = new Client({ token });
      const res = await client.publishJSON({
        url: workerUrl,
        body: payload,
        retries: options?.retries ?? 10,
        retryDelay: "exponential",
        timeout: "60s",
      });
      return (res as { messageId?: string })?.messageId;
    },
  };
}

/** Factory: returns the active queue adapter. Extend with BullMQ when needed. */
export function getQueue(): QueueAdapter {
  const provider = process.env.QUEUE_PROVIDER || "qstash";
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!base) throw new Error("Missing NEXT_PUBLIC_APP_URL or VERCEL_URL for worker URL");
  const workerUrl = base.startsWith("http") ? `${base}/api/worker/process` : `https://${base}/api/worker/process`;

  if (provider === "qstash") {
    return createQStashAdapter(workerUrl);
  }
  // Future: if (provider === "bullmq") return createBullMQAdapter(workerUrl);
  throw new Error(`Unknown QUEUE_PROVIDER: ${provider}`);
}
