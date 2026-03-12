import React, { useRef, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';

const UserDropdown = ({ user, onEditProfile, onLogout, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-neutral-200/80 dark:border-white/[0.08] shadow-xl shadow-black/10 dark:shadow-black/40 z-50 overflow-hidden"
    >
      {/* Header usuario */}
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
      </div>

      {/* Opciones */}
      <div className="p-1.5">
        <button
          onClick={() => { onEditProfile(); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors"
        >
          <User className="w-4 h-4 text-neutral-400" />
          Editar Perfil
        </button>
        <div className="my-1 h-px bg-neutral-100 dark:bg-white/[0.06]" />
        <button
          onClick={() => { onLogout(); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesion
        </button>
      </div>
    </div>
  );
};

export default UserDropdown;