// Cliente Supabase para el frontend (Vite).
// En .env define: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
// (puedes usar los mismos valores que SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY)

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[supabaseClient] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env. ' +
    'El mapa y Realtime no funcionarán hasta configurarlos.'
  );
}

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
