// src/api/maintenanceApi.js
// Cliente REST para maintenance_records → Express /api/app/maintenance/

const BASE = `${import.meta.env.VITE_API_URL || '/api'}/app/maintenance`;

async function request(path, options = {}) {
  const resp = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

export const getMaintenanceRecords = (vehicleId) =>
  request(`/${vehicleId}`);

export const createMaintenanceRecord = (vehicleId, data) =>
  request(`/${vehicleId}`, { method: 'POST', body: JSON.stringify(data) });

export const updateMaintenanceRecord = (vehicleId, id, data) =>
  request(`/${vehicleId}/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteMaintenanceRecord = (vehicleId, id) =>
  request(`/${vehicleId}/${id}`, { method: 'DELETE' });
