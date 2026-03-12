'use strict';

const { createClient } = require('@supabase/supabase-js');

/**
 * Crea un cliente de Supabase usando variables de entorno del backend.
 * Reutilizable por rutas y jobs sin duplicar lógica.
 */
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  }

  return createClient(url, key);
}

module.exports = {
  getSupabaseClient,
};

