const { Router } = require('express');
const { z } = require('zod');
const documents = require('../../core/documents/index.js');
const { requireAuth } = require('../middleware/auth');
const { requireVehicleOwnership } = require('../middleware/ownership');
const { validateBody } = require('../middleware/validate');
const { logError } = require('../lib/logger');

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const TIPOS_VALIDOS_DOCS = [
  'permiso_circulacion', 'seguro_obligatorio', 'revision_tecnica',
  'seguro_adicional', 'licencia', 'otro',
];

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe ser YYYY-MM-DD');

const createSchema = z.object({
  type:          z.enum(TIPOS_VALIDOS_DOCS),
  title:         z.string().min(1).max(255),
  expires_at:    ISO_DATE,
  issue_date:    ISO_DATE.optional(),
  notes:         z.string().max(2000).optional(),
  reminder_days: z.array(z.number().int().nonnegative()).max(10).optional(),
  file_url:      z.string().url().optional(),
  metadata:      z.record(z.unknown()).optional(),
});

const updateSchema = createSchema.partial();

// ─── Middleware ───────────────────────────────────────────────────────────────

// All routes in this router require auth + vehicle ownership
router.use(requireAuth);
router.use(requireVehicleOwnership);

/**
 * GET /api/app/documents/:vehicleId
 */
router.get('/:vehicleId', async (req, res) => {
  try {
    const docs = await documents.listByVehicle(req.params.vehicleId);
    return res.json(docs);
  } catch (err) {
    logError('Documents:list', 'Error listando documentos', err.message);
    return res.status(500).json({ error: 'Error obteniendo documentos.' });
  }
});

/**
 * POST /api/app/documents/:vehicleId
 * Body: { type, title, expires_at, issue_date?, notes?, reminder_days?, file_url?, metadata? }
 */
router.post('/:vehicleId', validateBody(createSchema), async (req, res) => {
  try {
    const doc = await documents.create(req.params.vehicleId, req.validated);
    return res.status(201).json(doc);
  } catch (err) {
    logError('Documents:create', 'Error creando documento', err.message);
    return res.status(500).json({ error: 'Error creando documento.' });
  }
});

/**
 * PUT /api/app/documents/:vehicleId/:id
 */
router.put('/:vehicleId/:id', validateBody(updateSchema), async (req, res) => {
  try {
    const doc = await documents.update(req.params.id, req.params.vehicleId, req.validated);
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });
    return res.json(doc);
  } catch (err) {
    logError('Documents:update', 'Error actualizando documento', err.message);
    return res.status(500).json({ error: 'Error actualizando documento.' });
  }
});

/**
 * DELETE /api/app/documents/:vehicleId/:id
 */
router.delete('/:vehicleId/:id', async (req, res) => {
  try {
    await documents.remove(req.params.id, req.params.vehicleId);
    return res.json({ ok: true });
  } catch (err) {
    logError('Documents:delete', 'Error eliminando documento', err.message);
    return res.status(500).json({ error: 'Error eliminando documento.' });
  }
});

module.exports = router;
