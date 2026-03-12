// src/api/liveShareApi.js
// Cliente ligero para /api/live-share.
// Importante: devuelve el Response nativo de fetch para NO cambiar
// el comportamiento actual de los componentes que inspeccionan
// status codes (404, 410, etc.) y llaman manualmente a res.json().

const BASE = `${import.meta.env.VITE_API_URL || '/api'}/live-share`;

/**
 * GET /api/live-share/:token — endpoint público (sin auth obligatoria).
 * Devuelve Response, el caller decide cómo manejar 404/410/etc.
 */
export function getPublicShare(token, options = {}) {
  return fetch(`${BASE}/${token}`, options);
}

/**
 * GET /api/live-share/my — shares activos del usuario autenticado.
 * Devuelve Response; el caller sigue verificando resp.ok como hoy.
 */
export function getMyShares(options = {}) {
  return fetch(`${BASE}/my`, {
    credentials: 'include',
    ...options,
  });
}

/**
 * POST /api/live-share — crear nuevo link.
 * Acepta el payload completo para preservar compatibilidad
 * (el backend ignora campos extra vía Zod).
 * Devuelve Response para conservar el mismo flujo de manejo de errores.
 */
export function createShare(payload, options = {}) {
  return fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: JSON.stringify(payload),
    ...options,
  });
}

/**
 * DELETE /api/live-share/:token — cancelar link.
 * Devuelve Response.
 */
export function cancelShare(token, options = {}) {
  return fetch(`${BASE}/${token}`, {
    method: 'DELETE',
    credentials: 'include',
    ...options,
  });
}

