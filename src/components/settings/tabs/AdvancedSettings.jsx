// src/components/settings/tabs/AdvancedSettings.jsx
// Configuraciones avanzadas (Premium): API keys, webhooks, exportación, modo dev
import React, { useState } from 'react';
import {
  Settings2, Key, Eye, EyeOff, RefreshCw, Copy, Check,
  Webhook, Plus, Trash2, Play, Save, Loader2,
  Download, FileJson, FileSpreadsheet, MapPin,
  Bug, Hash, Terminal, ToggleLeft, ExternalLink,
  Lock, ArrowUpRight, Sparkles
} from 'lucide-react';
import SettingCard from '../shared/SettingCard';
import ToggleSwitch from '../shared/ToggleSwitch';
import SaveIndicator from '../shared/SaveIndicator';

const AdvancedSettings = ({ onNotify, userPlan = 'pro' }) => {
  const isPremium = userPlan === 'premium';
  const [saveStatus, setSaveStatus] = useState('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // Mock API key
  const apiKey = "mock_key";

  const [webhooks, setWebhooks] = useState([
    {
      id: 1,
      url: 'https://mi-servidor.com/webhook',
      events: ['geofence_exit', 'speed_excess'],
      active: true,
    },
  ]);

  const [devMode, setDevMode] = useState({
    showTechnicalIds: false,
    verboseLogs: false,
    sandboxMode: false,
  });

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey).then(() => {
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 2000);
      onNotify?.({ tipo: 'sistema', mensaje: '📋 API Key copiada al portapapeles' });
    });
  };

  const handleRegenerateKey = () => {
    onNotify?.({
      tipo: 'sistema',
      mensaje: '🔑 API Key regenerada — actualiza tus integraciones',
      esAlerta: true,
    });
  };

  const handleTestWebhook = (id) => {
    onNotify?.({
      tipo: 'sistema',
      mensaje: '🪝 Webhook de prueba enviado correctamente',
    });
  };

  const handleExport = (type) => {
    onNotify?.({
      tipo: 'sistema',
      mensaje: `📥 Exportando ${type}... se descargará en un momento`,
    });
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSaveStatus('saved');
      onNotify?.({ tipo: 'sistema', mensaje: '✅ Configuración avanzada guardada' });
    } catch {
      setSaveStatus('error');
    }
  };

  // ═══ Lock Screen (si no es premium) ═══
  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="relative mb-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <Lock className="w-12 h-12 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
        </div>
        
        <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-2 text-center">
          Función Premium
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm mb-6">
          Actualiza a Premium para acceder a configuraciones avanzadas
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8 w-full max-w-md">
          {[
            'Integraciones API',
            'Webhooks personalizados',
            'Exportación de datos',
            'Modo desarrollador',
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.06]">
              <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{feat}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onNotify?.({ tipo: 'sistema', mensaje: '🚀 Redirigiendo a checkout...' })}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 shadow-lg shadow-amber-500/30 transition-all"
        >
          <ArrowUpRight className="w-4 h-4" /> Ver planes
        </button>
      </div>
    );
  }

  // ═══ Contenido Premium ═══
  const inputClass = 'w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none border bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-amber-500/50';

  const webhookEvents = [
    { id: 'geofence_exit', label: 'Salida de geovalla' },
    { id: 'speed_excess', label: 'Velocidad excedida' },
    { id: 'low_battery', label: 'Batería baja' },
    { id: 'device_offline', label: 'Dispositivo offline' },
    { id: 'movement_no_ignition', label: 'Movimiento sin ignición' },
  ];

  return (
    <div className="space-y-5">
      {/* ═══ API Key ═══ */}
      <SettingCard title="API & Integraciones" icon={Key}>
        <div className="mt-1 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              API Key
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly
                  className={`${inputClass} pr-10 font-mono text-xs`}
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleCopyApiKey}
                className="p-2.5 rounded-xl border border-neutral-200 dark:border-white/[0.08] hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                {apiKeyCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-neutral-400" />}
              </button>
              <button
                onClick={handleRegenerateKey}
                className="p-2.5 rounded-xl border border-orange-500/20 text-orange-500 hover:bg-orange-500/5 transition-colors"
                title="Regenerar API Key"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Ver documentación API
          </button>
        </div>
      </SettingCard>

      {/* ═══ Webhooks ═══ */}
      <SettingCard title="Webhooks" icon={Webhook}>
        <div className="space-y-3 mt-1">
          {webhooks.map((wh) => (
            <div key={wh.id} className="p-4 rounded-xl border border-neutral-200 dark:border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${wh.active ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                  <span className="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300 truncate">
                    {wh.url}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => handleTestWebhook(wh.id)}
                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors"
                    title="Probar webhook"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {wh.events.map(evt => {
                  const eventLabel = webhookEvents.find(e => e.id === evt)?.label || evt;
                  return (
                    <span key={evt} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {eventLabel}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}

          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 border border-dashed border-neutral-300 dark:border-white/[0.1] hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors">
            <Plus className="w-3.5 h-3.5" /> Agregar webhook
          </button>
        </div>
      </SettingCard>

      {/* ═══ Exportación de Datos ═══ */}
      <SettingCard title="Exportación de Datos" icon={Download}>
        <div className="space-y-2 mt-1">
          {[
            { label: 'Historial de rutas', format: 'CSV', icon: FileSpreadsheet, type: 'rutas' },
            { label: 'Alertas', format: 'JSON', icon: FileJson, type: 'alertas' },
            { label: 'Geovallas', format: 'GeoJSON', icon: MapPin, type: 'geovallas' },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => handleExport(item.label)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/[0.06] hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-white/[0.06] group-hover:bg-amber-500/10 transition-colors">
                  <item.icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{item.label}</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-500">Formato {item.format}</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-neutral-400 group-hover:text-amber-500 transition-colors" />
            </button>
          ))}
        </div>
      </SettingCard>

      {/* ═══ Modo Desarrollador ═══ */}
      <SettingCard title="Modo Desarrollador" icon={Bug}>
        <div className="space-y-3 mt-1">
          {[
            { key: 'showTechnicalIds', label: 'Mostrar IDs técnicos en la UI', desc: 'Device IDs, Position IDs, etc.', icon: Hash },
            { key: 'verboseLogs', label: 'Logs detallados en consola', desc: 'Debug info en DevTools', icon: Terminal },
            { key: 'sandboxMode', label: 'Sandbox mode', desc: 'No envía comandos reales al GPS', icon: ToggleLeft },
          ].map((opt) => (
            <div key={opt.key} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <opt.icon className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{opt.label}</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-500">{opt.desc}</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={devMode[opt.key]}
                onChange={(v) => setDevMode(prev => ({ ...prev, [opt.key]: v }))}
              />
            </div>
          ))}
        </div>
      </SettingCard>

      {/* ═══ Guardar ═══ */}
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
    </div>
  );
};

export default AdvancedSettings;
