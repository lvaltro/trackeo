# Arquitectura de Geocodificación Inversa — Trackeo.cl

## Objetivo

Convertir coordenadas GPS (lat/lng) a direcciones legibles usando **Nominatim (OpenStreetMap)** sin saturar el servicio, cumpliendo **1 petición/segundo** y minimizando llamadas externas.

---

## 1. Flujo de trabajo (alto nivel)

```
[Dispositivo GPS] → coordenadas cada 3s
        ↓
[Filtro de redundancia] → ¿Misma ubicación que la última? → SÍ → Descartar (no procesar)
        ↓ NO
[Disparador lógico] → ¿Debe geocodificarse?
        │
        ├─ Velocidad = 0 durante ≥ X min (ej. 2–5 min) → SÍ → Encolar
        ├─ Usuario pide "Ver dirección" en UI → SÍ → Encolar
        └─ En cualquier otro caso → NO → No encolar
        ↓
[Cola con rate limit 1/s] → Saca peticiones de a una
        ↓
[Verificación de caché] → ¿Hay coordenada cercana (≤ 25 m) ya geocodificada?
        │
        ├─ SÍ → Devolver dirección en caché (0 llamadas a Nominatim)
        └─ NO → Llamar Nominatim → Guardar en caché → Devolver
```

---

## 2. Disparadores lógicos (“solo lo necesario”)

| Disparador | Condición | Objetivo |
|------------|-----------|----------|
| **Vehículo detenido** | `speed === 0` durante ≥ **X minutos** (ej. 2–5) | Dirección de “dónde está estacionado” sin geocodificar cada punto de la ruta. |
| **Solicitud explícita** | Usuario hace clic en “Ver dirección” / “¿Dónde está?” en la UI | Bajo volumen, alta prioridad. |

No se geocodifica:

- Cada punto de la ruta en movimiento.
- Puntos repetidos (misma ubicación).
- Posiciones que no cumplan ningún disparador.

Pseudocódigo del filtro antes de encolar:

```
FUNCIÓN debeGeocodificar(evento, estadoPorDispositivo):
  deviceId = evento.deviceId
  lat, lng = evento.latitude, evento.longitude
  speed = evento.speed
  ahora = ahora()

  // 1. Redundancia: misma ubicación (estacionado, sin movimiento)
  ultimo = estadoPorDispositivo[deviceId]
  SI ultimo Y distancia(ultimo.lat, ultimo.lng, lat, lng) < 10 metros:
    RETORNAR false   // No hacer nada

  // 2. Actualizar última posición
  estadoPorDispositivo[deviceId] = { lat, lng, speed, timestamp: ahora }

  // 3. Disparador: usuario solicitó dirección (flag en estado)
  SI estadoPorDispositivo[deviceId].solicitudUsuario:
    estadoPorDispositivo[deviceId].solicitudUsuario = false
    RETORNAR true

  // 4. Disparador: vehículo detenido ≥ X minutos
  SI speed === 0 (o < umbral):
    SI ultimo.speed === 0 Y (ahora - ultimo.timestampDetenido) >= MINUTOS_DETENIDO * 60:
      RETORNAR true   // Primera vez que superamos el umbral de tiempo
    SINO:
      actualizar timestampDetenido en estado
      RETORNAR false
  SINO:
    resetear "timestampDetenido" para este dispositivo
    RETORNAR false
```

---

## 3. Caché por proximidad (evitar llamadas repetidas)

Antes de llamar a Nominatim se comprueba si **ya tenemos una dirección para un punto cercano** (radio ~20–30 m).

- **Clave de caché**: no la coordenada exacta, sino una **celda o clave de proximidad** (grid o “geohash” de precisión ~25 m).
- **Valor**: dirección (string o JSON) + tal vez lat/lng de referencia.
- **Búsqueda**: dado (lat, lng), buscar en caché si existe alguna entrada cuya coordenada esté a ≤ 25 m. Si existe, devolver esa dirección y **no** llamar a Nominatim.

Ver implementación en `geocoding-service/cacheAndDistance.js`.

---

## 4. Cola y rate limiting

- **Cola**: todas las peticiones que pasan el filtro se encolan (BullMQ, RabbitMQ o cola en memoria).
- **Worker**: un único consumidor que:
  - Saca un ítem de la cola.
  - Verifica caché (distancia).
  - Si no hay caché, llama a Nominatim **una vez**.
  - Espera **al menos 1 segundo** antes de procesar el siguiente (límite Nominatim: 1 req/s).
- **Headers**: User-Agent y Referer según [política de uso de Nominatim](https://operations.osmfoundation.org/policies/nominatim/).

---

## 5. Filtrado de redundancia (misma ubicación)

- Si el vehículo reporta **la misma ubicación** (ej. estacionado), no se reencola ni se geocodifica de nuevo.
- Criterio: `distancia(última_posición, posición_actual) < 10 m` (o umbral configurable) → descartar.
- Opcional: solo considerar “misma ubicación” si además `speed === 0` durante N reportes consecutivos.

---

## 6. Resumen de ahorro

| Sin estrategia | Con estrategia |
|----------------|----------------|
| 1 punto cada 5 s → 17.280 puntos/día por vehículo | Solo puntos “detenido ≥ X min” + solicitudes usuario (decenas por día) |
| Sin caché → 1 llamada por punto | Caché 25 m → muchas coordenadas reutilizan la misma dirección |
| Llamadas sin límite → riesgo de bloqueo | Cola + 1 req/s → cumplimiento de política Nominatim |

---

## 7. Dónde vive cada pieza

| Pieza | Ubicación sugerida |
|-------|--------------------|
| Filtro de redundancia y disparadores | Backend (servicio que recibe eventos de Traccar o de tu API). |
| Caché (Redis o local) | Backend; clave por proximidad (grid/geohash). |
| Cola (BullMQ/RabbitMQ) | Backend. |
| Cliente Nominatim (rate limit 1/s) | Backend. |
| UI “Ver dirección” | Frontend (Trackeo) → llama a tu API → encola + devuelve desde caché o resultado cuando esté listo. |

El código de ejemplo en **`geocoding-service/`** es Node.js y puede integrarse en un servicio backend de Trackeo (Express, Fastify, etc.).

---

## 8. Resumen: verificación de caché y distancia

Antes de llamar a Nominatim se comprueba si **ya existe una dirección para un punto cercano** (≤ 25 m):

- **Clave de caché**: celda de grid (`gridKey(lat, lon, 4)`) para reutilización por proximidad.
- **Búsqueda**: `cache.get(lat, lon)` → si `hit`, devolver esa dirección (0 llamadas externas); si no, llamar a Nominatim y guardar con `cache.set(lat, lon, address)`.

Implementación completa en `geocoding-service/cacheAndDistance.js`.
