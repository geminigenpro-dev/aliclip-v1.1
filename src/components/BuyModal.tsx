import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MessageCircle,
  Copy,
  Check,
  CreditCard,
  Smartphone,
  Coins,
  Wallet,
  Building2,
  CheckCircle2,
  ShieldCheck,
  User,
  AlertCircle,
} from 'lucide-react';
import { Product, ProductPlan, StoreSettings, PaymentMethod } from '../types';
import { DEFAULT_PAYMENT_METHODS } from '../services/storeService';
import { triggerPurchaseConfetti } from '../utils/confetti';
import { getDurationOptions, DurationOption } from '../utils/durationPricing';

interface BuyModalProps {
  product: Product | null;
  plan: ProductPlan | null;
  settings: StoreSettings;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const BuyModal: React.FC<BuyModalProps> = ({
  product,
  plan,
  settings,
  onClose,
  onToast,
}) => {
  // Available payment methods from settings or defaults
  const availableMethods: PaymentMethod[] = (
    settings.paymentMethods && settings.paymentMethods.length > 0
      ? settings.paymentMethods
      : DEFAULT_PAYMENT_METHODS
  ).filter((m) => m.enabled !== false);

  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    availableMethods[0]?.id || 'pay_yape'
  );
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Client name persisted in localStorage for friendly personalization
  const [clientName, setClientName] = useState<string>(() => {
    try {
      return localStorage.getItem('alixplay_client_name') || '';
    } catch {
      return '';
    }
  });

  // Mandatory Receipt checkbox
  const [hasReceiptChecked, setHasReceiptChecked] = useState<boolean>(false);
  const [checkError, setCheckError] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);

  if (!product) return null;

  const basePlan = plan || (product.plans && product.plans[0]) || {
    name: 'Estándar',
    price: 'S/ 25.00',
    desc: 'Plan Estándar',
  };

  const durationOptions = getDurationOptions(basePlan);
  const [selectedDurationMonths, setSelectedDurationMonths] = useState<number>(() => {
    const nameLower = (plan?.name || '').toLowerCase();
    if (nameLower.includes('12 m') || nameLower.includes('anual')) return 12;
    if (nameLower.includes('6 m')) return 6;
    if (nameLower.includes('3 m')) return 3;
    return 1;
  });

  const selectedDuration =
    durationOptions.find((d) => d.months === selectedDurationMonths) || durationOptions[0];

  const currentPlan: ProductPlan = {
    name: `${basePlan.name.replace(/\s*\(\d+\s*Mes(es)?\)/gi, '')} (${selectedDuration.label})`,
    price: selectedDuration.calculatedPrice,
    desc: `${selectedDuration.label} con garantía activa`,
  };

  const selectedMethod =
    availableMethods.find((m) => m.id === selectedMethodId) ||
    availableMethods[0] ||
    DEFAULT_PAYMENT_METHODS[0];

  const handleCopy = (text: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          fallbackCopyText(text);
        });
      } else {
        fallbackCopyText(text);
      }
    } catch {
      fallbackCopyText(text);
    }
    setCopiedText(text);
    onToast(`${label} copiado al portapapeles`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (e) {
      console.warn('Fallback copy failed', e);
    }
  };

  // Flow triggered on confirmation:
  // 1. Validar que el check sea OBLIGATORIO marcarlo
  // 2. Activar la animación de confeti en canvas con múltiples ráfagas suaves
  // 3. El botón pasa a estado de éxito con resplandor neón: ¡Pedido Confirmado! 🎉 Abriendo WhatsApp....
  // 4. Mostrar animación en la modal por tiempo prolongado y dinámico (~3.8s)
  // 5. Abrir WhatsApp con mensaje personalizado con el nombre del cliente
  // 6. Cerrar suavemente la modal tras apreciar la celebración
  const handleConfirmWhatsApp = () => {
    if (isProcessing) return;

    // Validación OBLIGATORIA del check
    if (!hasReceiptChecked) {
      setCheckError(true);
      onToast('⚠️ Debes marcar la casilla para confirmar que tienes tu comprobante listo.');
      setTimeout(() => setCheckError(false), 2500);
      return;
    }

    // Activar estado de éxito y desplegar celebración en la modal
    setIsProcessing(true);
    setShowCelebrationModal(true);

    // Ráfaga 1 instantánea de confeti
    triggerPurchaseConfetti();
    onToast(`¡Pedido confirmado para ${product.name}! 🎉`);

    // Ráfaga 2 a los 700ms
    setTimeout(() => {
      triggerPurchaseConfetti();
    }, 700);

    // Ráfaga 3 a los 1600ms
    setTimeout(() => {
      triggerPurchaseConfetti();
    }, 1600);

    // Ráfaga 4 suave a los 2600ms
    setTimeout(() => {
      triggerPurchaseConfetti();
    }, 2600);

    // Luego de visualizar la animación dinámicamente (~3.8 segundos):
    setTimeout(() => {
      // Saludo personalizado con el nombre del cliente
      const clientGreeting = clientName.trim()
        ? `¡Hola ${settings.name}${settings.suffix}! 👋 Mi nombre es *${clientName.trim()}*.`
        : `¡Hola ${settings.name}${settings.suffix}! 👋`;

      const message = `${clientGreeting} Acabo de confirmar mi compra de *${product.name}* por *${selectedDuration.label}* en el plan *${currentPlan.name}* (${currentPlan.price}). Mi método de pago utilizado es: *${selectedMethod.name}* (Dato: ${selectedMethod.accountNumber}). Adjunto aquí mi comprobante de pago para la activación inmediata.`;

      const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cierre suave de la modal tras abrir WhatsApp
      setTimeout(() => {
        onClose();
      }, 900);
    }, 3800);
  };

  const renderMethodIcon = (method: PaymentMethod, sizeClass = 'w-4 h-4') => {
    if (method.logoUrl) {
      return (
        <img
          src={method.logoUrl}
          alt={method.name}
          className={`${sizeClass} object-contain rounded-sm`}
        />
      );
    }
    switch (method.icon) {
      case 'smartphone':
        return <Smartphone className={sizeClass} style={{ color: method.color }} />;
      case 'coins':
        return <Coins className={sizeClass} style={{ color: method.color }} />;
      case 'wallet':
        return <Wallet className={sizeClass} style={{ color: method.color }} />;
      case 'bank':
        return <Building2 className={sizeClass} style={{ color: method.color }} />;
      case 'credit-card':
      default:
        return <CreditCard className={sizeClass} style={{ color: method.color }} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-purple-900/40 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Animated Celebration Screen Inside the Modal */}
        {showCelebrationModal && (
          <div className="absolute inset-0 z-40 bg-[#070a16]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fade-in select-none">
            {/* Ambient Pulsing Glow Rings */}
            <div className="absolute w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute w-52 h-52 rounded-full bg-pink-500/15 blur-2xl pointer-events-none" />

            {/* Glowing Success Icon with Neon Checkmark */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_45px_rgba(16,185,129,0.85)] animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-white stroke-[2.5]" />
              </div>
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-pink-500 border-2 border-[#070a16] flex items-center justify-center shadow-[0_0_14px_rgba(236,72,153,0.9)] animate-ping" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
              ¡Pedido Confirmado, {clientName.trim() || 'Estimado Cliente'}! 🎉
            </h3>
            <p className="text-xs text-emerald-400 font-bold mb-4 flex items-center gap-1.5 justify-center">
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>Comprobante validado para activación VIP</span>
            </p>

            {/* Product & Method Summary Card */}
            <div className="w-full max-w-sm bg-white/5 dark:bg-[#12182c] border border-emerald-500/30 rounded-2xl p-4 mb-5 text-left space-y-2 shadow-[0_0_25px_rgba(16,185,129,0.18)]">
              {clientName.trim() && (
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-700/50">
                  <span className="text-slate-400 font-medium">Cliente:</span>
                  <span className="font-black text-emerald-400">{clientName.trim()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Producto:</span>
                <span className="font-black text-white">{product.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Plan seleccionado:</span>
                <span className="font-extrabold text-amber-300">
                  {currentPlan.name} ({currentPlan.price})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Método de pago:</span>
                <span className="font-extrabold text-cyan-300">{selectedMethod.name}</span>
              </div>
            </div>

            {/* Active Loading Bar / Transition to WhatsApp */}
            <div className="flex items-center gap-2 text-xs font-black text-slate-300">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Abriendo WhatsApp con tu asesor VIP...</span>
            </div>
            <div className="w-56 h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 rounded-full transition-all duration-[3800ms] ease-out w-full"
                style={{
                  animation: 'pulse 1.8s infinite',
                }}
              />
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Pagar Membresía
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {product.name} • {currentPlan.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="py-3.5 space-y-3.5 overflow-y-auto pr-1 flex-1">
          {/* Selected Product & Plan Summary */}
          <div className="bg-slate-50 dark:bg-[#12182c] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-black text-purple-600 dark:text-purple-400 block tracking-wider">
                Resumen de Compra
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {product.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {currentPlan.name} • {currentPlan.desc}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
              <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                {currentPlan.price}
              </span>
            </div>
          </div>

          {/* Service Duration Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                1. Tiempo de Suscripción
              </label>
              {selectedDuration.savingsText && (
                <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedDuration.savingsText}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {durationOptions.map((opt) => {
                const isSelected = opt.months === selectedDurationMonths;
                return (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => setSelectedDurationMonths(opt.months)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-black">{opt.label}</div>
                    <div className="text-[10px] font-bold opacity-90 mt-0.5">{opt.calculatedPrice}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector Grid */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wider">
              2. Selecciona Método de Pago
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableMethods.map((method) => {
                const isSelected = method.id === selectedMethodId;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethodId(method.id)}
                    className={`p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 relative ${
                      isSelected
                        ? 'border-purple-500 dark:border-purple-400 bg-purple-50/60 dark:bg-purple-950/40 shadow-xs'
                        : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${method.color}15`,
                      }}
                    >
                      {renderMethodIcon(method, 'w-4 h-4')}
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 text-center leading-tight">
                      {method.name}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Payment Method Details */}
          <div className="bg-slate-50/90 dark:bg-[#101528] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-purple-900/30 space-y-2.5">
            <div className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              3. Datos Oficiales de Pago
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${selectedMethod.color}20` }}
                >
                  {renderMethodIcon(selectedMethod, 'w-3.5 h-3.5')}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none">
                    {selectedMethod.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {selectedMethod.badge || 'Pago inmediato'}
                  </span>
                </div>
              </div>

              {/* Neon Glow badge */}
              <span
                className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider"
                style={{
                  backgroundColor: `${selectedMethod.color}20`,
                  color: selectedMethod.color,
                  boxShadow: `0 0 8px ${selectedMethod.color}40`,
                }}
              >
                Activo
              </span>
            </div>

            {/* Account Number Box */}
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/90 dark:border-slate-700 space-y-1">
              <span className="text-[9.5px] uppercase font-bold text-slate-400 dark:text-slate-400 block tracking-wider">
                Dato de Pago / Cuenta a Transferir:
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight break-all">
                  {selectedMethod.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedMethod.accountNumber, selectedMethod.name)}
                  className="px-2.5 py-1 rounded-md text-xs font-bold text-white shrink-0 flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: selectedMethod.color,
                    boxShadow: `0 0 10px ${selectedMethod.color}50`,
                  }}
                >
                  {copiedText === selectedMethod.accountNumber ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Account Holder & Instructions */}
            {selectedMethod.accountHolder && (
              <p className="text-[10.5px] text-slate-600 dark:text-slate-300 font-medium leading-tight">
                <strong>Titular:</strong> {selectedMethod.accountHolder}
              </p>
            )}

            {selectedMethod.instructions && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight bg-slate-50/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                ℹ️ {selectedMethod.instructions}
              </p>
            )}
          </div>

          {/* Step 4: Customer Name Input (Personalized Message) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              4. Tu Nombre o Alias (Para personalizar tu pedido)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  try {
                    localStorage.setItem('alixplay_client_name', e.target.value);
                  } catch (err) {
                    console.warn(err);
                  }
                }}
                placeholder="Ej: Carlos Mendoza"
                className="w-full pl-9 pr-24 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-400/20 transition-all"
              />
              {clientName.trim() && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] font-bold text-emerald-500 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Personalizado</span>
                </span>
              )}
            </div>
          </div>

          {/* Step 3: Checkbox Obligatorio para marcar el comprobante */}
          <div>
            <label
              onClick={() => {
                if (!isProcessing) {
                  setHasReceiptChecked(!hasReceiptChecked);
                  setCheckError(false);
                }
              }}
              className={`flex items-start gap-2.5 p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
                checkError
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-400 animate-pulse'
                  : hasReceiptChecked
                  ? 'bg-emerald-500/10 border-emerald-500/50 dark:bg-emerald-950/30 dark:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/40'
              }`}
            >
              <div className="pt-0.5">
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                    hasReceiptChecked
                      ? 'bg-emerald-500 border-emerald-500 text-white scale-105 shadow-[0_0_10px_rgba(16,185,129,0.7)]'
                      : checkError
                      ? 'border-rose-500 bg-rose-100 dark:bg-rose-900/60'
                      : 'border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-900'
                  }`}
                >
                  {hasReceiptChecked && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                </div>
              </div>
              <div className="text-left leading-snug">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Tengo mi comprobante de pago listo para enviar</span>
                  <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider">
                    * Obligatorio
                  </span>
                  {hasReceiptChecked && (
                    <span className="text-[10px] text-emerald-500 font-bold">✓ Listo</span>
                  )}
                </span>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Es obligatorio marcar esta casilla para confirmar que ya realizaste o tienes lista la transferencia antes de abrir WhatsApp.
                </span>
                {checkError && (
                  <span className="text-[10.5px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Marca esta casilla para poder confirmar tu pedido.</span>
                  </span>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Modal Actions - Botón de confirmación con resplandor neón */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={handleConfirmWhatsApp}
            disabled={isProcessing}
            className={`w-full py-3 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
              isProcessing
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 border border-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.9)] scale-[0.98] ring-2 ring-emerald-400'
                : hasReceiptChecked
                ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-98 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:border-emerald-500/50 cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
                <span className="tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
                  ¡Pedido Confirmado! 🎉 Abriendo WhatsApp....
                </span>
              </>
            ) : hasReceiptChecked ? (
              <>
                <MessageCircle className="w-4 h-4" />
                <span>Confirmar y Enviar Comprobante por WhatsApp</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-slate-400" />
                <span>Marca la casilla de comprobante arriba para confirmar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full py-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer disabled:opacity-40"
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    </div>
  );
};
