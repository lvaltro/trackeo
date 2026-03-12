/**
 * scripts/cleanup-notifications.js
 * Tarea periódica: elimina notificaciones con más de 7 días.
 * Se importa desde server/index.js al iniciar el proceso.
 */

const { cleanupOld } = require('../core/notifications/index.js');

setInterval(async () => {
  try {
    await cleanupOld(7);
  } catch (err) {
    console.error('[cleanup-notifications] Error en limpieza:', err.message);
  }
}, 60 * 60 * 1000); // Cada hora
