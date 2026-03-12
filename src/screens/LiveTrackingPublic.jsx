// src/screens/LiveTrackingPublic.jsx
// Página pública "Viaje Seguro" — Muestra ubicación en vivo de un vehículo compartido.
// NO requiere autenticación. Se accede por URL: /live/:token
// Mobile-first. Standalone (sin sidebar, sin navbar de la app).

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TrackeoLogo from '../components/TrackeoLogo';
import { getPublicShare } from '../api/liveShareApi';

// ─── Icono de vehículo para el mapa ───
function createLiveIcon(course) {
  const deg = course != null ? Number(course) : 0;
  return L.divIcon({
    className: 'live-vehicle-icon',
    html: `<div style="
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 10px rgba(245,158,11,0.4);
      transform: rotate(${deg}deg);
      display: flex; align-items: center; justify-content: center;
    "><span style="
      display: block; width: 0; height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 10px solid #fff;
      margin-bottom: 8px;
    "></span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// ─── Centrar mapa cuando cambia la posición + invalidateSize al montar ───
function MapUpdater({ center, zoom }) {
  const map = useMap();
  // Forzar recálculo de tiles al montar (fix clásico de Leaflet en contenedores dinámicos)
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  useEffect(() => {
    if (center && center[0] != null && center[1] != null) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

/** Formato legible del tiempo restante. */
function formatCountdown(expiresAt) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expirado';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return `${minutes}min ${seconds}s`;
  return `${seconds}s`;
}

/** Formato "Hace X" para timestamp. */
function formatAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return 'Ahora';
  if (sec < 60) return `Hace ${sec}s`;
  const min = Math.floor(sec / 60);
  return `Hace ${min} min`;
}

const LiveTrackingPublic = () => {
  const { token } = useParams();
  console.log('[LiveTrackingPublic] Token recibido:', token);
  const [shareInfo, setShareInfo] = useState(null);
  const [position, setPosition] = useState(null);
  const [expired, setExpired] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  // Fetch posición cada 10 segundos
  useEffect(() => {
    let active = true;

    const fetchPosition = async () => {
      try {
        const resp = await getPublicShare(token);
        if (!active) return;

        if (resp.status === 410) {
          setExpired(true);
          setLoading(false);
          return;
        }
        if (resp.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!resp.ok) {
          setLoading(false);
          return;
        }

        const data = await resp.json();
        setShareInfo(data);
        if (data.position) setPosition(data.position);
        setLoading(false);
      } catch (err) {
        console.error('[LiveTracking] Error:', err);
        if (active) setLoading(false);
      }
    };

    fetchPosition();
    const interval = setInterval(fetchPosition, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [token]);

  // Countdown timer (cada segundo)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const hasValidCoords = position != null
    && position.lat != null && position.lng != null
    && !Number.isNaN(Number(position.lat)) && !Number.isNaN(Number(position.lng));

  const center = useMemo(() => {
    if (hasValidCoords) return [Number(position.lat), Number(position.lng)];
    return [-33.45, -70.66]; // Santiago por defecto
  }, [hasValidCoords, position?.lat, position?.lng]);

  const vehicleIcon = useMemo(() => createLiveIcon(position?.course), [position?.course]);

  // Detectar tema del sistema
  const prefersDark = typeof window !== 'undefined'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const tileUrl = prefersDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  // ═══ Estado: Cargando ═══
  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${prefersDark ? 'bg-[#0a0a0a]' : 'bg-neutral-50'}`}>
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className={`text-sm font-medium ${prefersDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          Cargando ubicación...
        </p>
      </div>
    );
  }

  // ═══ Estado: Link no válido ═══
  if (notFound) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${prefersDark ? 'bg-[#0a0a0a]' : 'bg-neutral-50'}`}>
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <span className="text-3xl">❌</span>
        </div>
        <h1 className={`text-xl font-bold mb-2 ${prefersDark ? 'text-white' : 'text-neutral-900'}`}>
          Link no válido
        </h1>
        <p className={`text-sm text-center mb-6 max-w-xs ${prefersDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          Este link de ubicación no existe o fue cancelado por el usuario.
        </p>
        <a
          href="https://trackeo.cl"
          className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 transition-all"
        >
          Conoce Trackeo
        </a>
      </div>
    );
  }

  // ═══ Estado: Expirado ═══
  if (expired) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${prefersDark ? 'bg-[#0a0a0a]' : 'bg-neutral-50'}`}>
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mb-4">
          <span className="text-3xl">⏱️</span>
        </div>
        <h1 className={`text-xl font-bold mb-2 ${prefersDark ? 'text-white' : 'text-neutral-900'}`}>
          Este link ha expirado
        </h1>
        <p className={`text-sm text-center mb-6 max-w-xs ${prefersDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          El usuario dejó de compartir su ubicación. Si necesitas seguimiento continuo, pide un nuevo link.
        </p>
        <a
          href="https://trackeo.cl"
          className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 transition-all"
        >
          Conoce Trackeo
        </a>
      </div>
    );
  }

  // ═══ Estado: Ubicación en vivo ═══
  return (
    <div className={`min-h-screen flex flex-col ${prefersDark ? 'bg-[#0a0a0a]' : 'bg-neutral-50'}`}>
      {/* CSS para el marker de Leaflet */}
      <style>{`
        .live-vehicle-icon.leaflet-marker-icon { background: transparent !important; border: none !important; }
      `}</style>

      {/* Header minimalista */}
      <header className={`flex items-center justify-between px-4 py-3 border-b ${
        prefersDark
          ? 'bg-[#111111] border-white/[0.06]'
          : 'bg-white border-neutral-200/80'
      }`}>
        <TrackeoLogo size="sm" dark={prefersDark} />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className={`text-xs font-semibold ${prefersDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Ubicación en vivo
          </span>
        </div>
      </header>

      {/* Mapa — altura explícita en vh para que Leaflet calcule tiles correctamente */}
      <div className="relative w-full h-[60vh]">
        {hasValidCoords ? (
          <MapContainer
            center={center}
            zoom={15}
            style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}
            scrollWheelZoom={true}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url={tileUrl}
            />
            <MapUpdater center={center} />
            <Marker position={center} icon={vehicleIcon}>
              <Popup>
                <div className="text-center p-1">
                  <strong className="block text-sm font-bold mb-1">{shareInfo?.deviceName}</strong>
                  <span className="text-xs text-gray-600">
                    {position.speed > 1 ? `${Math.round(position.speed)} km/h` : 'Detenido'}
                  </span>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-white/[0.06] flex items-center justify-center mb-3">
              <span className="text-2xl">📡</span>
            </div>
            <p className={`text-sm font-medium ${prefersDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Ubicación GPS no disponible
            </p>
            <p className={`text-xs mt-1 ${prefersDark ? 'text-neutral-600' : 'text-neutral-300'}`}>
              Esperando señal del vehículo...
            </p>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className={`p-4 space-y-3 ${prefersDark ? 'bg-[#111111]' : 'bg-white'} border-t ${
        prefersDark ? 'border-white/[0.06]' : 'border-neutral-200/80'
      }`}>
        {/* Vehículo y compartido por */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
              <span className="text-white text-lg">🚗</span>
            </div>
            <div className="min-w-0">
              <p className={`text-base font-bold truncate ${prefersDark ? 'text-white' : 'text-neutral-900'}`}>
                {shareInfo?.deviceName || 'Vehículo'}
              </p>
              <p className={`text-xs ${prefersDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Compartido por: <span className="font-semibold">{shareInfo?.userName || '—'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Datos en vivo */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`p-2.5 rounded-xl text-center ${prefersDark ? 'bg-white/[0.04]' : 'bg-neutral-50'}`}>
            <p className={`text-xs font-medium mb-0.5 ${prefersDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Velocidad</p>
            <p className={`text-sm font-bold ${prefersDark ? 'text-white' : 'text-neutral-900'}`}>
              {position ? (position.speed > 1 ? `${Math.round(position.speed)} km/h` : 'Detenido') : '—'}
            </p>
          </div>
          <div className={`p-2.5 rounded-xl text-center ${prefersDark ? 'bg-white/[0.04]' : 'bg-neutral-50'}`}>
            <p className={`text-xs font-medium mb-0.5 ${prefersDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Actualizado</p>
            <p className={`text-sm font-bold ${prefersDark ? 'text-white' : 'text-neutral-900'}`}>
              {position ? formatAgo(position.timestamp) : '—'}
            </p>
          </div>
          <div className={`p-2.5 rounded-xl text-center ${prefersDark ? 'bg-white/[0.04]' : 'bg-neutral-50'}`}>
            <p className={`text-xs font-medium mb-0.5 ${prefersDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Link válido</p>
            <p className={`text-sm font-bold text-amber-500`}>
              {shareInfo ? formatCountdown(shareInfo.expiresAt) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Banner marketing — CTA viral */}
      <div className={`px-4 pb-4 ${prefersDark ? 'bg-[#111111]' : 'bg-white'}`}>
        <a
          href="https://trackeo.cl"
          target="_blank"
          rel="noopener noreferrer"
          className={`block w-full p-4 rounded-2xl text-center transition-all hover:scale-[1.01] ${
            prefersDark
              ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20'
              : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50'
          }`}
        >
          <p className={`text-sm font-bold mb-1 ${prefersDark ? 'text-white' : 'text-neutral-900'}`}>
            ¿Quieres proteger tu vehículo también?
          </p>
          <p className="text-xs font-semibold text-amber-500">
            Conoce Trackeo →
          </p>
        </a>
      </div>
    </div>
  );
};

export default LiveTrackingPublic;
