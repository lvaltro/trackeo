/**
 * TRACKEO — Health check endpoint.
 *
 * Returns basic liveness/readiness: timestamp, DB connectivity, environment, queue provider.
 * Keep it simple and fast. No auth here; protect via Vercel/ingress if needed.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const ts = new Date().toISOString();
  const env = process.env.NODE_ENV ?? "development";
  const queueProvider = process.env.QUEUE_PROVIDER ?? "qstash";

  let db: "ok" | "error" = "error";
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { error } = await supabase.from("devices").select("id").limit(1).maybeSingle();
      db = error ? "error" : "ok";
    }
  } catch {
    db = "error";
  }

  return NextResponse.json({
    timestamp: ts,
    db,
    environment: env,
    queue_provider: queueProvider,
  });
}
