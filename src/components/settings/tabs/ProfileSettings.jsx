// src/components/settings/tabs/ProfileSettings.jsx
// Sección de perfil: foto, datos personales, preferencias de interfaz
import React, { useState, useCallback } from 'react';
import { 
  Camera, User, Mail, Phone, Check, Palette, Globe, 
  Ruler, Save, Loader2, Sun, Moon, Monitor, X
} from 'lucide-react';
import SettingCard from '../shared/SettingCard';
import SaveIndicator from '../shared/SaveIndicator';

const ProfileSettings = ({ user, isDark, onNotify }) => {
  const [saveStatus, setSaveStatus] = useState('idle');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+56 9 ',
    theme: isDark ? 'dark' : 'light',
    language: 'es-CL',
    units: 'km',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value || e.target.checked }));
  };

  const handleThemeChange = (theme) => {
    setFormData(prev => ({ ...prev, theme }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tamaño (2MB) y formato
    if (file.size > 2 * 1024 * 1024) {
      onNotify?.({ tipo: 'perfil', mensaje: '⚠️ La imagen no debe superar 2MB', esAlerta: true });
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onNotify?.({ tipo: 'perfil', mensaje: '⚠️ Solo se aceptan JPG, PNG o WEBP', esAlerta: true });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // TODO: Conectar con API real (PUT /api/users/{id})
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Guardar tema en localStorage
      localStorage.setItem('trackeo-theme', formData.theme);
      
      setSaveStatus('saved');
      onNotify?.({
        tipo: 'perfil',
        mensaje: '✅ Perfil actualizado correctamente',
      });
    } catch (err) {
      setSaveStatus('error');
      onNotify?.({
        tipo: 'perfil',
        mensaje: '❌ Error al guardar el perfil',
        esAlerta: true,
      });
    }
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none border bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-amber-500/50';
  const labelClass = 'block text-[11px] font-semibold mb-1.5 uppercase tracking-wider text-neutral-500 dark:text-neutral-400';

  return (
    <div className="space-y-5">
      {/* ═══ Foto de Perfil ═══ */}
      <SettingCard title="Foto de Perfil" icon={Camera}>
        <div className="flex items-center gap-5 mt-1">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-2xl">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
              <Camera className="w-5 h-5 text-white" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-neutral-900 dark:text-white">{user?.name || 'Usuario'}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">{user?.email || 'email@ejemplo.com'}</p>
            <div className="flex items-center gap-2 mt-2">
              <label className="px-3 py-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg cursor-pointer hover:bg-amber-500/20 transition-colors border border-amber-500/20">
                Cambiar foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              {avatarPreview && (
                <button 
                  onClick={() => setAvatarPreview(null)}
                  className="px-3 py-1.5 text-[11px] font-semibold text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Quitar
                </button>
              )}
            </div>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-1.5">JPG, PNG o WEBP. Max 2MB</p>
          </div>
        </div>
      </SettingCard>

      {/* ═══ Información Personal ═══ */}
      <SettingCard title="Información Personal" icon={User}>
        <div className="space-y-4 mt-1">
          <div>
            <label className={labelClass}>Nombre completo</label>
            <input
              type="text"
              value={formData.name}
              onChange={handleChange('name')}
              className={inputClass}
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                className={`${inputClass} pr-20`}
                placeholder="tu@email.com"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="w-3 h-3" /> Verificado
              </span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Teléfono</label>
            <div className="relative">
              <input
                type="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                className={`${inputClass} pr-20`}
                placeholder="+56 9 1234 5678"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-neutral-400">
                <Phone className="w-3 h-3" /> Opcional
              </span>
            </div>
          </div>
        </div>
      </SettingCard>

      {/* ═══ Preferencias de Interfaz ═══ */}
      <SettingCard title="Preferencias de Interfaz" icon={Palette}>
        <div className="space-y-5 mt-1">
          {/* Tema */}
          <div>
            <label className={labelClass}>Tema</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Claro', icon: Sun },
                { id: 'dark', label: 'Oscuro', icon: Moon },
                { id: 'auto', label: 'Auto', icon: Monitor },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleThemeChange(id)}
                  className={`
                    flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200 border
                    ${formData.theme === id
                      ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/[0.06] hover:bg-neutral-50 dark:hover:bg-white/[0.03]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Idioma */}
          <div>
            <label className={labelClass}>Idioma</label>
            <select
              value={formData.language}
              onChange={handleChange('language')}
              className={inputClass}
            >
              <option value="es-CL">Español (Chile)</option>
              <option value="es-MX">Español (México)</option>
              <option value="es-ES">Español (España)</option>
              <option value="en-US">English (US)</option>
              <option value="pt-BR">Português (Brasil)</option>
            </select>
          </div>

          {/* Unidades */}
          <div>
            <label className={labelClass}>Unidades de medida</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'km', label: 'Kilómetros / km/h' },
                { id: 'mi', label: 'Millas / MPH' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFormData(prev => ({ ...prev, units: id }))}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200 border
                    ${formData.units === id
                      ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/[0.06] hover:bg-neutral-50 dark:hover:bg-white/[0.03]'
                    }
                  `}
                >
                  <Ruler className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
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
          {saveStatus === 'saving' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar cambios
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
