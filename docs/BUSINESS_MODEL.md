# Trackeo.cl — Modelo de Negocio

## Principio fundamental

**Segmento comercial != Rol tecnico**

- Segmentos (Particular, Pyme, Flota, Industrial, Gobierno, Partner) definen plan, pricing, onboarding
- Roles (Owner, Admin, Operator, Driver, Installer, Support, Super Admin) definen permisos

## Planes

| Plan | Hardware | Cliente | Mensual | Vehiculos | Historial |
|------|----------|---------|---------|-----------|-----------|
| Start | FMC003 (OBD2) | Personas, Uber/Cabify | $7-10k | 1 | 30 dias |
| Pro | FMC150 | Pymes | $12-15k | 5 | 6 meses |
| Pro+ | FMC150 + sensores BLE | Flotas, Industrial | $20-30k | 20 | 12 meses |
| Enterprise | Variable | Gobierno, corporativo | Proyecto | Ilimitado | Ilimitado |

### Start incluye
- Ubicacion en tiempo real
- Historial de recorridos
- Velocidad
- Alertas basicas
- Lectura OBD2 (RPM, consumo estimado, DTC basicos)
- Reporte semanal automatico
- 1 geocerca

### Pro desbloquea (sobre Start)
- Hasta 5 vehiculos
- Geocercas ilimitadas
- Corte de corriente (si hardware lo permite)
- Reportes descargables
- Multiusuario (admin + viewer)
- Alertas avanzadas
- Lectura CAN real (combustible, horas motor, puertas, temperatura, voltaje)
- Historial 6 meses

### Pro+ desbloquea (sobre Pro)
- Hasta 20 vehiculos
- Telemetria CAN completa
- Sensores BLE
- Horas motor
- Reportes productividad
- Exportacion CSV
- Soporte prioritario
- Webhook basico

### Enterprise desbloquea (sobre Pro+)
- Vehiculos ilimitados
- API REST documentada
- Webhooks avanzados
- SSO (futuro)
- Branding personalizado
- Instancia dedicada (futuro)
- SLA formal

## Feature flags (implementacion tecnica)

Nunca `if (user.plan === "pro")`. Siempre feature keys:

```
MULTI_VEHICLE
ADVANCED_REPORTS
IMMOBILIZER
CAN_TELEMETRY
BLE_SENSORS
API_ACCESS
MULTI_USER
EXTENDED_HISTORY
WEBHOOK_BASIC
WEBHOOK_ADVANCED
CSV_EXPORT
PRIORITY_SUPPORT
CUSTOM_BRANDING
DEDICATED_INSTANCE
SSO
```

Cada plan es un bundle de features. Tabla `organization_features`:
- organization_id
- feature_key
- enabled

Esto permite: activar features manuales, trials, promos, enterprise custom.

## Upgrade triggers

| Upgrade | Disparador real | Lo que se desbloquea |
|---------|----------------|---------------------|
| Start -> Pro | 2do vehiculo, reportes, 2da geocerca, invitar usuario | Multi-vehicle + reportes |
| Pro -> Pro+ | Telemetria CAN, sensores, >5 vehiculos, export CSV | Productividad |
| Pro+ -> Enterprise | >20 vehiculos, API, SLA, branding, SSO | Integracion |

UI: nunca boton gris muerto. Siempre "Disponible en Plan X" + CTA "Actualizar plan".

Medir intentos bloqueados como leads internos de upgrade.

## Upsell automatico

- Dia 25: "Tu historial de 30 dias esta por expirar. Amplialo con Pro."
- Vehiculo desconectado: "Activa alertas avanzadas en Pro."
- 3er vehiculo: "Administra flotas completas con Pro+."

## Modelo de cobro

**Regla principal: el cliente final paga la suscripcion a Trackeo. Siempre.**

| Escenario | Hardware | Mensualidad | Instalador gana |
|-----------|----------|-------------|-----------------|
| Particular directo | Cliente paga | Cliente paga a Trackeo | Nada |
| Pyme via instalador | Cliente paga | Cliente paga a Trackeo | Instalacion + comision opcional |
| Partner (futuro) | Cliente paga | Cliente paga a Trackeo, Trackeo paga comision | Comision recurrente |
| White-label (Fase 3) | Contrato | Instalador cobra, paga fee a Trackeo | Margen propio |

**Fase 1: Cliente paga directo. Instalador gana por instalacion. No dar control de facturacion al instalador.**

Regla de oro: el cliente percibe "yo contrato Trackeo", no "yo contrato al instalador".

## Onboarding

### Plan Start (autoinstalacion, 10-15 min)
1. Compra (web/WhatsApp/ML)
2. Crea cuenta (email, password, tipo vehiculo, patente)
3. Recibe equipo, conecta al OBD2
4. Ingresa IMEI en plataforma -> validacion -> vinculacion device->org
5. Sistema detecta primer fix GPS -> estado TRACKING_ACTIVE
6. Wizard: alerta velocidad, alerta bateria, geocerca casa

### Plan Pro (con instalador, 24-48h)
1. Compra equipo + instalacion
2. Se crea org + orden de instalacion (INSTALLATION_PENDING)
3. Se asigna instalador (InstallerAssignment con fecha expiracion)
4. Instalador conecta FMC150, configura APN, testea senal, reporta OK
5. Sistema espera primer fix, valida voltaje/GSM/CAN
6. Estado -> TRACKING_ACTIVE, se revoca acceso extendido instalador
7. Cliente recibe notificacion + wizard configuracion

### Device states
```
PENDING_ACTIVATION
INSTALLATION_PENDING
AWAITING_FIRST_FIX
TRACKING_ACTIVE
SUSPENDED
DISCONNECTED
```

## Instaladores

Entidad separada (no parte del tenant).

Tablas: `installers`, `installer_assignments`

Acceso:
- Temporal (7 dias post instalacion, renovable)
- Solo tecnico (estado conexion, senal, IMEI, ultima conexion, test tecnico)
- No ve: historial completo, reportes, documentos, facturacion
- Toda accion auditada

| Plan | Ve telemetria | Puede cortar corriente | Puede editar config |
|------|--------------|----------------------|-------------------|
| Start | Solo estado conexion | No | No |
| Pro | Diagnostico tecnico | Si (segun permiso) | Limitado |
| Pro+ | Diagnostico + sensores | Si | Si tecnico |
| Enterprise | Segun contrato | Segun contrato | Controlado |

Futuro: panel partner propio, marketplace de instaladores.
