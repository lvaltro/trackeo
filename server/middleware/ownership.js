'use strict';

const { createClient } = require('@supabase/supabase-js');
const { logError } = require('../lib/logger');

const TRACCAR_API_URL = process.env.TRACCAR_API_URL || 'https://api.trackeo.cl';

// In-memory cache: userEmail -> { deviceUUIDs: Set, expiresAt: number }
// TTL: 60 seconds — balances security (revoked access detected within 1 min)
// with performance (avoid hitting Traccar + Supabase on every request).
const CACHE_TTL_MS = 60 * 1000;
const userDeviceCache = new Map();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Get the Supabase device UUIDs that a Traccar user has access to.
 *
 * Flow:
 * 1. Call Traccar /api/devices with user's cookie -> get their devices (with uniqueId = IMEI)
 * 2. Query Supabase devices table by IMEIs -> get UUIDs
 * 3. Return Set of UUIDs
 */
async function getUserDeviceUUIDs(cookie) {
  // Step 1: Get user's devices from Traccar
  const resp = await fetch(`${TRACCAR_API_URL}/api/devices`, {
    headers: { 'Cookie': cookie, 'Accept': 'application/json' },
  });
  if (!resp.ok) return new Set();

  const traccarDevices = await resp.json();
  if (!traccarDevices.length) return new Set();

  // Step 2: Map IMEIs to Supabase UUIDs
  const imeis = traccarDevices.map(d => String(d.uniqueId).trim()).filter(Boolean);
  if (!imeis.length) return new Set();

  const sb = getSupabase();
  if (!sb) {
    // Fallback: if Supabase not configured, cannot verify UUIDs.
    // Log warning but don't block — this only happens in dev without Supabase.
    logError('Ownership', 'Supabase not configured — cannot map IMEIs to UUIDs');
    return new Set();
  }

  const { data, error } = await sb
    .from('devices')
    .select('id')
    .in('imei', imeis);

  if (error) {
    logError('Ownership', 'Error querying devices by IMEI', error.message);
    return new Set();
  }

  return new Set((data || []).map(d => d.id));
}

/**
 * Get cached device UUIDs for a user, refreshing if expired.
 */
async function getCachedDeviceUUIDs(userEmail, cookie) {
  const cached = userDeviceCache.get(userEmail);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.deviceUUIDs;
  }

  const deviceUUIDs = await getUserDeviceUUIDs(cookie);
  userDeviceCache.set(userEmail, {
    deviceUUIDs,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return deviceUUIDs;
}

/**
 * Express middleware: verify that the authenticated user owns the vehicleId in params.
 *
 * Requires requireAuth to have run first (req.user must exist).
 * Checks req.params.vehicleId against user's Traccar devices mapped to Supabase UUIDs.
 *
 * Also attaches req.userDeviceIds (Set<string>) for downstream use.
 */
async function requireVehicleOwnership(req, res, next) {
  const vehicleId = req.params.vehicleId;
  if (!vehicleId) {
    return next(); // No vehicleId in route — nothing to check
  }

  if (!req.user) {
    return res.status(403).json({ error: 'No autenticado.' });
  }

  try {
    const userEmail = req.user.email;
    const cookie = req.headers.cookie;
    const deviceUUIDs = await getCachedDeviceUUIDs(userEmail, cookie);

    // Attach for downstream use (e.g., listing only owned vehicles)
    req.userDeviceIds = deviceUUIDs;

    if (!deviceUUIDs.has(vehicleId)) {
      logError('Ownership', `Access denied: ${userEmail} -> vehicleId ${vehicleId}`, {
        requestId: req.id,
        ownedDevices: deviceUUIDs.size,
      });
      return res.status(403).json({ error: 'No tienes acceso a este vehiculo.' });
    }

    next();
  } catch (err) {
    logError('Ownership', 'Error verificando propiedad del vehiculo', {
      requestId: req.id,
      error: err.message,
    });
    return res.status(500).json({ error: 'Error verificando acceso al vehiculo.' });
  }
}

/**
 * Clear the device cache for a specific user (e.g., after device assignment changes).
 */
function invalidateUserCache(userEmail) {
  userDeviceCache.delete(userEmail);
}

module.exports = { requireVehicleOwnership, invalidateUserCache };
