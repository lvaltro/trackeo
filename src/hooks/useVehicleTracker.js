// src/hooks/useVehicleTracker.js
// Fuente de datos: Supabase tabla vehicle_status.
// Initial load: select simple sin join embebido.
// Realtime: suscripción a INSERT/UPDATE en vehicle_status — preserva nombre del estado previo.

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useDemo } from '../context/DemoContext';

const KNOTS_TO_KMH = 1.852;

/**
 * Mapea una fila de vehicle_status al formato que esperan MapView y DashboardLayout.
 * @param {object} row  - Fila de vehicle_status
 * @param {string} [fallbackName] - Nombre previo del vehículo (para updates Realtime sin join)
 */
function rowToVehicle(row, fallbackName) {
  if (!row) return null;
  const deviceId = row.device_id;
  const speedKmh = row.last_speed != null ? Number(row.last_speed) * KNOTS_TO_KMH : 0;
  const name =
    fallbackName ??
    `Vehículo ${String(deviceId).slice(0, 8)}`;
  return {
    id: deviceId,
    name,
    latitude: row.last_latitude ?? null,
    longitude: row.last_longitude ?? null,
    speed: speedKmh,
    course: 0,
    status: row.is_online === true ? 'online' : 'offline',
    lastUpdate: row.last_update ?? null,
    attributes: { ignition: row.ignition ?? false },
    deviceAttributes: {},
  };
}

/**
 * Hook: datos en tiempo real desde Supabase vehicle_status.
 * - Initial load: select de todos los registros (RLS puede filtrar por usuario).
 * - Realtime: channel postgres_changes sobre vehicle_status (INSERT/UPDATE).
 * Devuelve el mismo formato que antes (id, name, latitude, longitude, speed, status, ...).
 */
export function useVehicleTracker() {
  const { isDemoMode } = useDemo();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  // Initial load: select de vehicle_status
  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      setVehicles([]);
      setError(null);
      return;
    }

    if (!supabase) {
      setLoading(false);
      setError('Supabase no configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
      return;
    }

    setError(null);
    setLoading(true);

    supabase
      .from('vehicle_status')
      .select('*')
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message ?? 'Error al cargar vehículos');
          setVehicles([]);
          return;
        }
        const list = (Array.isArray(data) ? data : []).map((row) => rowToVehicle(row)).filter(Boolean);
        setVehicles(list);
      })
      .finally(() => setLoading(false));
  }, [isDemoMode]);

  // Realtime: suscripción a INSERT y UPDATE en vehicle_status
  useEffect(() => {
    if (isDemoMode || !supabase) return;

    const channel = supabase
      .channel('vehicle_status_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_status',
        },
        (payload) => {
          const row = payload.new;
          if (!row) return;
          setVehicles((prev) => {
            // Preservar el nombre que ya teníamos (el evento Realtime no incluye el join)
            const existing = prev.find((v) => v.id === row.device_id);
            const vehicle = rowToVehicle(row, existing?.name);
            if (!vehicle) return prev;
            return [...prev.filter((v) => v.id !== vehicle.id), vehicle];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[useVehicleTracker] Realtime channel error');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isDemoMode]);

  return {
    vehicles: Array.isArray(vehicles) ? vehicles : [],
    loading: isDemoMode ? false : loading,
    error: isDemoMode ? null : error,
  };
}
