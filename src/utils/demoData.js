// src/utils/demoData.js
// Datos simulados para el Modo Demo (Test Drive).
// Coordenadas fijadas en Concepción, Chile.
// El mockUser tiene plan 'pro' para que la demo muestre todas las funciones.

export const mockUser = {
  id: 9999,
  name: 'Usuario Demo',
  email: 'demo@trackeo.cl',
  phone: '+56912345678',
  administrator: false,
  readonly: false,
  attributes: {
    onboardingCompleted: true,
    isFirstLogin: false,
    plan: 'pro',
  },
};

export const mockDevices = [
  {
    id: 10001,
    name: 'Camioneta Toyota Hilux',
    latitude: -36.8201,
    longitude: -73.0444,
    speed: 0,
    course: 145,
    status: 'online',
    lastUpdate: new Date().toISOString(),
    attributes: {
      totalDistance: 47832000,
      power: 12.8,
      batteryLevel: 85,
      ignition: false,
    },
    deviceAttributes: {
      totalDistance: 47832000,
    },
  },
  {
    id: 10002,
    name: 'Suzuki Swift',
    latitude: -36.8270,
    longitude: -73.0500,
    speed: 42,
    course: 270,
    status: 'online',
    lastUpdate: new Date().toISOString(),
    attributes: {
      totalDistance: 23100000,
      power: 14.2,
      batteryLevel: 92,
      ignition: true,
    },
    deviceAttributes: {
      totalDistance: 23100000,
    },
  },
  {
    id: 10003,
    name: 'Hyundai Tucson',
    latitude: -36.8150,
    longitude: -73.0380,
    speed: 0,
    course: 0,
    status: 'offline',
    lastUpdate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    attributes: {
      totalDistance: 81500000,
      power: 11.9,
      batteryLevel: 60,
      ignition: false,
    },
    deviceAttributes: {
      totalDistance: 81500000,
    },
  },
];

export const mockGeofences = [
  {
    id: 20001,
    name: 'Casa',
    description: 'Domicilio principal',
    area: 'CIRCLE (-36.8201 -73.0444, 200)',
  },
  {
    id: 20002,
    name: 'Oficina Centro',
    description: 'Lugar de trabajo',
    area: 'CIRCLE (-36.8270 -73.0500, 150)',
  },
];

// Notificaciones mock orientadas a ventas.
// Formato idéntico al que produce useNotifications (id, tipo, mensaje, dispositivo, leido, createdAt).
export const mockNotifications = [
  {
    id: 'demo-n1',
    tipo: 'alerta',
    mensaje: '🚨 Exceso de Velocidad: "Suzuki Swift" alcanzó 120 km/h en Ruta 160',
    dispositivo: 'Suzuki Swift',
    leido: false,
    fuente: 'alerta',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'demo-n2',
    tipo: 'geovalla',
    mensaje: '✅ "Camioneta Toyota Hilux" estacionada en zona segura "Casa"',
    dispositivo: 'Camioneta Toyota Hilux',
    leido: false,
    fuente: 'alerta',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'demo-n3',
    tipo: 'mantencion',
    mensaje: '🔧 Próximo cambio de aceite en 500 km — "Hyundai Tucson"',
    dispositivo: 'Hyundai Tucson',
    leido: false,
    fuente: 'alerta',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'demo-n4',
    tipo: 'motor',
    mensaje: '🔴 Motor de "Camioneta Toyota Hilux" apagado remotamente',
    dispositivo: 'Camioneta Toyota Hilux',
    leido: true,
    fuente: 'usuario',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'demo-n5',
    tipo: 'geovalla',
    mensaje: '⚠️ "Suzuki Swift" salió de la geovalla "Oficina Centro"',
    dispositivo: 'Suzuki Swift',
    leido: true,
    fuente: 'alerta',
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
];
