// src/components/GeofencesView.jsx
// Panel de Geovallas — CRUD completo, slider de radio, modo edición, mapa interactivo.
// Se muestra cuando activeMenu === 'geovallas' en el DashboardLayout.

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPinned, Plus, Trash2, Loader2, MapPin, Ruler,
  FileText, Car, ArrowLeft, Check, X, Target, Pencil
} from 'lucide-react';
import {
  MapContainer, TileLayer, Circle, Marker, useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { traccarService } from '../api/traccarApi';

// ─── Ícono del centro de geovalla (estilo Trackeo: gradiente amber→orange) ───
const centerIcon = L.divIcon({
  className: 'geofence-center-icon',
  html: `<div style="
    width:16px;height:16px;
    background:linear-gradient(135deg,#f59e0b,#ea580c);
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 2px 8px rgba(245,158,11,0.4);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// ─── Presets rápidos de radio (patrón idéntico a duration buttons de LiveSharePanel) ───
const RADIUS_PRESETS = [
  { value: 100, label: '100m' },
  { value: 200, label: '200m' },
  { value: 500, label: '500m' },
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
];

// ─── Formato legible del radio ───
function formatRadius(meters) {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`;
  }
  return `${meters} m`;
}

// ─── Parsear WKT CIRCLE a datos legibles ───
function parseCircleWKT(area) {
  if (!area) return null;
  const match = area.match(/CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([-\d.]+)\s*\)/i);
  if (!match) return null;
  return {
    latitude: parseFloat(match[1]),
    longitude: parseFloat(match[2]),
    radius: parseFloat(match[3]),
  };
}

// ─── Componente para capturar clicks en el mapa ───
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

// ─── Estilos CSS del slider (gradiente Trackeo, thumb profesional) ───
const sliderStyles = `
  .geofence-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .geofence-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #ea580c);
    border: 3px solid #fff;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .geofence-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 3px 12px rgba(245, 158, 11, 0.5);
  }
  .geofence-slider::-webkit-slider-thumb:active {
    transform: scale(1.05);
  }
  .geofence-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #ea580c);
    border: 3px solid #fff;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
    cursor: pointer;
  }
  .geofence-slider::-moz-range-track {
    height: 6px;
    border-radius: 3px;
    border: none;
  }
  .geofence-center-icon.leaflet-marker-icon {
    background: transparent !important;
    border: none !important;
  }
`;

const GeofencesView = ({ vehicles = [], activeVehicle, isDark, onNotify, isDemoMode = false, onDemoPaywall, demoGeofences }) => {
  // ─── Estados ───
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null); // id de la geovalla que se está eliminando
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Formulario (crear y editar)
  const [editingId, setEditingId] = useState(null); // null = crear, number = editar
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRadius, setFormRadius] = useState(200);
  const [formCenter, setFormCenter] = useState(null);
  const [formDeviceId, setFormDeviceId] = useState(activeVehicle?.id || '');
  const [formError, setFormError] = useState(null);

  const defaultMapCenter = [-36.8201352, -73.0443904]; // Concepción, Chile

  // ─── Cargar geovallas ───
  const loadGeofences = useCallback(async () => {
    if (isDemoMode && demoGeofences) {
      setGeofences(demoGeofences);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await traccarService.getGeofences();
      setGeofences(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar las geovallas');
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, demoGeofences]);

  useEffect(() => {
    loadGeofences();
  }, [loadGeofences]);

  // Actualizar deviceId por defecto cuando cambia el vehículo activo
  useEffect(() => {
    if (activeVehicle?.id && !isFormOpen) {
      setFormDeviceId(activeVehicle.id);
    }
  }, [activeVehicle, isFormOpen]);

  // ─── Click en mapa ───
  const handleMapClick = (latlng) => {
    setFormCenter({ lat: latlng.lat, lng: latlng.lng });
  };

  // ─── Guardar geovalla (crear o actualizar) ───
  const handleSave = async () => {
    if (isDemoMode) { onDemoPaywall?.(); return; }
    setFormError(null);

    if (!formName.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    if (!formCenter) {
      setFormError('Haz clic en el mapa para seleccionar el centro de la geovalla');
      return;
    }
    if (!formRadius || formRadius < 50) {
      setFormError('El radio debe ser al menos 50 metros');
      return;
    }

    setSaving(true);
    try {
      // Generar WKT — formato que espera Traccar
      const area = `CIRCLE (${formCenter.lat} ${formCenter.lng}, ${formRadius})`;
      let geofence;

      if (editingId) {
        // ─── ACTUALIZAR ───
        geofence = await traccarService.updateGeofence(editingId, {
          id: editingId,
          name: formName.trim(),
          description: formDescription.trim(),
          area,
        });
      } else {
        // ─── CREAR ───
        geofence = await traccarService.createGeofence({
          name: formName.trim(),
          description: formDescription.trim(),
          area,
        });
      }

      // Asignar permisos al vehículo (paso crítico para que genere alertas)
      const gfId = geofence?.id || editingId;
      if (formDeviceId && gfId) {
        try {
          await traccarService.assignGeofenceToDevice(Number(formDeviceId), gfId);
        } catch (permErr) {
          // 400 puede significar que el permiso ya existe — no bloqueamos
          console.warn('[Geofences] Permiso ya existe o error asignando:', permErr);
        }
      }

      // Éxito: Toast + historial de notificaciones
      const action = editingId ? 'actualizada' : 'creada';
      const mensaje = `Geovalla "${formName.trim()}" ${action} exitosamente`;
      onNotify?.({
        tipo: 'geovalla',
        mensaje: `✅ ${mensaje}`,
        dispositivo: vehicles.find(v => String(v.id) === String(formDeviceId))?.name || null,
      });
      resetForm();
      setIsFormOpen(false);
      await loadGeofences();
    } catch (err) {
      setFormError(err.message || 'Error al guardar la geovalla');
    } finally {
      setSaving(false);
    }
  };

  // ─── Eliminar geovalla ───
  const handleDelete = async (id) => {
    if (isDemoMode) { onDemoPaywall?.(); setDeleteConfirm(null); return; }
    setDeleting(id);
    try {
      const gf = geofences.find(g => g.id === id);
      await traccarService.deleteGeofence(id);
      setGeofences((prev) => prev.filter((g) => g.id !== id));
      setDeleteConfirm(null);
      onNotify?.({
        tipo: 'geovalla',
        mensaje: `🗑️ Geovalla "${gf?.name || ''}" eliminada`,
        dispositivo: activeVehicle?.name || null,
      });
    } catch (err) {
      setError(err.message || 'Error al eliminar la geovalla');
    } finally {
      setDeleting(null);
    }
  };

  // ─── Reset form ───
  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormRadius(200);
    setFormCenter(null);
    setFormDeviceId(activeVehicle?.id || '');
    setFormError(null);
  };

  // ─── Abrir modo crear ───
  const startCreating = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // ─── Abrir modo editar ───
  const startEditing = (gf) => {
    const circleData = parseCircleWKT(gf.area);
    setEditingId(gf.id);
    setFormName(gf.name || '');
    setFormDescription(gf.description || '');
    setFormRadius(circleData?.radius || 200);
    setFormCenter(
      circleData
        ? { lat: circleData.latitude, lng: circleData.longitude }
        : null
    );
    setFormDeviceId(activeVehicle?.id || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  // ─── Cerrar formulario ───
  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  // ─── Tile layer según tema (mismo que MapView.jsx) ───
  const tileLayerUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  // Centro inicial del mapa: geovalla editada → vehículo → default
  const mapInitialCenter = formCenter
    ? [formCenter.lat, formCenter.lng]
    : activeVehicle?.latitude && activeVehicle?.longitude
      ? [activeVehicle.latitude, activeVehicle.longitude]
      : defaultMapCenter;

  // Porcentaje del slider para el fondo degradado
  const sliderPercent = ((formRadius - 50) / (5000 - 50)) * 100;

  // ═══════════════════════════════════════════
  // RENDER: Modo Formulario (Crear / Editar)
  // ═══════════════════════════════════════════

  if (isFormOpen) {
    const isEditing = editingId !== null;

    return (
      <div className="space-y-5">
        <style>{sliderStyles}</style>

        {/* Header con botón volver */}
        <div className="flex items-center gap-3">
          <button
            onClick={closeForm}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/[0.1] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              {isEditing ? 'Editar Geovalla' : 'Nueva Geovalla'}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {isEditing ? 'Modifica los datos y la ubicación' : 'Define una zona virtual en el mapa'}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-5 md:p-6 space-y-4">
          {/* Nombre */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Nombre
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Casa, Oficina, Colegio..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-neutral-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Descripción <span className="text-neutral-400 dark:text-neutral-600">(opcional)</span>
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe esta zona..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-neutral-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
            />
          </div>

          {/* Radio — Slider dinámico */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Radio de la geovalla
              </label>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {formatRadius(formRadius)}
              </span>
            </div>

            <div className="px-1">
              <input
                type="range"
                min={50}
                max={5000}
                step={10}
                value={formRadius}
                onChange={(e) => setFormRadius(Number(e.target.value))}
                className="geofence-slider w-full"
                style={{
                  background: `linear-gradient(to right, #f59e0b ${sliderPercent}%, ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e5e5'} ${sliderPercent}%)`,
                }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-neutral-400 dark:text-neutral-600">50m</span>
                <span className="text-[9px] text-neutral-400 dark:text-neutral-600">5 km</span>
              </div>
            </div>

            {/* Presets rápidos — mismo patrón que DURATION_OPTIONS en LiveSharePanel */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {RADIUS_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setFormRadius(preset.value)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    formRadius === preset.value
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm shadow-amber-500/20'
                      : 'bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/[0.1]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vehículo a asignar */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Asignar a vehículo
            </label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <select
                value={formDeviceId}
                onChange={(e) => setFormDeviceId(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-neutral-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none appearance-none cursor-pointer"
              >
                <option value="">Sin asignar</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id} className="bg-white dark:bg-neutral-900">
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mapa interactivo */}
        <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-bold text-neutral-900 dark:text-white">
              {isEditing ? 'Ajusta la ubicación en el mapa' : 'Selecciona el centro en el mapa'}
            </p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Haz clic en el punto donde quieres ubicar el centro de la geovalla. El círculo se ajustará al radio seleccionado.
          </p>

          {formCenter && (
            <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Centro: {formCenter.lat.toFixed(6)}, {formCenter.lng.toFixed(6)} — Radio: {formatRadius(formRadius)}
              </p>
            </div>
          )}

          <div className="rounded-xl overflow-hidden border border-neutral-200/60 dark:border-white/[0.06] h-72 md:h-96 relative z-0">
            <MapContainer
              key={`map-${editingId || 'new'}`}
              center={mapInitialCenter}
              zoom={formCenter ? 14 : 13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url={tileLayerUrl}
              />
              <MapClickHandler onClick={handleMapClick} />

              {formCenter && (
                <>
                  <Marker position={[formCenter.lat, formCenter.lng]} icon={centerIcon} />
                  <Circle
                    center={[formCenter.lat, formCenter.lng]}
                    radius={formRadius}
                    pathOptions={{
                      color: '#f59e0b',
                      fillColor: '#f59e0b',
                      fillOpacity: 0.15,
                      weight: 2,
                      dashArray: isEditing ? '6 4' : undefined,
                    }}
                  />
                </>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Error del formulario */}
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <p className="text-xs text-red-600 dark:text-red-400 text-center">{formError}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={closeForm}
            disabled={saving}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/[0.1] transition-all disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {isEditing ? 'Guardar Cambios' : 'Crear Geovalla'}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // RENDER: Modo Lista
  // ═══════════════════════════════════════════

  return (
    <div className="space-y-6">
      <style>{sliderStyles}</style>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
            <MapPinned className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Geovallas</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Zonas virtuales para alertas de entrada y salida
            </p>
          </div>
        </div>
      </div>

      {/* Error global */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Botón crear nueva */}
      <button
        onClick={startCreating}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-110 transition-all active:scale-[0.99]"
      >
        <Plus className="w-4 h-4" />
        Crear Nueva Geovalla
      </button>

      {/* Lista de geovallas */}
      <div>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
          <MapPinned className="w-4 h-4 text-amber-500" />
          Geovallas activas
          {!loading && geofences.length > 0 && (
            <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
              {geofences.length}
            </span>
          )}
        </h3>

        {loading ? (
          <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando geovallas...</p>
            </div>
          </div>
        ) : geofences.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <MapPinned className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No tienes geovallas creadas. Crea una para recibir alertas cuando tu vehículo entre o salga de una zona.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {geofences.map((gf) => {
              const circleData = parseCircleWKT(gf.area);
              const isDeleting = deleting === gf.id;

              return (
                <div
                  key={gf.id}
                  className={`rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-4 transition-all hover:shadow-md ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm flex-shrink-0 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {gf.name}
                        </h4>
                        {gf.description && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                            {gf.description}
                          </p>
                        )}
                        {circleData && (
                          <div className="flex items-center gap-3 mt-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                              <Ruler className="w-3 h-3" />
                              {formatRadius(circleData.radius)}
                            </span>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                              {circleData.latitude.toFixed(4)}, {circleData.longitude.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones: Editar + Eliminar */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {deleteConfirm === gf.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(gf.id)}
                            disabled={isDeleting}
                            className="p-2 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
                            title="Confirmar eliminación"
                          >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-2 rounded-lg text-xs font-semibold text-neutral-500 bg-neutral-100 dark:bg-white/[0.06] hover:bg-neutral-200 dark:hover:bg-white/[0.1] transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(gf)}
                            className="p-2 rounded-lg text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                            title="Editar geovalla"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(gf.id)}
                            className="p-2 rounded-lg text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                            title="Eliminar geovalla"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info contextual */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 p-4">
        <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
          <strong>Geovallas:</strong> Recibirás una alerta cada vez que tu vehículo entre o salga de una zona definida.
          Ideal para monitorear visitas a casa, oficina, colegio o cualquier punto de interés.
        </p>
      </div>
    </div>
  );
};

export default GeofencesView;
