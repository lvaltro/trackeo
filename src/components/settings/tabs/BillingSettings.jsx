// src/components/settings/tabs/BillingSettings.jsx
// Plan actual, upgrade, historial de pagos, métodos de pago
import React, { useState } from 'react';
import {
  CreditCard, Star, Sparkles, Zap, Check, X, ArrowUpRight,
  Download, ChevronRight, Plus, Trash2, Shield, Clock,
  MessageSquare, Users, FileText, Phone, Infinity, Database
} from 'lucide-react';
import SettingCard from '../shared/SettingCard';

const BillingSettings = ({ userPlan = 'pro', onNotify }) => {
  const [showComparison, setShowComparison] = useState(false);
  const isPremium = userPlan === 'premium';

  // Mock: datos de facturación
  const planData = {
    free: {
      name: 'Free',
      price: 'Gratis',
      priceNum: 0,
      icon: Shield,
      features: ['1 vehículo', 'Historial 30 días', '3 geovallas', 'Alertas push', 'Soporte email'],
    },
    pro: {
      name: 'Pro',
      price: '$9.990/mes',
      priceNum: 9990,
      icon: Star,
      features: ['Hasta 3 vehículos', 'Historial 90 días', 'Geovallas ilimitadas', 'Notificaciones email', 'Reportes PDF'],
    },
    premium: {
      name: 'Premium',
      price: '$19.990/mes',
      priceNum: 19990,
      icon: Sparkles,
      features: ['Vehículos ilimitados', 'Historial sin límite', 'Alertas WhatsApp + SMS', 'API & Webhooks', 'Dashboard multi-usuario', 'Soporte prioritario 24/7', 'Logs de auditoría', 'Modo flota (10+ vehíc.)'],
    },
  };

  const currentPlan = planData[userPlan] || planData.pro;

  const payments = [
    { month: 'Mar 2026', amount: '$9.990', status: 'paid', date: '15 Mar 2026' },
    { month: 'Feb 2026', amount: '$9.990', status: 'paid', date: '15 Feb 2026' },
    { month: 'Ene 2026', amount: '$9.990', status: 'paid', date: '15 Ene 2026' },
  ];

  const comparisonFeatures = [
    { name: 'Vehículos', free: '1', pro: '3', premium: '∞' },
    { name: 'Historial', free: '30 días', pro: '90 días', premium: '∞' },
    { name: 'Geovallas', free: '3', pro: '∞', premium: '∞' },
    { name: 'Alertas', free: 'Push', pro: 'Push + Email', premium: 'Todo' },
    { name: 'API', free: false, pro: false, premium: true },
    { name: 'Reportes', free: false, pro: true, premium: true },
    { name: 'Soporte', free: 'Email', pro: 'Email', premium: '24/7 Tel.' },
  ];

  return (
    <div className="space-y-5">
      {/* ═══ Plan Actual ═══ */}
      <SettingCard noPadding>
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <currentPlan.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-neutral-900 dark:text-white">Plan {currentPlan.name}</h3>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Activo
                  </span>
                </div>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{currentPlan.price}</p>
              </div>
            </div>
          </div>

          {/* Features del plan actual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
            {currentPlan.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Próxima facturación: 15 Abril 2026</span>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-neutral-100 dark:border-white/[0.04] flex items-center justify-between">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            {showComparison ? 'Ocultar comparación' : 'Ver comparación de planes'}
          </button>
          <button className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
            Gestionar suscripción
          </button>
        </div>
      </SettingCard>

      {/* ═══ Comparación de Planes (condicional) ═══ */}
      {showComparison && (
        <SettingCard>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider pb-3 pr-4">Característica</th>
                  <th className="text-center text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider pb-3 px-2">Free</th>
                  <th className={`text-center text-[10px] font-bold uppercase tracking-wider pb-3 px-2 ${userPlan === 'pro' ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-600'}`}>Pro</th>
                  <th className={`text-center text-[10px] font-bold uppercase tracking-wider pb-3 px-2 ${userPlan === 'premium' ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-600'}`}>Premium</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feat, i) => (
                  <tr key={i} className="border-t border-neutral-50 dark:border-white/[0.03]">
                    <td className="py-2.5 pr-4 text-xs font-medium text-neutral-700 dark:text-neutral-300">{feat.name}</td>
                    {['free', 'pro', 'premium'].map(plan => {
                      const val = feat[plan];
                      return (
                        <td key={plan} className="py-2.5 px-2 text-center">
                          {typeof val === 'boolean' ? (
                            val ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-neutral-300 dark:text-neutral-600 mx-auto" />
                          ) : (
                            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-200 dark:border-white/[0.06]">
                  <td className="py-3 pr-4 text-xs font-bold text-neutral-900 dark:text-white">Precio</td>
                  <td className="py-3 px-2 text-center text-xs font-bold text-neutral-600 dark:text-neutral-400">Gratis</td>
                  <td className="py-3 px-2 text-center text-xs font-bold text-neutral-900 dark:text-white">$9.990</td>
                  <td className="py-3 px-2 text-center text-xs font-bold text-amber-600 dark:text-amber-400">$19.990</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </SettingCard>
      )}

      {/* ═══ Upgrade (si no es premium) ═══ */}
      {!isPremium && (
        <div className="relative rounded-2xl overflow-hidden border border-amber-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-amber-500/5" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-base font-black text-neutral-900 dark:text-white">Upgrade a Premium</h3>
            </div>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mb-3">
              $19.990<span className="text-sm font-medium text-neutral-500">/mes</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {[
                { icon: Infinity, text: 'Vehículos ilimitados' },
                { icon: Database, text: 'Historial sin límite' },
                { icon: MessageSquare, text: 'Alertas WhatsApp + SMS' },
                { icon: Zap, text: 'API & Webhooks' },
                { icon: Users, text: 'Dashboard multi-usuario' },
                { icon: Phone, text: 'Soporte prioritario 24/7' },
                { icon: FileText, text: 'Logs de auditoría' },
                { icon: Shield, text: 'Modo flota (10+ vehíc.)' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{item.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNotify?.({ tipo: 'sistema', mensaje: '🚀 Redirigiendo a checkout...' })}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 shadow-lg shadow-amber-500/30 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              Actualizar a Premium
            </button>
            <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-2 font-medium">
              Primer mes 50% OFF — Cancela cuando quieras
            </p>
          </div>
        </div>
      )}

      {/* ═══ Historial de Pagos ═══ */}
      <SettingCard title="Historial de Pagos" icon={FileText}>
        <div className="space-y-2 mt-1">
          {payments.map((payment, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{payment.month}</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-500">{payment.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">{payment.amount}</p>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Pagado</span>
                </div>
                <button className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-2 text-center text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 py-2 transition-colors">
          Ver todas las facturas
        </button>
      </SettingCard>

      {/* ═══ Método de Pago ═══ */}
      <SettingCard title="Método de Pago" icon={CreditCard}>
        <div className="mt-1">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">•••• •••• •••• 4532</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-500">Visa · Vence 08/27</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="px-3 py-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-white/[0.06] rounded-lg hover:bg-neutral-200 dark:hover:bg-white/[0.1] transition-colors">
                Cambiar
              </button>
              <button className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/5">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 border border-dashed border-neutral-300 dark:border-white/[0.1] hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors">
            <Plus className="w-3.5 h-3.5" /> Agregar método de pago
          </button>
        </div>
      </SettingCard>
    </div>
  );
};

export default BillingSettings;
