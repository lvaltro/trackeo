// src/api/traccarApi.js
// Capa de servicio Traccar — usa apiClient como transporte.
// Cada método corresponde a un endpoint de la API de Traccar.

import apiClient from './apiClient';

export const traccarService = {
  // ═══ Autenticación ═══

  /** POST /session — Login con email y password (form-urlencoded) */
  login: (email, password) =>
    apiClient.post(
      '/session',
      `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ),

  /** DELETE /session — Cerrar sesión en Traccar */
  logout: () => apiClient.delete('/session'),

  /** GET /session — Obtener sesión actual (valida si la cookie sigue activa) */
  getSession: () => apiClient.get('/session'),

  // ═══ Dispositivos ═══

  /** GET /devices — Lista todos los dispositivos del usuario */
  getDevices: (options) => apiClient.get('/devices', options),

  /** GET /devices/:id — Dispositivo específico */
  getDevice: (id, options) => apiClient.get(`/devices/${id}`, options),

  // ═══ Posiciones ═══

  /** GET /positions — Últimas posiciones de todos los dispositivos */
  getPositions: (options) => apiClient.get('/positions', options),

  // ═══ Reportes ═══

  /** GET /reports/route — Historial de ruta de un dispositivo */
  getRouteReport: (deviceId, from, to, options) => {
    const params = new URLSearchParams({
      deviceId: String(deviceId),
      from,
      to,
    });
    return apiClient.get(`/reports/route?${params}`, options);
  },

  // ═══ Comandos IoT ═══

  /** POST /commands/send — Enviar comando al dispositivo (ej: engineStop, engineResume) */
  sendCommand: (deviceId, command) =>
    apiClient.post('/commands/send', { deviceId, ...command }, {
      headers: { 'Content-Type': 'application/json' },
    }),

  // ═══ Geovallas (Geofences) ═══

  /** GET /geofences — Lista todas las geovallas del usuario */
  getGeofences: (options) => apiClient.get('/geofences', options),

  /** POST /geofences — Crear nueva geovalla (area en formato WKT) */
  createGeofence: (geofence) =>
    apiClient.post('/geofences', geofence, {
      headers: { 'Content-Type': 'application/json' },
    }),

  /** PUT /geofences/:id — Actualizar geovalla existente */
  updateGeofence: (id, geofence) =>
    apiClient.put(`/geofences/${id}`, geofence, {
      headers: { 'Content-Type': 'application/json' },
    }),

  /** DELETE /geofences/:id — Eliminar geovalla */
  deleteGeofence: (id) => apiClient.delete(`/geofences/${id}`),

  /** POST /permissions — Asignar geovalla a dispositivo */
  assignGeofenceToDevice: (deviceId, geofenceId) =>
    apiClient.post('/permissions', { deviceId, geofenceId }, {
      headers: { 'Content-Type': 'application/json' },
    }),

  // ═══ Usuarios ═══

  /** PUT /users/:id — Actualizar datos del usuario (atributos, email, teléfono, etc.) */
  updateUser: (id, userData) =>
    apiClient.put(`/users/${id}`, userData, {
      headers: { 'Content-Type': 'application/json' },
    }),

  // ═══ Preparación IoT (futuros endpoints) ═══
  // getNotifications: () => apiClient.get('/notifications'),
  // getAlerts: (deviceId) => apiClient.get(`/events?deviceId=${deviceId}`),
};

export default traccarService;
