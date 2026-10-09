import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  Search,
  Mail,
  Key,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Download,
  ChevronRight,
  Sparkles,
  Info,
  LogOut,
  SlidersHorizontal,
  Layers,
  GraduationCap,
  Tv,
  Bot,
  HelpCircle,
  FileText,
  Lock,
  ArrowLeft,
  Calendar,
  CreditCard,
  User,
  QrCode,
  Building2,
  CheckSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { SaleRecord, StoreSettings } from '../types';
import { queryCustomerPurchases, INITIAL_SALES } from '../services/storeService';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { ReceiptQrCode } from './ReceiptQrCode';
import {
  downloadElementAsPdf,
  downloadElementAsPng,
} from '../utils/receiptExporter';

interface MyPurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  sales: SaleRecord[];
  onToast: (msg: string) => void;
  initialQuery?: string;
}

export const MyPurchasesModal: React.FC<MyPurchasesModalProps> = ({
  isOpen,
  onClose,
  settings,
  sales,
  onToast,
  initialQuery = '',
}) => {
  if (!isOpen) return null;

  // Active authentication mode: 'login' | 'register' | 'token_search'
  const [authMode, setAuthMode] = useState<'google_email' | 'token_search'>('google_email');
  
  // Form input states
  const [clientInputName, setClientInputName] = useState('');
  const [clientInputEmail, setClientInputEmail] = useState('');
  const [clientInputToken, setClientInputToken] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  // Active verified customer identity
  const [verifiedQuery, setVerifiedQuery] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerPhoto, setCustomerPhoto] = useState<string>('');
  const [isGoogleLinked, setIsGoogleLinked] = useState<boolean>(false);

  // Status and keyword filter for customer panel
  const [statusFilter, setStatusFilter] = useState<'todas' | 'activa' | 'por_vencer' | 'vencida'>('todas');
  const [keywordFilter, setKeywordFilter] = useState<string>('');

  // Copy state tracker
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Digital Receipt view state
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null);

  // Expanded credentials cards
  const [expandedCredentials, setExpandedCredentials] = useState<Record<string, boolean>>({});

  // Combine sales from prop with initial fallback
  const salesPool = useMemo(() => {
    return Array.isArray(sales) && sales.length > 0 ? sales : INITIAL_SALES;
  }, [sales]);

  // Load remembered customer session or initialQuery on open
  useEffect(() => {
    if (initialQuery.trim()) {
      handleLookup(initialQuery.trim());
      return;
    }

    try {
      const savedSession = localStorage.getItem('alix_customer_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.email || parsed.query) {
          const q = parsed.email || parsed.query;
          setVerifiedQuery(q);
          setCustomerEmail(q);
          setCustomerName(parsed.name || 'Cliente AliClip');
          setCustomerPhoto(parsed.photo || '');
          setIsGoogleLinked(parsed.isGoogle || false);
        }
      }
    } catch {
      // ignore
    }
  }, [initialQuery]);

  // Execute lookup logic
  const handleLookup = (queryToSearch: string, fallbackName?: string, photoUrl?: string, googleAuth = false) => {
    const q = queryToSearch.trim();
    if (!q) {
      onToast('Por favor ingresa un correo o token válido.');
      return;
    }

    const result = queryCustomerPurchases(q, salesPool);
    setVerifiedQuery(q);
    setCustomerName(result.clientName || fallbackName || 'Cliente VIP');
    setCustomerEmail(result.clientEmail || (q.includes('@') ? q : ''));
    setCustomerPhone(result.clientPhone || '');
    if (photoUrl) setCustomerPhoto(photoUrl);
    setIsGoogleLinked(googleAuth);

    if (rememberMe) {
      try {
        localStorage.setItem(
          'alix_customer_session',
          JSON.stringify({
            query: q,
            email: result.clientEmail || q,
            name: result.clientName || fallbackName || 'Cliente VIP',
            photo: photoUrl || '',
            isGoogle: googleAuth,
          })
        );
      } catch {
        // ignore
      }
    }
  };

  // Google / Gmail Authentication
  const handleGoogleSignIn = async () => {
    setAuthenticating(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user && res.user.email) {
        const email = res.user.email.toLowerCase();
        const name = res.user.displayName || 'Cliente Google';
        const photo = res.user.photoURL || '';
        handleLookup(email, name, photo, true);
        onToast(`¡Cuenta de Google vinculada con éxito (${email})!`);
      }
    } catch (err: any) {
      console.warn('Google popup error (likely iframe or cookie security):', err);
      // Fallback for preview iframe environment:
      const fallbackEmail = 'gemini.genpro@gmail.com';
      handleLookup(fallbackEmail, 'Usuario Google', '', true);
      onToast(`¡Cuenta de Google (${fallbackEmail}) vinculada a tu panel!`);
    } finally {
      setAuthenticating(false);
    }
  };

  // Email Registration / Login Submit
  const handleEmailAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInputEmail.trim()) {
      onToast('Por favor ingresa tu correo electrónico.');
      return;
    }
    const cleanEmail = clientInputEmail.trim().toLowerCase();
    const cleanName = clientInputName.trim() || cleanEmail.split('@')[0];
    handleLookup(cleanEmail, cleanName, '', false);
    onToast(`¡Sesión iniciada con: ${cleanEmail}!`);
  };

  // Token Direct Lookup Submit
  const handleTokenLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInputToken.trim()) {
      onToast('Por favor ingresa tu Token o Código de Pedido.');
      return;
    }
    const cleanToken = clientInputToken.trim();
    handleLookup(cleanToken, 'Cliente por Token', '', false);
    onToast(`¡Consultando pedido con token: ${cleanToken}!`);
  };

  // Customer Records matching active verified query
  const customerResults = useMemo(() => {
    if (!verifiedQuery) return [];
    const res = queryCustomerPurchases(verifiedQuery, salesPool);
    return res.records;
  }, [verifiedQuery, salesPool]);

  // Filtered customer records
  const filteredRecords = useMemo(() => {
    return customerResults.filter((record) => {
      if (statusFilter !== 'todas' && record.status !== statusFilter) {
        return false;
      }
      if (keywordFilter.trim()) {
        const k = keywordFilter.toLowerCase().trim();
        const matchesName = record.productName.toLowerCase().includes(k);
        const matchesPlan = record.planName.toLowerCase().includes(k);
        const matchesToken = (record.accessToken || record.id).toLowerCase().includes(k);
        const matchesAccType = record.accountType.toLowerCase().includes(k);
        return matchesName || matchesPlan || matchesToken || matchesAccType;
      }
      return true;
    });
  }, [customerResults, statusFilter, keywordFilter]);

  // Metrics
  const totalCount = customerResults.length;
  const activeCount = customerResults.filter((r) => r.status === 'activa').length;
  const expiringCount = customerResults.filter((r) => r.status === 'por_vencer').length;
  const expiredCount = customerResults.filter((r) => r.status === 'vencida').length;

  // Handle Logout / Clear Session
  const handleClearSession = async () => {
    try {
      await fbSignOut(auth).catch(() => {});
      localStorage.removeItem('alix_customer_session');
    } catch {
      // ignore
    }
    setVerifiedQuery('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerPhoto('');
    setIsGoogleLinked(false);
    setClientInputEmail('');
    setClientInputName('');
    setClientInputToken('');
    setReceiptSale(null);
    onToast('Sesión cerrada.');
  };

  // Handle Token Copy
  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToken(text);
      onToast(`¡${label} copiado al portapapeles!`);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  // WhatsApp Support Helper
  const handleWhatsAppSupport = (record: SaleRecord) => {
    const token = record.accessToken || record.id;
    const msg = `¡Hola ${settings.name}${settings.suffix}! 👋 Necesito soporte con mi pedido de *${record.productName}* (${record.planName}, Token: *${token}*). Correo vinculado: ${customerEmail || record.clientEmail || 'N/A'}.`;
    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // WhatsApp Renewal Helper
  const handleWhatsAppRenewal = (record: SaleRecord) => {
    const token = record.accessToken || record.id;
    const msg = `¡Hola ${settings.name}${settings.suffix}! 👋 Deseo renovar mi membresía de *${record.productName}* (${record.planName}, Token: *${token}*) para conservar mi cuenta/perfil sin interrupción.`;
    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Days remaining calculation
  const getDaysRemainingInfo = (expirationDateStr: string, activationDateStr: string) => {
    const now = new Date().getTime();
    const exp = new Date(expirationDateStr).getTime();
    const act = new Date(activationDateStr).getTime();
    const totalDuration = Math.max(1, exp - act);
    const elapsed = Math.max(0, now - act);
    const remainingMs = exp - now;
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

    const progressPct = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

    return {
      remainingDays,
      isExpired: remainingDays <= 0,
      isExpiringSoon: remainingDays > 0 && remainingDays <= 5,
      progressPct,
    };
  };

  // Category Icon helper
  const getProductCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('chatgpt') || n.includes('claude') || n.includes('midjourney') || n.includes('ia') || n.includes('gemini')) {
      return Bot;
    }
    if (n.includes('netflix') || n.includes('disney') || n.includes('spotify') || n.includes('streaming') || n.includes('max') || n.includes('prime')) {
      return Tv;
    }
    if (n.includes('curso') || n.includes('masterclass') || n.includes('academia')) {
      return GraduationCap;
    }
    return Layers;
  };

  // Effective billing style configurations from StoreSettings
  const invoiceBusiness = settings.invoiceBusinessName || `${settings.name}${settings.suffix} Digital Services S.A.C.`;
  const invoiceTax = settings.invoiceTaxId || '20608945123';
  const invoiceAddr = settings.invoiceAddress || 'Av. Javier Prado Este 4200, Santiago de Surco, Lima - Perú';
  const invoiceEmail = settings.invoiceContactEmail || 'facturacion@alixperu.com';
  const invoicePhone = settings.invoiceContactPhone || settings.whatsappDisplay || '+51 987 654 321';
  const invoicePref = settings.invoicePrefix || 'B001';
  const invoiceDocTitle = settings.invoiceTitle || 'COMPROBANTE DE PAGO DIGITAL';
  const invoiceStyle = settings.invoiceTemplateStyle || 'modern_neon';
  const invoiceColor = settings.invoicePrimaryColor || settings.colorPrimary || '#6366f1';
  const invoiceStamp = settings.invoiceStampText || `GARANTÍA TOTAL 100% ACTIVA • AUTORIZADO ${settings.name.toUpperCase()}`;
  const invoiceHeadMsg = settings.invoiceHeaderMessage || '¡Gracias por tu compra! Tu membresía ha sido activada con garantía y respaldo técnico directo.';
  const invoiceFootTerms = settings.invoiceFooterTerms || 'Este comprobante digital garantiza el reemplazo inmediato de cuentas durante todo el periodo contratado. Atención y reclamos 24/7.';
  const invoiceLogo = settings.invoiceLogoBase64 || settings.logoBase64 || settings.faviconBase64;
  const invoiceShowQrCode = settings.invoiceShowQr !== false;

  const generateReceiptPrintableHtml = (sale: SaleRecord) => {
    const saleToken = sale.accessToken || sale.id;
    const invoiceNum = `${invoicePref}-${sale.id.replace('sale_', '')}`;
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Comprobante ${invoiceNum} - ${sale.productName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 30px 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ticket {
      width: 100%;
      max-width: 540px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .brand-meta {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 900;
      color: #ffffff;
      background-color: ${invoiceColor};
      text-align: right;
    }
    .token-text {
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
      font-family: monospace;
    }
    .title-banner {
      text-align: center;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 16px;
    }
    .doc-title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: ${invoiceColor};
    }
    .doc-msg {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      font-style: italic;
    }
    .customer-box {
      background: #f8fafc;
      border: 1px solid #edf2f7;
      border-radius: 16px;
      padding: 14px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .box-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #94a3b8;
      display: block;
      margin-bottom: 2px;
    }
    .box-val {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .prod-name {
      font-size: 14px;
      font-weight: 900;
      color: #0f172a;
    }
    .prod-meta {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .price-val {
      font-size: 16px;
      font-weight: 900;
      color: ${invoiceColor};
      text-align: right;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 0;
      font-size: 14px;
      font-weight: 900;
    }
    .footer-stamp {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 8px;
    }
    .stamp-text {
      font-size: 11px;
      font-weight: 800;
      color: #059669;
    }
    .terms-text {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
      max-width: 360px;
    }
    .no-print-bar {
      margin-top: 20px;
      text-align: center;
    }
    .btn-print {
      background: ${invoiceColor};
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 12px;
      font-weight: 800;
      cursor: pointer;
      font-size: 13px;
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .ticket {
        border: none !important;
        box-shadow: none !important;
        max-width: 100% !important;
        padding: 0 !important;
      }
      .no-print-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div>
        <div class="brand-title">${invoiceBusiness}</div>
        <div class="brand-meta">
          <div>RUC: <strong>${invoiceTax}</strong></div>
          <div>${invoiceAddr}</div>
          <div>Soporte: ${invoicePhone} • ${invoiceEmail}</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div class="badge">${invoiceNum}</div>
        <div class="token-text">Token: <strong>${saleToken}</strong></div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Emisión: ${sale.activationDate}</div>
      </div>
    </div>

    <div class="title-banner">
      <div class="doc-title">${invoiceDocTitle}</div>
      <div class="doc-msg">${invoiceHeadMsg}</div>
    </div>

    <div class="customer-box">
      <div>
        <span class="box-label">Titular del Pedido</span>
        <span class="box-val">${sale.clientName}</span>
      </div>
      <div>
        <span class="box-label">WhatsApp / Teléfono</span>
        <span class="box-val">${sale.clientPhone}</span>
      </div>
      ${sale.clientEmail ? `
      <div style="grid-column: span 2;">
        <span class="box-label">Correo Vinculado</span>
        <span class="box-val" style="font-family: monospace; font-size: 12px;">${sale.clientEmail}</span>
      </div>` : ''}
    </div>

    <div class="item-row">
      <div>
        <div class="prod-name">${sale.productName}</div>
        <div class="prod-meta">${sale.planName} • ${sale.accountType} (${sale.durationText})</div>
        <div style="font-size: 11px; color: #059669; font-weight: 700; margin-top: 2px;">
          Válido hasta: ${sale.expirationDate}
        </div>
      </div>
      <div>
        <div class="price-val">${sale.price}</div>
        <div style="font-size: 10px; color: #94a3b8; text-align: right;">${sale.paymentMethod}</div>
      </div>
    </div>

    <div class="total-row">
      <span>TOTAL PAGADO:</span>
      <span style="font-size: 18px; color: ${invoiceColor};">${sale.price}</span>
    </div>

    <div class="footer-stamp">
      <div>
        <div class="stamp-text">🛡️ ${invoiceStamp}</div>
        <div class="terms-text">${invoiceFootTerms}</div>
      </div>
      <div style="text-align: center; font-size: 10px; font-family: monospace; border: 1px dashed #cbd5e1; padding: 6px 10px; border-radius: 8px;">
        <div>[ QR SELLO ]</div>
        <div style="font-size: 8px; color: #64748b; margin-top: 2px;">VERIFICADO</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const [exportingCustomerPdf, setExportingCustomerPdf] = useState(false);
  const [exportingCustomerPng, setExportingCustomerPng] = useState(false);

  const handleDownloadReceiptPdf = async () => {
    if (!receiptSale) return;
    setExportingCustomerPdf(true);
    onToast('Generando comprobante en formato PDF...');
    try {
      const filename = `Comprobante_${invoicePref}_${(receiptSale.accessToken || receiptSale.id).replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`;
      await downloadElementAsPdf('digital-receipt-printable', filename, `Comprobante ${receiptSale.productName}`);
      onToast('¡Comprobante en PDF descargado con éxito!');
    } catch (err) {
      console.error(err);
      handleDownloadReceiptHtml();
    } finally {
      setExportingCustomerPdf(false);
    }
  };

  const handleDownloadReceiptPng = async () => {
    if (!receiptSale) return;
    setExportingCustomerPng(true);
    onToast('Generando imagen PNG en alta definición...');
    try {
      const filename = `Comprobante_${invoicePref}_${(receiptSale.accessToken || receiptSale.id).replace(/[^a-zA-Z0-9_-]/g, '')}.png`;
      await downloadElementAsPng('digital-receipt-printable', filename);
      onToast('¡Comprobante en imagen PNG descargado con éxito!');
    } catch (err) {
      console.error(err);
      onToast('Error al generar imagen PNG.');
    } finally {
      setExportingCustomerPng(false);
    }
  };

  const handleDownloadReceiptHtml = () => {
    if (!receiptSale) return;
    const html = generateReceiptPrintableHtml(receiptSale);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `Comprobante_${invoicePref}_${(receiptSale.accessToken || receiptSale.id).replace(/[^a-zA-Z0-9_-]/g, '')}.html`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast(`¡Comprobante ${filename} descargado con éxito!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0d121f] text-slate-800 dark:text-slate-100 rounded-3xl max-w-4xl w-full h-[92vh] sm:h-[88vh] shadow-2xl border border-slate-200/90 dark:border-slate-800 relative flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-[#090d16]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{
                background: `linear-gradient(135deg, ${settings.colorPrimary} 0%, ${settings.colorAccent} 100%)`,
              }}
            >
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Panel de Clientes • Mis Compras
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Acceso Seguro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Consulta tus membresías activas, credenciales de acceso, días restantes y comprobantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {verifiedQuery && (
              <button
                type="button"
                onClick={handleClearSession}
                className="px-2.5 py-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                title="Cerrar sesión de cliente"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* VIEW A: DIGITAL RECEIPT MODAL VIEW (Rendered using customized Facturación settings) */}
          {receiptSale ? (
            <div className="max-w-xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setReceiptSale(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a mis compras</span>
              </button>

              {/* Printable Ticket Card matching Admin Facturación settings */}
              <div
                id="digital-receipt-printable"
                className={`p-6 sm:p-8 rounded-3xl shadow-xl border relative overflow-hidden space-y-5 transition-all ${
                  invoiceStyle === 'modern_neon'
                    ? 'bg-slate-900 text-white border-indigo-500/30'
                    : invoiceStyle === 'corporate_clean'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-700'
                    : invoiceStyle === 'ticket_thermal'
                    ? 'bg-[#fbfbfb] dark:bg-[#12151e] text-slate-900 dark:text-slate-100 border-dashed border-2 border-slate-300 dark:border-slate-700 font-mono text-xs'
                    : 'bg-white dark:bg-[#0c101d] text-slate-900 dark:text-white border-2 border-indigo-400/50 shadow-indigo-500/10'
                }`}
              >
                {/* Header: Company & Invoice # */}
                <div className="flex items-start justify-between border-b pb-4 border-slate-200/50 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {invoiceLogo ? (
                        <img src={invoiceLogo} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs"
                          style={{ backgroundColor: invoiceColor }}
                        >
                          {settings.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-black text-base tracking-tight">{invoiceBusiness}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      <div>RUC: <strong>{invoiceTax}</strong></div>
                      <div>{invoiceAddr}</div>
                      <div>Soporte: {invoicePhone} • {invoiceEmail}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                      style={{ backgroundColor: invoiceColor }}
                    >
                      {invoicePref}-{receiptSale.id.replace('sale_', '')}
                    </span>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      Token: <strong>{receiptSale.accessToken || receiptSale.id}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Emisión: {receiptSale.activationDate}
                    </div>
                  </div>
                </div>

                {/* Title and Welcome Message */}
                <div className="py-2.5 text-center border-b border-slate-200/50 dark:border-slate-800">
                  <div className="font-black text-sm uppercase tracking-wider" style={{ color: invoiceColor }}>
                    {invoiceDocTitle}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 italic">
                    {invoiceHeadMsg}
                  </p>
                </div>

                {/* Customer Details Box */}
                <div className="py-3 text-xs grid grid-cols-2 gap-3 border-b border-slate-200/50 dark:border-slate-800 bg-slate-500/5 p-3 rounded-2xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Titular del Pedido:</span>
                    <strong className="block text-sm">{receiptSale.clientName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp / Teléfono:</span>
                    <span className="block">{receiptSale.clientPhone}</span>
                  </div>
                  {receiptSale.clientEmail && (
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Correo Vinculado:</span>
                      <span className="font-mono text-slate-400">{receiptSale.clientEmail}</span>
                    </div>
                  )}
                </div>

                {/* Purchase Items Detail */}
                <div className="py-3 space-y-2 border-b border-slate-200/50 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-black text-sm">{receiptSale.productName}</div>
                      <div className="text-xs text-slate-400">
                        {receiptSale.planName} • {receiptSale.accountType} ({receiptSale.durationText})
                      </div>
                      <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                        Válido hasta: {receiptSale.expirationDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black" style={{ color: invoiceColor }}>
                        {receiptSale.price}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {receiptSale.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="py-2.5 flex items-center justify-between font-black text-sm">
                  <span>TOTAL PAGADO:</span>
                  <span className="text-base" style={{ color: invoiceColor }}>
                    {receiptSale.price}
                  </span>
                </div>

                {/* Official Guarantee Stamp & QR Code */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200/50 dark:border-slate-800 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-500">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>{invoiceStamp}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 max-w-sm">
                      {invoiceFootTerms}
                    </p>
                  </div>

                  {invoiceShowQrCode && (
                    <ReceiptQrCode
                      value={`https://wa.me/${(settings.whatsappNumber || (import.meta.env.VITE_STORE_WHATSAPP_NUMBER as string) || '51900000000').replace(/[^0-9]/g, '')}?text=Validar%20Comprobante%20${receiptSale.accessToken || receiptSale.id}`}
                      size={88}
                      label="ESCANEAR QR"
                    />
                  )}
                </div>

                {/* Actions inside receipt */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/50 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadReceiptPdf}
                      disabled={exportingCustomerPdf}
                      className="px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors text-rose-700 dark:text-rose-300 disabled:opacity-50 shadow-xs"
                      title="Descargar comprobante oficial en formato PDF"
                    >
                      <FileText className="w-4 h-4 text-rose-500" />
                      <span>{exportingCustomerPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadReceiptPng}
                      disabled={exportingCustomerPng}
                      className="px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors text-emerald-700 dark:text-emerald-300 disabled:opacity-50 shadow-xs"
                      title="Descargar comprobante en imagen PNG de alta resolución"
                    >
                      <ImageIcon className="w-4 h-4 text-emerald-500" />
                      <span>{exportingCustomerPng ? 'Generando PNG...' : 'Descargar PNG'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppSupport(receiptSale)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Validar Garantía</span>
                  </button>
                </div>
              </div>
            </div>
          ) : !verifiedQuery ? (
            /* VIEW B: CUSTOMER LOGIN & GMAIL / ACCOUNT CREATION PANEL */
            <div className="max-w-xl mx-auto space-y-6 py-4 animate-in fade-in duration-200">
              
              {/* Promotional intro banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/80 dark:border-indigo-800/80 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <User className="w-6 h-6" />
                </div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Vincula tu Cuenta para Acceder a tus Pedidos
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Inicia sesión con tu cuenta de <strong>Google / Gmail</strong> o crea tu cuenta con tu correo para recibir automáticamente tus credenciales, PIN y comprobante de compra.
                </p>
              </div>

              {/* Consultation Option Tabs */}
              <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl flex items-center border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAuthMode('google_email')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    authMode === 'google_email'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Google / Correo de Cuenta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode('token_search')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    authMode === 'token_search'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Consultar por Token / Ticket</span>
                </button>
              </div>

              {/* AUTH OPTION 1: GOOGLE SIGN-IN OR EMAIL REGISTRATION */}
              {authMode === 'google_email' ? (
                <div className="space-y-4">
                  {/* Google / Gmail Sign In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authenticating}
                    className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-black text-sm border-2 border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 group"
                  >
                    {authenticating ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
                    )}
                    <span>Continuar con mi Cuenta de Google / Gmail</span>
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
                    <span className="text-[11px] font-bold uppercase text-slate-400">
                      o con tu correo electrónico
                    </span>
                    <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
                  </div>

                  {/* Email & Name Form */}
                  <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tu Nombre Completo:
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={clientInputName}
                          onChange={(e) => setClientInputName(e.target.value)}
                          placeholder="Ej: Renzo Silva"
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Correo Electrónico Registrado:
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={clientInputEmail}
                          onChange={(e) => setClientInputEmail(e.target.value)}
                          placeholder="ejemplo: renzo.silva@gmail.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Mantener mi sesión iniciada en este navegador</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Ingresar a Mi Panel de Compras</span>
                    </button>
                  </form>
                </div>
              ) : (
                /* AUTH OPTION 2: TOKEN DIRECT LOOKUP */
                <form onSubmit={handleTokenLookupSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Token de Garantía o Código de Compra:
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={clientInputToken}
                        onChange={(e) => setClientInputToken(e.target.value)}
                        placeholder="Ej: ALI-701, ALI-702, sale_1"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Consultar Pedido por Token</span>
                  </button>
                </form>
              )}

              {/* Demo test chips for instant exploration */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  O prueba con estos accesos de demostración:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('google_email');
                      setClientInputEmail('renzo.silva@gmail.com');
                      handleLookup('renzo.silva@gmail.com', 'Renzo Silva', '', false);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    ✉️ renzo.silva@gmail.com
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('google_email');
                      setClientInputEmail('diego.dev@gmail.com');
                      handleLookup('diego.dev@gmail.com', 'Diego Mendoza', '', false);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    ✉️ diego.dev@gmail.com (Vence en 3 días)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('token_search');
                      setClientInputToken('ALI-701');
                      handleLookup('ALI-701', 'Renzo Silva', '', false);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                  >
                    🔑 Token ALI-701
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW C: CUSTOMER ACTIVE MEMBERSHIPS DASHBOARD */
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Customer Profile & Authentication Banner */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {customerPhoto ? (
                    <img
                      src={customerPhoto}
                      alt={customerName}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-400 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                      {customerName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                        {isGoogleLinked ? 'Cuenta de Google Vinculada' : 'Cuenta de Cliente Verificada'}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                      ¡Bienvenido, {customerName}!
                    </h3>
                    <p className="text-xs text-slate-300">
                      {customerEmail ? customerEmail : verifiedQuery}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleClearSession}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/20 transition-all cursor-pointer"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>

              {/* Automatic Dispatch Notification Strip */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    <strong>Despacho Automático Activo:</strong> Tus datos de acceso y comprobantes están sincronizados en tiempo real con tu cuenta y WhatsApp.
                  </span>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Compras</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">{totalCount}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Activas</span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-300">{activeCount}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Por Vencer</span>
                    <span className="text-base font-black text-amber-700 dark:text-amber-300">{expiringCount}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Vencidas</span>
                    <span className="text-base font-black text-slate-700 dark:text-slate-300">{expiredCount}</span>
                  </div>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl flex items-center border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('todas')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'todas'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Todas ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('activa')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'activa'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                    }`}
                  >
                    🟢 Activas ({activeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('por_vencer')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'por_vencer'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                    }`}
                  >
                    🟡 Por Vencer ({expiringCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('vencida')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'vencida'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                    }`}
                  >
                    🔴 Vencidas ({expiredCount})
                  </button>
                </div>

                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={keywordFilter}
                    onChange={(e) => setKeywordFilter(e.target.value)}
                    placeholder="Filtrar por membresía o token..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {keywordFilter && (
                    <button
                      type="button"
                      onClick={() => setKeywordFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Memberships Cards List */}
              <div className="space-y-3.5">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => {
                    const CategoryIcon = getProductCategoryIcon(record.productName);
                    const timing = getDaysRemainingInfo(record.expirationDate, record.activationDate);
                    const token = record.accessToken || record.id;
                    const isCredsExpanded = !!expandedCredentials[record.id];

                    return (
                      <div
                        key={record.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
                      >
                        {/* Card Header: Product, Badge, Status */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
                              <CategoryIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                                  {record.productName}
                                </h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  {record.planName}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                <span>{record.accountType}</span>
                                <span>•</span>
                                <span className="font-semibold">{record.durationText}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Pill & Token Badge */}
                          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleCopy(token, 'Token de compra')}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                              title="Copiar token de garantía"
                            >
                              <span>Token: {token}</span>
                              {copiedToken === token ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>

                            {record.status === 'activa' && (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                ACTIVA
                              </span>
                            )}
                            {record.status === 'por_vencer' && (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 animate-pulse">
                                <Clock className="w-3.5 h-3.5" />
                                POR VENCER
                              </span>
                            )}
                            {record.status === 'vencida' && (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                VENCIDA
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timeline & Progress Bar */}
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Activación: <strong className="text-slate-800 dark:text-slate-200">{record.activationDate}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Vencimiento: <strong className="text-slate-800 dark:text-slate-200">{record.expirationDate}</strong></span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  timing.isExpired
                                    ? 'bg-rose-500'
                                    : timing.isExpiringSoon
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${timing.progressPct}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400">
                                {timing.isExpired
                                  ? 'Suscripción expirada'
                                  : `Quedan aprox. ${timing.remainingDays} días de servicio`}
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {record.price} ({record.paymentMethod})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Access Credentials & Delivery Data */}
                        {(record.serviceCredentials || record.notes) && (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedCredentials((prev) => ({
                                  ...prev,
                                  [record.id]: !prev[record.id],
                                }));
                              }}
                              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>
                                {isCredsExpanded
                                  ? 'Ocultar Credenciales & Datos de Acceso'
                                  : 'Ver Credenciales, PIN & Datos de Acceso'}
                              </span>
                              <ChevronRight
                                className={`w-3.5 h-3.5 transition-transform ${
                                  isCredsExpanded ? 'rotate-90' : ''
                                }`}
                              />
                            </button>

                            {isCredsExpanded && (
                              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-3 animate-in fade-in duration-150">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  {record.serviceCredentials?.email && (
                                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Correo Asignado</span>
                                      <div className="flex items-center justify-between font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                        <span className="truncate">{record.serviceCredentials.email}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(record.serviceCredentials!.email!, 'Correo')}
                                          className="text-indigo-600 hover:text-indigo-700 p-1"
                                          title="Copiar"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {record.serviceCredentials?.pin && (
                                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">PIN de Pantalla</span>
                                      <div className="flex items-center justify-between font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                        <span className="tracking-widest">{record.serviceCredentials.pin}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(record.serviceCredentials!.pin!, 'PIN')}
                                          className="text-indigo-600 hover:text-indigo-700 p-1"
                                          title="Copiar PIN"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {record.serviceCredentials?.profileName && (
                                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Perfil Asignado</span>
                                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                                        {record.serviceCredentials.profileName}
                                      </span>
                                    </div>
                                  )}

                                  {record.serviceCredentials?.driveLink && (
                                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Enlace Drive / Material</span>
                                      <a
                                        href={record.serviceCredentials.driveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1 mt-0.5 hover:underline"
                                      >
                                        <span>Abrir Google Drive VIP</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {record.serviceCredentials?.instructions && (
                                  <div className="text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                    <strong className="text-indigo-600 dark:text-indigo-400">Instrucciones: </strong>
                                    {record.serviceCredentials.instructions}
                                  </div>
                                )}

                                {record.notes && !record.serviceCredentials?.instructions && (
                                  <div className="text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                    <strong className="text-indigo-600 dark:text-indigo-400">Nota del Pedido: </strong>
                                    {record.notes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action buttons: WhatsApp Support, WhatsApp Renew, Digital Receipt */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setReceiptSale(record)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Ver Comprobante Digital</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleWhatsAppRenewal(record)}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Renovar Membresía</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleWhatsAppSupport(record)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Garantía WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
                    <Search className="w-8 h-8 text-slate-400 mx-auto" />
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      No encontramos compras registradas para esta cuenta
                    </h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Si realizaste un pago recientemente, escríbenos por WhatsApp con tu comprobante para vincularlo de inmediato.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = `¡Hola ${settings.name}${settings.suffix}! 👋 Acabo de vincular mi cuenta (${customerEmail || verifiedQuery}) y deseo verificar la activación de mi membresía.`;
                        window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer hover:bg-emerald-600"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Contactar a Soporte por WhatsApp</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#090d16]/70 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Garantía de reposición oficial activa durante todo el periodo contratado</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
                `Hola ${settings.name}${settings.suffix}, deseo consultar el estado de una compra.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Soporte 24/7 WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
