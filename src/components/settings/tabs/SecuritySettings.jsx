// src/components/settings/tabs/SecuritySettings.jsx
// Seguridad: 2FA, sesiones activas, logs de acceso, cambio de contraseña
import React, { useState } from 'react';
import {
  Shield, Smartphone, Monitor, Key, Lock, Unlock,
  Eye, EyeOff, LogOut, Clock, AlertTriangle, Trash2,
  Download, Save, Loader2, MapPin, X
} from 'lucide-react';
import SettingCard from '../shared/SettingCard';
import ToggleSwitch from '../shared/ToggleSwitch';
import PremiumBadge from '../shared/PremiumBadge';
import SaveIndicator from '../shared/SaveIndicator';

const SecuritySettings = ({ user, onNotify, userPlan = 'pro' }) => {
  const [saveStatus, setSaveStatus] = useState('idle');
  const isPremium = userPlan === 'premium';
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  // Mock: sesiones activas
  const [sessions] = useState([
    {
      id: 1,
      device: 'Chrome — Windows',
      icon: Monitor,
      location: 'Santiago, Chile',
      lastActive: 'Activa ahora',
      isCurrent: true,
    },
    {
      id: 2,
      device: 'iPhone 13 — iOS',
      icon: Smartphone,
      location: 'Santiago, Chile',
      lastActive: 'Hace 2 horas',
      isCurrent: false,
    },
  ]);

  // Mock: logs de actividad
  const activityLogs = [
    { action: 'Inicio de sesión', date: 'Hoy 14:23', type: 'login' },
    { action: 'Config. modificada', date: 'Ayer 18:45', type: 'config' },
    { action: 'Geovalla creada', date: '12 Mar 09:12', type: 'geofence' },
    { action: 'Comando enviado', date: '10 Mar 22:34', type: 'command' },
    { action: 'Contraseña cambiada', date: '05 Mar 11:20', type: 'security' },
  ];

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new) return;
    if (passwords.new !== passwords.confirm) {
      onNotify?.({ tipo: 'sistema', mensaje: '⚠️ Las contraseñas no coinciden', esAlerta: true });
      return;
    }
    if (passwords.new.length < 8) {
      onNotify?.({ tipo: 'sistema', mensaje: '⚠️ La contraseña debe tener al menos 8 caracteres', esAlerta: true });
      return;
    }

    setSaveStatus('saving');
    try {
      // TODO: PUT /api/users/{id} con nueva contraseña
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      setPasswords({ current: '', new: '', confirm: '' });
      onNotify?.({
        tipo: 'perfil',
        mensaje: '🔑 Contraseña actualizada correctamente',
      });
    } catch {
      setSaveStatus('error');
    }
  };

  const handleCloseSession = (sessionId) => {
    onNotify?.({
      tipo: 'sistema',
      mensaje: '🔒 Sesión cerrada correctamente',
    });
  };

  const handleCloseAllSessions = () => {
    onNotify?.({
      tipo: 'sistema',
      mensaje: '🔒 Todas las sesiones cerradas (excepto la actual)',
    });
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none border bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-amber-500/50';
  const labelClass = 'block text-[11px] font-semibold mb-1.5 uppercase tracking-wider text-neutral-500 dark:text-neutral-400';

  return (
    <div className="space-y-5">
      {/* ═══ Autenticación de Dos Factores ═══ */}
      <SettingCard 
        title="Autenticación de Dos Factores" 
        icon={Shield}
        badge="Recomendado"
        action={
          <ToggleSwitch
            enabled={twoFactorEnabled}
            onChange={(v) => {
              setTwoFactorEnabled(v);
              onNotify?.({
                tipo: 'sistema',
                mensaje: v ? '🛡️ 2FA activado' : '⚠️ 2FA desactivado',
              });
            }}
          />
        }
      >
        <div className="mt-2">
          {!twoFactorEnabled ? (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Protege tu cuenta</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-500 mt-0.5">
                  Activa la verificación en dos pasos para mayor seguridad
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                Métodos disponibles
              </p>
              {[
                { label: 'App Autenticador', desc: 'Google/Microsoft Authenticator', recommended: true },
                { label: 'SMS', desc: `Al +56 9 ****${user?.phone?.slice(-4) || '5678'}`, recommended: false },
              ].map((method, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{method.label}</p>
                      {method.recommended && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-500">{method.desc}</p>
                  </div>
                  <button className="px-3 py-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg hover:bg-amber-500/20 transition-colors border border-amber-500/20">
                    Configurar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SettingCard>

      {/* ═══ Sesiones Activas ═══ */}
      <SettingCard title="Sesiones Activas" icon={Monitor}>
        <div className="space-y-2 mt-1">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`
                flex items-center justify-between px-4 py-3 rounded-xl border
                ${session.isCurrent
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-neutral-200 dark:border-white/[0.06]'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${session.isCurrent ? 'bg-emerald-500/10' : 'bg-neutral-100 dark:bg-white/[0.06]'}`}>
                  <session.icon className={`w-4 h-4 ${session.isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{session.device}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-neutral-400" />
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-500">{session.location}</span>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-600">·</span>
                    <span className={`text-[11px] font-medium ${session.isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'}`}>
                      {session.lastActive}
                    </span>
                  </div>
                </div>
              </div>
              {session.isCurrent ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Esta sesión
                </span>
              ) : (
                <button
                  onClick={() => handleCloseSession(session.id)}
                  className="px-3 py-1.5 text-[11px] font-semibold text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                  Cerrar
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={handleCloseAllSessions}
          className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-500 border border-red-500/20 hover:bg-red-500/5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Cerrar todas las sesiones
        </button>
      </SettingCard>

      {/* ═══ Registro de Actividad ═══ */}
      <SettingCard title="Registro de Actividad" icon={Clock} badge="Últimos 5">
        <div className="space-y-0 mt-1">
          {activityLogs.map((log, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-neutral-50 dark:border-white/[0.03] last:border-b-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{log.action}</span>
              </div>
              <span className="text-[11px] text-neutral-400 dark:text-neutral-600">{log.date}</span>
            </div>
          ))}
        </div>
        <button className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors">
          Ver historial completo
          {!isPremium && <PremiumBadge plan="premium" locked size="sm" />}
        </button>
      </SettingCard>

      {/* ═══ Cambiar Contraseña ═══ */}
      <SettingCard title="Cambiar Contraseña" icon={Key}>
        <div className="space-y-3 mt-1">
          <div>
            <label className={labelClass}>Contraseña actual</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                className={`${inputClass} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Nueva contraseña</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                className={`${inputClass} pr-10`}
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Confirmar nueva contraseña</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
              className={inputClass}
              placeholder="Repite la contraseña"
            />
          </div>
          <div className="flex items-center justify-end pt-1">
            <SaveIndicator status={saveStatus} />
            <button
              onClick={handleChangePassword}
              disabled={!passwords.current || !passwords.new || saveStatus === 'saving'}
              className="ml-3 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 shadow-lg shadow-amber-500/20 disabled:opacity-60 transition-all"
            >
              {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Actualizar contraseña
            </button>
          </div>
        </div>
      </SettingCard>

      {/* ═══ Zona de Peligro ═══ */}
      <SettingCard className="border-red-500/20">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <p className="text-sm font-bold text-red-500">Zona de Peligro</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/[0.08] hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors">
            <Download className="w-3.5 h-3.5" /> Descargar mis datos
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-500 border border-red-500/20 hover:bg-red-500/5 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar cuenta
          </button>
        </div>
      </SettingCard>
    </div>
  );
};

export default SecuritySettings;
