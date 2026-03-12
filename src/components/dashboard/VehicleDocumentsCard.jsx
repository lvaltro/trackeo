// ═══════════════════════════════════════════════════
// VehicleDocumentsCard — Documentación del vehículo
// Lista de documentos con badges de estado (vencido, por vencer, al día)
// Dual theme (light/dark)
// ═══════════════════════════════════════════════════

import { FileCheck, ChevronRight } from 'lucide-react';

const STATUS_CONFIG = {
  expired: {
    label: 'Vencido',
    classes:
      'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  },
  expiring: {
    label: 'Por Vencer',
    classes:
      'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  },
  ok: {
    label: 'Al día',
    classes:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
};

function getDocumentStatus(expirationDate) {
  const date = expirationDate instanceof Date
    ? expirationDate
    : new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffMs = date - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays < 30) return 'expiring';
  return 'ok';
}

function formatDate(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * VehicleDocumentsCard
 * @param {Object}   props
 * @param {Array}    props.documents - [{ type: string, expirationDate: Date|string }]
 * @param {Function} props.onViewAll  - Callback opcional al pulsar 'Ver todos'
 */
function VehicleDocumentsCard({ documents = [], onViewAll }) {
  return (
    <div
      className="
        rounded-2xl border p-5
        bg-white border-slate-200
        dark:bg-slate-900 dark:border-slate-800
      "
    >
      {/* Título */}
      <div className="flex items-center gap-2 mb-4">
        <FileCheck className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />
        <h3 className="text-slate-700 dark:text-slate-200 font-semibold">
          Documentación del Vehículo
        </h3>
      </div>

      {/* Lista */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {documents.length === 0 ? (
          <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
            No hay documentos registrados
          </p>
        ) : (
          documents.map((doc, i) => {
            const status = getDocumentStatus(doc.expirationDate);
            const config = STATUS_CONFIG[status];
            return (
              <div
                key={doc.type ?? i}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-slate-900 dark:text-white font-medium text-sm">
                    {doc.type}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    {status === 'expired'
                      ? `venció ${formatDate(doc.expirationDate)}`
                      : `vence ${formatDate(doc.expirationDate)}`}
                  </p>
                </div>
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-xs font-medium shrink-0
                    ${config.classes}
                  `}
                >
                  {config.label}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Botón Ver todos */}
      {documents.length > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          className="
            mt-4 flex items-center gap-1 text-sm font-medium
            text-slate-500 hover:text-indigo-600
            dark:text-slate-400 dark:hover:text-indigo-400
            transition-colors duration-200
          "
        >
          Ver todos
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default VehicleDocumentsCard;
