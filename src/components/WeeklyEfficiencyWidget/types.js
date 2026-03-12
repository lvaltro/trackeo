// ═══════════════════════════════════════════════════
// WeeklyEfficiencyWidget — Constantes y configuración
// ═══════════════════════════════════════════════════

/**
 * Métricas disponibles para el selector de tabs
 * @type {Array<{id: string, label: string, icon: string, unit: string, dataKey: string}>}
 */
export const METRICS = [
  { id: 'distance', label: 'Distancia',   icon: '🛣️', unit: 'KM',      dataKey: 'km' },
  { id: 'efficiency', label: 'Eficiencia', icon: '⛽', unit: 'L/100km', dataKey: 'efficiency' },
  { id: 'time',     label: 'Tiempo',      icon: '⏱️', unit: 'Horas',   dataKey: 'hours' },
];

/**
 * Nombres completos de los días (español) indexados por abreviatura
 */
export const DAY_FULL_NAMES = {
  Lun: 'Lunes',
  Mar: 'Martes',
  Mié: 'Miércoles',
  Jue: 'Jueves',
  Vie: 'Viernes',
  Sáb: 'Sábado',
  Dom: 'Domingo',
};

/**
 * Abreviaturas de 1 y 2 letras para responsividad
 */
export const DAY_SHORT = {
  Lun: { one: 'L', two: 'Lu' },
  Mar: { one: 'M', two: 'Ma' },
  Mié: { one: 'X', two: 'Mi' },
  Jue: { one: 'J', two: 'Ju' },
  Vie: { one: 'V', two: 'Vi' },
  Sáb: { one: 'S', two: 'Sá' },
  Dom: { one: 'D', two: 'Do' },
};

/**
 * Gradiente de barras (tokens de color)
 */
export const BAR_GRADIENT = {
  start: '#f97316',  // orange-500 (Trackeo brand)
  end:   '#ea580c',  // orange-600
};

/**
 * Configuración de alturas responsivas (en px)
 */
export const CHART_HEIGHTS = {
  mobile:  200,
  tablet:  250,
  desktop: 300,
};

/**
 * Datos de prueba para desarrollo
 */
export const MOCK_DATA = [
  { day: 'Lun', km: 45.2,  maxSpeed: 80,  fuelCost: 3200, efficiency: 7.1,  hours: 1.2 },
  { day: 'Mar', km: 67.8,  maxSpeed: 95,  fuelCost: 4800, efficiency: 7.5,  hours: 2.1 },
  { day: 'Mié', km: 23.1,  maxSpeed: 60,  fuelCost: 1600, efficiency: 6.9,  hours: 0.8 },
  { day: 'Jue', km: 0,     maxSpeed: 0,   fuelCost: 0,    efficiency: 0,    hours: 0   },
  { day: 'Vie', km: 89.4,  maxSpeed: 110, fuelCost: 6300, efficiency: 7.0,  hours: 2.8 },
  { day: 'Sáb', km: 120.5, maxSpeed: 100, fuelCost: 8500, efficiency: 7.1,  hours: 3.5 },
  { day: 'Dom', km: 34.7,  maxSpeed: 70,  fuelCost: 2400, efficiency: 6.8,  hours: 1.0 },
];
