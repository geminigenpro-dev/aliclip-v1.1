import React, { useState } from 'react';
import {
  Receipt,
  Building2,
  FileText,
  Palette,
  ShieldCheck,
  QrCode,
  Download,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  Eye,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  HelpCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { saveSettingsToFirestore } from '../../services/storeService';
import { ReceiptQrCode } from '../ReceiptQrCode';
import {
  downloadElementAsPdf,
  downloadElementAsPng,
} from '../../utils/receiptExporter';

interface AdminBillingTabProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onToast: (msg: string) => void;
}

export const AdminBillingTab: React.FC<AdminBillingTabProps> = ({
  settings,
  onUpdateSettings,
  onToast,
}) => {
  // Local form state
  const [businessName, setBusinessName] = useState(
    settings.invoiceBusinessName || `${settings.name}${settings.suffix} Digital Services S.A.C.`
  );
  const [taxId, setTaxId] = useState(settings.invoiceTaxId || '20608945123');
  const [address, setAddress] = useState(
    settings.invoiceAddress || 'Av. Javier Prado Este 4200, Santiago de Surco, Lima - Perú'
  );
  const [contactEmail, setContactEmail] = useState(
    settings.invoiceContactEmail || 'facturacion@alixperu.com'
  );
  const [contactPhone, setContactPhone] = useState(
    settings.invoiceContactPhone || settings.whatsappDisplay || '+51 987 654 321'
  );
  const [prefix, setPrefix] = useState(settings.invoicePrefix || 'B001');
  const [title, setTitle] = useState(
    settings.invoiceTitle || 'COMPROBANTE DE PAGO DIGITAL'
  );
  const [templateStyle, setTemplateStyle] = useState<
    'modern_neon' | 'corporate_clean' | 'ticket_thermal' | 'official_qr'
  >(settings.invoiceTemplateStyle || 'modern_neon');
  const [primaryColor, setPrimaryColor] = useState(
    settings.invoicePrimaryColor || settings.colorPrimary || '#6366f1'
  );
  const [logoBase64, setLogoBase64] = useState(
    settings.invoiceLogoBase64 || ''
  );
  const [stampText, setStampText] = useState(
    settings.invoiceStampText || `GARANTÍA TOTAL 100% ACTIVA • AUTORIZADO ${settings.name.toUpperCase()}`
  );
  const [headerMessage, setHeaderMessage] = useState(
    settings.invoiceHeaderMessage ||
      '¡Gracias por tu compra! Tu membresía ha sido activada con garantía y respaldo técnico directo.'
  );
  const [footerTerms, setFooterTerms] = useState(
    settings.invoiceFooterTerms ||
      'Este comprobante digital garantiza el reemplazo inmediato de cuentas durante todo el periodo contratado. Atención y reclamos disponibles 24/7.'
  );
  const [showQr, setShowQr] = useState<boolean>(
    settings.invoiceShowQr !== false
  );

  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    onToast('Generando comprobante de muestra en PDF...');
    try {
      await downloadElementAsPdf(
        'billing-preview-ticket',
        `Comprobante_Muestra_${prefix || 'B001'}.pdf`,
        `${title || 'Comprobante'} - Muestra Oficial`
      );
      onToast('¡Muestra en formato PDF descargada con éxito!');
    } catch (err) {
      console.error('PDF export error:', err);
      onToast('Error al generar PDF. Intenta nuevamente.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    setExportingPng(true);
    onToast('Generando imagen PNG de alta definición...');
    try {
      await downloadElementAsPng(
        'billing-preview-ticket',
        `Comprobante_Muestra_${prefix || 'B001'}.png`
      );
      onToast('¡Imagen PNG descargada con éxito!');
    } catch (err) {
      console.error('PNG export error:', err);
      onToast('Error al generar PNG. Intenta nuevamente.');
    } finally {
      setExportingPng(false);
    }
  };

  // File upload for invoice logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        onToast('La imagen es muy pesada. Debe ser menor a 1.5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setLogoBase64(reader.result as string);
        onToast('Logo de facturación cargado.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated: StoreSettings = {
        ...settings,
        invoiceBusinessName: businessName.trim(),
        invoiceTaxId: taxId.trim(),
        invoiceAddress: address.trim(),
        invoiceContactEmail: contactEmail.trim(),
        invoiceContactPhone: contactPhone.trim(),
        invoicePrefix: prefix.trim(),
        invoiceTitle: title.trim(),
        invoiceTemplateStyle: templateStyle,
        invoicePrimaryColor: primaryColor,
        invoiceLogoBase64: logoBase64,
        invoiceStampText: stampText.trim(),
        invoiceHeaderMessage: headerMessage.trim(),
        invoiceFooterTerms: footerTerms.trim(),
        invoiceShowQr: showQr,
        updatedAt: new Date().toISOString(),
      };

      await saveSettingsToFirestore(updated);
      onUpdateSettings(updated);
      onToast('¡Configuración de facturación guardada exitosamente!');
    } catch (err) {
      console.error(err);
      onToast('Error al guardar configuración de facturación.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setBusinessName(`${settings.name}${settings.suffix} Digital Services S.A.C.`);
    setTaxId('20608945123');
    setAddress('Av. Javier Prado Este 4200, Santiago de Surco, Lima - Perú');
    setContactEmail('facturacion@alixperu.com');
    setContactPhone(settings.whatsappDisplay || '+51 987 654 321');
    setPrefix('B001');
    setTitle('COMPROBANTE DE PAGO DIGITAL');
    setTemplateStyle('modern_neon');
    setPrimaryColor(settings.colorPrimary || '#6366f1');
    setLogoBase64('');
    setStampText(`GARANTÍA TOTAL 100% ACTIVA • AUTORIZADO ${settings.name.toUpperCase()}`);
    setHeaderMessage('¡Gracias por tu compra! Tu membresía ha sido activada con garantía y respaldo técnico.');
    setFooterTerms('Este comprobante digital garantiza el reemplazo inmediato de cuentas durante todo el periodo contratado.');
    setShowQr(true);
    onToast('Valores restaurados por defecto. Haz clic en Guardar para persistir.');
  };

  // Color preset options
  const colorPresets = ['#6366f1', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#0f172a'];

  const effectiveLogo = logoBase64 || settings.logoBase64 || settings.faviconBase64;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              Facturación & Comprobantes de Pago
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personaliza el diseño, datos fiscales, RUC, estilos visuales y logotipo de los comprobantes que reciben tus clientes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Column (Settings Form) & Right Column (Live Invoice Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Form Column */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
          
          {/* Card 1: Datos de la Empresa / Emisor */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>1. Datos del Emisor & Empresa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Comercial / Razón Social:
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  RUC / NIT / Documento Fiscal:
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="ej: 20608945123"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Serie / Prefijo del Ticket:
                </label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="ej: B001, CP-2026, TK"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección Fiscal o Comercial:
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correo de Facturación / Soporte:
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp de Contacto en Comprobante:
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Estilo Visual & Plantilla */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              <Palette className="w-4 h-4" />
              <span>2. Plantilla Visual & Estilo de Comprobante</span>
            </div>

            {/* Template selector cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  id: 'modern_neon',
                  title: 'Moderno Neón VIP',
                  desc: 'Bordes suaves, gradientes sutiles y badges tecnológicos',
                  badge: 'Recomendado',
                },
                {
                  id: 'corporate_clean',
                  title: 'Corporativo Minimalista',
                  desc: 'Diseño limpio y formal en blanco y negro para empresas',
                  badge: 'Formal',
                },
                {
                  id: 'ticket_thermal',
                  title: 'Ticket Térmico Digital',
                  desc: 'Estilo recibo de caja de punto de venta con líneas punteadas',
                  badge: 'Ticket',
                },
                {
                  id: 'official_qr',
                  title: 'Oficial con QR & Sello',
                  desc: 'Certificación digital con sello de seguridad y código QR',
                  badge: 'Oficial',
                },
              ].map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setTemplateStyle(tmpl.id as any)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    templateStyle === tmpl.id
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {tmpl.title}
                      </span>
                      <span
                        className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold ${
                          templateStyle === tmpl.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {tmpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {tmpl.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Color & Logo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Color de Acento del Comprobante:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
                {/* Palette chips */}
                <div className="flex items-center gap-1.5 mt-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimaryColor(c)}
                      className="w-5 h-5 rounded-full border border-white dark:border-slate-800 shadow-2xs hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Logo for Invoice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Logo Exclusivo de Facturación:
                </label>
                <div className="flex items-center gap-2">
                  {effectiveLogo ? (
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden p-1 shrink-0">
                      <img src={effectiveLogo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {settings.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <label className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{logoBase64 ? 'Cambiar Logo' : 'Subir Logo Propio'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {logoBase64 && (
                    <button
                      type="button"
                      onClick={() => setLogoBase64('')}
                      className="text-xs text-rose-500 hover:underline cursor-pointer"
                      title="Usar logo general de la tienda"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Si no subes uno, se usará el logotipo general de la marca.
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Textos, Sello & Verificación QR */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              <FileText className="w-4 h-4" />
              <span>3. Textos del Documento & Garantía</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título Principal del Documento:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mensaje de Bienvenida / Encabezado:
                </label>
                <input
                  type="text"
                  value={headerMessage}
                  onChange={(e) => setHeaderMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Texto del Sello de Garantía Oficial:
                </label>
                <input
                  type="text"
                  value={stampText}
                  onChange={(e) => setStampText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Términos de Garantía y Ley al Pie de Página:
                </label>
                <textarea
                  rows={2}
                  value={footerTerms}
                  onChange={(e) => setFooterTerms(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={showQr}
                    onChange={(e) => setShowQr(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Mostrar Código QR de Verificación Digital en Comprobantes</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Guardar Configuración de Facturación</span>
          </button>
        </form>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 sticky top-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              Previsualización en Vivo
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Tiempo Real
            </span>
          </div>

          {/* Simulated Invoice Display */}
          <div
            id="billing-preview-ticket"
            className={`p-5 rounded-3xl shadow-xl border relative transition-all ${
              templateStyle === 'modern_neon'
                ? 'bg-slate-900 text-white border-indigo-500/30'
                : templateStyle === 'corporate_clean'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-700'
                : templateStyle === 'ticket_thermal'
                ? 'bg-[#fbfbfb] dark:bg-[#12151e] text-slate-900 dark:text-slate-100 border-dashed border-2 border-slate-300 dark:border-slate-700 font-mono text-xs'
                : 'bg-white dark:bg-[#0c101d] text-slate-900 dark:text-white border-2 border-indigo-400/50 shadow-indigo-500/10'
            }`}
          >
            {/* Header: Company & Invoice # */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-200/50 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {effectiveLogo ? (
                    <img src={effectiveLogo} alt="Logo" className="w-7 h-7 object-contain rounded-lg" />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {settings.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="font-black text-sm tracking-tight">{businessName}</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  <div>RUC: {taxId}</div>
                  <div className="truncate max-w-[200px]">{address}</div>
                </div>
              </div>

              <div className="text-right">
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {prefix}-00492
                </span>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  {new Date().toISOString().split('T')[0]}
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="py-2.5 text-center border-b border-slate-200/50 dark:border-slate-800">
              <div className="font-extrabold text-xs uppercase tracking-wider" style={{ color: primaryColor }}>
                {title}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 italic">
                {headerMessage}
              </p>
            </div>

            {/* Customer Details Box */}
            <div className="py-3 text-[11px] grid grid-cols-2 gap-2 border-b border-slate-200/50 dark:border-slate-800">
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Cliente:</span>
                <strong className="block truncate">Renzo Silva</strong>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Correo / Celular:</span>
                <span className="block truncate text-slate-400">renzo.silva@gmail.com</span>
              </div>
            </div>

            {/* Line Items Sample */}
            <div className="py-3 space-y-2 border-b border-slate-200/50 dark:border-slate-800 text-[11px]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">ChatGPT Plus • Perfil Privado</div>
                  <div className="text-[10px] text-slate-400">1 Mes VIP (Vigencia 30 días)</div>
                </div>
                <div className="text-right font-black">
                  S/ 45.00
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="py-2.5 flex items-center justify-between font-black text-xs">
              <span>IMPORTE TOTAL:</span>
              <span className="text-sm" style={{ color: primaryColor }}>
                S/ 45.00 (Pagado vía Yape)
              </span>
            </div>

            {/* Official Stamp & QR */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/50 dark:border-slate-800 text-[10px]">
              <div className="space-y-1 max-w-[200px]">
                <div className="flex items-center gap-1 font-bold text-emerald-500">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{stampText}</span>
                </div>
                <p className="text-[9px] text-slate-400 line-clamp-2">
                  {footerTerms}
                </p>
              </div>

              {showQr && (
                <ReceiptQrCode
                  value={`https://wa.me/${(settings.whatsappNumber || '51987654321').replace(/[^0-9]/g, '')}?text=Validar%20Comprobante%20${prefix || 'B001'}-MUESTRA`}
                  size={84}
                  label="ESCANEAR QR"
                />
              )}
            </div>
          </div>

          {/* Download options: PDF and PNG */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Descargar Muestra de Comprobante</span>
            </div>

            {/* Download format options: PDF and PNG */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                className="py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 shadow-xs"
                title="Descargar muestra en formato PDF oficial"
              >
                <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{exportingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={exportingPng}
                className="py-2.5 px-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 shadow-xs"
                title="Descargar muestra en imagen PNG en alta definición"
              >
                <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{exportingPng ? 'Generando PNG...' : 'Descargar PNG'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
