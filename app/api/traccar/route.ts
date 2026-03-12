/**
 * TRACKEO — Webhook Ingestor (Edge)
 *
 * Receives Traccar POST, validates device, applies Upstash rate limiting (edge Redis),
 * enqueues via modular queue (QStash), returns 200 in <100ms target.
 * Heavy work (DB writes) is done by the worker at /api/worker/process.
 *
 * Env: QSTASH_TOKEN, NEXT_PUBLIC_APP_URL or VERCEL_URL,
 *      UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (for rate limiting)
 */

export const runtime = "edge";

import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/edge";
import { getQueue } from "../../lib/queue";

const RATE_LIMIT_ID = "traccar-webhook";
const RATE_LIMIT_WINDOW = "1 m";
const RATE_LIMIT_MAX = 2000;

function getEdgeRatelimit(): Ratelimit {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required for rate limiting");
  }
  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW),
    analytics: true,
  });
}

export async function POST(request: Request) {
  try {
    const ratelimit = getEdgeRatelimit();
    const { success, limit, remaining, reset } = await ratelimit.limit(RATE_LIMIT_ID);
    const headers: Record<string, string> = {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(reset),
    };
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: reset },
        { status: 429, headers }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const device = body.device;
    const uniqueId = device?.uniqueId ?? device?.id;
    if (uniqueId == null || String(uniqueId).trim() === "") {
      return NextResponse.json({ error: "Missing device.uniqueId or device.id" }, { status: 400 });
    }

    const queue = getQueue();
    await queue.publish(body as Record<string, unknown>, { retries: 10 });

    return NextResponse.json({ ok: true, queued: true }, { status: 200, headers });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("QSTASH_TOKEN") || msg.includes("worker URL")) {
      return NextResponse.json({ error: "Queue not configured" }, { status: 503 });
    }
    if (msg.includes("UPSTASH_REDIS")) {
      return NextResponse.json({ error: "Rate limit not configured" }, { status: 503 });
    }
    console.error("[traccar] Ingestor error:", e);
    return NextResponse.json(
      { error: "Internal server error", message: msg },
      { status: 500 }
    );
  }
}
