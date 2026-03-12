/**
 * Servidor backend — Trackeo.cl
 *
 * Solo wiring: middleware global + mount de routers.
 * La logica de dominio vive en core/.
 * Las rutas HTTP viven en server/routes/.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ─── Middleware ───
const requestId = require('./middleware/requestId');
const cors = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');

// ─── Routes ───
const geocodeRouter = require('./routes/geocode');
const liveShareRouter = require('./routes/liveShare');
const healthRouter = require('./routes/health');
const notificationsRouter = require('./routes/notifications');
const maintenanceRouter = require('./routes/maintenance');
const documentsRouter = require('./routes/documents');
const weeklyStatsRouter = require('./routes/weeklyStats');
const jobsRouter = require('./routes/jobs');

// ─── Side effects: periodic cleanup ───
require('../scripts/cleanup-notifications.js');

// ─── Jobs: daily stats + doc reminders ───
const { logError } = require('./lib/logger');
const { calculateCurrentWeekForAll } = require('../core/jobs/weeklyStats.js');
const { runDocReminders } = require('../core/jobs/docReminders.js');
const liveShare = require('../core/live-share/index.js');

const app = express();
const PORT = process.env.GEOCODE_PORT || 3001;

// ═══ Global middleware ═══
app.use(requestId);
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(cors);

// Rate limiting (skip health check)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' },
});
app.use('/api', (req, res, next) => {
  if (req.path === '/app/health') return next();
  return apiLimiter(req, res, next);
});

// ═══ Mount routes ═══
app.use('/api/geocode', geocodeRouter);
app.use('/api/live-share', liveShareRouter);
app.use('/api/app/health', healthRouter);
app.use('/api/app/notifications', notificationsRouter);
app.use('/api/app/maintenance', maintenanceRouter);
app.use('/api/app/documents', documentsRouter);
app.use('/api/app/weekly-stats', weeklyStatsRouter);
app.use('/api/app/jobs', jobsRouter);

// ═══ Global error handler (MUST be last) ═══
app.use(errorHandler);

// ═══ Periodic tasks ═══
setInterval(() => {
  const cleaned = liveShare.cleanupExpired();
  if (cleaned > 0) {
    console.log(`[LiveShare] Limpieza: ${cleaned} share(s) expirado(s) eliminado(s).`);
  }
}, 10 * 60 * 1000);

const DAILY_MS = 24 * 60 * 60 * 1000;
setInterval(async () => {
  try {
    await calculateCurrentWeekForAll();
  } catch (err) {
    logError('Jobs:weeklyStats', 'Error en job de stats semanales', err.message);
  }
  try {
    await runDocReminders();
  } catch (err) {
    logError('Jobs:docReminders', 'Error en job de recordatorios', err.message);
  }
}, DAILY_MS);

// ═══ Start server ═══
app.listen(PORT, () => {
  console.log(`[Trackeo] Servidor backend en http://localhost:${PORT}`);
  console.log(`          Health:          GET  /api/app/health`);
  console.log(`          Geocode:         GET  /api/geocode/reverse`);
  console.log(`          Live Share:      POST /api/live-share`);
  console.log(`          Notifications:   GET  /api/app/notifications`);
  console.log(`          Maintenance:     GET  /api/app/maintenance/:vehicleId`);
  console.log(`          Documents:       GET  /api/app/documents/:vehicleId`);
  console.log(`          Weekly Stats:    GET  /api/app/weekly-stats/:vehicleId`);
  console.log(`          Jobs:            POST /api/app/jobs/weekly-stats`);
  if (!process.env.TRACCAR_ADMIN_EMAIL) {
    console.warn('  ⚠  TRACCAR_ADMIN_EMAIL no configurado — Live Share no podra obtener posiciones.');
  }
});
