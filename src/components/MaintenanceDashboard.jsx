// src/components/MaintenanceDashboard.jsx
// Dashboard completo de Salud y Mantenimiento vehicular.
// Incluye: Health Score, Timeline de servicios, Historial, Costos (Pro), Documentos, Upsell.

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplet, Filter, Wind, Disc, Circle, Battery, Thermometer, Settings,
  Zap, Compass, RotateCw, FileCheck, Shield, FileText, Wrench,
  ChevronDown, ChevronRight, Plus, Clock, AlertTriangle, CheckCircle2,
  Calendar, Edit3, Trash2, MoreHorizontal, X, Lock, Sparkles,
  TrendingUp, TrendingDown, DollarSign, BarChart3, Eye, Upload,
  Star, ArrowRight, Info, Award, Target, Activity,
} from 'lucide-react';
import { useMaintenance, MAINTENANCE_CATEGORIES, ESTIMATED_COSTS } from '../hooks/useMaintenance';

// ═══════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════

const ICON_MAP = {
  Droplet, Filter, Wind, Disc, Circle, Battery, Thermometer, Settings,
  Zap, Compass, RotateCw, FileCheck, Shield, FileText, Wrench,
};

const STATUS_CONFIG = {
  ok:       { label: 'Bien',      color: 'emerald', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10', borderClass: 'border-l-emerald-500', textClass: 'text-emerald-600 dark:text-emerald-400', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  warning:  { label: 'Próximo',   color: 'amber',   bgClass: 'bg-amber-50 dark:bg-amber-500/10',     borderClass: 'border-l-amber-500',   textClass: 'text-amber-600 dark:text-amber-400',     badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
  critical: { label: 'Urgente',   color: 'red',     bgClass: 'bg-red-50 dark:bg-red-500/10',         borderClass: 'border-l-red-500',     textClass: 'text-red-600 dark:text-red-400',         badgeClass: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
  overdue:  { label: 'Vencido',   color: 'red',     bgClass: 'bg-red-50 dark:bg-red-500/10',         borderClass: 'border-l-red-600',     textClass: 'text-red-700 dark:text-red-400',         badgeClass: 'bg-red-200 text-red-800 dark:bg-red-500/30 dark:text-red-300' },
};

// Formato moneda CLP
function formatCLP(amount) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
}

// Formato km
function formatKm(km) {
  if (km == null) return '—';
  return `${Math.round(km).toLocaleString('es-CL')} km`;
}

// Formato fecha corta
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffD === 0) return 'Hoy';
  if (diffD === 1) return 'Ayer';
  if (diffD < 30) return `Hace ${diffD} días`;
  const months = Math.floor(diffD / 30);
  return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
}

// ═══════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════

// ─── Progress Bar con colores dinámicos ───
const ProgressBar = ({ percentage, status }) => {
  const clamp = Math.min(percentage, 100);
  const colorMap = {
    ok: 'from-emerald-400 to-emerald-500',
    warning: 'from-amber-400 to-amber-500',
    critical: 'from-red-400 to-red-500',
    overdue: 'from-red-500 to-red-700',
  };
  const gradient = colorMap[status] || colorMap.ok;
  const bgColor = status === 'overdue' || status === 'critical'
    ? 'bg-red-100 dark:bg-red-500/10'
    : 'bg-neutral-200/60 dark:bg-white/[0.06]';

  return (
    <div className={`w-full h-2 rounded-full ${bgColor} overflow-hidden`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamp}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full bg-gradient-to-r ${gradient} ${status === 'overdue' ? 'animate-pulse' : ''}`}
      />
    </div>
  );
};

// ─── Health Score Circle (SVG animado) ───
const HealthScoreCircle = ({ score }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 80) return { stroke: '#10B981', text: 'text-emerald-600 dark:text-emerald-400', label: 'Excelente', bg: 'from-emerald-50 to-green-50 dark:from-emerald-500/5 dark:to-green-500/5' };
    if (s >= 60) return { stroke: '#F59E0B', text: 'text-amber-600 dark:text-amber-400', label: 'Bueno', bg: 'from-amber-50 to-yellow-50 dark:from-amber-500/5 dark:to-yellow-500/5' };
    if (s >= 40) return { stroke: '#F97316', text: 'text-orange-600 dark:text-orange-400', label: 'Regular', bg: 'from-orange-50 to-red-50 dark:from-orange-500/5 dark:to-red-500/5' };
    return { stroke: '#EF4444', text: 'text-red-600 dark:text-red-400', label: 'Necesita atención', bg: 'from-red-50 to-rose-50 dark:from-red-500/5 dark:to-rose-500/5' };
  };

  const config = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-neutral-200 dark:text-white/[0.06]" />
          <motion.circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke={config.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-4xl font-black ${config.text}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">/100</span>
        </div>
      </div>
      <span className={`text-sm font-bold mt-2 ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
};

// ─── Metric Card (Resumen rápido) ───
const MetricCard = ({ icon: Icon, label, value, subtitle, status, progress, proLocked, onUpgrade }) => {
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  if (proLocked) {
    return (
      <div className="relative rounded-2xl p-4 bg-white dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
        <div className="filter blur-[2px] opacity-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/[0.04]">
              <Icon className="w-4 h-4 text-neutral-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</span>
          </div>
          <p className="text-lg font-bold text-neutral-300">—</p>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-black/40 backdrop-blur-[1px]">
          <Lock className="w-5 h-5 text-purple-500 mb-1" />
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">PRO</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-4 bg-white dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06] hover:shadow-md transition-all group ${statusConfig && status !== 'ok' ? statusConfig.bgClass : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${statusConfig ? statusConfig.bgClass : 'bg-neutral-100 dark:bg-white/[0.04]'}`}>
            <Icon className={`w-4 h-4 ${statusConfig ? statusConfig.textClass : 'text-neutral-500 dark:text-neutral-400'}`} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{label}</span>
        </div>
        {status && (
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${STATUS_CONFIG[status]?.badgeClass || ''}`}>
            {STATUS_CONFIG[status]?.label}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-neutral-900 dark:text-white leading-tight mt-1">{value}</p>
      {subtitle && <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>}
      {progress != null && (
        <div className="mt-2">
          <ProgressBar percentage={progress} status={status || 'ok'} />
        </div>
      )}
    </div>
  );
};

// ─── Service Card (Expandible) ───
const ServiceCard = ({ service, isExpanded, onToggle, onComplete, onEdit, onRemove, isPro }) => {
  const cat = MAINTENANCE_CATEGORIES[service.category] || MAINTENANCE_CATEGORIES.other;
  const statusConfig = STATUS_CONFIG[service.status] || STATUS_CONFIG.ok;
  const IconComponent = ICON_MAP[cat.icon] || Wrench;

  return (
    <motion.div layout className={`border-l-[3px] ${statusConfig.borderClass} rounded-2xl bg-white dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden transition-shadow duration-300 hover:shadow-md dark:hover:shadow-black/20 ${service.status === 'overdue' ? 'ring-1 ring-red-200 dark:ring-red-500/20' : ''}`}>
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3.5 cursor-pointer" onClick={() => onToggle(service.id)}>
        <div className={`p-2 rounded-xl ${statusConfig.bgClass} shrink-0 mt-0.5`}>
          <IconComponent className={`w-4 h-4 ${statusConfig.textClass}`} strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{cat.label}</span>
          </div>
          <p className="text-sm font-bold text-neutral-900 dark:text-white leading-snug mt-1">{service.title}</p>
          {service.description && (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">{service.description}</p>
          )}

          {/* Info chips */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {service.kmLeft != null && (
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${service.kmLeft <= 0 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.04] dark:text-neutral-400'}`}>
                <TrendingUp className="w-3 h-3" />
                {service.kmLeft <= 0 ? `Excedido ${formatKm(Math.abs(service.kmLeft))}` : formatKm(service.kmLeft)}
              </span>
            )}
            {service.daysLeft != null && (
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${service.daysLeft <= 0 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : service.daysLeft <= 30 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.04] dark:text-neutral-400'}`}>
                <Clock className="w-3 h-3" />
                {service.daysLeft <= 0 ? `Vencido hace ${Math.abs(service.daysLeft)}d` : `${service.daysLeft} días`}
              </span>
            )}
            {service.estimatedCost && (
              <span className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                <DollarSign className="w-3 h-3" />
                {formatCLP(service.estimatedCost.min)} - {formatCLP(service.estimatedCost.max)}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1">
              <ProgressBar percentage={service.wear} status={service.status} />
            </div>
            <span className={`text-[11px] font-bold min-w-[36px] text-right ${statusConfig.textClass}`}>
              {Math.round(service.wear)}%
            </span>
          </div>
        </div>

        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 mt-1">
          <ChevronDown className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
        </motion.div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-neutral-100 dark:border-white/[0.04]">
              {/* Último servicio */}
              {service.lastServiceDate && (
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/[0.04]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">Último servicio</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {formatDate(service.lastServiceDate)}
                    </span>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
                      {service.lastServiceKm && <span>{formatKm(service.lastServiceKm)}</span>}
                      {service.lastServiceCost && <span className="font-semibold">{formatCLP(service.lastServiceCost)}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              {service.notes && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Nota</p>
                  <p className="text-[12px] text-blue-700 dark:text-blue-300">{service.notes}</p>
                </div>
              )}

              {/* Documentos (Pro) */}
              {!isPro && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/10">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300">Gestión de documentos</p>
                      <p className="text-[10px] text-purple-500 dark:text-purple-400">Sube facturas y certificados con Pro</p>
                    </div>
                  </div>
                </div>
              )}

              {isPro && (
                <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-neutral-300 dark:border-white/10 text-[11px] font-semibold text-neutral-500 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Subir documento
                </button>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onComplete(service); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[11px] font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Marcar realizado
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(service); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400 text-[11px] font-bold hover:bg-neutral-200 dark:hover:bg-white/[0.08] transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(service.id); }}
                  className="flex items-center justify-center p-2.5 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── History Item ───
const HistoryItem = ({ record }) => {
  const cat = MAINTENANCE_CATEGORIES[record.category] || MAINTENANCE_CATEGORIES.other;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-neutral-100 dark:border-white/[0.04] last:border-0">
      <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/[0.04]">
        <span className="text-sm">{cat.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{record.title}</p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{formatDate(record.performedAt)}</span>
          {record.performedAtKm && <span className="text-[10px] text-neutral-400">• {formatKm(record.performedAtKm)}</span>}
          {record.performedBy && <span className="text-[10px] text-neutral-400">• {record.performedBy}</span>}
        </div>
        {record.notes && <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{record.notes}</p>}
      </div>
      {record.cost > 0 && (
        <span className="text-sm font-bold text-neutral-900 dark:text-white shrink-0">{formatCLP(record.cost)}</span>
      )}
    </div>
  );
};

// ─── Cost Chart (SVG simple) ───
const CostChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.amount), 1);
  const h = 120;
  const barWidth = 32;
  const gap = 12;
  const totalW = data.length * (barWidth + gap);

  return (
    <svg viewBox={`0 0 ${totalW} ${h + 25}`} className="w-full" style={{ maxHeight: 160 }}>
      {data.map((d, i) => {
        const barH = (d.amount / max) * h;
        const x = i * (barWidth + gap);
        return (
          <g key={i}>
            <rect x={x} y={h - barH} width={barWidth} height={barH} rx="6" className="fill-amber-400/80 dark:fill-amber-500/40" />
            <text x={x + barWidth / 2} y={h + 16} textAnchor="middle" className="fill-neutral-400 dark:fill-neutral-500 text-[9px] font-semibold">
              {d.month}
            </text>
            {d.amount > 0 && (
              <text x={x + barWidth / 2} y={h - barH - 5} textAnchor="middle" className="fill-neutral-500 dark:fill-neutral-400 text-[8px] font-bold">
                {Math.round(d.amount / 1000)}k
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ─── Pro Upsell Card ───
const ProUpsellCard = ({ onUpgrade }) => (
  <div className="rounded-2xl overflow-hidden">
    <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 p-6 text-white relative">
      <div className="absolute top-3 right-3 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-yellow-300" />
          <span className="text-sm font-bold uppercase tracking-wider">Trackeo Pro</span>
        </div>
        <h3 className="text-lg font-bold mb-3">Desbloquea todo el potencial</h3>
        <ul className="space-y-2 text-sm mb-5">
          {[
            'Predicción IA de mantenimientos',
            'Análisis de costos con proyecciones',
            'Documentos y facturas ilimitados',
            'Historial completo sin límites',
            'Hasta 10 vehículos',
          ].map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-300 shrink-0" />
              <span className="text-white/90">{f}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={onUpgrade}
          className="w-full py-3 rounded-xl bg-white text-purple-600 font-bold text-sm hover:bg-neutral-100 transition-colors shadow-lg"
        >
          Probar 14 días gratis
        </button>
        <p className="text-xs text-center mt-2 text-white/60">$9.990/mes • Cancela cuando quieras</p>
      </div>
    </div>
  </div>
);

// ─── Add / Edit Maintenance Modal ───
const AddMaintenanceModal = ({ isOpen, onClose, onSave, editingService = null }) => {
  const isEditing = !!editingService;
  const [form, setForm] = useState(() => {
    if (editingService) {
      return {
        category: editingService.category || 'other',
        title: editingService.title || '',
        description: editingService.description || '',
        intervalKm: editingService.intervalKm || '',
        intervalMonths: editingService.intervalMonths || '',
        lastServiceDate: editingService.lastServiceDate ? new Date(editingService.lastServiceDate).toISOString().split('T')[0] : '',
        lastServiceKm: editingService.lastServiceKm || '',
        estimatedCostMin: editingService.estimatedCost?.min || '',
        estimatedCostMax: editingService.estimatedCost?.max || '',
        priority: editingService.priority || 'medium',
        notes: editingService.notes || '',
        reminder: editingService.reminder !== false,
      };
    }
    return {
      category: 'oil',
      title: '',
      description: '',
      intervalKm: '',
      intervalMonths: '',
      lastServiceDate: '',
      lastServiceKm: '',
      estimatedCostMin: '',
      estimatedCostMax: '',
      priority: 'medium',
      notes: '',
      reminder: true,
    };
  });

  // Auto-fill al cambiar categoría
  const handleCategoryChange = (cat) => {
    const config = MAINTENANCE_CATEGORIES[cat];
    const costs = ESTIMATED_COSTS[cat];
    setForm(prev => ({
      ...prev,
      category: cat,
      title: prev.title || config?.label || '',
      intervalKm: config?.defaultKm || '',
      intervalMonths: config?.defaultMonths || '',
      estimatedCostMin: costs?.min || '',
      estimatedCostMax: costs?.max || '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const serviceData = {
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      intervalKm: form.intervalKm ? Number(form.intervalKm) : null,
      intervalMonths: form.intervalMonths ? Number(form.intervalMonths) : null,
      lastServiceDate: form.lastServiceDate || null,
      lastServiceKm: form.lastServiceKm ? Number(form.lastServiceKm) : null,
      estimatedCost: (form.estimatedCostMin || form.estimatedCostMax)
        ? { min: Number(form.estimatedCostMin) || 0, max: Number(form.estimatedCostMax) || 0 }
        : null,
      priority: form.priority,
      notes: form.notes.trim(),
      reminder: form.reminder,
    };

    onSave(serviceData, editingService?.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-neutral-200 dark:border-white/[0.08]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-[#1a1a1a] px-6 py-4 border-b border-neutral-100 dark:border-white/[0.06] flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {isEditing ? 'Editar servicio' : 'Agregar mantenimiento'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.04] transition-colors">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Tipo de servicio</label>
            <select
              value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
            >
              {Object.entries(MAINTENANCE_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>{cat.emoji} {cat.label}</option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Cambio aceite 10W-40"
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-400"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Descripción (opcional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalles adicionales..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-400 resize-none"
            />
          </div>

          {/* Intervalos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Intervalo (km)</label>
              <input
                type="number"
                value={form.intervalKm}
                onChange={(e) => setForm(prev => ({ ...prev, intervalKm: e.target.value }))}
                placeholder="5000"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Intervalo (meses)</label>
              <input
                type="number"
                value={form.intervalMonths}
                onChange={(e) => setForm(prev => ({ ...prev, intervalMonths: e.target.value }))}
                placeholder="6"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Último servicio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Último servicio (fecha)</label>
              <input
                type="date"
                value={form.lastServiceDate}
                onChange={(e) => setForm(prev => ({ ...prev, lastServiceDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Último servicio (km)</label>
              <input
                type="number"
                value={form.lastServiceKm}
                onChange={(e) => setForm(prev => ({ ...prev, lastServiceKm: e.target.value }))}
                placeholder="40000"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Costo estimado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Costo mín. ($)</label>
              <input
                type="number"
                value={form.estimatedCostMin}
                onChange={(e) => setForm(prev => ({ ...prev, estimatedCostMin: e.target.value }))}
                placeholder="25000"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Costo máx. ($)</label>
              <input
                type="number"
                value={form.estimatedCostMax}
                onChange={(e) => setForm(prev => ({ ...prev, estimatedCostMax: e.target.value }))}
                placeholder="45000"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Prioridad</label>
            <div className="flex gap-2">
              {[
                { id: 'low', label: 'Baja', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' },
                { id: 'medium', label: 'Media', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' },
                { id: 'high', label: 'Alta', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' },
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, priority: p.id }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${form.priority === p.id ? p.color + ' shadow-sm' : 'bg-neutral-50 dark:bg-white/[0.02] text-neutral-400 border-neutral-200 dark:border-white/[0.06]'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Notas (opcional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Taller preferido, tipo de repuesto..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-400 resize-none"
            />
          </div>

          {/* Recordatorio */}
          <label className="flex items-center gap-3 py-2 cursor-pointer">
            <div className={`w-10 h-6 rounded-full transition-colors relative ${form.reminder ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.reminder ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Activar recordatorio</span>
          </label>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-neutral-100 dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400 font-bold text-sm hover:bg-neutral-200 dark:hover:bg-white/[0.08] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-amber-500/25 transition-all">
              {isEditing ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Complete Service Modal ───
const CompleteServiceModal = ({ isOpen, onClose, service, onConfirm, currentKm }) => {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    km: currentKm ? Math.round(currentKm) : '',
    cost: '',
    workshop: '',
    notes: '',
  });

  if (!isOpen || !service) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(service.id, {
      date: form.date,
      km: Number(form.km) || currentKm,
      cost: Number(form.cost) || 0,
      workshop: form.workshop,
      notes: form.notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-neutral-200 dark:border-white/[0.08]"
      >
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/[0.06]">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Registrar servicio realizado</h2>
          <p className="text-xs text-neutral-500 mt-0.5">{service.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Fecha</label>
              <input type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Kilometraje</label>
              <input type="number" value={form.km} onChange={(e) => setForm(p => ({ ...p, km: e.target.value }))} placeholder={currentKm ? Math.round(currentKm).toString() : ''} className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 placeholder:text-neutral-400" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Costo ($)</label>
            <input type="number" value={form.cost} onChange={(e) => setForm(p => ({ ...p, cost: e.target.value }))} placeholder={service.estimatedCost ? `${service.estimatedCost.min} - ${service.estimatedCost.max}` : '0'} className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 placeholder:text-neutral-400" />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Taller / Mecánico</label>
            <input type="text" value={form.workshop} onChange={(e) => setForm(p => ({ ...p, workshop: e.target.value }))} placeholder="Ej: Taller AutoPro" className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 placeholder:text-neutral-400" />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Observaciones</label>
            <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Detalles del servicio..." className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500 placeholder:text-neutral-400 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-neutral-100 dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400 font-bold text-sm">Cancelar</button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all">Registrar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════

const MaintenanceDashboard = ({ activeVehicle, isDark }) => {
  const currentKm = activeVehicle?.attributes?.totalDistance
    ? activeVehicle.attributes.totalDistance / 1000
    : 45000;

  const {
    services, history, healthScore, stats, monthlyCosts,
    isPro, loading, error, addService, updateService, removeService, completeService, togglePro,
  } = useMaintenance(activeVehicle?.id, currentKm);

  const [expandedId, setExpandedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [completingService, setCompletingService] = useState(null);
  const [activeTab, setActiveTab] = useState('services'); // 'services' | 'history'
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Agrupar servicios por estado
  const groupedServices = useMemo(() => {
    const overdue = services.filter(s => s.status === 'overdue');
    const critical = services.filter(s => s.status === 'critical');
    const warning = services.filter(s => s.status === 'warning');
    const ok = services.filter(s => s.status === 'ok');
    return { overdue, critical, warning, ok };
  }, [services]);

  const handleToggle = useCallback((id) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const handleSave = useCallback((data, editId) => {
    if (editId) {
      updateService(editId, data);
    } else {
      addService(data);
    }
    setEditingService(null);
  }, [addService, updateService]);

  const handleEdit = useCallback((svc) => {
    setEditingService(svc);
    setShowAddModal(true);
  }, []);

  const handleRemove = useCallback((id) => {
    if (window.confirm('¿Eliminar este servicio?')) {
      removeService(id);
    }
  }, [removeService]);

  // Visible history items (free: 3, pro: all)
  const visibleHistory = useMemo(() => {
    if (isPro || showAllHistory) return history;
    return history.slice(0, 3);
  }, [history, isPro, showAllHistory]);

  // Métricas para las 4 cards rápidas
  const quickMetrics = useMemo(() => {
    const nextOil = services.find(s => s.category === 'oil' && s.enabled);
    const nextInspection = services.find(s => s.category === 'inspection' && s.enabled);
    const nextBrakes = services.find(s => s.category === 'brakes' && s.enabled);
    const nextTires = services.find(s => s.category === 'tires' && s.enabled);

    return [
      {
        icon: Droplet,
        label: 'Próx. aceite',
        value: nextOil?.kmLeft != null ? formatKm(Math.max(0, nextOil.kmLeft)) : '—',
        subtitle: nextOil?.daysLeft != null ? `${nextOil.daysLeft > 0 ? nextOil.daysLeft : 0} días` : '',
        status: nextOil?.status || 'ok',
        progress: nextOil?.wear || 0,
      },
      {
        icon: FileCheck,
        label: 'Rev. técnica',
        value: nextInspection?.daysLeft != null
          ? (nextInspection.daysLeft > 0 ? `${nextInspection.daysLeft} días` : 'Vencida')
          : '—',
        subtitle: nextInspection?.lastServiceDate ? `Últ: ${formatDate(nextInspection.lastServiceDate)}` : '',
        status: nextInspection?.status || 'ok',
        progress: nextInspection?.wear || 0,
      },
      {
        icon: Battery,
        label: 'Batería',
        value: activeVehicle?.attributes?.power
          ? `${Number(activeVehicle.attributes.power).toFixed(1)}V`
          : '—',
        subtitle: 'Voltaje actual',
        status: 'ok',
        progress: 0,
        proLocked: !isPro,
      },
      {
        icon: Disc,
        label: 'Frenos',
        value: nextBrakes?.kmLeft != null ? formatKm(Math.max(0, nextBrakes.kmLeft)) : '—',
        subtitle: nextBrakes?.daysLeft != null ? `${nextBrakes.daysLeft > 0 ? nextBrakes.daysLeft : 0} días` : '',
        status: nextBrakes?.status || 'ok',
        progress: nextBrakes?.wear || 0,
      },
    ];
  }, [services, isPro, activeVehicle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-400 dark:text-neutral-500">Cargando mantenimiento…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-center max-w-xs">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Error al cargar registros</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            Salud y Mantenimiento
            {stats.overdue > 0 && (
              <span className="text-xs font-bold text-white bg-red-500 rounded-full px-2.5 py-0.5 animate-pulse">
                {stats.overdue} vencido{stats.overdue > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {activeVehicle?.name || 'Vehículo'} • {formatKm(currentKm)} recorridos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingService(null); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
          {/* Pro toggle (para demo) */}
          <button
            onClick={togglePro}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${isPro ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white border-transparent' : 'bg-white dark:bg-white/[0.04] text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20'}`}
          >
            <Star className="w-3.5 h-3.5" />
            {isPro ? 'PRO activo' : 'Activar Pro'}
          </button>
        </div>
      </div>

      {/* ═══ GRID PRINCIPAL ═══ */}
      <div className="grid grid-cols-12 gap-5">

        {/* ─── COLUMNA PRINCIPAL (8 cols) ─── */}
        <div className="col-span-12 lg:col-span-8 space-y-5">

          {/* Health Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-white/[0.02] dark:to-white/[0.01] border border-neutral-200/80 dark:border-white/[0.06] p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Score circular */}
              <div className="md:col-span-2 flex justify-center">
                <HealthScoreCircle score={healthScore} />
              </div>

              {/* Quick metrics */}
              <div className="md:col-span-3 grid grid-cols-2 gap-3">
                {quickMetrics.map((m, i) => (
                  <MetricCard key={i} {...m} />
                ))}
              </div>
            </div>

            {/* IA Prediction / Upsell */}
            <div className="mt-5">
              {isPro ? (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-300">Predicción IA</p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
                        Basado en tu promedio de uso ({currentKm > 0 ? Math.round(currentKm / 365) : '—'} km/día),
                        necesitarás cambio de aceite en aproximadamente <strong>{services.find(s => s.category === 'oil')?.daysLeft || '—'} días</strong>.
                        Te sugerimos agendar para la primera semana del próximo mes.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/5 dark:to-pink-500/5 border border-purple-200 dark:border-purple-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-bold text-purple-900 dark:text-purple-300">Predicción IA</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400">Anticipa costos y optimiza tu presupuesto</p>
                      </div>
                    </div>
                    <button onClick={togglePro} className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors">
                      Upgrade Pro
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tabs: Servicios | Historial */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-white/[0.03] p-1 rounded-xl border border-neutral-200/60 dark:border-white/[0.06]">
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'services' ? 'bg-white dark:bg-white/[0.06] text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'}`}
            >
              <Activity className="w-3.5 h-3.5" />
              Servicios ({services.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-white/[0.06] text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'}`}
            >
              <Clock className="w-3.5 h-3.5" />
              Historial ({history.length})
            </button>
          </div>

          {/* Services Timeline */}
          <AnimatePresence mode="wait">
            {activeTab === 'services' ? (
              <motion.div
                key="services"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                {/* Vencidos */}
                {groupedServices.overdue.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                        Vencidos ({groupedServices.overdue.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {groupedServices.overdue.map(s => (
                        <ServiceCard key={s.id} service={s} isExpanded={expandedId === s.id} onToggle={handleToggle} onComplete={setCompletingService} onEdit={handleEdit} onRemove={handleRemove} isPro={isPro} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Críticos */}
                {groupedServices.critical.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400">
                        Requiere atención ({groupedServices.critical.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {groupedServices.critical.map(s => (
                        <ServiceCard key={s.id} service={s} isExpanded={expandedId === s.id} onToggle={handleToggle} onComplete={setCompletingService} onEdit={handleEdit} onRemove={handleRemove} isPro={isPro} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Próximos */}
                {groupedServices.warning.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Próximos ({groupedServices.warning.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {groupedServices.warning.map(s => (
                        <ServiceCard key={s.id} service={s} isExpanded={expandedId === s.id} onToggle={handleToggle} onComplete={setCompletingService} onEdit={handleEdit} onRemove={handleRemove} isPro={isPro} />
                      ))}
                    </div>
                  </div>
                )}

                {/* OK */}
                {groupedServices.ok.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        En buen estado ({groupedServices.ok.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {groupedServices.ok.map(s => (
                        <ServiceCard key={s.id} service={s} isExpanded={expandedId === s.id} onToggle={handleToggle} onComplete={setCompletingService} onEdit={handleEdit} onRemove={handleRemove} isPro={isPro} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty */}
                {services.length === 0 && (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                      <Wrench className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-500">Sin servicios programados</p>
                    <p className="text-xs text-neutral-400 mt-1">Agrega tus primeros mantenimientos</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 inline mr-1" />
                      Agregar servicio
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="rounded-2xl bg-white dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06] p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Historial de intervenciones</h3>
                  {!isPro && history.length > 3 && (
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {history.length - 3} más con Pro
                    </span>
                  )}
                </div>

                {visibleHistory.length > 0 ? (
                  <div>
                    {visibleHistory.map(record => (
                      <HistoryItem key={record.id} record={record} />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Clock className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">Sin historial registrado</p>
                  </div>
                )}

                {!isPro && history.length > 3 && !showAllHistory && (
                  <div className="mt-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/10 text-center">
                    <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-2">
                      Historial limitado a 3 registros
                    </p>
                    <button onClick={togglePro} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors">
                      Desbloquear con Pro
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── SIDEBAR DERECHA (4 cols) ─── */}
        <div className="col-span-12 lg:col-span-4 space-y-5">

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06] p-5"
          >
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4">Resumen</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/10">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Vencidos</span>
                </div>
                <span className={`text-sm font-bold ${stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'}`}>
                  {stats.overdue}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/10">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Pendientes</span>
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{stats.pending}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Completados (total)</span>
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{history.length}</span>
              </div>

              <div className="h-px bg-neutral-200/60 dark:bg-white/[0.04]" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/10">
                    <DollarSign className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Total invertido</span>
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{formatCLP(stats.totalSpent)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-500/10">
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Promedio/servicio</span>
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{formatCLP(stats.avgCost)}</span>
              </div>
            </div>
          </motion.div>

          {/* Cost Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Análisis de Costos</h3>
              {isPro && (
                <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20 px-2 py-0.5 rounded-full">PRO</span>
              )}
            </div>

            {isPro ? (
              <>
                <div className="mb-4">
                  <p className="text-[10px] text-neutral-400 mb-0.5">Gasto mensual promedio</p>
                  <p className="text-2xl font-black text-neutral-900 dark:text-white">{formatCLP(stats.monthlyAvg)}</p>
                </div>
                <CostChart data={monthlyCosts} />
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-white/[0.04] flex justify-between text-xs">
                  <span className="text-neutral-500">Proyección anual</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{formatCLP(stats.monthlyAvg * 12)}</span>
                </div>
                <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 dark:text-blue-300">
                      <strong>Tip:</strong> Puedes ahorrar ~15% agendando mantenimientos preventivos antes de su vencimiento.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <Lock className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Análisis detallado</p>
                <p className="text-[11px] text-neutral-400 mb-4">Proyecciones, gráficos y sugerencias de ahorro</p>
                <button onClick={togglePro} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors">
                  Upgrade a Pro
                </button>
              </div>
            )}
          </motion.div>

          {/* Pro Upsell (solo si no es Pro) */}
          {!isPro && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ProUpsellCard onUpgrade={togglePro} />
            </motion.div>
          )}

          {/* IA Recommendations (solo Pro) */}
          {isPro && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 border border-blue-200 dark:border-blue-500/10 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">Recomendaciones IA</h3>
              </div>
              <div className="space-y-3">
                {[
                  { text: 'Agrupa el cambio de aceite con el filtro de aire para ahorrar en mano de obra', icon: '💡' },
                  { text: 'Tu batería tiene 18 meses — considera revisarla en el próximo servicio', icon: '🔋' },
                  { text: 'Basado en tu uso, programa rotación de neumáticos para el próximo mes', icon: '🔄' },
                ].map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/60 dark:bg-white/[0.03]">
                    <span className="text-sm">{rec.icon}</span>
                    <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">{rec.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      <AnimatePresence>
        {showAddModal && (
          <AddMaintenanceModal
            isOpen={showAddModal}
            onClose={() => { setShowAddModal(false); setEditingService(null); }}
            onSave={handleSave}
            editingService={editingService}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {completingService && (
          <CompleteServiceModal
            isOpen={!!completingService}
            onClose={() => setCompletingService(null)}
            service={completingService}
            onConfirm={completeService}
            currentKm={currentKm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MaintenanceDashboard;
