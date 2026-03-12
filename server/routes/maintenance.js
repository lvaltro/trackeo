const { Router } = require('express');
const { z } = require('zod');
const maintenance = require('../../core/maintenance/index.js');
const { requireAuth } = require('../middleware/auth');
const { requireVehicleOwnership } = require('../middleware/ownership');
const { validateBody } = require('../middleware/validate');
const { logError } = require('../lib/logger');

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const TIPOS_VALIDOS = ['oil_change', 'tire_rotation', 'brake_inspection', 'filter_change',
  'battery', 'belt', 'coolant', 'transmission', 'alignment', 'general', 'other'];

const createSchema = z.object({
  type:            z.string().min(1).max(50),
  title:           z.string().min(1).max(255),
  notes:           z.string().max(2000).optional(),
  status:          z.enum(['scheduled', 'completed', 'overdue']).optional(),
  scheduled_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  scheduled_km:    z.number().nonnegative().optional(),
  next_service_km: z.number().nonnegative().optional(),
  completed_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  completed_km:    z.number().nonnegative().optional(),
  completed_by:    z.string().max(255).optional(),
  cost:            z.number().nonnegative().optional(),
  invoice_url:     z.string().url().optional(),
  metadata:        z.record(z.unknown()).optional(),
});

const updateSchema = createSchema.partial();

// ─── Middleware ───────────────────────────────────────────────────────────────

// All routes in this router require auth + vehicle ownership
router.use(requireAuth);
router.use(requireVehicleOwnership);

/**
 * GET /api/app/maintenance/:vehicleId
 */
router.get('/:vehicleId', async (req, res) => {
  try {
    const records = await maintenance.listByVehicle(req.params.vehicleId);
    return res.json(records);
  } catch (err) {
    logError('Maintenance:list', 'Error listando registros', err.message);
    return res.status(500).json({ error: 'Error obteniendo registros de mantenimiento.' });
  }
});

/**
 * POST /api/app/maintenance/:vehicleId
 * Body: { type, title, notes?, status?, completed_date?, completed_km?, completed_by?, cost?, metadata? }
 */
router.post('/:vehicleId', validateBody(createSchema), async (req, res) => {
  try {
    const record = await maintenance.create(req.params.vehicleId, req.validated);
    return res.status(201).json(record);
  } catch (err) {
    logError('Maintenance:create', 'Error creando registro', err.message);
    return res.status(500).json({ error: 'Error creando registro de mantenimiento.' });
  }
});

/**
 * PUT /api/app/maintenance/:vehicleId/:id
 */
router.put('/:vehicleId/:id', validateBody(updateSchema), async (req, res) => {
  try {
    const record = await maintenance.update(req.params.id, req.params.vehicleId, req.validated);
    if (!record) return res.status(404).json({ error: 'Registro no encontrado.' });
    return res.json(record);
  } catch (err) {
    logError('Maintenance:update', 'Error actualizando registro', err.message);
    return res.status(500).json({ error: 'Error actualizando registro de mantenimiento.' });
  }
});

/**
 * DELETE /api/app/maintenance/:vehicleId/:id
 */
router.delete('/:vehicleId/:id', async (req, res) => {
  try {
    await maintenance.remove(req.params.id, req.params.vehicleId);
    return res.json({ ok: true });
  } catch (err) {
    logError('Maintenance:delete', 'Error eliminando registro', err.message);
    return res.status(500).json({ error: 'Error eliminando registro de mantenimiento.' });
  }
});

module.exports = router;
