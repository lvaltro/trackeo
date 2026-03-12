// src/api/notificationApi.js
// Servicio de notificaciones — ahora usando apiClient centralizado.
// Ruta backend: /api/app/notifications (separado de Traccar).
// Tipos: geovalla, motor, mantenimiento, alerta, perfil, sistema

import apiClient, { ApiError } from './apiClient';

const BASE = '/app/notifications';

async function backendRequest(method, path, body) {
  const endpoint = `/api${path}`;

  try {
    switch (method) {
      case 'GET':
        return await apiClient.get(path);
      case 'POST':
        return await apiClient.post(path, body, {
          headers: { 'Content-Type': 'application/json' },
        });
      case 'PUT':
        return await apiClient.put(path, body ?? {}, {
          headers: { 'Content-Type': 'application/json' },
        });
      default:
        throw new Error(`Método no soportado: ${method}`);
    }
  } catch (err) {
    // Adaptar ApiError de apiClient al comportamiento previo.
    if (err instanceof ApiError) {
      const status = err.status ?? 0;
      const text = typeof err.data === 'string' ? err.data : '';

      if (status === 404) {
        console.error(
          `[NotificationAPI] ❌ ${method} ${endpoint} → 404 NOT FOUND.\n` +
          `  Esto indica que la petición llegó a TRACCAR en vez del backend Express.\n` +
          `  Soluciones:\n` +
          `  1. Verifica que el servidor Express esté corriendo: node server/index.js\n` +
          `  2. En desarrollo, el proxy de Vite debe apuntar /api/app → localhost:3001\n` +
          `  3. En producción, Nginx necesita: location /api/app/ { proxy_pass http://127.0.0.1:3001; }`
        );
        throw new Error('Backend Express no alcanzable (404 — petición llegó a Traccar)');
      }

      if (status === 403) {
        console.warn(
          `[NotificationAPI] ⚠️ ${method} ${endpoint} → 403 NO AUTENTICADO.\n` +
          `  La cookie JSESSIONID no llegó al backend o la sesión expiró.\n` +
          `  Respuesta: ${text}`
        );
        throw new Error('Sesión no válida (403). Vuelve a iniciar sesión.');
      }

      console.error(`[NotificationAPI] ${method} ${endpoint} → ${status}:`, text || err.message);
      throw new Error(text || err.message || `Error ${status}`);
    }

    // Error de red (servidor no disponible).
    if (err?.name === 'TypeError' || err?.message?.includes('Failed') || err?.message?.includes('network')) {
      console.error(
        `[NotificationAPI] ❌ Error de red para ${endpoint}.\n` +
        `  El servidor no respondió. ¿Está corriendo el backend? → node server/index.js`
      );
      throw new Error('Servidor de notificaciones no disponible');
    }

    throw err;
  }
}

// ─── Verificar conectividad con el backend Express ───
export async function checkBackendHealth() {
  try {
    const data = await apiClient.get('/app/health');
    return data?.status === 'ok';
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn('[NotificationAPI] Health check falló:', err.message);
    }
    return false;
  }
}

/**
 * Obtener notificaciones del usuario (últimos 7 días).
 * @param {number} limit - Máximo de notificaciones (default 50)
 * @returns {Promise<Array>}
 */
export async function getNotifications(limit = 50) {
  return backendRequest('GET', `${BASE}?limit=${limit}`);
}

/**
 * Guardar una nueva notificación en el historial propio.
 * @param {{ tipo: string, mensaje: string, dispositivo?: string, leido?: boolean }} data
 * @returns {Promise<object>}
 */
export async function createNotification(data) {
  return backendRequest('POST', BASE, data);
}

/**
 * Marcar una notificación como leída.
 * @param {number} id
 */
export async function markAsRead(id) {
  return backendRequest('PUT', `${BASE}/${id}/read`);
}

/**
 * Marcar todas las notificaciones como leídas.
 */
export async function markAllAsRead() {
  return backendRequest('PUT', `${BASE}/read-all`);
}
