import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Tv,
  Smartphone,
  Laptop,
  Check,
  Sparkles,
  Clock,
  MessageCircle,
  CreditCard,
  Flame,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Product, ProductPlan, StoreSettings } from '../types';
import { getProductSpecs, productSupportsPin } from '../utils/productDetails';
import { getProductRating } from '../utils/productRatings';
import { getDurationOptions, DurationOption } from '../utils/durationPricing';

interface QuickViewModalProps {
  product: Product | null;
  settings: StoreSettings;
  onClose: () => void;
  onProceedToBuy: (product: Product, plan: ProductPlan) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  settings,
  onClose,
  onProceedToBuy,
}) => {
  const [selectedDurationMonths, setSelectedDurationMonths] = useState<number>(1);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const basePlan =
    product.plans && product.plans.length > 0
      ? product.plans[0]
      : { name: 'Estándar', price: 'S/ 25.00', desc: 'Plan Estándar' };

  const durationOptions = getDurationOptions(basePlan);
  const selectedDuration =
    durationOptions.find((d) => d.months === selectedDurationMonths) || durationOptions[0];

  const specs = getProductSpecs(product);
  const ratingInfo = getProductRating(product);
  const hasPin = productSupportsPin(product, basePlan);
  const stockUnits = product.stock ?? 10;
  const isAvailable = product.available && stockUnits > 0;

  const handleBuyClick = () => {
    const customizedPlan: ProductPlan = {
      name: `${basePlan.name} (${selectedDuration.label})`,
      price: selectedDuration.calculatedPrice,
      desc: `${selectedDuration.label} de servicio con garantía activa`,
    };
    onProceedToBuy(product, customizedPlan);
  };

  const handleWhatsAppConsult = () => {
    const text = `¡Hola ${settings.name}${settings.suffix}! 👋 Tengo una consulta sobre *${product.name}* (Opción: ${selectedDuration.label} a ${selectedDuration.calculatedPrice}). ¿Tienen disponibilidad inmediata?`;
    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-[#0c1020] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Gradient Accent Line */}
        <div
          className="h-1.5 w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, ${settings.colorPrimary || '#8b5cf6'} 0%, ${
              settings.colorAccent || '#06b6d4'
            } 100%)`,
          }}
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 flex items-center gap-1">
              <Info className="w-3 h-3 text-purple-500" />
              Vista Rápida &amp; Especificaciones
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {product.category === 'ai' ? 'Inteligencia Artificial' : 'Streaming 4K'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista rápida"
            className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Optional High-Performance Optimized Cover Banner */}
          {product.coverImageUrl && (
            <div className="relative w-full aspect-[16/9] max-h-56 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-slate-900 shadow-md">
              <img
                src={product.coverImageUrl}
                alt={`Portada oficial de ${product.name}`}
                width={640}
                height={360}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-3.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30">
                    {product.accountType
                      ? product.accountType.replace('_', ' ').toUpperCase()
                      : hasPin ? 'PERFIL CON PIN' : 'CUENTA COMPLETA'}
                  </span>
                  {product.durationText && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/80 backdrop-blur-md text-white border border-purple-400/50">
                      {product.durationText}
                    </span>
                  )}
                  {stockUnits <= 3 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-md animate-pulse flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-current" />
                      {stockUnits === 1 ? '¡ÚLTIMA UNIDAD!' : `¡ÚLTIMAS ${stockUnits} UNID.!`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Hero Summary */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            {/* Image / Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2.5 shrink-0 shadow-sm relative">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  width={96}
                  height={96}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              ) : (
                <Sparkles className="w-8 h-8 text-indigo-500" />
              )}
              {hasPin && (
                <div className="absolute -bottom-2 -right-1 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black shadow-xs flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  PIN
                </div>
              )}
            </div>

            {/* Title & Ratings */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 id="quick-view-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {product.name}
                </h3>
                {stockUnits <= 3 && isAvailable ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse ${
                    stockUnits === 1 ? 'bg-red-600 text-white' : 'bg-amber-400 text-slate-950'
                  }`}>
                    <Flame className="w-3 h-3 fill-current" />
                    {stockUnits === 1 ? '¡Último cupo!' : `¡Solo ${stockUnits} cupos!`}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {product.available ? `En Stock (${stockUnits})` : 'Agotado'}
                  </span>
                )}
              </div>

              {/* Distinct Star Rating & Reviews */}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-2">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < ratingInfo.starsCount
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-300 dark:fill-slate-700 text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {ratingInfo.formattedScore}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {ratingInfo.formattedCount}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {product.desc}
              </p>
            </div>
          </div>

          {/* Duration Selector (1 Mes, 3 Meses, 6 Meses, 12 Meses) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tiempo de suscripción:</span>
              </label>
              {selectedDuration.savingsText && (
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 animate-pulse">
                  ⚡ {selectedDuration.savingsText}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {durationOptions.map((opt) => {
                const isSelected = opt.months === selectedDurationMonths;
                return (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => setSelectedDurationMonths(opt.months)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-md scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black">{opt.label}</div>
                    <div
                      className={`text-sm font-extrabold mt-0.5 ${
                        isSelected ? 'text-white' : 'text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      {opt.calculatedPrice}
                    </div>
                    {opt.discountPercent > 0 && (
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-md inline-block mt-1 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        -{opt.discountPercent}% OFF
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Technical Specifications Grid */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Especificaciones Técnicas</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {specs.resolution && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                    Resolución / Calidad:
                  </div>
                  <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {specs.resolution}
                  </div>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                  Modalidad de Acceso:
                </div>
                <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {hasPin ? 'Perfil con PIN Privado de 4 dígitos' : specs.accountType}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                  Dispositivos Simultáneos:
                </div>
                <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {specs.screens || '1 Dispositivo a la vez'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                  Renovación &amp; Continuidad:
                </div>
                <div className="font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{specs.renewal}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 sm:col-span-2">
                <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                  Dispositivos y Sistemas Compatibles:
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {specs.devices.map((dev, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-[10.5px] font-bold text-slate-800 dark:text-slate-200"
                    >
                      {dev}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Highlighted Benefits */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Beneficios Destacados</span>
            </h4>

            <div className="space-y-2">
              {specs.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/80"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {h}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Official Guarantee Banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 border border-emerald-300/60 dark:border-emerald-800/80 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">
                Garantía Total Oficial
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Soporte y reemplazo inmediato durante los {selectedDuration.label} de tu membresía.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0 bg-slate-50/80 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total por {selectedDuration.label}:
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {selectedDuration.calculatedPrice}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* WhatsApp Consultation Button */}
            <button
              type="button"
              onClick={handleWhatsAppConsult}
              className="flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <span>Consultar</span>
            </button>

            {/* Direct Buy Action */}
            <button
              type="button"
              onClick={handleBuyClick}
              disabled={!product.available}
              className={`flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 rounded-xl text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                stockUnits <= 3 && product.available
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 shadow-red-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/25 hover:shadow-purple-500/40'
              }`}
            >
              {stockUnits <= 3 && product.available ? (
                <Flame className="w-4 h-4 fill-white shrink-0" />
              ) : (
                <Zap className="w-4 h-4 fill-white shrink-0" />
              )}
              <span>
                {stockUnits <= 3 && product.available
                  ? `¡Asegurar Cupo (${selectedDuration.calculatedPrice})!`
                  : `Comprar Ahora (${selectedDuration.calculatedPrice})`}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
