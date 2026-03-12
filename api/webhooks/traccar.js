import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Usa POST.' });
  }

  try {
    const body = req.body; 
    const { event, position, device } = body;

    // Usamos device.uniqueId que es el IMEI (019175742870)
    if (!device || !device.uniqueId) {
      return res.status(400).json({ error: 'No device uniqueId (IMEI)' });
    }

    // 1. BUSCAR EL ID REAL DEL DISPOSITIVO EN TU TABLA 'devices'
    const { data: dbDevice, error: deviceError } = await supabase
      .from('devices')
      .select('id')
      .eq('imei', device.uniqueId) // Buscamos por el IMEI que registramos
      .single();

    if (deviceError || !dbDevice) {
      console.log('⚠️ Dispositivo no registrado:', device.uniqueId);
      return res.status(200).json({ message: 'Dispositivo no encontrado en DB, ignorando.' });
    }

    const realDeviceId = dbDevice.id; // Este es el UUID que Supabase necesita
    const eventType = event ? event.type : (position ? 'positionUpdate' : 'unknown');
    const serverTime = event ? event.serverTime : (position ? position.serverTime : new Date().toISOString());

    // 2. GUARDAR EN HISTÓRICO (device_events)
    const { error: eventError } = await supabase
      .from('device_events')
      .insert({
        device_id: realDeviceId,
        event_type: eventType,
        recorded_at: serverTime,
        position_data: position || {},
        attributes: event ? event.attributes : (position ? position.attributes : {})
      });

    if (eventError) throw eventError;

    // 3. ACTUALIZAR ESTADO EN TIEMPO REAL (vehicle_status)
    if (position) {
      const ignitionStatus = position.attributes?.ignition || false;
      
      const { error: statusError } = await supabase
        .from('vehicle_status')
        .upsert({
          device_id: realDeviceId,
          last_latitude: position.latitude,
          last_longitude: position.longitude,
          last_speed: position.speed,
          ignition: ignitionStatus,
          is_online: true,
          last_update: serverTime,
          updated_at: new Date().toISOString()
        }, { onConflict: 'device_id' });

      if (statusError) throw statusError;
    }

    return res.status(200).json({ success: true, message: '¡Datos vinculados correctamente!' });

  } catch (error) {
    console.error('🚨 Error en el Webhook:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}