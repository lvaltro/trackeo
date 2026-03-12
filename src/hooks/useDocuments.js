// src/hooks/useDocuments.js
// Gestión de documentos del vehículo.
// Modo demo cuando vehicleId es null → localStorage + mock.
// Modo real cuando vehicleId está presente → API REST.

import { useState, useEffect, useCallback } from 'react';
import { getDocuments, createDocument, updateDocument, deleteDocument } from '../api/documentsApi';

const STORAGE_KEY = 'trackeo_documents_demo';

// Tipos de documentos válidos (deben coincidir con core/documents/index.js)
export const DOCUMENT_TYPES = [
  { value: 'permiso_circulacion', label: 'Permiso de Circulación' },
  { value: 'seguro_obligatorio',  label: 'Seguro Obligatorio (SOAP)' },
  { value: 'revision_tecnica',    label: 'Revisión Técnica' },
  { value: 'seguro_adicional',    label: 'Seguro Adicional' },
  { value: 'licencia',            label: 'Licencia Conductor' },
  { value: 'otro',                label: 'Otro' },
];

const TYPE_LABELS = Object.fromEntries(DOCUMENT_TYPES.map(t => [t.value, t.label]));

function calcDaysUntil(expiresAt) {
  return Math.floor((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
}

function calcStatus(expiresAt) {
  const diff = calcDaysUntil(expiresAt);
  if (diff < 0) return 'expired';
  if (diff <= 30) return 'expiring';
  return 'ok';
}

// Adaptar fila de DB al shape que espera VehicleDocumentsCard
// { type, expirationDate } + campos extra para el dashboard
function rowToDoc(row) {
  return {
    id:             row.id,
    type:           row.type,
    typeLabel:      TYPE_LABELS[row.type] || row.type,
    title:          row.title,
    expirationDate: row.expires_at,
    issueDate:      row.issue_date || null,
    notes:          row.notes || null,
    reminderDays:   row.reminder_days || [30, 7, 0],
    fileUrl:        row.file_url || null,
    status:         calcStatus(row.expires_at),
    daysUntil:      calcDaysUntil(row.expires_at),
    metadata:       row.metadata || {},
  };
}

// Mock data para demo (sin vehicleId)
function generateMockDocs() {
  const today = new Date();
  const addDays = (d) => { const dt = new Date(today); dt.setDate(dt.getDate() + d); return dt.toISOString().split('T')[0]; };
  return [
    { id: 'mock-1', vehicle_id: 'demo', type: 'permiso_circulacion', title: 'Permiso de Circulación', expires_at: addDays(45), issue_date: addDays(-320), notes: null, reminder_days: [30, 7, 0], file_url: null, status: 'ok', metadata: {} },
    { id: 'mock-2', vehicle_id: 'demo', type: 'seguro_obligatorio',  title: 'SOAP',                  expires_at: addDays(18), issue_date: addDays(-347), notes: null, reminder_days: [30, 7, 0], file_url: null, status: 'expiring', metadata: {} },
    { id: 'mock-3', vehicle_id: 'demo', type: 'revision_tecnica',    title: 'Revisión Técnica',      expires_at: addDays(-5), issue_date: addDays(-370), notes: null, reminder_days: [30, 7, 0], file_url: null, status: 'expired', metadata: {} },
  ];
}

export function useDocuments(vehicleId) {
  const useMock = !vehicleId;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar documentos
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (useMock) {
        const stored = localStorage.getItem(STORAGE_KEY);
        const raw = stored ? JSON.parse(stored) : generateMockDocs();
        setRows(raw);
      } else {
        const data = await getDocuments(vehicleId);
        setRows(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, useMock]);

  useEffect(() => { load(); }, [load]);

  // Documentos adaptados para UI
  const documents = rows.map(rowToDoc);

  // Separados por estado para el dashboard
  const expiredDocs   = documents.filter(d => d.status === 'expired');
  const expiringDocs  = documents.filter(d => d.status === 'expiring');
  const okDocs        = documents.filter(d => d.status === 'ok');

  // Para VehicleDocumentsCard (ordena: expirados primero, luego por días)
  const documentsForCard = [...expiredDocs, ...expiringDocs, ...okDocs].slice(0, 5);

  // Crear documento
  const addDocument = useCallback(async (fields) => {
    if (useMock) {
      const newDoc = {
        id: `mock-${Date.now()}`,
        vehicle_id: 'demo',
        type: fields.type,
        title: fields.title,
        expires_at: fields.expires_at,
        issue_date: fields.issue_date || null,
        notes: fields.notes || null,
        reminder_days: fields.reminder_days || [30, 7, 0],
        file_url: fields.file_url || null,
        status: calcStatus(fields.expires_at),
        metadata: fields.metadata || {},
      };
      const updated = [...rows, newDoc];
      setRows(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newDoc;
    }
    const created = await createDocument(vehicleId, fields);
    setRows(prev => [...prev, created]);
    return created;
  }, [vehicleId, useMock, rows]);

  // Actualizar documento
  const editDocument = useCallback(async (id, fields) => {
    if (useMock) {
      const updated = rows.map(r => r.id === id ? { ...r, ...fields, status: fields.expires_at ? calcStatus(fields.expires_at) : r.status } : r);
      setRows(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated.find(r => r.id === id);
    }
    const result = await updateDocument(vehicleId, id, fields);
    setRows(prev => prev.map(r => r.id === id ? result : r));
    return result;
  }, [vehicleId, useMock, rows]);

  // Eliminar documento
  const removeDocument = useCallback(async (id) => {
    if (useMock) {
      const updated = rows.filter(r => r.id !== id);
      setRows(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return;
    }
    await deleteDocument(vehicleId, id);
    setRows(prev => prev.filter(r => r.id !== id));
  }, [vehicleId, useMock, rows]);

  return {
    documents,
    documentsForCard,
    expiredDocs,
    expiringDocs,
    okDocs,
    loading,
    error,
    refresh: load,
    addDocument,
    editDocument,
    removeDocument,
    DOCUMENT_TYPES,
  };
}
