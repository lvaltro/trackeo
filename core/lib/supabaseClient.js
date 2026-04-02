'use strict';
/**
 * core/lib/supabaseClient.js
 * Punto único de creación del cliente Supabase para todos los módulos de core/.
 * Al ser un módulo separado, puede ser mockeado en tests sin tocar @supabase/supabase-js.
 */

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  // Lazy require: only loaded when getClient() is actually called.
  // Tests replace this function before calling it, so the require never runs in test context.
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key, { auth: { persistSession: false } });
}

module.exports = { getClient };
