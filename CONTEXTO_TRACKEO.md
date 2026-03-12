# CONTEXTO DEL PROYECTO TRACKEO 🚗

> Resumen de la base de código actual (frontend + backend) para trabajar más rápido sobre el dashboard y la plataforma.

---

## 1. Estructura de carpetas (resumen, sin `node_modules`)

```text
.
├─ .env
├─ .env.production
├─ .gitignore
├─ ARCHITECTURE.md
├─ index.html
├─ package.json
├─ package-lock.json
├─ tailwind.config.js
├─ vite.config.js
├─ public/
│  └─ pwa-192x192.svg
├─ prisma/
│  └─ schema.prisma
├─ server/
│  ├─ .env
│  ├─ index.js
│  └─ package-lock.json
├─ geocoding-service/
│  └─ package.json
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ App.css
   ├─ index.css
   ├─ assets/
   │  └─ react.svg
   ├─ api/
   │  ├─ apiClient.js
   │  ├─ geocodeApi.js
   │  ├─ notificationApi.js
   │  └─ traccarApi.js
   ├─ components/
   │  ├─ ActivityFeed.jsx
   │  ├─ AddVehicleModal.jsx
   │  ├─ DemoPaywallModal.jsx
   │  ├─ EngineConfirmModal.jsx
   │  ├─ EngineStatusToast.jsx
   │  ├─ EngineToggleButton.jsx
   │  ├─ FloatingActionButton.jsx
   │  ├─ FleetInsightsWidget.jsx
   │  ├─ GeofencesView.jsx
   │  ├─ HistoryView.jsx
   │  ├─ LoadingScreen.jsx
   │  ├─ LiveSharePanel.jsx
   │  ├─ MaintenanceDashboard.jsx
   │  ├─ MapView.jsx
   │  ├─ NotificationsDropdown.jsx
   │  ├─ OnboardingWizard.jsx
   │  ├─ ParkingAlertModal.jsx
   │  ├─ ParkingModeController.jsx
   │  ├─ ProfileModal.jsx
   │  ├─ ProtectionActivateModal.jsx
   │  ├─ ProtectionDeactivateModal.jsx
   │  ├─ ProtectionSettingsPanel.jsx
   │  ├─ TrackeoLogo.jsx
   │  ├─ UpgradeSection.jsx
   │  ├─ UserDropdown.jsx
   │  ├─ WeeklyUsageWidget.jsx
   │  ├─ WeeklyEfficiencyWidget/
   │  │  ├─ BarChart.jsx
   │  │  ├─ FloatingTooltip.jsx
   │  │  ├─ GoalIndicator.jsx
   │  │  ├─ MetricTabs.jsx
   │  │  ├─ index.jsx
   │  │  └─ types.js
   │  ├─ dashboard/
   │  │  ├─ AddWidgetModal.jsx
   │  │  ├─ EditModeToolbar.jsx
   │  │  ├─ ProPlanWidget.jsx
   │  │  └─ SortableCard.jsx
   │  └─ settings/
   │     ├─ SettingsLayout.jsx
   │     ├─ shared/
   │     │  ├─ PremiumBadge.jsx
   │     │  ├─ SaveIndicator.jsx
   │     │  └─ SettingCard.jsx
   │     │  └─ ToggleSwitch.jsx
   │     └─ tabs/
   │        ├─ AdvancedSettings.jsx
   │        ├─ BillingSettings.jsx
   │        ├─ NotificationSettings.jsx
   │        ├─ ProfileSettings.jsx
   │        ├─ SecuritySettings.jsx
   │        └─ VehicleSettings.jsx
   ├─ context/
   │  └─ DemoContext.jsx
   ├─ hooks/
   │  ├─ useCounter.js
   │  ├─ useEngineControl.js
   │  ├─ useLongPress.js
   │  ├─ useMaintenance.js
   │  ├─ useNotifications.js
   │  ├─ useParkingMode.js
   │  ├─ usePWAInstall.js
   │  ├─ useTraccarSocket.js
   │  └─ useVehicleTracker.js
   ├─ screens/
   │  ├─ DashboardLayout.jsx
   │  ├─ InstallerScreen.jsx
   │  ├─ LiveTrackingPublic.jsx
   │  └─ LoginScreen.jsx
   └─ utils/
      ├─ demoData.js
      └─ mapUtils.js
```

---

## 2. `package.json` (dependencias principales)

```json
{
  "name": "personas-trackeo",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "framer-motion": "^12.34.0",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.563.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-leaflet": "^5.0.0",
    "react-router-dom": "^7.13.0",
    "recharts": "^3.7.0",
    "sonner": "^2.0.7"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.24",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "vite": "^7.2.4",
    "vite-plugin-pwa": "^1.2.0"
  }
}
```

Resumen rápido:

- React 19 + React Router DOM 7 para SPA.
- Vite + Tailwind + lucide-react para UI moderna.
- Leaflet + react-leaflet para mapas.
- dnd-kit para layout de dashboard drag & drop (widgets).
- sonner para toasts globales.

---

## 3. Esquema de base de datos (Prisma / PostgreSQL)

Archivo: `prisma/schema.prisma`  
Base: PostgreSQL multi-tenant para SaaS de tracking (organizaciones, usuarios, vehículos, billing, etc.).

### 3.1. Generales

- `generator client { provider = "prisma-client-js" }`
- `datasource db { provider = "postgresql" }`

### 3.2. Módulos principales y modelos

**Plataforma / Catálogo**

- `Country`: países, moneda, impuestos, timezone.
- `Plan`: planes comerciales (precio USD, features, límites).
- `PlanPrice`: precios por país/moneda.
- `PlatformAdmin`: admins de plataforma.

**Organizaciones y usuarios**

- `Organization`: cliente final (empresa/persona), settings, estado de suscripción, onboarding.
- `User`: usuarios dentro de la organización (roles, permisos, preferencias).

**Dispositivos y vehículos**

- `Installer`: instaladores certificados, métricas y comisiones.
- `Device`: dispositivo físico GPS (IMEI, SIM, estado, última posición).
- `Vehicle`: vehículo lógico asociado a `Device`, odómetro, estado, alertConfig.
- `VehicleDriver`: asignación N:M vehículo–conductor (`User`).

**Features principales**

- `Geofence`: geovallas con geometría, reglas de alerta y programación.
- `Place`: lugares (puntos) asociados a organización y geovallas.
- `Alert`: alertas generadas (geovallas, eventos, comportamiento).
- `Trip`: viajes con métricas de distancia, velocidad, eficiencia, combustible.
- `PlannedRoute` + `RouteEvent`: planificación de rutas y eventos asociados.
- `MaintenanceRecord`: agenda y registro de mantenciones por vehículo.

**Pagos y suscripciones**

- `Subscription`: suscripción activa (plan, ciclo, fechas, estado).
- `Payment`: pagos individuales con impuestos, factura, estado.

**Instalaciones, cache y notificaciones**

- `InstallationJob`: órdenes de instalación para instaladores.
- `GeocodingCache`: cache de resultados de geocodificación (direcciones ↔ coordenadas).
- `Notification`: notificaciones por usuario (email/app/etc).
- `AuditLog`: auditoría de acciones (usuario, recurso, cambios).

En general el diseño está listo para un SaaS completo de tracking (multi-tenant, billing, instaladores, viajes, mantenciones, etc.), aunque en el backend actual (`server/index.js`) se usa sobre todo Traccar + endpoints propios; habría que revisar allí qué partes ya persisten en Postgres.

---

## 4. Archivos clave del Dashboard

### 4.1. `src/App.jsx`

Responsable de:

- Estado global mínimo: `user`, `isDark`, restaurar sesión y tema desde `localStorage`.
- Router principal (`react-router-dom`):
  - `/` → redirección a `/dashboard` o `/login` según sesión.
  - `/login` → `LoginScreen`.
  - `/dashboard` → `DashboardLayout` (ruta protegida).
  - `/installer` → `InstallerScreen` (pantalla para instaladores).
  - `/live/:token` → `LiveTrackingPublic` (página pública de seguimiento).
- Integración con:
  - `DemoProvider` (`DemoContext`) para modo demo.
  - `Toaster` de `sonner` para notificaciones globales.
  - `OnboardingWizard` cuando el usuario es primer login o no completó onboarding.

### 4.2. `src/screens/LoginScreen.jsx`

Pantalla de login con diseño de marketing + glassmorphism.

- Props: `onLoginSuccess`, `isDark`, `onToggleTheme`.
- Llama `traccarService.login(email, password)` para autenticar contra Traccar.
- Maneja:
  - Recordar sesión 24h en `localStorage` (`trackeo_session`).
  - Errores de credenciales/conexión.
  - Botón para entrar en **modo demo** (`useDemo` + `mockUser`).
  - CTA para instalar PWA (`usePWAInstall`) con banner inferior.

### 4.3. `src/screens/DashboardLayout.jsx`

Componente principal del dashboard autenticado.

- Props: `user`, `isDark`, `onToggleTheme`, `onLogout`.
- Usa hooks de dominio:
  - `useVehicleTracker`: polling cada 3s a Traccar, combina devices + positions.
  - `useEngineControl`: corte/encendido remoto de motor.
  - `useNotifications`: sistema de notificaciones + toasts.
  - `useProtection`: feature “Protege mi camino” (escolta + live share).
  - `useParkingMode`: “Modo Estacionado” con geovalla dinámica y alertas.
  - `useCounter`: animaciones numéricas (odómetro).
- Usa componentes de alto nivel:
  - `MapView`, `HistoryView`, `GeofencesView`.
  - `ActivityFeed`, `MaintenanceDashboard`.
  - `WeeklyUsageWidget`, `UpgradeSection`.
  - `EngineToggleButton`, `EngineConfirmModal`, `EngineStatusToast`.
  - `ProtectionSettingsPanel` + modales de activar/desactivar.
  - `ParkingModeController` + `ParkingAlertModal`.
  - `FloatingActionButton` (FAB) unificado para acciones rápidas.
- Lógica principal:
  - **Sidebar** con secciones: Mis Vehículos, Historial, Rutas, Geovallas, Protege mi camino, Alertas, Mantención, Configuraciones + control de motor y Modo Estacionado.
  - Selección de vehículo activa (selector en header).
  - Modo demo: reemplaza `vehicles` reales con `mockDevices` y bloquea acciones sensibles con paywall.
  - Tarjetas de métricas:
    - Velocidad (online/offline + “hace X min”).
    - Estado de conexión (online/offline).
    - Ubicación actual con geocoding (`reverseGeocode` + `getShortAddress`) y botón para copiar / abrir en Google Maps.
    - Odómetro total.
    - Batería / voltaje con estimación y detección de motor encendido.
  - Layout responsive:
    - Grid de stats + mapa + widget de uso semanal + sección de upgrade.
    - Modales y paneles superpuestos (motor, protección, parking, perfil, añadir vehículo).

### 4.4. `src/screens/InstallerScreen.jsx`

Pantalla mobile-first para validación de instalación de dispositivos.

- Formulario con:
  - Patente del vehículo.
  - Kilometraje actual.
  - IMEI del GPS (con botón futuro para escanear).
- Evidencia fotográfica:
  - Tablero (odómetro).
  - GPS instalado.
  - Vehículo completo.
- Actualmente:
  - `handleSubmit` solo hace `console.log` y `alert` (“simulación”).
  - Falta conectar a un endpoint real (propio backend / API Traccar).

### 4.5. `src/screens/LiveTrackingPublic.jsx`

Página pública “Viaje Seguro” (no requiere login), para compartir un link:

- Ruta: `/live/:token`.
- Fetch periódico (`fetch /api/live-share/:token`) cada 10s:
  - Maneja estados: cargando, link no válido (404), expirado (410), OK.
- Mapa con `react-leaflet`:
  - Icono circular custom con flecha que rota según `course`.
  - Auto-centra al vehículo con `MapUpdater`.
- UI:
  - Header minimalista con logo y estado “Ubicación en vivo”.
  - Card inferior con nombre del vehículo, nombre de quien comparte, velocidad, tiempo desde última actualización y tiempo restante del link.
  - CTA para ir a `trackeo.cl`.

---

## 5. ¿Qué está funcionando ya y qué falta?

### 5.1. Ya funcionando / muy avanzado

- **Autenticación básica** contra Traccar desde el frontend (`traccarApi.js` + `LoginScreen`).
- **Gestión de sesión**:
  - Persistencia en `localStorage` con expiración de 24h.
  - Restauración automática de sesión y tema en `App.jsx`.
  - Manejo global de expiración (evento `auth:expired` desde `apiClient.js`).
- **Dashboard en tiempo real**:
  - Polling a Traccar y fusión de datos de dispositivos/posiciones.
  - Selección de vehículo y métricas clave (velocidad, estado GPS, odómetro, batería).
  - Mapa en vivo con `MapView` y `react-leaflet`.
  - Historial de rutas con `HistoryView` + mapa de replay.
- **Features de valor** (al menos a nivel de UI + lógica de front):
  - Geovallas (`GeofencesView` + `useParkingMode` + `useProtection`).
  - “Protege mi camino” con contactos, zona segura y live share.
  - Modo Estacionamiento con panel propio y alertas visuales.
  - Motor remoto (apagado/encendido) con confirmación y toasts.
  - Notificaciones y feed de actividad (`NotificationsDropdown`, `ActivityFeed`).
  - Dashboard de mantención (`MaintenanceDashboard` + `useMaintenance`).
  - Widgets analíticos (`WeeklyUsageWidget`, `WeeklyEfficiencyWidget`).
  - Pantalla pública de seguimiento (`LiveTrackingPublic`) conectada al backend vía `/api/live-share/:token`.
- **Modo demo** bien integrado:
  - `DemoContext` + `demoData` para explorar la app sin Traccar real.
  - Paywall visual (`DemoPaywallModal` / `showPaywall`) para features premium.
- **PWA / Mobile ready**:
  - Vite PWA plugin configurado.
  - Hook `usePWAInstall` y banner de instalación en el login.
  - Diseño muy mobile-first en login, installer y live tracking.

### 5.2. Faltantes / por conectar

- **Persistencia real en Postgres (Prisma)**:
  - El esquema Prisma está completo, pero no se ve aún la capa de acceso (no hay código `prisma` en el frontend y habría que revisar el backend para ver qué modelos se usan ya).
  - Probable estado actual: Traccar como fuente principal + algunos endpoints propios (geocoding, live-share, notificaciones) sin explotar todavía todo el modelo SaaS (planes, billing, instaladores, etc.).
- **Backend de instalador**:
  - `InstallerScreen` hoy solo simula el envío; falta:
    - Endpoint en `server/index.js` para recibir `formData` + fotos.
    - Subida de archivos (S3 / almacenamiento) y persistencia (idealmente en `InstallationJob` + campos de fotos en `Device`/`Vehicle`).
- **Integración completa de billing y planes**:
  - El modelo contempla `Plan`, `PlanPrice`, `Subscription`, `Payment`, pero no se ven (desde el front) pantallas de facturación real, solo UI de “upgrade”/pro.
- **Sincronización completa de alertas/trips con DB propia**:
  - A nivel de UI hay `Alert`, `Trip`, `MaintenanceRecord` modelados en Prisma y componentes en el dashboard, pero habría que confirmar que el backend los persiste y no depende solo de datos en memoria o de Traccar.
- **Hardening y errores**:
  - Revisar manejo de errores y loading states en todos los hooks (`useVehicleTracker`, `useNotifications`, `useProtection`, etc.) para casos borde (sin red, Traccar caído, backend caído).

---

## 6. Cómo usar este documento

- Como mapa rápido para:
  - Encontrar archivos clave del dashboard y del backend.
  - Ver de un vistazo el modelo de datos global (Prisma).
  - Entender qué features ya tienen UI + lógica y cuáles requieren solo “conectar cables” al backend/Postgres.
- Idealmente mantenerlo actualizado cuando:
  - Se agreguen módulos nuevos (ej. facturación real, reporting).
  - Se empiece a usar Prisma en producción para alguna parte del flujo.

