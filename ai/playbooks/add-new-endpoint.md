# Playbook: Agregar un nuevo endpoint

Checklist paso a paso para agregar un endpoint R2-compliant.

## 1. Definir el dominio

¿Existe `core/<dominio>/index.js`?
- Si no: crear el módulo core/ primero (ver patrón en `ai/core/conventions.md`)
- Si sí: agregar la función al módulo existente

## 2. Agregar función a core/

```javascript
// core/<dominio>/index.js — agregar:
async function create(vehicleId, fields) {
  const { id: _id, vehicle_id: _vid, created_at: _ca, ...safe } = fields;
  const { data, error } = await getClient()
    .from(TABLE)
    .insert({ ...safe, vehicle_id: vehicleId })
    .select()
    .single();
  if (error) throw error;
  return data;
}
module.exports = { ..., create };
```

## 3. Definir schema Zod en la ruta

```javascript
const createSchema = z.object({
  campo1: z.string().min(1).max(255),
  campo2: z.number().optional(),
});
```

## 4. Agregar handler en server/routes/

```javascript
router.post('/:vehicleId', requireAuth, requireVehicleOwnership, validateBody(createSchema), async (req, res) => {
  try {
    const result = await dominio.create(req.params.vehicleId, req.validated);
    return res.status(201).json(result);
  } catch (err) {
    logError('Dominio:create', 'Error creando', err.message);
    return res.status(500).json({ error: 'Error interno.' });
  }
});
```

## 5. Montar la ruta en server/index.js (si es un router nuevo)

```javascript
const miRouter = require('./routes/mirouter');
app.use('/api/app/mirouter', miRouter);
```

## 6. Agregar a docs/api/endpoints.md

Documentar el endpoint con body, response y errores.

## 7. Escribir test

```javascript
// server/__tests__/<dominio>.test.js
it('creates correctly', async () => { ... });
it('throws on DB error', async () => { ... });
```

## Checklist final

- [ ] Schema Zod definido
- [ ] `req.validated` usado (no `req.body`)
- [ ] `requireAuth` + `requireVehicleOwnership` aplicados si corresponde
- [ ] `logError` en catch
- [ ] Función core/ no importa Express
- [ ] Test escrito
- [ ] Endpoint documentado en `docs/api/endpoints.md`
