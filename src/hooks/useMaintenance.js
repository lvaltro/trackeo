// src/hooks/useMaintenance.js
// Hook de mantenimiento vehicular.
// - Con vehicleId: carga datos desde la API (Supabase vía Express).
// - Sin vehicleId: usa localStorage con datos mock (modo demo / sin vehículo seleccionado).

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from '../api/maintenanceApi.js';

// ═══════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════

export const MAINTENANCE_CATEGORIES = {
  oil:         { label: 'Cambio de Aceite',      emoji: '🛢️', icon: 'Droplet',     color: 'amber',   defaultKm: 5000,  defaultMonths: 6  },
  oil_filter:  { label: 'Filtro de Aceite',      emoji: '🔧', icon: 'Filter',      color: 'amber',   defaultKm: 10000, defaultMonths: 12 },
  air_filter:  { label: 'Filtro de Aire',        emoji: '💨', icon: 'Wind',        color: 'sky',     defaultKm: 15000, defaultMonths: 12 },
  brakes:      { label: 'Sistema de Frenos',     emoji: '🛑', icon: 'Disc',        color: 'red',     defaultKm: 40000, defaultMonths: 24 },
  tires:       { label: 'Neumáticos',            emoji: '🛞', icon: 'Circle',      color: 'neutral', defaultKm: 50000, defaultMonths: 36 },
  battery:     { label: 'Batería',               emoji: '🔋', icon: 'Battery',     color: 'green',   defaultKm: 40000, defaultMonths: 36 },
  coolant:     { label: 'Refrigerante',          emoji: '🌡️', icon: 'Thermometer', color: 'blue',    defaultKm: 40000, defaultMonths: 24 },
  transmission:{ label: 'Transmisión',           emoji: '⚙️', icon: 'Settings',    color: 'purple',  defaultKm: 60000, defaultMonths: 48 },
  sparkplugs:  { label: 'Bujías',               emoji: '⚡', icon: 'Zap',         color: 'yellow',  defaultKm: 30000, defaultMonths: 24 },
  alignment:   { label: 'Alineación y Balanceo', emoji: '🎯', icon: 'Compass',    color: 'indigo',  defaultKm: 20000, defaultMonths: 12 },
  rotation:    { label: 'Rotación Neumáticos',   emoji: '🔄', icon: 'RotateCw',   color: 'teal',    defaultKm: 10000, defaultMonths: 6  },
  inspection:  { label: 'Revisión Técnica',      emoji: '📋', icon: 'FileCheck',   color: 'blue',    defaultKm: null,  defaultMonths: 12 },
  insurance:   { label: 'SOAP / Seguro',         emoji: '🛡️', icon: 'Shield',      color: 'emerald', defaultKm: null,  defaultMonths: 12 },
  permit:      { label: 'Permiso Circulación',   emoji: '📄', icon: 'FileText',    color: 'violet',  defaultKm: null,  defaultMonths: 12 },
  other:       { label: 'Otro',                  emoji: '🔧', icon: 'Wrench',      color: 'neutral', defaultKm: 10000, defaultMonths: 12 },
};

export const ESTIMATED_COSTS = {
  oil:         { min: 25000,  max: 45000  },
  oil_filter:  { min: 8000,   max: 15000  },
  air_filter:  { min: 10000,  max: 20000  },
  brakes:      { min: 80000,  max: 150000 },
  tires:       { min: 200000, max: 400000 },
  battery:     { min: 50000,  max: 100000 },
  coolant:     { min: 20000,  max: 35000  },
  transmission:{ min: 100000, max: 200000 },
  sparkplugs:  { min: 40000,  max: 80000  },
  alignment:   { min: 25000,  max: 40000  },
  rotation:    { min: 15000,  max: 25000  },
  inspection:  { min: 25000,  max: 35000  },
  insurance:   { min: 300000, max: 800000 },
  permit:      { min: 150000, max: 200000 },
  other:       { min: 0,      max: 0      },
};

const STORAGE_KEY = 'trackeo_maintenance';

// ═══════════════════════════════════════════════════
// CÁLCULOS (sin cambios)
// ═══════════════════════════════════════════════════

export function calculateWear(service, currentKm) {
  if (!service.enabled) return 0;
  let wearByKm = 0;
  let wearByTime = 0;
  if (service.intervalKm && service.lastServiceKm != null) {
    const kmSince = currentKm - service.lastServiceKm;
    wearByKm = Math.max(0, (kmSince / service.intervalKm) * 100);
  }
  if (service.intervalMonths && service.lastServiceDate) {
    const msSince = Date.now() - new Date(service.lastServiceDate).getTime();
    const monthsSince = msSince / (1000 * 60 * 60 * 24 * 30.44);
    wearByTime = Math.max(0, (monthsSince / service.intervalMonths) * 100);
  }
  if (service.intervalKm && service.intervalMonths) return Math.max(wearByKm, wearByTime);
  return service.intervalKm ? wearByKm : wearByTime;
}

export function getStatus(wear) {
  if (wear >= 100) return 'overdue';
  if (wear >= 85)  return 'critical';
  if (wear >= 60)  return 'warning';
  return 'ok';
}

export function getDaysRemaining(service) {
  if (!service.intervalMonths || !service.lastServiceDate) return null;
  const nextDate = new Date(service.lastServiceDate);
  nextDate.setMonth(nextDate.getMonth() + service.intervalMonths);
  return Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function getKmRemaining(service, currentKm) {
  if (!service.intervalKm || service.lastServiceKm == null) return null;
  return (service.lastServiceKm + service.intervalKm) - currentKm;
}

export function calculateHealthScore(services, currentKm) {
  const active = services.filter(s => s.enabled);
  if (active.length === 0) return 100;
  const weights   = { high: 1.5, medium: 1, low: 0.5 };
  const penalties = { ok: 0, warning: 8, critical: 20, overdue: 40 };
  let totalPenalty = 0;
  let totalWeight  = 0;
  active.forEach(service => {
    const wear   = calculateWear(service, currentKm);
    const status = getStatus(wear);
    const weight = weights[service.priority || 'medium'];
    totalPenalty += penalties[status] * weight;
    totalWeight  += weight;
  });
  if (totalWeight === 0) return 100;
  return Math.max(0, Math.round(100 - (totalPenalty / (totalWeight * 40)) * 100));
}

// ═══════════════════════════════════════════════════
// DATOS MOCK (primera vez / modo demo)
// ═══════════════════════════════════════════════════

function generateMockServices(currentKm) {
  const baseKm = currentKm || 45000;
  const now = new Date();
  return [
    { id: 'svc-1', category: 'oil',        title: 'Cambio de aceite 10W-40',        description: 'Aceite sintético + filtro incluido',   intervalKm: 5000,  intervalMonths: 6,  lastServiceKm: baseKm - 3200,  lastServiceDate: new Date(now - 90  * 86400000).toISOString(), lastServiceCost: 35000,  estimatedCost: { min: 25000, max: 45000  }, enabled: true, priority: 'high',   reminder: true, notes: '',  completed: false },
    { id: 'svc-2', category: 'inspection', title: 'Revisión técnica',               description: 'Revisión técnica anual obligatoria',   intervalKm: null,  intervalMonths: 12, lastServiceKm: null,           lastServiceDate: new Date(now - 340 * 86400000).toISOString(), lastServiceCost: 28000,  estimatedCost: { min: 25000, max: 35000  }, enabled: true, priority: 'high',   reminder: true, notes: 'Planta revisión: Av. Grecia 1234', completed: false },
    { id: 'svc-3', category: 'brakes',     title: 'Pastillas de freno delanteras',  description: 'Pastillas cerámicas + revisión discos', intervalKm: 40000, intervalMonths: 24, lastServiceKm: baseKm - 28000, lastServiceDate: new Date(now - 450 * 86400000).toISOString(), lastServiceCost: 95000,  estimatedCost: { min: 80000, max: 150000 }, enabled: true, priority: 'high',   reminder: true, notes: '',  completed: false },
    { id: 'svc-4', category: 'tires',      title: 'Neumáticos (juego completo)',    description: '4 neumáticos 205/55 R16',               intervalKm: 50000, intervalMonths: 36, lastServiceKm: baseKm - 22000, lastServiceDate: new Date(now - 300 * 86400000).toISOString(), lastServiceCost: 280000, estimatedCost: { min: 200000, max: 400000 }, enabled: true, priority: 'medium', reminder: true, notes: '',  completed: false },
    { id: 'svc-5', category: 'battery',    title: 'Batería 12V',                   description: 'Batería libre mantención 60Ah',         intervalKm: 40000, intervalMonths: 36, lastServiceKm: baseKm - 15000, lastServiceDate: new Date(now - 540 * 86400000).toISOString(), lastServiceCost: 65000,  estimatedCost: { min: 50000, max: 100000 }, enabled: true, priority: 'medium', reminder: true, notes: '',  completed: false },
    { id: 'svc-6', category: 'air_filter', title: 'Filtro de aire motor',           description: 'Filtro original o equivalente',         intervalKm: 15000, intervalMonths: 12, lastServiceKm: baseKm - 8000,  lastServiceDate: new Date(now - 180 * 86400000).toISOString(), lastServiceCost: 12000,  estimatedCost: { min: 10000, max: 20000  }, enabled: true, priority: 'low',    reminder: true, notes: '',  completed: false },
    { id: 'svc-7', category: 'alignment',  title: 'Alineación y balanceo',         description: '4 ruedas, ajuste de convergencia',     intervalKm: 20000, intervalMonths: 12, lastServiceKm: baseKm - 18000, lastServiceDate: new Date(now - 330 * 86400000).toISOString(), lastServiceCost: 32000,  estimatedCost: { min: 25000, max: 40000  }, enabled: true, priority: 'low',    reminder: true, notes: '',  completed: false },
    { id: 'svc-8', category: 'insurance',  title: 'SOAP Obligatorio',              description: 'Seguro obligatorio de accidentes',     intervalKm: null,  intervalMonths: 12, lastServiceKm: null,           lastServiceDate: new Date(now - 300 * 86400000).toISOString(), lastServiceCost: 45000,  estimatedCost: { min: 300000, max: 800000 }, enabled: true, priority: 'medium', reminder: true, notes: '',  completed: false },
  ];
}

function generateMockHistory() {
  const now = new Date();
  return [
    { id: 'hist-1', category: 'oil',        title: 'Cambio de aceite 10W-40',          performedAt: new Date(now - 90  * 86400000).toISOString(), performedAtKm: 41800, cost: 35000,  performedBy: 'Taller AutoPro',  notes: 'Aceite Mobil 1 sintético'         },
    { id: 'hist-2', category: 'brakes',     title: 'Cambio pastillas delanteras',       performedAt: new Date(now - 450 * 86400000).toISOString(), performedAtKm: 17000, cost: 95000,  performedBy: 'Frenos Chile',     notes: 'Pastillas cerámicas Brembo'       },
    { id: 'hist-3', category: 'tires',      title: 'Neumáticos nuevos 205/55 R16',      performedAt: new Date(now - 300 * 86400000).toISOString(), performedAtKm: 23000, cost: 280000, performedBy: 'NeumaCenter',      notes: 'Michelin Primacy 4'               },
    { id: 'hist-4', category: 'inspection', title: 'Revisión técnica aprobada',         performedAt: new Date(now - 340 * 86400000).toISOString(), performedAtKm: 20000, cost: 28000,  performedBy: 'PRT San Miguel',   notes: 'Aprobada sin observaciones'       },
    { id: 'hist-5', category: 'alignment',  title: 'Alineación y balanceo 4 ruedas',   performedAt: new Date(now - 330 * 86400000).toISOString(), performedAtKm: 27000, cost: 32000,  performedBy: 'NeumaCenter',      notes: 'Convergencia ajustada'            },
  ];
}

// ═══════════════════════════════════════════════════
// MAPEADORES DB ↔ HOOK
// ═══════════════════════════════════════════════════

/** Fila DB (status=scheduled) → formato interno del hook */
function rowToService(row) {
  const m = row.metadata || {};
  return {
    id: row.id,
    category: row.type,
    title: row.title,
    description: m.description || '',
    intervalKm: m.intervalKm ?? null,
    intervalMonths: m.intervalMonths ?? null,
    lastServiceKm: row.completed_km != null ? Number(row.completed_km) : null,
    lastServiceDate: row.completed_date ?? null,
    lastServiceCost: row.cost != null ? Number(row.cost) : null,
    estimatedCost: m.estimatedCost ?? null,
    enabled: m.enabled !== false,
    priority: m.priority || 'medium',
    reminder: m.reminder !== false,
    notes: row.notes || '',
    completed: false,
  };
}

/** Fila DB (status=completed) → formato historial del hook */
function rowToHistory(row) {
  return {
    id: row.id,
    category: row.type,
    title: row.title,
    performedAt: row.completed_date ?? row.created_at,
    performedAtKm: row.completed_km != null ? Number(row.completed_km) : null,
    cost: row.cost != null ? Number(row.cost) : 0,
    performedBy: row.completed_by || '',
    notes: row.notes || '',
  };
}

/** Datos del hook → fila para INSERT en DB (servicio programado) */
function serviceToInsert(vehicleId, data) {
  return {
    vehicle_id: vehicleId,
    type: data.category || 'other',
    title: data.title || '',
    notes: data.notes || null,
    completed_date: data.lastServiceDate || null,
    completed_km: data.lastServiceKm ?? null,
    cost: data.lastServiceCost ?? null,
    status: 'scheduled',
    metadata: {
      description: data.description || '',
      intervalKm: data.intervalKm ?? null,
      intervalMonths: data.intervalMonths ?? null,
      estimatedCost: data.estimatedCost ?? null,
      enabled: data.enabled !== false,
      priority: data.priority || 'medium',
      reminder: data.reminder !== false,
    },
  };
}

/** Datos del hook → fila para UPDATE en DB (servicio programado) */
function serviceToUpdate(data) {
  return {
    type: data.category || 'other',
    title: data.title || '',
    notes: data.notes || null,
    completed_date: data.lastServiceDate || null,
    completed_km: data.lastServiceKm ?? null,
    cost: data.lastServiceCost ?? null,
    metadata: {
      description: data.description || '',
      intervalKm: data.intervalKm ?? null,
      intervalMonths: data.intervalMonths ?? null,
      estimatedCost: data.estimatedCost ?? null,
      enabled: data.enabled !== false,
      priority: data.priority || 'medium',
      reminder: data.reminder !== false,
    },
  };
}

// ═══════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════

/**
 * @param {string|null} vehicleId - device_id del vehículo activo. Si es null/undefined,
 *   opera en modo demo (localStorage). Si está definido, carga desde la API.
 * @param {number} currentKm - Odómetro actual para cálculos de desgaste.
 */
export function useMaintenance(vehicleId, currentKm = 0) {
  // scheduledRows: filas DB con status='scheduled' (o services en modo mock)
  const [scheduledRows, setScheduledRows] = useState([]);
  // completedRows: filas DB con status='completed' (o history en modo mock)
  const [completedRows, setCompletedRows] = useState([]);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const useMock = !vehicleId;

  // ─── Carga inicial ───────────────────────────────
  useEffect(() => {
    if (useMock) {
      // Modo demo: cargar desde localStorage o generar mock
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          setScheduledRows(data.services || []);
          setCompletedRows(data.history  || []);
          setIsPro(data.isPro || false);
        } else {
          setScheduledRows(generateMockServices(currentKm));
          setCompletedRows(generateMockHistory());
        }
      } catch {
        setScheduledRows(generateMockServices(currentKm));
        setCompletedRows(generateMockHistory());
      }
      setLoading(false);
      return;
    }

    // Modo real: cargar desde API
    setLoading(true);
    setError(null);
    getMaintenanceRecords(vehicleId)
      .then(records => {
        setScheduledRows(records.filter(r => r.status === 'scheduled'));
        setCompletedRows(records.filter(r => r.status === 'completed'));
      })
      .catch(err => {
        console.error('[useMaintenance] Error cargando desde API:', err.message);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Persistir en localStorage (solo modo mock) ──
  useEffect(() => {
    if (!useMock || loading) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ services: scheduledRows, history: completedRows, isPro }));
  }, [scheduledRows, completedRows, isPro, useMock, loading]);

  // ─── Mapear a formato del hook ───────────────────
  const services = useMemo(() =>
    useMock ? scheduledRows : scheduledRows.map(rowToService),
  [scheduledRows, useMock]);

  const history = useMemo(() =>
    useMock ? completedRows : completedRows.map(rowToHistory),
  [completedRows, useMock]);

  // ─── Enriquecer servicios con cálculos ───────────
  const enrichedServices = useMemo(() =>
    services.map(svc => {
      const wear    = calculateWear(svc, currentKm);
      const status  = getStatus(wear);
      const daysLeft = getDaysRemaining(svc);
      const kmLeft  = getKmRemaining(svc, currentKm);
      return { ...svc, wear, status, daysLeft, kmLeft };
    }),
  [services, currentKm]);

  const healthScore = useMemo(() => calculateHealthScore(services, currentKm), [services, currentKm]);

  const stats = useMemo(() => {
    const overdue  = enrichedServices.filter(s => s.status === 'overdue').length;
    const critical = enrichedServices.filter(s => s.status === 'critical').length;
    const warning  = enrichedServices.filter(s => s.status === 'warning').length;
    const ok       = enrichedServices.filter(s => s.status === 'ok').length;
    const totalSpent = history.reduce((sum, h) => sum + (h.cost || 0), 0);
    const avgCost    = history.length > 0 ? Math.round(totalSpent / history.length) : 0;
    const sixMonthsAgo = Date.now() - 180 * 86400000;
    const recentSpent  = history.filter(h => new Date(h.performedAt) > sixMonthsAgo).reduce((sum, h) => sum + (h.cost || 0), 0);
    return { overdue, critical, warning, ok, pending: overdue + critical + warning, totalSpent, avgCost, monthlyAvg: Math.round(recentSpent / 6) };
  }, [enrichedServices, history]);

  const maintenanceAlerts = useMemo(() =>
    enrichedServices
      .filter(s => s.enabled && (s.status === 'overdue' || s.status === 'critical'))
      .map(s => {
        const cat = MAINTENANCE_CATEGORIES[s.category] || MAINTENANCE_CATEGORIES.other;
        const isOverdue = s.status === 'overdue';
        return {
          id: `maint-alert-${s.id}`,
          tipo: 'mantenimiento',
          severity: isOverdue ? 'danger' : 'warning',
          mensaje: isOverdue
            ? `${cat.emoji} ${s.title} — VENCIDO ${s.daysLeft != null ? `hace ${Math.abs(s.daysLeft)} días` : ''}`
            : `${cat.emoji} ${s.title} — Próximo ${s.daysLeft != null ? `en ${s.daysLeft} días` : ''} ${s.kmLeft != null ? `(${Math.round(s.kmLeft).toLocaleString()} km)` : ''}`,
          dispositivo: null,
          leido: false,
          createdAt: new Date().toISOString(),
          _maintenanceId: s.id,
        };
      }),
  [enrichedServices]);

  const monthlyCosts = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const month    = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0);
      const total    = history.filter(h => { const d = new Date(h.performedAt); return d >= month && d <= monthEnd; }).reduce((s, h) => s + (h.cost || 0), 0);
      return { month: month.toLocaleDateString('es-CL', { month: 'short' }), amount: total };
    });
  }, [history]);

  // ─── CRUD ────────────────────────────────────────

  const addService = useCallback(async (serviceData) => {
    if (useMock) {
      const newService = { id: `svc-${Date.now()}`, ...serviceData, enabled: true, completed: false };
      setScheduledRows(prev => [...prev, newService]);
      return newService;
    }
    try {
      const row     = serviceToInsert(vehicleId, { ...serviceData, enabled: true });
      const created = await createMaintenanceRecord(vehicleId, row);
      setScheduledRows(prev => [created, ...prev]);
      return rowToService(created);
    } catch (err) {
      console.error('[useMaintenance] addService error:', err.message);
    }
  }, [vehicleId, useMock]);

  const updateService = useCallback(async (id, updates) => {
    if (useMock) {
      setScheduledRows(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      return;
    }
    try {
      const existing = scheduledRows.find(r => r.id === id);
      if (!existing) return;
      const merged  = { ...rowToService(existing), ...updates };
      const row     = serviceToUpdate(merged);
      const updated = await updateMaintenanceRecord(vehicleId, id, row);
      setScheduledRows(prev => prev.map(r => r.id === id ? updated : r));
    } catch (err) {
      console.error('[useMaintenance] updateService error:', err.message);
    }
  }, [vehicleId, useMock, scheduledRows]);

  const removeService = useCallback(async (id) => {
    if (useMock) {
      setScheduledRows(prev => prev.filter(s => s.id !== id));
      return;
    }
    try {
      await deleteMaintenanceRecord(vehicleId, id);
      setScheduledRows(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('[useMaintenance] removeService error:', err.message);
    }
  }, [vehicleId, useMock]);

  const completeService = useCallback(async (serviceId, completionData) => {
    if (useMock) {
      const service = scheduledRows.find(s => s.id === serviceId);
      if (!service) return;
      const record = {
        id: `hist-${Date.now()}`,
        category: service.category,
        title: service.title,
        performedAt: completionData.date || new Date().toISOString(),
        performedAtKm: completionData.km || currentKm,
        cost: completionData.cost || 0,
        performedBy: completionData.workshop || '',
        notes: completionData.notes || '',
      };
      setCompletedRows(prev => [record, ...prev]);
      setScheduledRows(prev => prev.map(s => s.id !== serviceId ? s : {
        ...s,
        lastServiceKm:   completionData.km   || currentKm,
        lastServiceDate: completionData.date  || new Date().toISOString(),
        lastServiceCost: completionData.cost  || 0,
      }));
      return;
    }
    try {
      const scheduledRow = scheduledRows.find(r => r.id === serviceId);
      if (!scheduledRow) return;
      const svc = rowToService(scheduledRow);

      // 1. Crear registro completado (historial)
      const histRow = {
        vehicle_id: vehicleId,
        type: svc.category,
        title: svc.title,
        notes: completionData.notes || null,
        completed_date: completionData.date || new Date().toISOString().split('T')[0],
        completed_km:   completionData.km   || currentKm || null,
        completed_by:   completionData.workshop || null,
        cost:           completionData.cost || null,
        status: 'completed',
        metadata: {},
      };
      const newHistRow = await createMaintenanceRecord(vehicleId, histRow);
      setCompletedRows(prev => [newHistRow, ...prev]);

      // 2. Actualizar servicio programado (resetear último servicio)
      const updatedScheduled = await updateMaintenanceRecord(vehicleId, serviceId, {
        completed_date: histRow.completed_date,
        completed_km:   histRow.completed_km,
        cost:           histRow.cost,
      });
      setScheduledRows(prev => prev.map(r => r.id === serviceId ? updatedScheduled : r));
    } catch (err) {
      console.error('[useMaintenance] completeService error:', err.message);
    }
  }, [vehicleId, useMock, scheduledRows, currentKm]);

  const togglePro = useCallback(() => setIsPro(prev => !prev), []);

  return {
    services: enrichedServices,
    history,
    healthScore,
    stats,
    maintenanceAlerts,
    monthlyCosts,
    isPro,
    loading,
    error,
    addService,
    updateService,
    removeService,
    completeService,
    togglePro,
  };
}

export default useMaintenance;
