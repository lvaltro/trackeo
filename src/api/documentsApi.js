// src/api/documentsApi.js
// Cliente REST para vehicle_documents → Express /api/app/documents/

const BASE = `${import.meta.env.VITE_API_URL || '/api'}/app/documents`;

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

export const getDocuments       = (vehicleId)          => request(`/${vehicleId}`);
export const createDocument     = (vehicleId, data)    => request(`/${vehicleId}`, { method: 'POST', body: JSON.stringify(data) });
export const updateDocument     = (vehicleId, id, data) => request(`/${vehicleId}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDocument     = (vehicleId, id)      => request(`/${vehicleId}/${id}`, { method: 'DELETE' });
