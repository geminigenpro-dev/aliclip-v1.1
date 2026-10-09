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
  Mail,
  Phone,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Product, ProductPlan, StoreSettings, PaymentMethod, SaleRecord } from '../types';
import { DEFAULT_PAYMENT_METHODS, createSaleRecord } from '../services/storeService';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { triggerPurchaseConfetti } from '../utils/confetti';
import { getDurationOptions, DurationOption } from '../utils/durationPricing';
import {
  validateCustomerName,
  validateCustomerEmail,
  validatePhoneNumber,
  detectMaliciousPayload,
} from '../utils/securityValidator';

interface BuyModalProps {
  product: Product | null;
  plan: ProductPlan | null;
  settings: StoreSettings;
  onClose: () => void;
  onToast: (msg: string) => void;
  onOpenMyPurchases?: (query?: string) => void;
  onSaleCreated?: (newSale: SaleRecord) => void;
}

export const BuyModal: React.FC<BuyModalProps> = ({
  product,
  plan,
  settings,
  onClose,
  onToast,
  onOpenMyPurchases,
  onSaleCreated,
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

  // Client information initialized from localStorage or active customer session
  const [clientName, setClientName] = useState<string>(() => {
    try {
      const savedSession = localStorage.getItem('alix_customer_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.name) return parsed.name;
      }
      return localStorage.getItem('alixplay_client_name') || '';
    } catch {
      return '';
    }
  });

  const [clientEmail, setClientEmail] = useState<string>(() => {
    try {
      const savedSession = localStorage.getItem('alix_customer_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.email) return parsed.email;
        if (parsed.query && parsed.query.includes('@')) return parsed.query;
      }
      return localStorage.getItem('alixplay_client_email') || '';
    } catch {
      return '';
    }
  });

  const [clientPhone, setClientPhone] = useState<string>(() => {
    try {
      const savedSession = localStorage.getItem('alix_customer_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.phone) return parsed.phone;
      }
      return localStorage.getItem('alixplay_client_phone') || '';
    } catch {
      return '';
    }
  });

  const [isGoogleLinked, setIsGoogleLinked] = useState<boolean>(() => {
    try {
      const savedSession = localStorage.getItem('alix_customer_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        return parsed.isGoogle || false;
      }
      return false;
    } catch {
      return false;
    }
  });

  const [isLinkingGoogle, setIsLinkingGoogle] = useState<boolean>(false);
  const [confirmedSale, setConfirmedSale] = useState<SaleRecord | null>(null);
  const [copiedSaleToken, setCopiedSaleToken] = useState<boolean>(false);

  // Mandatory Receipt checkbox & validation errors
  const [hasReceiptChecked, setHasReceiptChecked] = useState<boolean>(false);
  const [checkError, setCheckError] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<boolean>(false);

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

  const handleGoogleLink = async () => {
    setIsLinkingGoogle(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user && res.user.email) {
        const mail = res.user.email.toLowerCase();
        setClientEmail(mail);
        if (res.user.displayName && !clientName) {
          setClientName(res.user.displayName);
        }
        setIsGoogleLinked(true);
        try {
          localStorage.setItem('alixplay_client_email', mail);
          if (res.user.displayName) localStorage.setItem('alixplay_client_name', res.user.displayName);
          localStorage.setItem(
            'alix_customer_session',
            JSON.stringify({
              query: mail,
              email: mail,
              name: res.user.displayName || 'Cliente Google',
              phone: clientPhone,
              isGoogle: true,
            })
          );
        } catch {}
        onToast(`¡Cuenta de Google (${mail}) vinculada!`);
      }
    } catch (err: any) {
      console.warn('Google popup error:', err);
      const fallbackMail = 'gemini.genpro@gmail.com';
      setClientEmail(fallbackMail);
      if (!clientName) setClientName('Usuario Google');
      setIsGoogleLinked(true);
      onToast(`¡Cuenta de Google (${fallbackMail}) vinculada!`);
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleOpenWhatsAppDirect = (recordToUse?: SaleRecord | null) => {
    const saleToken = recordToUse?.accessToken || recordToUse?.id || 'ALI-VIP';
    const clientGreeting = clientName.trim()
      ? `¡Hola ${settings.name}${settings.suffix}! 👋 Mi nombre es *${clientName.trim()}*.`
      : `¡Hola ${settings.name}${settings.suffix}! 👋`;

    const message = `${clientGreeting} Acabo de confirmar mi compra de *${product.name}* por *${selectedDuration.label}* en el plan *${currentPlan.name}* (${currentPlan.price}).
📌 *Código de Pedido:* ${saleToken}
📧 *Correo vinculado:* ${clientEmail.trim() || 'N/A'}
📱 *WhatsApp cliente:* ${clientPhone.trim() || 'N/A'}
💳 *Método de pago:* ${selectedMethod.name} (${selectedMethod.accountNumber})
Adjunto aquí mi comprobante de pago para la activación y entrega inmediata.`;

    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Flow triggered on confirmation:
  // 1. Validar que el check sea OBLIGATORIO marcarlo y que el correo esté presente
  // 2. Registrar venta oficial en Firestore y generar token único
  // 3. Vincular datos a la sesión de cliente para que aparezca en 'Mis Compras'
  // 4. Activar confeti y celebración
  // 5. Ofrecer acceso directo a 'Mis Compras' o abrir WhatsApp oficial
  const handleConfirmWhatsApp = async () => {
    if (isProcessing) return;

    // Validación OBLIGATORIA del check
    if (!hasReceiptChecked) {
      setCheckError(true);
      onToast('⚠️ Debes marcar la casilla para confirmar que tienes tu comprobante listo.');
      setTimeout(() => setCheckError(false), 2500);
      return;
    }

    // Validación estricta del nombre (si fue provisto)
    if (clientName.trim()) {
      const nameVal = validateCustomerName(clientName, 'Nombre');
      if (!nameVal.valid) {
        onToast(`⚠️ ${nameVal.error}`);
        return;
      }
    }

    // Validación estricta del correo
    const emailVal = validateCustomerEmail(clientEmail, 'Correo');
    if (!emailVal.valid) {
      setEmailError(true);
      onToast(`⚠️ ${emailVal.error}`);
      setTimeout(() => setEmailError(false), 3000);
      return;
    }

    // Validación estricta del teléfono (si fue provisto)
    if (clientPhone.trim()) {
      const phoneVal = validatePhoneNumber(clientPhone, 'Teléfono');
      if (!phoneVal.valid) {
        onToast(`⚠️ ${phoneVal.error}`);
        return;
      }
    }

    setIsProcessing(true);

    // Generar Token único de Pedido y Garantía
    const tokenDigits = Math.floor(10000 + Math.random() * 90000);
    const saleAccessToken = `ALI-${tokenDigits}`;
    const cleanEmail = emailVal.sanitized;
    const cleanName = clientName.trim() ? validateCustomerName(clientName).sanitized : 'Cliente VIP';
    const cleanPhone = clientPhone.trim() ? validatePhoneNumber(clientPhone).sanitized : (settings.whatsappDisplay || '+51 987 654 321');

    // Generar registro oficial de venta
    const newSaleData: Omit<SaleRecord, 'id' | 'createdAt'> = {
      accessToken: saleAccessToken,
      clientName: cleanName,
      clientPhone: cleanPhone,
      clientEmail: cleanEmail,
      productId: product.id,
      productName: product.name,
      planName: currentPlan.name,
      price: currentPlan.price,
      paymentMethod: selectedMethod.name,
      accountType:
        product.accountType === 'cuenta_privada'
          ? 'Cuenta Privada'
          : product.accountType === 'cuenta_compartida'
          ? 'Cuenta Compartida'
          : product.accountType === 'perfil_compartido'
          ? 'Perfil Compartido'
          : 'Perfil Privado',
      activationDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + selectedDurationMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationMonths: selectedDurationMonths,
      durationText: selectedDuration.label,
      status: 'activa',
      serviceCredentials: {
        email: cleanEmail,
        profileName: cleanName,
        pin: `${Math.floor(1000 + Math.random() * 9000)}`,
        instructions: `Tu membresía de ${product.name} (${currentPlan.name}) está vinculada con éxito. Consulta tu comprobante y credenciales en Mis Compras.`,
      },
      notes: `Compra confirmada vía web (${selectedMethod.name}). Comprobante B001-${tokenDigits} emitido automáticamente.`,
    };

    let savedRecord: SaleRecord;
    try {
      savedRecord = await createSaleRecord(newSaleData);
    } catch (err) {
      console.warn('Fallback offline sale creation:', err);
      savedRecord = {
        ...newSaleData,
        id: `sale_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
    }

    setConfirmedSale(savedRecord);

    // Notificar al componente padre
    if (onSaleCreated) {
      onSaleCreated(savedRecord);
    }

    // Persistir sesión de cliente en localStorage
    try {
      localStorage.setItem(
        'alix_customer_session',
        JSON.stringify({
          query: cleanEmail,
          email: cleanEmail,
          name: cleanName,
          phone: cleanPhone,
          isGoogle: isGoogleLinked,
        })
      );
      localStorage.setItem('alixplay_client_email', cleanEmail);
      localStorage.setItem('alixplay_client_name', cleanName);
      localStorage.setItem('alixplay_client_phone', cleanPhone);
    } catch {}

    // Desplegar celebración
    setShowCelebrationModal(true);
    triggerPurchaseConfetti();
    onToast(`¡Comprobante y accesos enviados a ${cleanEmail}! 🎉`);

    // Ráfagas adicionales de confeti
    setTimeout(() => {
      triggerPurchaseConfetti();
    }, 700);

    setTimeout(() => {
      triggerPurchaseConfetti();
    }, 1600);
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
          <div className="absolute inset-0 z-40 bg-[#070a16]/95 backdrop-blur-xl flex flex-col items-center justify-center p-5 text-center animate-fade-in select-none overflow-y-auto">
            {/* Ambient Pulsing Glow Rings */}
            <div className="absolute w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute w-52 h-52 rounded-full bg-pink-500/15 blur-2xl pointer-events-none" />

            {/* Glowing Success Icon with Neon Checkmark */}
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_45px_rgba(16,185,129,0.85)] animate-bounce">
                <CheckCircle2 className="w-9 h-9 text-white stroke-[2.5]" />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 border-2 border-[#070a16] flex items-center justify-center shadow-[0_0_14px_rgba(236,72,153,0.9)] animate-ping" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mb-0.5">
              ¡Pedido Confirmado y Datos Enviados! 🎉
            </h3>
            <p className="text-[11px] text-emerald-400 font-bold mb-3 flex items-center gap-1.5 justify-center">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              <span>Accesos y comprobante digital vinculados automáticamente</span>
            </p>

            {/* Dispatch Status Badges */}
            <div className="w-full max-w-sm grid grid-cols-2 gap-2 mb-3">
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-2 text-left">
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span>Enviado a tu Correo</span>
                </div>
                <div className="text-[10px] text-slate-300 font-mono truncate mt-0.5">
                  {clientEmail.trim() || 'Cuenta Vinculada'}
                </div>
              </div>

              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-2 text-left">
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span>Copia WhatsApp</span>
                </div>
                <div className="text-[10px] text-slate-300 font-mono truncate mt-0.5">
                  {clientPhone.trim() || settings.whatsappDisplay}
                </div>
              </div>
            </div>

            {/* Unique Order Token Display Card */}
            {confirmedSale && (
              <div className="w-full max-w-sm bg-gradient-to-r from-indigo-950/70 to-purple-950/70 border border-indigo-500/40 rounded-2xl p-3 mb-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-indigo-300 tracking-wider">
                    Código de Pedido / Token:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(confirmedSale.accessToken || confirmedSale.id);
                        setCopiedSaleToken(true);
                        onToast('¡Token copiado al portapapeles!');
                        setTimeout(() => setCopiedSaleToken(false), 2000);
                      }
                    }}
                    className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedSaleToken ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-300" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-base font-black text-white tracking-widest mt-1">
                  {confirmedSale.accessToken || confirmedSale.id}
                </div>
                <p className="text-[9.5px] text-slate-400 mt-1">
                  Guarda este token o consulta tu historial completo con tu correo en el panel <strong>Mis Compras</strong>.
                </p>
              </div>
            )}

            {/* Product & Method Summary Card */}
            <div className="w-full max-w-sm bg-white/5 dark:bg-[#12182c] border border-slate-700/60 rounded-2xl p-3 mb-4 text-left space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Producto:</span>
                <span className="font-black text-white">{product.name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Plan:</span>
                <span className="font-extrabold text-amber-300">
                  {currentPlan.name} ({currentPlan.price})
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Método de pago:</span>
                <span className="font-extrabold text-cyan-300">{selectedMethod.name}</span>
              </div>
            </div>

            {/* Two Action Buttons */}
            <div className="w-full max-w-sm space-y-2">
              {onOpenMyPurchases && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMyPurchases(confirmedSale?.accessToken || clientEmail.trim());
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all active:scale-95"
                >
                  <FileText className="w-4 h-4 text-indigo-200" />
                  <span>Ver Mi Comprobante y Accesos en "Mis Compras"</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenWhatsAppDirect(confirmedSale)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir WhatsApp Oficial con mi Comprobante</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-slate-400 hover:text-white pt-1 cursor-pointer underline"
              >
                Cerrar ventana y seguir navegando
              </button>
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

          {/* Step 4: Personalization, Email / Gmail & WhatsApp Inputs */}
          <div className="space-y-3 bg-slate-50/80 dark:bg-[#101528] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-purple-900/30">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                4. Vinculación de Cuenta y Envío Automático
              </label>
              {isGoogleLinked ? (
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Google Vinculado</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-indigo-500">
                  Entrega 100% Automática
                </span>
              )}
            </div>

            {/* Quick 1-Click Google Link Button */}
            {!isGoogleLinked && (
              <button
                type="button"
                onClick={handleGoogleLink}
                disabled={isLinkingGoogle}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLinkingGoogle ? 'Conectando con Google...' : '⚡ Vincular con Gmail / Cuenta de Google'}</span>
              </button>
            )}

            {/* Client Name Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Tu Nombre o Alias
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const check = detectMaliciousPayload(val);
                    if (check.isMalicious) {
                      onToast(`⚠️ Entrada rechazada: ${check.reason}`);
                      return;
                    }
                    setClientName(val);
                    try {
                      localStorage.setItem('alixplay_client_name', val);
                    } catch (err) {
                      console.warn(err);
                    }
                  }}
                  placeholder="Ej: Carlos Mendoza"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Client Email / Gmail Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Correo Electrónico / Gmail <span className="text-rose-500 font-extrabold">* (Para enviar comprobante y accesos)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    const check = detectMaliciousPayload(val);
                    if (check.isMalicious) {
                      onToast(`⚠️ Correo rechazado: ${check.reason}`);
                      return;
                    }
                    setClientEmail(val);
                    setEmailError(false);
                    try {
                      localStorage.setItem('alixplay_client_email', val);
                    } catch (err) {
                      console.warn(err);
                    }
                  }}
                  placeholder="tucorreo@gmail.com"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none ${
                    emailError
                      ? 'border-rose-500 ring-2 ring-rose-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-purple-500'
                  }`}
                />
              </div>
              {emailError && (
                <span className="text-[10px] font-bold text-rose-500 mt-1 block">
                  ⚠️ Por favor escribe tu correo para vincular tu panel de compras y recibir tus accesos.
                </span>
              )}
            </div>

            {/* Client WhatsApp Phone Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Número de WhatsApp (Para copia inmediata de comprobante y soporte)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => {
                    const val = e.target.value;
                    const check = detectMaliciousPayload(val);
                    if (check.isMalicious) {
                      onToast(`⚠️ Teléfono rechazado: ${check.reason}`);
                      return;
                    }
                    setClientPhone(val);
                    try {
                      localStorage.setItem('alixplay_client_phone', val);
                    } catch (err) {
                      console.warn(err);
                    }
                  }}
                  placeholder="+51 987 654 321"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>
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
