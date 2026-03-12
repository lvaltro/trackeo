'use strict';
/**
 * core/jobs/docReminders.js
 * Job de recordatorios: verifica documentos próximos a vencer
 * y crea notificaciones del sistema para los propietarios.
 *
 * Resolución vehicle_id → user_email: pendiente vía Prisma (vehicles → organization → users)
 * o vista/endpoint equivalente. La tabla vehicle_status no contiene user_email ni email.
 */

const { createClient } = require('@supabase/supabase-js');
const { getExpiringSoon } = require('../documents/index.js');
const { createSystemNotification } = require('../notifications/index.js');

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  return createClient(url, key);
}

/**
 * Obtener el email del propietario de un vehículo.
 * TODO: resolver vía Prisma (vehicle → organization → owner) o vista. Mientras tanto retorna null.
 */
async function getVehicleOwnerEmail(vehicleId) {
  return null;
}

/**
 * Ejecutar job de recordatorios de documentos.
 * Crea notificaciones para documentos que vencen en 30, 7 y 0 días.
 * @returns {{ processed: number, notified: number }}
 */
async function runDocReminders() {
  console.log('[DocReminders] Iniciando job de recordatorios...');

  // Documentos que vencen en los próximos 31 días (incluye ya vencidos del día)
  let expiringDocs;
  try {
    expiringDocs = await getExpiringSoon(31);
  } catch (err) {
    console.error('[DocReminders] Error obteniendo documentos:', err.message);
    return { processed: 0, notified: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let notified = 0;

  for (const doc of expiringDocs) {
    const expiresAt = new Date(doc.expires_at + 'T12:00:00');
    const daysLeft = Math.floor((expiresAt - today) / (1000 * 60 * 60 * 24));
    const reminderDays = doc.reminder_days || [30, 7, 0];

    // Solo notificar en los días configurados de recordatorio
    if (!reminderDays.includes(daysLeft)) continue;

    // Obtener email del propietario
    let userEmail;
    try {
      userEmail = await getVehicleOwnerEmail(doc.vehicle_id);
    } catch {
      userEmail = null;
    }

    if (!userEmail) {
      console.warn(`[DocReminders] Sin email para vehículo ${doc.vehicle_id} — omitiendo.`);
      continue;
    }

    const mensaje = daysLeft === 0
      ? `${doc.title} vence HOY`
      : daysLeft < 0
        ? `${doc.title} venció hace ${Math.abs(daysLeft)} días`
        : `${doc.title} vence en ${daysLeft} días`;

    try {
      await createSystemNotification({
        tipo:    'sistema',
        mensaje,
        userId:  userEmail,
        data:    { documentId: doc.id, vehicleId: doc.vehicle_id, daysLeft, expiresAt: doc.expires_at },
      });
      notified++;
      console.log(`[DocReminders] Notificado: ${userEmail} — ${mensaje}`);
    } catch (err) {
      console.error(`[DocReminders] Error creando notificación:`, err.message);
    }
  }

  console.log(`[DocReminders] Job completado: ${expiringDocs.length} documentos revisados, ${notified} notificaciones creadas.`);
  return { processed: expiringDocs.length, notified };
}

module.exports = { runDocReminders };
