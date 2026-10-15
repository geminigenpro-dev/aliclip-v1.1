import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Mail,
  Lock,
  User,
  ExternalLink,
  FileText,
  Send,
  CheckCircle2,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { SaleRecord, ServiceCredentials } from '../../types';
import { updateSaleCredentials } from '../../services/storeService';
import { sendSaleCredentialsNotification } from '../../services/notificationService';
import { detectMaliciousPayload, sanitizeStrictText } from '../../utils/securityValidator';

interface AdminCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleRecord | null;
  storeName?: string;
  webhookUrl?: string;
  onToast: (msg: string) => void;
  onSuccess?: () => void;
}

export const AdminCredentialsModal: React.FC<AdminCredentialsModalProps> = ({
  isOpen,
  onClose,
  sale,
  storeName = 'AliClip Store',
  webhookUrl,
  onToast,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [profileName, setProfileName] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sale) {
      const creds = sale.serviceCredentials || {};
      setEmail(creds.email || '');
      setPin(creds.pin || creds.password || '');
      setProfileName(creds.profileName || '');
      setDriveLink(creds.driveLink || '');
      setInstructions(creds.instructions || '');
    } else {
      setEmail('');
      setPin('');
      setProfileName('');
      setDriveLink('');
      setInstructions('');
    }
    setCopied(false);
  }, [sale]);

  if (!isOpen || !sale) return null;

  const handleSaveOnly = async () => {
    // Validar entradas
    if (
      detectMaliciousPayload(email).isMalicious ||
      detectMaliciousPayload(pin).isMalicious ||
      detectMaliciousPayload(profileName).isMalicious
    ) {
      onToast('⚠️ Las credenciales contienen caracteres no permitidos.');
      return;
    }

    setSaving(true);
    try {
      const creds: ServiceCredentials = {
        email: sanitizeStrictText(email, 120),
        pin: sanitizeStrictText(pin, 50),
        profileName: sanitizeStrictText(profileName, 60),
        driveLink: sanitizeStrictText(driveLink, 250),
        instructions: sanitizeStrictText(instructions, 500),
      };

      await updateSaleCredentials(sale.id, creds);
      onToast('¡Credenciales actualizadas y sincronizadas en el panel del cliente!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      onToast('Error al guardar credenciales.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndDispatch = async () => {
    if (
      detectMaliciousPayload(email).isMalicious ||
      detectMaliciousPayload(pin).isMalicious ||
      detectMaliciousPayload(profileName).isMalicious
    ) {
      onToast('⚠️ Las credenciales contienen caracteres no permitidos.');
      return;
    }

    setSaving(true);
    try {
      const creds: ServiceCredentials = {
        email: sanitizeStrictText(email, 120),
        pin: sanitizeStrictText(pin, 50),
        profileName: sanitizeStrictText(profileName, 60),
        driveLink: sanitizeStrictText(driveLink, 250),
        instructions: sanitizeStrictText(instructions, 500),
      };

      // 1. Guardar en BD / LocalStorage para que el cliente lo vea en su panel "Mis compras"
      await updateSaleCredentials(sale.id, creds);

      // 2. Despachar notificación automática a correo y WhatsApp (MailerSend / Webhook)
      const notifRes = await sendSaleCredentialsNotification(sale, creds, storeName);

      // 3. Abrir WhatsApp con el mensaje estructurado de credenciales
      if (notifRes.waUrl) {
        try {
          window.open(notifRes.waUrl, '_blank', 'noopener,noreferrer');
        } catch {}
      }

      const emailNote = sale.clientEmail ? ` y al correo (${sale.clientEmail}) desde soporte@aliclip.site` : '';
      onToast(`¡Credenciales sincronizadas en el Panel del Cliente y enviadas a WhatsApp (${sale.clientPhone})${emailNote}!`);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      onToast('Error al despachar credenciales.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyMessage = () => {
    const creds: ServiceCredentials = {
      email,
      pin,
      profileName,
      driveLink,
      instructions,
    };
    const saleToken = sale.accessToken || sale.id;

    let msg = `¡Hola ${sale.clientName}! 🚀✨
Te enviamos las credenciales oficiales de tu compra en *${storeName}*:

📦 *Servicio:* ${sale.productName} (${sale.planName} - ${sale.durationText})
🗓️ *Vigente hasta:* ${sale.expirationDate}
🔑 *Código de Pedido:* ${saleToken}

🔐 *TUS DATOS DE ACCESO:*
━━━━━━━━━━━━━━━━━━━━`;
    if (email) msg += `\n📧 *Usuario / Correo:* ${email}`;
    if (pin) msg += `\n🔑 *PIN / Contraseña:* ${pin}`;
    if (profileName) msg += `\n👤 *Perfil:* ${profileName}`;
    if (driveLink) msg += `\n📁 *Drive / Material:* ${driveLink}`;
    if (instructions) msg += `\n📌 *Instrucciones:* ${instructions}`;
    msg += `\n━━━━━━━━━━━━━━━━━━━━
💡 También puedes consultar tu pedido y descargar tu comprobante en: https://aliclip.site`;

    navigator.clipboard.writeText(msg);
    setCopied(true);
    onToast('¡Mensaje copiado al portapapeles!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Datos de Acceso &amp; Credenciales
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sincronización con Panel del Cliente, Correo y WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
          {/* Resumen del Cliente y Pedido */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-xs">
                <span>{sale.clientName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                  {sale.accessToken || sale.id}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {sale.productName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-semibold">{sale.clientPhone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{sale.clientEmail || 'Sin correo registrado'}</span>
              </div>
            </div>
          </div>

          {/* Formulario de Credenciales */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                <span>Correo / Usuario de Acceso:</span>
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej: cliente@netflixvip.pe"
                className="w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Contraseña o PIN de Pantalla:</span>
                </label>
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="ej: 4092 o Clave123"
                  className="w-full px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-500" />
                  <span>Perfil Asignado:</span>
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="ej: Perfil 3 (Renzo)"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
                <span>Enlace Google Drive / Material (Opcional):</span>
              </label>
              <input
                type="url"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Instrucciones / Reglas de Uso:</span>
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="ej: No cambiar correo ni contraseña. Conectar únicamente en 1 dispositivo."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              />
            </div>
          </div>

          {/* Información de Confianza & Envío Automático */}
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/40 text-[11px] text-indigo-950 dark:text-indigo-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Sincronización Multi-Canal Automática</span>
            </div>
            <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-tight">
              Al hacer clic en <strong>Guardar y Enviar</strong>, las credenciales aparecerán de inmediato en el panel del cliente en <em>"Mis compras"</em> y se enviará una copia completa a su WhatsApp ({sale.clientPhone}) desde el canal soporte (+51967693595) y vía correo electrónico desde <strong>soporte@aliclip.site</strong> a {sale.clientEmail || 'su correo registrado'}.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar Mensaje'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveOnly}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Solo Guardar en Panel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAndDispatch}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{saving ? 'Despachando...' : 'Guardar y Enviar al Cliente'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
