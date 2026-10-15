/**
 * ALICLIP NOTIFICATION & CREDENTIALS DISPATCH SERVICE
 *
 * Maneja el envío y sincronización de:
 * 1. Copia de registro de cliente (Nombre, Correo, WhatsApp) enviada al correo y WhatsApp.
 * 2. Copia oficial de datos de acceso/credenciales (Usuario, PIN, Perfil, Instrucciones)
 *    al confirmar la venta por administración, sincronizada con el panel de clientes, correo y WhatsApp.
 */

import { SaleRecord, ServiceCredentials } from '../types';

export interface RegistrationNotificationData {
  name: string;
  email: string;
  phone: string;
}

export interface NotificationResult {
  success: boolean;
  emailSent: boolean;
  waUrl: string;
  message: string;
  error?: string;
}

export const OFFICIAL_SUPPORT_EMAIL = 'soporte@aliclip.site';
export const OFFICIAL_SUPPORT_WHATSAPP = '+51967693595';
export const OFFICIAL_SUPPORT_WHATSAPP_DIGITS = '51967693595';

/**
 * Normaliza y formatea el número de teléfono para enlaces de WhatsApp de Perú o internacional
 */
export function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  // Si no empieza con código de país (y tiene 9 dígitos ej: 987654321), asumir Perú (+51)
  if (digits.length === 9 && digits.startsWith('9')) {
    return `51${digits}`;
  }
  return digits;
}

/**
 * Genera el mensaje oficial de bienvenida y confirmación de registro para WhatsApp
 */
export function buildRegistrationWhatsAppMessage(data: RegistrationNotificationData, storeName: string = 'AliClip Store'): string {
  const cleanName = data.name.trim();
  const cleanEmail = data.email.trim();
  const cleanPhone = data.phone.trim();
  const clientToken = `CLI-${Date.now().toString().slice(-5)}`;

  return `¡Hola ${cleanName}! 👋🎉
Te damos una cordial bienvenida a *${storeName}*.

Tu cuenta de cliente ha sido registrada exitosamente con los siguientes datos:
━━━━━━━━━━━━━━━━━━━━
👤 *Titular:* ${cleanName}
📧 *Correo registrado:* ${cleanEmail}
📱 *WhatsApp vinculado:* ${cleanPhone}
🛡️ *Código de Cliente:* ${clientToken}
━━━━━━━━━━━━━━━━━━━━

✅ *Beneficios de tu cuenta:*
• Acceso las 24 horas a tu panel en *"Mis compras"*
• Historial completo de tus suscripciones, perfiles y PINs
• Comprobantes oficiales digitales con descarga en PDF y PNG
• Garantía oficial de reposición activa durante toda tu membresía

📬 *Importante sobre tus accesos:*
Una vez confirmada cualquier compra desde el panel admin, el envío oficial de tus datos de acceso se realizará directamente a tu correo registrado (*${cleanEmail}*) desde *${OFFICIAL_SUPPORT_EMAIL}* y copia a este WhatsApp.

Puedes ingresar en cualquier momento desde nuestra web oficial:
🔗 https://aliclip.site

💬 *Canal Oficial de Soporte:*
• Correo: ${OFFICIAL_SUPPORT_EMAIL}
• WhatsApp Oficial: ${OFFICIAL_SUPPORT_WHATSAPP}

¡Gracias por confiar en nosotros! Estamos a tu servicio.`;
}

/**
 * Genera el mensaje oficial de credenciales y activación de venta para WhatsApp
 */
export function buildCredentialsWhatsAppMessage(
  sale: SaleRecord,
  credentials?: ServiceCredentials,
  storeName: string = 'AliClip Store'
): string {
  const creds = credentials || sale.serviceCredentials || {};
  const cleanName = sale.clientName.trim();
  const saleToken = sale.accessToken || sale.id.replace('sale_', 'ALI-');

  let text = `¡Hola ${cleanName}! 🚀✨
Tu compra en *${storeName}* ha sido *CONFIRMADA Y ACTIVADA* con éxito por administración.

📦 *DETALLES DEL SERVICIO:*
• *Producto:* ${sale.productName}
• *Plan contratado:* ${sale.planName} (${sale.durationText})
• *Modalidad:* ${sale.accountType}
• *Vigencia hasta:* ${sale.expirationDate}
• *Código de Pedido:* ${saleToken}

🔐 *TUS DATOS DE ACCESO OFICIALES:*
━━━━━━━━━━━━━━━━━━━━`;

  if (creds.email) {
    text += `\n📧 *Usuario / Correo:* ${creds.email}`;
  }
  if (creds.pin) {
    text += `\n🔑 *Contraseña / PIN:* ${creds.pin}`;
  }
  if (creds.profileName) {
    text += `\n👤 *Perfil Asignado:* ${creds.profileName}`;
  }
  if (creds.driveLink) {
    text += `\n📁 *Material / Drive:* ${creds.driveLink}`;
  }
  if (creds.instructions) {
    text += `\n📌 *Instrucciones:* ${creds.instructions}`;
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━

📬 *ENVÍO OFICIAL POR CORREO ELECTRÓNICO:*
Se ha despachado una copia completa de estos datos desde *${OFFICIAL_SUPPORT_EMAIL}* a tu correo registrado (*${sale.clientEmail || 'correo vinculado'}*).
⚠️ *Por favor revisa tu bandeja de entrada y la carpeta de spam / no deseados.*

💡 *Acceso al Panel del Cliente:*
Tus datos ya están sincronizados en tu panel *"Mis compras"*, donde podrás ver tu tiempo restante y descargar tu comprobante oficial en PDF/PNG:
🔗 https://aliclip.site

🛡️ *Soporte & Garantía AliClip:*
• Correo Oficial: ${OFFICIAL_SUPPORT_EMAIL}
• WhatsApp Soporte: ${OFFICIAL_SUPPORT_WHATSAPP}
¡Disfruta al máximo de tu membresía con reposición y soporte continuo!`;

  return text;
}

/**
 * 1. Envía notificación de registro del usuario (Correo y prepara WhatsApp)
 */
export async function sendRegistrationNotification(
  data: RegistrationNotificationData,
  storeName: string = 'AliClip Store'
): Promise<NotificationResult> {
  const waPhone = formatWhatsAppPhone(data.phone);
  const waMessage = buildRegistrationWhatsAppMessage(data, storeName);
  const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}` : '';

  let emailSent = false;
  try {
    const res = await fetch('/api/notifications/registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone,
        senderEmail: OFFICIAL_SUPPORT_EMAIL,
        supportWhatsApp: OFFICIAL_SUPPORT_WHATSAPP,
        storeName,
      }),
    });
    if (res.ok) {
      emailSent = true;
    }
  } catch (err) {
    console.warn('Endpoint /api/notifications/registration fallback:', err);
  }

  return {
    success: true,
    emailSent,
    waUrl,
    message: waMessage,
  };
}

/**
 * 2. Envía notificación de confirmación de venta con credenciales (Correo y prepara WhatsApp)
 */
export async function sendSaleCredentialsNotification(
  sale: SaleRecord,
  credentials?: ServiceCredentials,
  storeName: string = 'AliClip Store'
): Promise<NotificationResult> {
  const creds = credentials || sale.serviceCredentials || {};
  const waPhone = formatWhatsAppPhone(sale.clientPhone);
  const waMessage = buildCredentialsWhatsAppMessage(sale, creds, storeName);
  const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}` : '';

  let emailSent = false;
  try {
    const res = await fetch('/api/notifications/sale-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saleId: sale.id,
        accessToken: sale.accessToken,
        clientName: sale.clientName,
        clientEmail: sale.clientEmail,
        clientPhone: sale.clientPhone,
        productName: sale.productName,
        planName: sale.planName,
        price: sale.price,
        accountType: sale.accountType,
        durationText: sale.durationText,
        activationDate: sale.activationDate,
        expirationDate: sale.expirationDate,
        credentials: creds,
        senderEmail: OFFICIAL_SUPPORT_EMAIL,
        supportWhatsApp: OFFICIAL_SUPPORT_WHATSAPP,
        storeName,
      }),
    });
    if (res.ok) {
      emailSent = true;
    }
  } catch (err) {
    console.warn('Endpoint /api/notifications/sale-credentials fallback:', err);
  }

  return {
    success: true,
    emailSent,
    waUrl,
    message: waMessage,
  };
}
