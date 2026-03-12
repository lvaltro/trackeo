import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

const ProfileModal = ({ user, onClose, onNotify }) => {
  const overlayRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    speedUnit: 'kmh',
    defaultMap: 'osm',
  });

  // Escape para cerrar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Click en overlay para cerrar
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // TODO: Conectar con PUT /api/users/{id} via apiClient
  const handleSave = async () => {
    setSaving(true);
    try {
      // await traccarApi.updateUser(user.id, {
      //   name: formData.name,
      //   email: formData.email,
      //   password: formData.newPassword || undefined,
      //   attributes: { speedUnit: formData.speedUnit, defaultMap: formData.defaultMap },
      // });
      console.log('Guardar perfil:', formData);
      onNotify?.({
        tipo: 'perfil',
        mensaje: '✅ Perfil actualizado correctamente',
      });
      onClose();
    } catch (err) {
      console.error('Error guardando perfil:', err);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none border bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-amber-500/50';

  const labelClass =
    'block text-[11px] font-semibold mb-1.5 uppercase tracking-wider text-neutral-500 dark:text-neutral-400';

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#151515] border border-neutral-200/80 dark:border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-white/[0.06]">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Datos personales */}
          <div>
            <label className={labelClass}>Nombre</label>
            <input type="text" value={formData.name} onChange={handleChange('name')} className={inputClass} placeholder="Tu nombre" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={formData.email} onChange={handleChange('email')} className={inputClass} placeholder="tu@email.com" />
          </div>

          {/* Separador */}
          <div className="pt-2 pb-1">
            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">Cambiar contrasena</p>
          </div>
          <div>
            <label className={labelClass}>Contrasena actual</label>
            <input type="password" value={formData.currentPassword} onChange={handleChange('currentPassword')} className={inputClass} placeholder="********" />
          </div>
          <div>
            <label className={labelClass}>Nueva contrasena</label>
            <input type="password" value={formData.newPassword} onChange={handleChange('newPassword')} className={inputClass} placeholder="********" />
          </div>

          {/* Preferencias */}
          <div className="pt-2 pb-1">
            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">Preferencias</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Velocidad</label>
              <select value={formData.speedUnit} onChange={handleChange('speedUnit')} className={inputClass}>
                <option value="kmh">km/h</option>
                <option value="mph">mph</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Mapa</label>
              <select value={formData.defaultMap} onChange={handleChange('defaultMap')} className={inputClass}>
                <option value="osm">OpenStreetMap</option>
                <option value="satellite">Satelite</option>
                <option value="dark">Oscuro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 dark:border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
