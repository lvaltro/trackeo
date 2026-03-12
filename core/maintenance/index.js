'use strict';

/**
 * core/maintenance/index.js
 * Lógica de dominio para maintenance_records.
 * Usa @supabase/supabase-js con SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
 * vehicle_id = device_id de la tabla devices (el mismo UUID de vehicle_status).
 */

const { createClient } = require('@supabase/supabase-js');

const TABLE = 'maintenance_records';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados en server/.env');
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Listar todos los registros (scheduled + completed) de un vehículo.
 * Ordenados por created_at DESC.
 */
async function listByVehicle(vehicleId) {
  const { data, error } = await getClient()
    .from(TABLE)
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Crear un nuevo registro de mantenimiento.
 * Campos seguros: no se puede fijar id, vehicle_id, created_at, updated_at desde fuera.
 */
async function create(vehicleId, fields) {
  const { id: _id, vehicle_id: _vid, created_at: _ca, updated_at: _ua, ...safe } = fields;
  const { data, error } = await getClient()
    .from(TABLE)
    .insert({ ...safe, vehicle_id: vehicleId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Actualizar un registro. Solo permite modificar registros del mismo vehículo.
 * El trigger updated_at se encarga de actualizar ese campo en PostgreSQL.
 */
async function update(id, vehicleId, fields) {
  const { id: _id, vehicle_id: _vid, created_at: _ca, updated_at: _ua, ...safe } = fields;
  const { data, error } = await getClient()
    .from(TABLE)
    .update(safe)
    .eq('id', id)
    .eq('vehicle_id', vehicleId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Eliminar un registro. Solo permite eliminar registros del mismo vehículo.
 */
async function remove(id, vehicleId) {
  const { error } = await getClient()
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('vehicle_id', vehicleId);
  if (error) throw error;
}

module.exports = { listByVehicle, create, update, remove };
