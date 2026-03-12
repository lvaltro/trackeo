/**
 * TRACKEO — QStash Worker (Node)
 *
 * Writes to two tables only:
 * - device_positions: every GPS position (partitioned by month); raw time-series.
 * - device_events: only specific alerts (ignition, speed, geofence, etc.).
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY
 */

import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const maxDuration = 60;

/** Event types that are stored as alerts in device_events (not plain position updates). */
const ALERT_EVENT_TYPES = new Set([
  "ignitionOn",
  "ignitionOff",
  "deviceMoving",
  "deviceStopped",
  "geofenceEnter",
  "geofenceExit",
  "geofenceIn",
  "geofenceOut",
  "alarm",
  "overspeed",
  "commandResult",
  "deviceOffline",
  "deviceOnline",
]);

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function logStructured(obj: Record<string, unknown>) {
  console.log(JSON.stringify(obj));
}

async function handler(request: Request) {
  const start = Date.now();
  let deviceIdForLog: string | undefined;

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
    deviceIdForLog = String(uniqueId);

    const event = (body.event as { type?: string; serverTime?: string; attributes?: Record<string, unknown> }) ?? {};
    const position = (body.position as Record<string, unknown>) ?? null;
    const serverTime =
      (event as { serverTime?: string }).serverTime ??
      (position as { serverTime?: string })?.serverTime ??
      new Date().toISOString();
    const eventType = (event as { type?: string }).type ?? (position ? "positionUpdate" : "unknown");

    const supabase = getSupabase();

    const { data: dbDevice, error: deviceError } = await supabase
      .from("devices")
      .select("id")
      .eq("imei", String(uniqueId).trim())
      .single();

    if (deviceError || !dbDevice) {
      const durationMs = Date.now() - start;
      logStructured({
        type: "worker_processed",
        device_id: deviceIdForLog,
        duration_ms: durationMs,
        success: true,
        skipped: "device_not_found",
      });
      return NextResponse.json(
        { message: "Device not found in DB, ignoring.", uniqueId: String(uniqueId) },
        { status: 200 }
      );
    }

    const realDeviceId = dbDevice.id as string;
    deviceIdForLog = realDeviceId;

    if (position && typeof position === "object") {
      const lat = (position as { latitude?: number }).latitude;
      const lng = (position as { longitude?: number }).longitude;
      const speed = (position as { speed?: number }).speed;
      const attrs = (position.attributes as Record<string, unknown>) ?? {};

      // Deduplicación: ignorar si ya existe una posición para este activo
      // en el último minuto con las mismas coordenadas (±0.0001° ≈ 11 m).
      const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
      const { data: recent } = await supabase
        .from("device_positions")
        .select("id")
        .eq("device_id", realDeviceId)
        .gte("recorded_at", oneMinuteAgo)
        .gte("latitude", (lat ?? 0) - 0.0001)
        .lte("latitude", (lat ?? 0) + 0.0001)
        .gte("longitude", (lng ?? 0) - 0.0001)
        .lte("longitude", (lng ?? 0) + 0.0001)
        .limit(1);

      if (recent && recent.length > 0) {
        logStructured({
          type: "worker_processed",
          device_id: realDeviceId,
          duration_ms: Date.now() - start,
          success: true,
          skipped: "duplicate_position",
        });
        return NextResponse.json({ ok: true, skipped: "duplicate_position" }, { status: 200 });
      }

      const { error: posError } = await supabase.from("device_positions").insert({
        device_id: realDeviceId,
        recorded_at: serverTime,
        latitude: lat ?? 0,
        longitude: lng ?? 0,
        speed: speed ?? null,
        attributes: attrs,
      });

      if (posError) {
        logStructured({
          type: "worker_error",
          device_id: realDeviceId,
          error_message: posError.message,
          stack: posError.details ?? undefined,
        });
        return NextResponse.json(
          { error: "Failed to write device_positions", detail: posError.message },
          { status: 500 }
        );
      }
    }

    const isAlert = ALERT_EVENT_TYPES.has(eventType);
    if (isAlert) {
      const { error: eventError } = await supabase.from("device_events").insert({
        device_id: realDeviceId,
        event_type: eventType,
        recorded_at: serverTime,
        position_data: position ?? {},
        attributes:
          (event as { attributes?: Record<string, unknown> }).attributes ??
          (position as { attributes?: Record<string, unknown> })?.attributes ??
          {},
      });

      if (eventError) {
        logStructured({
          type: "worker_error",
          device_id: realDeviceId,
          error_message: eventError.message,
          stack: eventError.details ?? undefined,
        });
        return NextResponse.json(
          { error: "Failed to write device_events", detail: eventError.message },
          { status: 500 }
        );
      }
    }

    const durationMs = Date.now() - start;
    logStructured({
      type: "worker_processed",
      device_id: realDeviceId,
      duration_ms: durationMs,
      success: true,
    });
    return NextResponse.json({ ok: true, device_id: realDeviceId }, { status: 200 });
  } catch (e) {
    const err = e as Error;
    logStructured({
      type: "worker_error",
      device_id: deviceIdForLog ?? "unknown",
      error_message: err.message,
      stack: err.stack,
    });
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

export const POST = verifySignatureAppRouter(handler);
