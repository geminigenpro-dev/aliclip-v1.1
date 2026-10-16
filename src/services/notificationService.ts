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
 * 1. Envía notificación de registro del usuario (Valida con token de Firebase hacia Cloudflare / Make y prepara WhatsApp)
 */
export async function sendRegistrationNotification(
  data: RegistrationNotificationData,
  storeName: string = 'AliClip Store',
  firebaseIdToken?: string
): Promise<NotificationResult> {
  const waPhone = formatWhatsAppPhone(data.phone);
  const waMessage = buildRegistrationWhatsAppMessage(data, storeName);
  const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}` : '';

  let emailSent = false;
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (firebaseIdToken) {
      headers['Authorization'] = `Bearer ${firebaseIdToken}`;
    }

    const res = await fetch('/api/notifications/registration', {
      method: 'POST',
      headers,
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

/**
 * 3. Genera la plantilla HTML responsive para el correo de bienvenida del cliente
 */
export function generateWelcomeEmailHtml(
  data?: Partial<RegistrationNotificationData> | Record<string, any>,
  storeName: string = 'AliClip Store'
): string {
  const cleanName = data?.name?.trim() || 'Cliente VIP';
  const cleanEmail = data?.email?.trim() || 'cliente@ejemplo.com';
  const cleanPhone = data?.phone?.trim() || '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a ${storeName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #111827; border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.4);">
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">¡Bienvenido a ${storeName}! 👋🎉</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Tu cuenta ha sido creada y verificada exitosamente</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px;">
              <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-top: 0;">
                Hola <strong style="color: #ffffff;">${cleanName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Te damos una cordial bienvenida a nuestra plataforma oficial de membresías digitales y cuentas premium.
              </p>
              
              <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #818cf8;">Datos de tu Cuenta</h3>
                <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px; color: #cbd5e1;">
                  <tr>
                    <td width="35%" style="color: #64748b;">Titular:</td>
                    <td><strong style="color: #f1f5f9;">${cleanName}</strong></td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">Correo:</td>
                    <td><strong style="color: #38bdf8;">${cleanEmail}</strong></td>
                  </tr>
                  ${cleanPhone ? `<tr>
                    <td style="color: #64748b;">WhatsApp:</td>
                    <td><strong style="color: #f1f5f9;">${cleanPhone}</strong></td>
                  </tr>` : ''}
                </table>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="https://aliclip.site" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                  Acceder a la Tienda Oficial
                </a>
              </div>

              <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin-bottom: 0; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px;">
                ¿Tienes alguna consulta? Nuestro equipo de soporte oficial está a tu disposición en <a href="mailto:${OFFICIAL_SUPPORT_EMAIL}" style="color: #818cf8; text-decoration: none;">${OFFICIAL_SUPPORT_EMAIL}</a> o vía WhatsApp en <a href="https://wa.me/${OFFICIAL_SUPPORT_WHATSAPP_DIGITS}" style="color: #818cf8; text-decoration: none;">${OFFICIAL_SUPPORT_WHATSAPP}</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 4. Genera la plantilla HTML responsive para el despacho de credenciales al cliente
 */
export function generateCredentialsEmailHtml(
  sale?: Partial<SaleRecord> | Record<string, any>,
  credentials?: Partial<ServiceCredentials>,
  storeName: string = 'AliClip Store'
): string {
  const creds = credentials || (sale as any)?.serviceCredentials || {};
  const cleanName = (sale as any)?.clientName?.trim() || 'Cliente VIP';
  const cleanProduct = (sale as any)?.productName || 'Membresía Premium';
  const cleanPlan = (sale as any)?.planName || 'Plan Oficial';
  const cleanDuration = (sale as any)?.durationText || '1 Mes';
  const token = (sale as any)?.accessToken || (sale as any)?.id || 'ALI-VIP';
  const expDate = (sale as any)?.expirationDate || '30 días';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tus Credenciales de Acceso - ${cleanProduct}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #111827; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">¡Servicio Activado con Éxito! 🚀✨</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.95);">Tus datos de acceso oficiales ya están listos</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px;">
              <p style="font-size: 15px; color: #cbd5e1; margin-top: 0;">
                Hola <strong style="color: #ffffff;">${cleanName}</strong>, tu compra en ${storeName} ha sido confirmada:
              </p>

              <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px; color: #cbd5e1;">
                  <tr><td width="35%" style="color: #64748b;">Producto:</td><td><strong style="color: #f1f5f9;">${cleanProduct}</strong></td></tr>
                  <tr><td style="color: #64748b;">Plan:</td><td><strong style="color: #38bdf8;">${cleanPlan} (${cleanDuration})</strong></td></tr>
                  <tr><td style="color: #64748b;">Vigencia:</td><td><strong style="color: #10b981;">Hasta ${expDate}</strong></td></tr>
                  <tr><td style="color: #64748b;">Código:</td><td><span style="font-family: monospace; background: rgba(99,102,241,0.2); color: #818cf8; padding: 2px 6px; border-radius: 4px;">${token}</span></td></tr>
                </table>
              </div>

              <div style="background: #0f172a; border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #a5b4fc;">🔐 Credenciales de Acceso</h3>
                <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
                  ${creds.email ? `<tr><td width="35%" style="color: #94a3b8;">Usuario / Correo:</td><td><code style="background: rgba(255,255,255,0.06); color: #38bdf8; padding: 3px 8px; border-radius: 6px; font-size: 14px;">${creds.email}</code></td></tr>` : ''}
                  ${creds.pin ? `<tr><td style="color: #94a3b8;">Contraseña / PIN:</td><td><code style="background: rgba(255,255,255,0.06); color: #f43f5e; padding: 3px 8px; border-radius: 6px; font-size: 14px; font-weight: bold;">${creds.pin}</code></td></tr>` : ''}
                  ${creds.profileName ? `<tr><td style="color: #94a3b8;">Perfil Asignado:</td><td><strong style="color: #f1f5f9;">${creds.profileName}</strong></td></tr>` : ''}
                  ${creds.instructions ? `<tr><td style="color: #94a3b8; vertical-align: top;">Instrucciones:</td><td style="color: #e2e8f0; font-size: 13px;">${creds.instructions}</td></tr>` : ''}
                </table>
              </div>

              <div style="text-align: center; margin: 28px 0;">
                <a href="https://aliclip.site#mis-compras" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-block;">
                  Ver en mi Panel "Mis Compras"
                </a>
              </div>

              <p style="font-size: 12px; color: #64748b; margin-bottom: 0; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 14px;">
                Soporte y Garantía Oficial: <a href="mailto:${OFFICIAL_SUPPORT_EMAIL}" style="color: #818cf8; text-decoration: none;">${OFFICIAL_SUPPORT_EMAIL}</a> | WhatsApp: ${OFFICIAL_SUPPORT_WHATSAPP}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 5. Genera la plantilla HTML responsive para la alerta de nueva orden dirigida al administrador
 */
export function generateAdminOrderAlertEmailHtml(
  sale?: Partial<SaleRecord> | Record<string, any>,
  storeName: string = 'AliClip Store'
): string {
  const cleanName = (sale as any)?.clientName?.trim() || 'Cliente';
  const cleanEmail = (sale as any)?.clientEmail?.trim() || 'N/A';
  const cleanPhone = (sale as any)?.clientPhone?.trim() || 'N/A';
  const cleanProduct = (sale as any)?.productName || 'Producto';
  const cleanPlan = (sale as any)?.planName || 'Plan';
  const cleanPrice = (sale as any)?.price !== undefined ? `S/ ${(sale as any).price}` : 'Verificar';
  const cleanMethod = (sale as any)?.paymentMethod || 'Yape / Transferencia';
  const token = (sale as any)?.accessToken || (sale as any)?.id || 'ALI-NEW';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Nueva Orden Recibida - ${token}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #0f172a; font-family: -apple-system, sans-serif; color: #f8fafc;">
  <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 14px; overflow: hidden;">
    <div style="background: #e11d48; padding: 20px; color: #ffffff; text-align: center;">
      <h2 style="margin: 0; font-size: 18px; font-weight: 800;">🔔 NUEVA ORDEN RECIBIDA (${token})</h2>
      <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">${storeName} - Notificación de Ventas</p>
    </div>
    <div style="padding: 24px;">
      <h3 style="font-size: 14px; color: #94a3b8; text-transform: uppercase; margin-top: 0;">Detalles de la Compra</h3>
      <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; color: #cbd5e1; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #334155;"><td style="color: #64748b;">Producto:</td><td><strong style="color: #f1f5f9;">${cleanProduct}</strong> (${cleanPlan})</td></tr>
        <tr style="border-bottom: 1px solid #334155;"><td style="color: #64748b;">Monto:</td><td><strong style="color: #10b981;">${cleanPrice}</strong></td></tr>
        <tr style="border-bottom: 1px solid #334155;"><td style="color: #64748b;">Método de Pago:</td><td>${cleanMethod}</td></tr>
        <tr style="border-bottom: 1px solid #334155;"><td style="color: #64748b;">Cliente:</td><td><strong style="color: #f1f5f9;">${cleanName}</strong></td></tr>
        <tr style="border-bottom: 1px solid #334155;"><td style="color: #64748b;">Correo:</td><td><a href="mailto:${cleanEmail}" style="color: #38bdf8;">${cleanEmail}</a></td></tr>
        <tr><td style="color: #64748b;">WhatsApp:</td><td><a href="https://wa.me/${cleanPhone.replace(/[^0-9]/g, '')}" style="color: #10b981;">${cleanPhone}</a></td></tr>
      </table>
      <div style="margin-top: 24px; text-align: center;">
        <a href="https://aliclip.site" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; display: inline-block;">
          Abrir Panel Admin
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 6. Envía alerta de nueva orden a administración (WhatsApp y llamada al endpoint)
 */
export async function sendAdminOrderAlertNotification(
  saleOrData?: Partial<SaleRecord> | Record<string, any>,
  storeSettingsOrName: any = 'AliClip Store'
): Promise<NotificationResult> {
  const storeName = typeof storeSettingsOrName === 'string'
    ? storeSettingsOrName
    : storeSettingsOrName?.name || 'AliClip Store';

  const sale = (saleOrData || {}) as any;
  const cleanName = sale?.clientName?.trim() || 'Cliente VIP';
  const cleanEmail = sale?.clientEmail?.trim() || '';
  const cleanPhone = sale?.clientPhone?.trim() || '';
  const cleanProduct = sale?.productName || 'Producto Digital';
  const cleanPlan = sale?.planName || 'Plan Oficial';
  const cleanMethod = sale?.paymentMethod || 'Transferencia';
  const token = sale?.accessToken || sale?.id || 'ALI-NUEVO';
  const price = sale?.price !== undefined ? `S/ ${sale.price}` : '';

  const waMessage = `🔔 *¡NUEVA ORDEN REGISTRADA EN ${storeName.toUpperCase()}!*
━━━━━━━━━━━━━━━━━━━━
📌 *Código:* ${token}
📦 *Producto:* ${cleanProduct} (${cleanPlan})
💰 *Monto:* ${price || 'Verificar comprobante'}
💳 *Método:* ${cleanMethod}
👤 *Cliente:* ${cleanName}
📧 *Correo:* ${cleanEmail || 'N/A'}
📱 *WhatsApp:* ${cleanPhone || 'N/A'}
━━━━━━━━━━━━━━━━━━━━
⚡ Requiere confirmación y despacho de credenciales desde el panel de administración.`;

  const adminPhone = OFFICIAL_SUPPORT_WHATSAPP_DIGITS;
  const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(waMessage)}`;

  let emailSent = false;
  try {
    const res = await fetch('/api/notifications/order-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        clientName: cleanName,
        clientEmail: cleanEmail,
        clientPhone: cleanPhone,
        productName: cleanProduct,
        planName: cleanPlan,
        price: sale?.price,
        paymentMethod: cleanMethod,
        storeName,
        timestamp: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      emailSent = true;
    }
  } catch (err) {
    console.warn('Endpoint /api/notifications/order-alert fallback:', err);
  }

  return {
    success: true,
    emailSent,
    waUrl,
    message: waMessage,
  };
}
