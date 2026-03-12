// src/components/settings/tabs/VehicleSettings.jsx
// Configuración GPS por vehículo: intervalos, precisión, detección de movimiento
import React, { useState, useMemo } from 'react';
import { 
  Car, Bike, Truck, Radio, Target, Move, Activity,
  Cpu, Battery, Wifi, RefreshCw, Save, Loader2, AlertTriangle,
  ChevronRight
} from 'lucide-react';
import SettingCard from '../shared/SettingCard';
import ToggleSwitch from '../shared/ToggleSwitch';
import SaveIndicator from '../shared/SaveIndicator';

// Íconos de vehículo según nombre (heurística)
const getVehicleIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('moto') || lower.includes('bike') || lower.includes('yamaha') || lower.includes('honda')) return Bike;
  if (lower.includes('camion') || lower.includes('truck') || lower.includes('camión')) return Truck;
  return Car;
};

const VehicleSettings = ({ vehicles = [], onNotify }) => {
  const [selectedId, setSelectedId] = useState(vehicles[0]?.id || null);
  const [saveStatus, setSaveStatus] = useState('idle');

  // Config por vehículo (estado local)
  const [configs, setConfigs] = useState(() => {
    const initial = {};
    vehicles.forEach(v => {
      initial[v.id] = {
        reportInterval: 'normal', // 'realtime' | 'normal' | 'saving'
        minAccuracy: 15,
        alertMovementNoIgnition: true,
        autoSleep: true,
        autoSleepMinutes: 30,
      };
    });
    return initial;
  });

  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedId), [vehicles, selectedId]);
  const currentConfig = configs[selectedId] || {};

  const updateConfig = (key, value) => {
    setConfigs(prev => ({
      ...prev,
      [selectedId]: { ...prev[selectedId], [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // TODO: Conectar con API real
      await new Promise(resolve => setTimeout(resolve, 800));
      setSaveStatus('saved');
      onNotify?.({
        tipo: 'sistema',
        mensaje: `✅ Configuración de "${selectedVehicle?.name}" guardada`,
        dispositivo: selectedVehicle?.name,
      });
    } catch {
      setSaveStatus('error');
    }
  };

  const intervalOptions = [
    { id: 'realtime', label: 'Tiempo Real (10s)', desc: 'Mayor consumo de batería', icon: '⚡' },
    { id: 'normal', label: 'Normal (30s)', desc: 'Recomendado', icon: '⚖️' },
    { id: 'saving', label: 'Ahorro (60s)', desc: 'Ahorra batería', icon: '🔋' },
  ];

  if (vehicles.length === 0) {
    return (
      <SettingCard title="Sin vehículos" icon={Car}>
        <div className="text-center py-8">
          <Car className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No tienes vehículos registrados</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">Añade un vehículo desde el menú principal</p>
        </div>
      </SettingCard>
    );
  }

  return (
    <div className="space-y-5">
      {/* ═══ Selector de Vehículo ═══ */}
      <SettingCard>
        <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider mb-3">
          Selecciona un vehículo
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {vehicles.map(v => {
            const VIcon = getVehicleIcon(v.name);
            const isActive = selectedId === v.id;
            const isOnline = v.status === 'online';
            return (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={`
                  relative flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl
                  transition-all duration-200 border
                  ${isActive
                    ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 shadow-sm'
                    : 'border-neutral-200 dark:border-white/[0.06] hover:bg-neutral-50 dark:hover:bg-white/[0.03]'
                  }
                `}
              >
                {/* Indicador online/offline */}
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                
                <div className={`p-2.5 rounded-xl ${isActive ? 'bg-amber-500/20' : 'bg-neutral-100 dark:bg-white/[0.06]'}`}>
                  <VIcon className={`w-5 h-5 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-500 dark:text-neutral-400'}`} />
                </div>
                <span className={`text-xs font-bold truncate w-full text-center ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {v.name}
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-600 truncate w-full text-center">
                  {v.uniqueId || 'Sin ID'}
                </span>
              </button>
            );
          })}
        </div>
      </SettingCard>

      {selectedVehicle && (
        <>
          {/* ═══ Intervalo de Reporte ═══ */}
          <SettingCard title={`Configuración GPS — ${selectedVehicle.name}`} icon={Radio}>
            <div className="space-y-4 mt-1">
              <div>
                <p className={labelClass}>Intervalo de Reporte</p>
                <div className="space-y-2">
                  {intervalOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => updateConfig('reportInterval', opt.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                        transition-all duration-200 border
                        ${currentConfig.reportInterval === opt.id
                          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20'
                          : 'border-neutral-200 dark:border-white/[0.06] hover:bg-neutral-50 dark:hover:bg-white/[0.03]'
                        }
                      `}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${currentConfig.reportInterval === opt.id ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-500">{opt.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        currentConfig.reportInterval === opt.id
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}>
                        {currentConfig.reportInterval === opt.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SettingCard>

          {/* ═══ Precisión GPS ═══ */}
          <SettingCard title="Precisión GPS" icon={Target}>
            <div className="mt-1">
              <p className={labelClass}>Mínima precisión aceptable</p>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-neutral-400 w-6">5m</span>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={currentConfig.minAccuracy}
                  onChange={(e) => updateConfig('minAccuracy', Number(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none bg-neutral-200 dark:bg-white/[0.08] accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] font-bold text-neutral-400 w-8">50m</span>
              </div>
              <p className="text-center text-sm font-bold text-amber-600 dark:text-amber-400 mt-2">
                {currentConfig.minAccuracy} metros
              </p>
            </div>
          </SettingCard>

          {/* ═══ Detección de Movimiento ═══ */}
          <SettingCard title="Detección de Movimiento" icon={Move}>
            <div className="space-y-3 mt-1">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Alertar si se mueve sin ignición</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-500">Detecta movimiento sospechoso</p>
                </div>
                <ToggleSwitch
                  enabled={currentConfig.alertMovementNoIgnition}
                  onChange={(v) => updateConfig('alertMovementNoIgnition', v)}
                />
              </div>
              <div className="border-t border-neutral-100 dark:border-white/[0.04]" />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Modo reposo automático</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-500">
                    Tras {currentConfig.autoSleepMinutes} min sin movimiento
                  </p>
                </div>
                <ToggleSwitch
                  enabled={currentConfig.autoSleep}
                  onChange={(v) => updateConfig('autoSleep', v)}
                />
              </div>
            </div>
          </SettingCard>

          {/* ═══ Datos del Dispositivo ═══ */}
          <SettingCard title="Datos del Dispositivo" icon={Cpu}>
            <div className="mt-1 space-y-2.5">
              {[
                { label: 'IMEI', value: selectedVehicle.uniqueId || '—', icon: Cpu },
                { label: 'Firmware', value: 'v2.4.1', extra: '✓ Actualizado', icon: Activity },
                { label: 'Última conexión', value: selectedVehicle.lastUpdate ? new Date(selectedVehicle.lastUpdate).toLocaleString('es-CL') : '—', icon: Wifi },
                { label: 'Batería GPS', value: selectedVehicle.attributes?.batteryLevel ? `${selectedVehicle.attributes.batteryLevel}%` : '—', icon: Battery },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-500">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">{item.value}</span>
                    {item.extra && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{item.extra}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Acciones del dispositivo */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-100 dark:border-white/[0.04]">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                <Target className="w-3.5 h-3.5" /> Calibrar GPS
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                <RefreshCw className="w-3.5 h-3.5" /> Reiniciar Disp.
              </button>
            </div>
          </SettingCard>

          {/* ═══ Botón Guardar ═══ */}
          <div className="flex items-center justify-between pt-2">
            <SaveIndicator status={saveStatus} />
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 shadow-lg shadow-amber-500/20 disabled:opacity-60 transition-all"
            >
              {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar cambios
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Estilo de labels compartido
const labelClass = 'block text-[11px] font-semibold mb-2 uppercase tracking-wider text-neutral-500 dark:text-neutral-400';

export default VehicleSettings;
