// src/components/settings/tabs/NotificationSettings.jsx
// Configuración de canales, tipos de alertas y modo no molestar
import React, { useState } from 'react';
import {
  Bell, Mail, MessageSquare, Smartphone, Send, Clock,
  Shield, AlertTriangle, Wrench, BarChart3, Moon,
  Save, Loader2, Volume2
} from 'lucide-react';
import SettingCard from '../shared/SettingCard';
import ToggleSwitch from '../shared/ToggleSwitch';
import PremiumBadge from '../shared/PremiumBadge';
import SaveIndicator from '../shared/SaveIndicator';

const NotificationSettings = ({ onNotify, userPlan = 'pro' }) => {
  const [saveStatus, setSaveStatus] = useState('idle');
  const isPremium = userPlan === 'premium';

  const [channels, setChannels] = useState({
    push: true,
    email: false,
    sms: false,
    whatsapp: false,
  });

  const [alerts, setAlerts] = useState({
    geofenceExit: { enabled: true, priority: 'critical' },
    speedExcess: { enabled: true, priority: 'high' },
    gpsDisconnect: { enabled: true, priority: 'medium' },
    vibration: { enabled: false, priority: 'high' },
    serviceReminder: { enabled: true, priority: 'info' },
    lowBattery: { enabled: true, priority: 'medium' },
    dailySummary: { enabled: false, priority: 'info' },
    weeklyReport: { enabled: false, priority: 'info' },
  });

  const [doNotDisturb, setDoNotDisturb] = useState({
    enabled: false,
    from: '23:00',
    to: '07:00',
  });

  const toggleChannel = (key) => {
    // Pro requiere email, Premium requiere SMS y WhatsApp
    if (key === 'sms' || key === 'whatsapp') {
      if (!isPremium) return;
    }
    setChannels(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAlert = (key) => {
    setAlerts(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSaveStatus('saved');
      onNotify?.({
        tipo: 'sistema',
        mensaje: '✅ Preferencias de notificación guardadas',
      });
    } catch {
      setSaveStatus('error');
    }
  };

  const handleTestNotification = () => {
    onNotify?.({
      tipo: 'sistema',
      mensaje: '🔔 Esta es una notificación de prueba',
    });
  };

  const channelItems = [
    { key: 'push', label: 'Push (App)', desc: 'Instantáneo, sin costo', icon: Smartphone, locked: false, plan: null },
    { key: 'email', label: 'Email', desc: 'Resumen diario', icon: Mail, locked: false, plan: 'pro' },
    { key: 'sms', label: 'SMS', desc: 'Alertas críticas solo', icon: MessageSquare, locked: !isPremium, plan: 'premium' },
    { key: 'whatsapp', label: 'WhatsApp', desc: 'Via API Business', icon: Send, locked: !isPremium, plan: 'premium' },
  ];

  const priorityColors = {
    critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  const priorityLabels = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    info: 'Info',
  };

  const alertSections = [
    {
      title: 'Seguridad',
      icon: Shield,
      items: [
        { key: 'geofenceExit', label: 'Salida de geovalla' },
        { key: 'speedExcess', label: 'Exceso de velocidad' },
        { key: 'gpsDisconnect', label: 'Desconexión GPS (>15min)' },
        { key: 'vibration', label: 'Vibración / impacto' },
      ],
    },
    {
      title: 'Mantenimiento',
      icon: Wrench,
      items: [
        { key: 'serviceReminder', label: 'Recordatorio service' },
        { key: 'lowBattery', label: 'Batería baja (<20%)' },
      ],
    },
    {
      title: 'Uso',
      icon: BarChart3,
      items: [
        { key: 'dailySummary', label: 'Resumen diario de ruta' },
        { key: 'weeklyReport', label: 'Informe semanal' },
      ],
    },
  ];

  const inputClass = 'px-3 py-2 rounded-xl text-sm font-medium transition-all outline-none border bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-amber-500/50';

  return (
    <div className="space-y-5">
      {/* ═══ Canales de Notificación ═══ */}
      <SettingCard title="Canales de Notificación" icon={Bell}>
        <div className="space-y-2 mt-1">
          {channelItems.map(ch => (
            <div
              key={ch.key}
              className={`
                flex items-center justify-between px-4 py-3 rounded-xl border
                transition-all duration-200
                ${ch.locked
                  ? 'border-neutral-100 dark:border-white/[0.04] opacity-60'
                  : 'border-neutral-200/80 dark:border-white/[0.06] hover:border-neutral-300 dark:hover:border-white/[0.1]'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${channels[ch.key] && !ch.locked ? 'bg-amber-500/10' : 'bg-neutral-100 dark:bg-white/[0.06]'}`}>
                  <ch.icon className={`w-4 h-4 ${channels[ch.key] && !ch.locked ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-500 dark:text-neutral-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{ch.label}</p>
                    {ch.plan && <PremiumBadge plan={ch.plan} locked={ch.locked} size="sm" />}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-500">{ch.desc}</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={channels[ch.key]}
                onChange={() => toggleChannel(ch.key)}
                disabled={ch.locked}
              />
            </div>
          ))}
        </div>
      </SettingCard>

      {/* ═══ Tipos de Alertas ═══ */}
      <SettingCard title="Tipos de Alertas" icon={AlertTriangle}>
        <div className="space-y-5 mt-1">
          {alertSections.map(section => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-2.5">
                <section.icon className="w-3.5 h-3.5 text-neutral-400" />
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">
                  {section.title}
                </p>
              </div>
              <div className="space-y-1">
                {section.items.map(item => {
                  const alertData = alerts[item.key];
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-2.5 px-1"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <ToggleSwitch
                          enabled={alertData.enabled}
                          onChange={() => toggleAlert(item.key)}
                          size="sm"
                        />
                        <span className={`text-sm font-medium truncate ${alertData.enabled ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-600'}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityColors[alertData.priority]}`}>
                        {priorityLabels[alertData.priority]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SettingCard>

      {/* ═══ Modo No Molestar ═══ */}
      <SettingCard 
        title="Modo No Molestar" 
        icon={Moon}
        action={
          <ToggleSwitch
            enabled={doNotDisturb.enabled}
            onChange={(v) => setDoNotDisturb(prev => ({ ...prev, enabled: v }))}
          />
        }
      >
        {doNotDisturb.enabled && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Desde
                </label>
                <input
                  type="time"
                  value={doNotDisturb.from}
                  onChange={(e) => setDoNotDisturb(prev => ({ ...prev, from: e.target.value }))}
                  className={inputClass + ' w-full'}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Hasta
                </label>
                <input
                  type="time"
                  value={doNotDisturb.to}
                  onChange={(e) => setDoNotDisturb(prev => ({ ...prev, to: e.target.value }))}
                  className={inputClass + ' w-full'}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Excepto alertas críticas (geovalla, movimiento sospechoso)
              </p>
            </div>
          </div>
        )}
      </SettingCard>

      {/* ═══ Acciones ═══ */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          <button
            onClick={handleTestNotification}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/[0.08] hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" /> Probar notificación
          </button>
        </div>
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

export default NotificationSettings;
