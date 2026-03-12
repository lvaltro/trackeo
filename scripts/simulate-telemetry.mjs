#!/usr/bin/env node

/**
 * scripts/simulate-telemetry.mjs
 *
 * Simula telemetría GPS en Supabase:
 *   - INSERT en device_positions
 *   - UPSERT en vehicle_status (singular)
 *   - INSERT en device_events
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SIM_DEVICE_ID   (UUID)  O  SIM_DEVICE_IMEI  (string)
 *
 * Opcionales:
 *   SIM_LAT          (default: -36.8201  — Concepción)
 *   SIM_LNG          (default: -73.0444)
 *   SIM_SPEED        (default: 30)
 *   SIM_IGNITION     ("true"|"false", default: true)
 *   SIM_EVENT_TYPE   (default: "ignitionOn")
 *   SIM_MODE         ("movement" → inserta 10 posiciones con variación)
 *
 * Uso (PowerShell):
 *   $env:SUPABASE_URL="https://xxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   $env:SIM_DEVICE_IMEI="019175742870"
 *   node scripts/simulate-telemetry.mjs
 *
 *   # Modo movimiento:
 *   $env:SIM_MODE="movement"
 *   node scripts/simulate-telemetry.mjs
 */

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function env(name, required = false) {
  const value = process.env[name];
  if (required && (!value || String(value).trim() === '')) {
    throw new Error(`Variable de entorno requerida no definida: ${name}`);
  }
  return value || undefined;
}

function parseBool(str, def = false) {
  if (str == null) return def;
  const v = String(str).toLowerCase().trim();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return def;
}

function parseFloat_(str, def) {
  if (str == null) return def;
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : def;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// ---------------------------------------------------------------------------
// Resolve device_id
// ---------------------------------------------------------------------------

async function resolveDeviceId(supabase) {
  const explicitId = env('SIM_DEVICE_ID');
  const imei = env('SIM_DEVICE_IMEI');

  if (explicitId) {
    console.log(`[config] SIM_DEVICE_ID: ${explicitId}`);
    return explicitId.trim();
  }

  if (!imei) {
    throw new Error('Debes definir SIM_DEVICE_ID (UUID) o SIM_DEVICE_IMEI.');
  }

  console.log(`[config] Buscando device_id por IMEI: ${imei}`);
  const { data, error } = await supabase
    .from('devices')
    .select('id, imei, brand, model')
    .eq('imei', imei.trim())
    .single();

  if (error || !data) {
    throw new Error(`No se encontró device con imei=${imei}: ${error?.message ?? 'sin filas'}`);
  }

  console.log(`[devices] Encontrado → id=${data.id}  brand=${data.brand}  model=${data.model}`);
  return data.id;
}

// ---------------------------------------------------------------------------
// Operaciones individuales
// ---------------------------------------------------------------------------

async function insertPosition(supabase, deviceId, pos) {
  const { data, error } = await supabase
    .from('device_positions')
    .insert({
      device_id: deviceId,
      recorded_at: pos.recorded_at,
      latitude: pos.latitude,
      longitude: pos.longitude,
      speed: pos.speed,
      attributes: {
        ignition: pos.ignition,
        source: 'simulate-telemetry-script',
      },
    })
    .select()
    .single();

  if (error) {
    console.error('[device_positions] ERROR:', error.message);
    throw error;
  }

  console.log('[device_positions] INSERT OK →', JSON.stringify(data, null, 2));
  return data;
}

async function upsertStatus(supabase, deviceId, pos) {
  const { data, error } = await supabase
    .from('vehicle_status')
    .upsert(
      {
        device_id: deviceId,
        last_latitude: pos.latitude,
        last_longitude: pos.longitude,
        last_speed: pos.speed,
        ignition: pos.ignition,
        is_online: true,
        last_update: pos.recorded_at,
        updated_at: pos.recorded_at,
      },
      { onConflict: 'device_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[vehicle_status] ERROR:', error.message);
    throw error;
  }

  console.log('[vehicle_status] UPSERT OK →', JSON.stringify(data, null, 2));
  return data;
}

async function insertEvent(supabase, deviceId, pos, eventType) {
  const { data, error } = await supabase
    .from('device_events')
    .insert({
      device_id: deviceId,
      event_type: eventType,
      recorded_at: pos.recorded_at,         // ← columna correcta en device_events
      position_data: {
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed: pos.speed,
        recorded_at: pos.recorded_at,
      },
      attributes: {
        ignition: pos.ignition,
        test_event: true,
        source: 'simulate-telemetry-script',
      },
    })
    .select()
    .single();

  if (error) {
    console.error('[device_events] ERROR:', error.message);
    throw error;
  }

  console.log('[device_events] INSERT OK →', JSON.stringify(data, null, 2));
  return data;
}

// ---------------------------------------------------------------------------
// Simulación única
// ---------------------------------------------------------------------------

async function simulateSingle(supabase, deviceId, lat, lng, speed, ignition, eventType) {
  const pos = {
    recorded_at: new Date().toISOString(),
    latitude: lat,
    longitude: lng,
    speed,
    ignition,
  };

  console.log('\n--- Parámetros ---');
  console.log('device_id  :', deviceId);
  console.log('latitude   :', pos.latitude);
  console.log('longitude  :', pos.longitude);
  console.log('speed      :', pos.speed, 'km/h');
  console.log('ignition   :', pos.ignition);
  console.log('event_type :', eventType);
  console.log('recorded_at:', pos.recorded_at);
  console.log('------------------\n');

  await insertPosition(supabase, deviceId, pos);
  await upsertStatus(supabase, deviceId, pos);
  await insertEvent(supabase, deviceId, pos, eventType);
}

// ---------------------------------------------------------------------------
// Simulación de movimiento (10 posiciones)
// ---------------------------------------------------------------------------

async function simulateMovement(supabase, deviceId, startLat, startLng, eventType) {
  console.log(`\n=== SIM_MODE=movement: 10 posiciones desde (${startLat}, ${startLng}) ===\n`);

  let lat = startLat;
  let lng = startLng;

  for (let i = 1; i <= 10; i++) {
    // Pequeña variación aleatoria (~10-50 metros por paso)
    lat += rand(0.0001, 0.0005) * (Math.random() > 0.5 ? 1 : -1);
    lng += rand(0.0001, 0.0005) * (Math.random() > 0.5 ? 1 : -1);
    const speed = parseFloat_(null, rand(20, 80)).toFixed(1) * 1;
    const ignition = true;

    const pos = {
      recorded_at: new Date().toISOString(),
      latitude: parseFloat(lat.toFixed(7)),
      longitude: parseFloat(lng.toFixed(7)),
      speed,
      ignition,
    };

    console.log(`--- Posición ${i}/10 ---`);
    console.log(`lat=${pos.latitude}  lng=${pos.longitude}  speed=${pos.speed}  t=${pos.recorded_at}`);

    await insertPosition(supabase, deviceId, pos);
    await upsertStatus(supabase, deviceId, pos);

    // Solo insertar evento en la primera y última posición
    if (i === 1 || i === 10) {
      const type = i === 1 ? 'movementStart' : 'movementEnd';
      await insertEvent(supabase, deviceId, pos, type);
    }

    // Pequeña pausa entre posiciones para timestamps distintos
    await new Promise((r) => setTimeout(r, 100));
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const supabaseUrl = env('SUPABASE_URL', true);
  const supabaseKey = env('SUPABASE_SERVICE_ROLE_KEY', true);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const deviceId = await resolveDeviceId(supabase);

  const lat = parseFloat_(env('SIM_LAT'), -36.8201);
  const lng = parseFloat_(env('SIM_LNG'), -73.0444);
  const speed = parseFloat_(env('SIM_SPEED'), 30);
  const ignition = parseBool(env('SIM_IGNITION'), true);
  const eventType = env('SIM_EVENT_TYPE') ?? 'ignitionOn';
  const simMode = (env('SIM_MODE') ?? '').toLowerCase();

  if (simMode === 'movement') {
    await simulateMovement(supabase, deviceId, lat, lng, eventType);
  } else {
    await simulateSingle(supabase, deviceId, lat, lng, speed, ignition, eventType);
  }

  console.log('\n✅ Simulación completada.');
}

main().catch((err) => {
  console.error('\n❌ Error en simulate-telemetry.mjs:', err.message ?? err);
  process.exit(1);
});
