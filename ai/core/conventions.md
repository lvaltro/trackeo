# Convenciones de código — Trackeo.cl

## Module system

| Directorio | Sistema | Usar |
|---|---|---|
| `src/` | ESM | `import`/`export` |
| `server/` | CommonJS | `require`/`module.exports` |
| `core/` | CommonJS | `require`/`module.exports` |
| `scripts/` | CommonJS | `require`/`module.exports` |
| `app/` | TypeScript/ESM | `import`/`export` |

## Estructura de un nuevo endpoint (R2 compliant)

```javascript
// server/routes/myfeature.js
'use strict';
const { Router } = require('express');
const { z } = require('zod');
const myFeature = require('../../core/myfeature/index.js');
const { requireAuth } = require('../middleware/auth');
const { requireVehicleOwnership } = require('../middleware/ownership');
const { validateBody } = require('../middleware/validate');
const { logError } = require('../lib/logger');

const router = Router();

const createSchema = z.object({
  field1: z.string().min(1).max(255),
  field2: z.number().optional(),
});

router.post('/:vehicleId', requireAuth, requireVehicleOwnership, validateBody(createSchema), async (req, res) => {
  try {
    const result = await myFeature.create(req.params.vehicleId, req.validated); // req.validated, no req.body
    return res.status(201).json(result);
  } catch (err) {
    logError('MyFeature:create', 'Error creando', err.message);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
```

## Estructura de un nuevo módulo core/

```javascript
// core/myfeature/index.js
'use strict';
// NO require('express') NI req/res aquí
const { createClient } = require('@supabase/supabase-js');

const TABLE = 'my_table';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function listBy(vehicleId) {
  const { data, error } = await getClient()
    .from(TABLE)
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

module.exports = { listBy };
```

## Estructura de un nuevo hook frontend (dual-mode)

```javascript
// src/hooks/useMyFeature.js
import { useState, useEffect } from 'react';
import { myFeatureApi } from '../api/myFeatureApi';
import { useDemo } from '../context/DemoContext';

const MOCK_DATA = []; // fallback para demo

export function useMyFeature(vehicleId) {
  const { isDemoMode } = useDemo();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isDemoMode || !vehicleId) {
      setData(MOCK_DATA);
      return;
    }
    setLoading(true);
    myFeatureApi.list(vehicleId)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [vehicleId, isDemoMode]);

  return { data, loading, error };
}
```

## Naming conventions

- **Routes:** `server/routes/<feature>.js` (snake_case del dominio)
- **Core modules:** `core/<feature>/index.js`
- **Frontend API clients:** `src/api/<feature>Api.js`
- **Frontend hooks:** `src/hooks/use<Feature>.js`
- **Tests:** `server/__tests__/<feature>.test.js`
- **Variables ENV:** UPPER_SNAKE_CASE en `.env`
- **Supabase tables:** snake_case (ej: `maintenance_records`)
- **Endpoints:** `/api/app/<dominio>/:id` para rutas autenticadas, `/api/<servicio>` para transversales

## Campos protegidos en CRUD

Al hacer update/create en core/, siempre hacer destructuring para eliminar campos protegidos:
```javascript
const { id: _id, vehicle_id: _vid, created_at: _ca, updated_at: _ua, ...safe } = fields;
```

## Validación de errores en core/

- Usar `throw error` (no `throw new Error(error.message)`) para Supabase errors
- Excepción: cuando se necesita un mensaje específico del dominio
