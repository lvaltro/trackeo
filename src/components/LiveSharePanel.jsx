// src/components/LiveSharePanel.jsx
// Panel "Viaje Seguro" — Genera y gestiona links temporales de ubicación en vivo.
// Se muestra cuando activeMenu === 'rutas' en el DashboardLayout.

import { useState, useEffect, useCallback } from 'react';
import { Shield, Link2, Copy, Check, Trash2, Clock, Loader2, ExternalLink, Car } from 'lucide-react';
import { getMyShares, createShare, cancelShare } from '../api/liveShareApi';

// ─── Ícono WhatsApp (SVG inline) ───
const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const DURATION_OPTIONS = [
  { value: 1, label: '1 hora' },
  { value: 2, label: '2 horas' },
  { value: 4, label: '4 horas' },
  { value: 8, label: '8 horas' },
];

/** Formato legible del tiempo restante. */
function formatTimeRemaining(expiresAt) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expirado';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes} min`;
}

const LiveSharePanel = ({ activeVehicle, vehicles = [], userName, isDark }) => {
  const [selectedDuration, setSelectedDuration] = useState(2);
  const [activeShares, setActiveShares] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);
  const [error, setError] = useState(null);
  const [, setTick] = useState(0); // Force re-render for countdown

  // Actualizar countdown cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Cargar shares activos al montar
  const loadShares = useCallback(async () => {
    try {
      const resp = await getMyShares();
      if (resp.ok) {
        const data = await resp.json();
        setActiveShares(data);
      }
    } catch (err) {
      console.error('[LiveShare] Error cargando shares:', err);
    }
  }, []);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  // Generar link
  const handleGenerate = async () => {
    if (!activeVehicle) return;
    setIsGenerating(true);
    setError(null);

    try {
      const resp = await createShare({
        deviceId: activeVehicle.id,
        deviceName: activeVehicle.name,
        duration: selectedDuration,
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Error ${resp.status}`);
      }

      const share = await resp.json();
      setActiveShares((prev) => [share, ...prev]);

      // Auto-copiar al portapapeles
      try {
        await navigator.clipboard.writeText(share.url);
        setCopiedToken(share.token);
        setTimeout(() => setCopiedToken(null), 3000);
      } catch {}
    } catch (err) {
      setError(err.message || 'Error generando link');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar link
  const handleCopy = async (share) => {
    try {
      await navigator.clipboard.writeText(share.url);
      setCopiedToken(share.token);
      setTimeout(() => setCopiedToken(null), 3000);
    } catch {
      setError('No se pudo copiar al portapapeles');
    }
  };

  // Compartir por WhatsApp
  const handleShareWhatsApp = (share) => {
    const message = encodeURIComponent(
      `Sigue mi ubicación en vivo 📍\n${share.url}\n\nCompartido desde Trackeo - Válido por ${share.duration}h`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Cancelar link
  const handleCancel = async (token) => {
    try {
      const resp = await cancelShare(token);
      if (resp.ok) {
        setActiveShares((prev) => prev.filter((s) => s.token !== token));
      }
    } catch (err) {
      console.error('[LiveShare] Error cancelando:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Viaje Seguro</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Comparte tu ubicación en vivo con quien quieras
            </p>
          </div>
        </div>
      </div>

      {/* Card principal */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-5 md:p-6">
        {/* Vehículo actual */}
        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.04]">
          <Car className="w-5 h-5 text-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Vehículo</p>
            <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              {activeVehicle?.name || 'Sin vehículo seleccionado'}
            </p>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${activeVehicle?.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
        </div>

        {/* Duración */}
        <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
          Duración del link
        </label>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedDuration(opt.value)}
              className={`py-2.5 px-2 rounded-xl text-sm font-semibold transition-all ${
                selectedDuration === opt.value
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                  : 'bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/[0.1]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Botón generar */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !activeVehicle}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              Generar Link Seguro
            </>
          )}
        </button>
      </div>

      {/* Links activos */}
      <div>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          Links activos
        </h3>

        {activeShares.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <Link2 className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No tienes links activos. Genera uno para compartir la ubicación de tu vehículo.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeShares.map((share) => {
              const isExpired = Date.now() > new Date(share.expiresAt).getTime();
              if (isExpired) return null;

              return (
                <div
                  key={share.token}
                  className="rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] p-4 transition-all"
                >
                  {/* Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                      <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {share.deviceName}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      Expira en {formatTimeRemaining(share.expiresAt)}
                    </span>
                  </div>

                  {/* URL preview */}
                  <div className="mb-3 p-2 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.04]">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">
                      {share.url}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(share)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/[0.1]"
                    >
                      {copiedToken === share.token ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleShareWhatsApp(share)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1da851] transition-colors"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>

                    <button
                      onClick={() => handleCancel(share.token)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info de seguridad */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 p-4">
        <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
          <strong>Seguridad:</strong> Los links son temporales y expiran automáticamente.
          Solo se comparte la ubicación del vehículo, nunca datos técnicos del dispositivo.
          Puedes cancelar cualquier link activo en cualquier momento.
        </p>
      </div>
    </div>
  );
};

export default LiveSharePanel;
