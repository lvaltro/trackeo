// ═══════════════════════════════════════════════════
// DocumentsDashboard — Gestión de documentos del vehículo
// Vencimientos, recordatorios y CRUD completo.
// ═══════════════════════════════════════════════════

import { useState } from 'react';
import {
  FileCheck, Plus, Trash2, Edit3, AlertTriangle,
  Clock, CheckCircle, X, Loader2,
} from 'lucide-react';
import { useDocuments, DOCUMENT_TYPES } from '../hooks/useDocuments';

// ─── Helpers ───

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function StatusBadge({ status, daysUntil }) {
  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
        <AlertTriangle className="w-3 h-3" />
        Vencido
      </span>
    );
  }
  if (status === 'expiring') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        <Clock className="w-3 h-3" />
        {daysUntil === 0 ? 'Vence hoy' : `${daysUntil}d`}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
      <CheckCircle className="w-3 h-3" />
      Al día
    </span>
  );
}

// ─── Formulario ───

const EMPTY_FORM = {
  type: 'permiso_circulacion',
  title: '',
  expires_at: '',
  issue_date: '',
  notes: '',
  file_url: '',
};

function DocumentForm({ initial = {}, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })); }

  // Auto-populate title from type if blank
  function handleTypeChange(e) {
    const type = e.target.value;
    const label = DOCUMENT_TYPES.find(t => t.value === type)?.label || '';
    setForm(prev => ({ ...prev, type, title: prev.title || label }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      type: form.type,
      title: form.title.trim(),
      expires_at: form.expires_at,
      issue_date: form.issue_date || null,
      notes: form.notes.trim() || null,
      file_url: form.file_url.trim() || null,
    };
    await onSave(payload);
  }

  const inputCls = "w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tipo *</label>
          <select value={form.type} onChange={handleTypeChange} className={inputCls} required>
            {DOCUMENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Título *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Ej: SOAP 2025"
            className={inputCls}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Fecha de vencimiento *</label>
          <input
            type="date"
            value={form.expires_at}
            onChange={e => set('expires_at', e.target.value)}
            className={inputCls}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Fecha de emisión</label>
          <input
            type="date"
            value={form.issue_date}
            onChange={e => set('issue_date', e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">URL del archivo</label>
          <input
            type="url"
            value={form.file_url}
            onChange={e => set('file_url', e.target.value)}
            placeholder="https://..."
            className={inputCls}
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Notas</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            className={inputCls}
            placeholder="Observaciones adicionales..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          Guardar
        </button>
      </div>
    </form>
  );
}

// ─── Modal ───

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-900 dark:text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Componente principal ───

function DocumentsDashboard({ activeVehicle }) {
  const vehicleId = activeVehicle?.id ?? null;
  const {
    documents, expiredDocs, expiringDocs, okDocs,
    loading, error, refresh,
    addDocument, editDocument, removeDocument,
  } = useDocuments(vehicleId);

  const [modal, setModal] = useState(null); // null | 'add' | { doc }
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // doc | null

  async function handleSave(fields) {
    setSaving(true);
    try {
      if (modal === 'add') {
        await addDocument(fields);
      } else {
        await editDocument(modal.doc.id, fields);
      }
      setModal(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(doc) {
    setSaving(true);
    try {
      await removeDocument(doc.id);
      setDeleteConfirm(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-red-700 dark:text-red-300 font-medium">Error cargando documentos</p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
          <button onClick={refresh} className="mt-2 text-sm text-red-600 underline hover:no-underline">Reintentar</button>
        </div>
      </div>
    );
  }

  const alertCount = expiredDocs.length + expiringDocs.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-slate-900 dark:text-white font-semibold text-lg">Documentos</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
              {alertCount > 0 && (
                <span className="ml-2 text-red-500 font-medium">· {alertCount} requieren atención</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {/* Alertas — vencidos y por vencer */}
      {alertCount > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-4 space-y-2">
          <p className="text-amber-800 dark:text-amber-300 font-medium text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Documentos que requieren atención
          </p>
          {[...expiredDocs, ...expiringDocs].map(doc => (
            <div key={doc.id} className="flex items-center justify-between text-sm">
              <span className="text-amber-700 dark:text-amber-400">{doc.title}</span>
              <StatusBadge status={doc.status} daysUntil={doc.daysUntil} />
            </div>
          ))}
        </div>
      )}

      {/* Lista completa */}
      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
          <FileCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No hay documentos registrados</p>
          <button
            onClick={() => setModal('add')}
            className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">Documento</th>
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">Vencimiento</th>
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{doc.title}</p>
                    {doc.notes && <p className="text-xs text-slate-400 truncate max-w-[200px]">{doc.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{doc.typeLabel}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(doc.expirationDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.status} daysUntil={doc.daysUntil} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setModal({ doc })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Agregar / Editar */}
      {modal && modal !== null && (
        <Modal
          title={modal === 'add' ? 'Agregar documento' : `Editar: ${modal.doc?.title}`}
          onClose={() => setModal(null)}
        >
          <DocumentForm
            initial={modal === 'add' ? {} : {
              type: modal.doc.type,
              title: modal.doc.title,
              expires_at: modal.doc.expirationDate,
              issue_date: modal.doc.issueDate || '',
              notes: modal.doc.notes || '',
              file_url: modal.doc.fileUrl || '',
            }}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}

      {/* Confirmación eliminar */}
      {deleteConfirm && (
        <Modal title="Eliminar documento" onClose={() => setDeleteConfirm(null)}>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            ¿Eliminar <strong>{deleteConfirm.title}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DocumentsDashboard;
