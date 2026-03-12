// src/components/MapView.jsx
// Recibe vehicles del hook useVehicleTracker (nombre + lat/lng + speed + course + status).
// Solo renderiza marcadores con coordenadas válidas; popup con nombre, velocidad y estado.
// Icono orientado según course (dirección del vehículo).

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Iconos por defecto de Leaflet (por si se usan en otros marcadores)
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

// --- Centrar mapa cuando cambia selectedVehicle ---
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] != null && center[1] != null) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// --- Icono de vehículo premium con efecto radar (pulse ping) ---
function createVehicleIcon() {
  return L.divIcon({
    className: 'vehicle-radar-icon',
    html: `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 relative">
      <div class="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316] z-10"></div>
      <div class="absolute animate-ping w-full h-full rounded-full bg-orange-500/50"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// --- Iconos para modo historial: Inicio (verde) y Fin (rojo) ---
const startIcon = L.divIcon({
  className: 'history-marker',
  html: `<div style="width:20px;height:20px;background:#22c55e;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
const endIcon = L.divIcon({
  className: 'history-marker',
  html: `<div style="width:20px;height:20px;background:#ef4444;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const ROUTE_COLOR = '#6366f1'; // violeta
const ROUTE_WEIGHT = 4;

// --- Componente de radar pulse para parking mode ---
function ParkingRadarPulse({ center, isAlert }) {
  if (!center || !center[0] || !center[1]) return null;
  // CSS puro para las ondas — se renderiza como SVG overlays en Leaflet
  return (
    <>
      {/* Onda 1 */}
      <Circle
        center={center}
        radius={50}
        pathOptions={{
          color: isAlert ? '#ef4444' : '#3b82f6',
          weight: 2,
          opacity: 0.4,
          fillColor: isAlert ? '#ef4444' : '#3b82f6',
          fillOpacity: 0.08,
          dashArray: '8 6',
          className: 'parking-geofence-circle',
        }}
      />
      {/* Zona interior (fill sólido) */}
      <Circle
        center={center}
        radius={25}
        pathOptions={{
          color: 'transparent',
          fillColor: isAlert ? '#ef4444' : '#3b82f6',
          fillOpacity: 0.05,
          weight: 0,
        }}
      />
    </>
  );
}

const MapView = ({ vehicles = [], selectedVehicle, isDarkMode, routeData = null, parkingData = null, parkingStatus = 'inactive' }) => {
  const defaultCenter = [-36.8201352, -73.0443904];

  const path = useMemo(() => {
    if (!routeData) return [];
    return Array.isArray(routeData) ? routeData : routeData.path || [];
  }, [routeData]);

  const center = useMemo(() => {
    if (path.length > 0) {
      const mid = Math.floor(path.length / 2);
      const p = path[mid];
      if (p && p[0] != null && p[1] != null) return [p[0], p[1]];
      if (path[0]) return [path[0][0], path[0][1]];
    }
    if (!selectedVehicle) return defaultCenter;
    const lat = selectedVehicle.latitude ?? selectedVehicle.position?.latitude;
    const lng = selectedVehicle.longitude ?? selectedVehicle.position?.longitude;
    if (lat != null && lng != null) return [lat, lng];
    return defaultCenter;
  }, [selectedVehicle, path]);

  const tileLayerUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const showHistory = path.length > 0;
  const startPoint = path.length > 0 ? path[0] : null;
  const endPoint = path.length > 1 ? path[path.length - 1] : path.length === 1 ? path[0] : null;

  // Parking geofence data
  const parkingCenter = useMemo(() => {
    if (!parkingData?.latitude || !parkingData?.longitude) return null;
    return [parkingData.latitude, parkingData.longitude];
  }, [parkingData]);
  const isParkingActive = parkingStatus === 'active' || parkingStatus === 'alert';
  const isParkingAlert = parkingStatus === 'alert';

  return (
    <div className="h-full w-full relative z-0">
      <style>{`
        .vehicle-radar-icon.leaflet-marker-icon { background: transparent !important; border: none !important; }
        .history-marker.leaflet-marker-icon { background: transparent !important; border: none !important; }
        .parking-geofence-circle {
          animation: dash-rotate-leaflet 8s linear infinite;
        }
        @keyframes dash-rotate-leaflet {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -100; }
        }
        .parking-radar-ring {
          animation: parking-radar 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .parking-radar-ring-delay-1 { animation-delay: 0.6s; }
        .parking-radar-ring-delay-2 { animation-delay: 1.2s; }
        @keyframes parking-radar {
          0% { r: 20; opacity: 0.6; }
          100% { r: 60; opacity: 0; }
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={showHistory ? 14 : 15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileLayerUrl}
        />
        <ZoomControl position="bottomright" />
        <MapUpdater center={center} />

        {showHistory && (
          <>
            <Polyline positions={path} pathOptions={{ color: ROUTE_COLOR, weight: ROUTE_WEIGHT }} />
            {startPoint && (
              <Marker position={startPoint} icon={startIcon}>
                <Popup>Inicio</Popup>
              </Marker>
            )}
            {endPoint && endPoint !== startPoint && (
              <Marker position={endPoint} icon={endIcon}>
                <Popup>Fin</Popup>
              </Marker>
            )}
          </>
        )}

        {/* Parking mode geofence overlay */}
        {isParkingActive && parkingCenter && (
          <ParkingRadarPulse center={parkingCenter} isAlert={isParkingAlert} />
        )}

        {!showHistory && vehicles.map((vehicle) => {
          const lat = vehicle.latitude;
          const lng = vehicle.longitude;
          if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return null;

          const icon = createVehicleIcon();
          const speedKmh = vehicle.speed != null ? Math.round(Number(vehicle.speed)) : 0;
          const statusLabel = vehicle.status === 'online' ? 'Online' : 'Offline';

          return (
            <Marker key={vehicle.id} position={[lat, lng]} icon={icon}>
              <Popup>
                <div className="text-center p-1 min-w-[140px]">
                  <strong className="block text-sm font-bold mb-1">{vehicle.name}</strong>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded text-white ${
                      vehicle.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                  >
                    {statusLabel}
                  </span>
                  <p className="text-xs mt-1 text-gray-600">{speedKmh} km/h</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
