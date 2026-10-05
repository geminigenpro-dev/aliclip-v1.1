import React from 'react';
import {
  CreditCard,
  Smartphone,
  Coins,
  Wallet,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { StoreSettings, PaymentMethod } from '../types';
import { DEFAULT_PAYMENT_METHODS } from '../services/storeService';

interface PaymentMethodsProps {
  settings?: StoreSettings;
  onOpenPaymentInfo: (method: string) => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  settings,
  onOpenPaymentInfo,
}) => {
  const visibleMethods: PaymentMethod[] = (
    settings?.paymentMethods && settings.paymentMethods.length > 0
      ? settings.paymentMethods
      : DEFAULT_PAYMENT_METHODS
  ).filter((m) => m.enabled !== false);

  const renderIcon = (method: PaymentMethod) => {
    if (method.logoUrl) {
      return (
        <img
          src={method.logoUrl}
          alt={method.name}
          className="w-8 h-8 object-contain p-0.5 rounded-md"
        />
      );
    }
    switch (method.icon) {
      case 'smartphone':
        return <Smartphone className="w-6 h-6" style={{ color: method.color }} />;
      case 'coins':
        return <Coins className="w-6 h-6" style={{ color: method.color }} />;
      case 'wallet':
        return <Wallet className="w-6 h-6" style={{ color: method.color }} />;
      case 'bank':
        return <Building2 className="w-6 h-6" style={{ color: method.color }} />;
      case 'credit-card':
      default:
        return <CreditCard className="w-6 h-6" style={{ color: method.color }} />;
    }
  };

  return (
    <section id="pagos" className="py-7 bg-slate-50 dark:bg-[#0b0f19] border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-5 space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Pagos 100% Verificados en Perú
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Métodos de Pago Inmediatos</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Haz clic en tu método preferido para ver el número o cuenta oficial al instante.
          </p>
        </div>

        <div
          className={`grid gap-3 ${
            visibleMethods.length <= 2
              ? 'grid-cols-2 max-w-lg mx-auto'
              : visibleMethods.length === 3
              ? 'grid-cols-2 sm:grid-cols-3 max-w-3xl mx-auto'
              : visibleMethods.length === 4
              ? 'grid-cols-2 sm:grid-cols-4 max-w-5xl mx-auto'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
          }`}
        >
          {visibleMethods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => onOpenPaymentInfo(method.name)}
              className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md text-center transition-all duration-200 group flex flex-col items-center justify-between cursor-pointer hover:-translate-y-0.5"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = method.color;
                e.currentTarget.style.boxShadow = `0 0 16px -2px ${method.color}35`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform bg-white dark:bg-slate-800"
                style={{
                  backgroundColor: `${method.color}15`,
                  border: `1px solid ${method.color}30`,
                }}
              >
                {renderIcon(method)}
              </div>
              <strong className="block text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">
                {method.name}
              </strong>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                {method.badge || 'Sin comisiones 24/7'}
              </span>
              <span
                className="mt-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all group-hover:scale-102 flex items-center gap-1"
                style={{
                  backgroundColor: `${method.color}15`,
                  color: method.color,
                }}
              >
                Ver datos →
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
