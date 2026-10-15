/**
 * ALICLIP NOTIFICATION & CREDENTIALS DISPATCH SERVICE
 *
 * Maneja el envío y sincronización de:
 * 1. Copia de registro de cliente (Bienvenida: Correo + WhatsApp + Webhook Make.com).
 * 2. Copia oficial de datos de acceso/credenciales (Usuario, PIN, Perfil, Instrucciones).
 * 3. Alerta de nuevo pedido para la administración (Correo + WhatsApp + Webhook Make.com).
 * 4. Generación de plantillas HTML para MailerSend y Make.com.
 */

import { SaleRecord, ServiceCredentials } from '../types';

export interface RegistrationNotificationData {
  name: string;
  email: string;
  phone: string;
  idToken?: string;
}

export interface AdminOrderAlertData {
  orderId?: string;
  accessToken?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  productName: string;
  planName: string;
  price?: number | string;
  paymentMethod?: string;
  durationText?: string;
  accountType?: string;
  notes?: string;
  createdAt?: string;
}

export type AdminOrderAlertNotificationData = AdminOrderAlertData;

export type EmailEventType = 'welcome' | 'sale_credentials' | 'admin_order_alert';

export interface AutomatedEmailPayload {
  eventType: EmailEventType;
  storeName: string;
  senderEmail: string;
  supportWhatsApp: string;
  timestamp: string;
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  orderDetails?: {
    orderId?: string;
    productName?: string;
    planName?: string;
    accountType?: string;
    expirationDate?: string;
    price?: number;
    paymentMethod?: string;
    credentials?: {
      email?: string;
      pin?: string;
      profileName?: string;
      driveLink?: string;
      instructions?: string;
    };
  };
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
  const digits = (phone || '').replace(/[^0-9]/g, '');
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
export function buildRegistrationWhatsAppMessage(
  data: RegistrationNotificationData,
  storeName: string = 'AliClip Store'
): string {
  const cleanName = (data.name || 'Cliente').trim();
  const cleanEmail = (data.email || '').trim();
  const cleanPhone = (data.phone || '').trim();
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
  const cleanName = (sale.clientName || 'Cliente').trim();
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
 * Genera el mensaje para WhatsApp notificando al administrador de un nuevo pedido
 */
export function buildOrderAlertWhatsAppMessage(
  order: AdminOrderAlertData,
  storeName: string = 'AliClip Store'
): string {
  const cleanName = (order.clientName || 'Cliente').trim();
  const token = order.accessToken || order.orderId || 'PENDIENTE';
  const priceText = order.price !== undefined && order.price !== null && order.price !== ''
    ? (typeof order.price === 'number' ? `S/ ${order.price.toFixed(2)}` : (String(order.price).startsWith('S/') ? String(order.price) : `S/ ${order.price}`))
    : 'Por confirmar';

  return `🚨 *NUEVO PEDIDO RECIBIDO - ${storeName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━
📦 *Producto:* ${order.productName} (${order.planName})
💰 *Monto:* ${priceText}
💳 *Método de Pago:* ${order.paymentMethod || 'No especificado'}
🔖 *Código de Pedido:* ${token}

👤 *DATOS DEL CLIENTE:*
• Nombre: ${cleanName}
• Correo: ${order.clientEmail}
• WhatsApp: ${order.clientPhone}

Accede al Panel de Administración para verificar el comprobante y asignar credenciales:
🔗 https://aliclip.site`;
}

/**
 * Genera plantilla HTML oficial para correo de bienvenida
 */
export function generateWelcomeEmailHtml(
  data: { name: string; email: string; phone?: string; storeName?: string }
): string {
  const store = data.storeName || 'AliClip Store';
  const name = data.name || 'Cliente';
  const email = data.email || '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a ${store}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; text-align: center; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">${store}</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0e7ff;">Plataforma Oficial de Suscripciones y Cuentas Premium</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">¡Hola ${name}! 👋</h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Tu cuenta ha sido registrada con éxito en <strong>${store}</strong>. Ya puedes acceder a todas nuestras funciones y consultar tus compras en cualquier momento.
              </p>

              <div style="background-color: #1e293b; border-left: 4px solid #6366f1; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Tus datos de cuenta</p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #ffffff;">👤 <strong>Titular:</strong> ${name}</p>
                <p style="margin: 0; font-size: 14px; color: #ffffff;">📧 <strong>Correo:</strong> ${email}</p>
              </div>

              <div style="background-color: #0f172a; border-radius: 10px; padding: 18px; margin-bottom: 26px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #38bdf8;">✨ Con tu cuenta disfrutas de:</p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                  <li>Acceso 24/7 a tu panel <strong>"Mis compras"</strong></li>
                  <li>Consulta de credenciales, perfiles y PINs activos</li>
                  <li>Comprobantes digitales oficiales descargables</li>
                  <li>Garantía de reposición oficial inmediata</li>
                </ul>
              </div>

              <!-- Button CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://aliclip.site" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 15px rgba(99,102,241,0.4);">
                      Ingresar a AliClip.site
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; text-align: center;">
                Si tienes dudas o necesitas asistencia, escríbenos a <a href="mailto:${OFFICIAL_SUPPORT_EMAIL}" style="color: #818cf8; text-decoration: none;">${OFFICIAL_SUPPORT_EMAIL}</a> o a nuestro WhatsApp oficial <strong>${OFFICIAL_SUPPORT_WHATSAPP}</strong>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #0f172a; border-top: 1px solid #1f2937; text-align: center; font-size: 12px; color: #64748b;">
              &copy; ${new Date().getFullYear()} ${store}. Todos los derechos reservados.<br>
              Canal de soporte: <a href="mailto:${OFFICIAL_SUPPORT_EMAIL}" style="color: #6366f1; text-decoration: none;">${OFFICIAL_SUPPORT_EMAIL}</a>
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
 * Genera plantilla HTML oficial para envío de credenciales y activación de compra
 */
export function generateCredentialsEmailHtml(
  sale: SaleRecord,
  credentials?: ServiceCredentials,
  storeName: string = 'AliClip Store'
): string {
  const creds = credentials || sale.serviceCredentials || {};
  const store = storeName || 'AliClip Store';
  const name = sale.clientName || 'Cliente';
  const token = sale.accessToken || sale.id;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tus Accesos - ${sale.productName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
              <span style="background-color: rgba(255,255,255,0.2); color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Compra Confirmada</span>
              <h1 style="margin: 10px 0 4px 0; font-size: 24px; font-weight: 800; color: #ffffff;">Tus Credenciales de Acceso</h1>
              <p style="margin: 0; font-size: 13px; color: #d1fae5;">${store} • Despacho Oficial</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #ffffff;">¡Hola ${name}! 🚀</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Tu orden de <strong>${sale.productName}</strong> ha sido verificada y activada por nuestro equipo de soporte. A continuación tienes tus datos de acceso:
              </p>

              <!-- Credentials Card -->
              <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table width="100%" style="font-size: 14px;">
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0; width: 130px;"><strong>📦 Producto:</strong></td>
                    <td style="color: #ffffff; font-weight: 600;">${sale.productName} (${sale.planName})</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;"><strong>⏳ Vigencia:</strong></td>
                    <td style="color: #34d399; font-weight: 600;">Hasta el ${sale.expirationDate}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;"><strong>🔖 Código / Token:</strong></td>
                    <td style="color: #a78bfa; font-family: monospace; font-size: 13px;">${token}</td>
                  </tr>
                  ${creds.email ? `
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;"><strong>📧 Usuario / Correo:</strong></td>
                    <td style="color: #38bdf8; font-family: monospace; font-weight: bold;">${creds.email}</td>
                  </tr>` : ''}
                  ${creds.pin ? `
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;"><strong>🔑 PIN / Contraseña:</strong></td>
                    <td style="color: #fbbf24; font-family: monospace; font-weight: bold;">${creds.pin}</td>
                  </tr>` : ''}
                  ${creds.profileName ? `
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;"><strong>👤 Perfil Asignado:</strong></td>
                    <td style="color: #f472b6; font-weight: bold;">${creds.profileName}</td>
                  </tr>` : ''}
                  ${creds.driveLink ? `
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;"><strong>📁 Material / Enlace:</strong></td>
                    <td><a href="${creds.driveLink}" target="_blank" style="color: #60a5fa; text-decoration: underline;">Abrir Recurso / Drive</a></td>
                  </tr>` : ''}
                </table>

                ${creds.instructions ? `
                <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed #475569;">
                  <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">📌 Instrucciones de Uso:</p>
                  <p style="margin: 0; font-size: 13px; color: #e2e8f0; line-height: 1.5;">${creds.instructions}</p>
                </div>` : ''}
              </div>

              <!-- Button CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://aliclip.site" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 15px rgba(16,185,129,0.4);">
                      Ver en "Mis Compras"
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
                Garantía oficial activa durante todo el periodo contratado. ¿Problemas con tu cuenta? Escríbenos directamente a <a href="mailto:${OFFICIAL_SUPPORT_EMAIL}" style="color: #34d399; text-decoration: none;">${OFFICIAL_SUPPORT_EMAIL}</a> o al WhatsApp <strong>${OFFICIAL_SUPPORT_WHATSAPP}</strong>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #0f172a; border-top: 1px solid #1f2937; text-align: center; font-size: 12px; color: #64748b;">
              &copy; ${new Date().getFullYear()} ${store}. Despacho oficial y seguro.
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
 * Genera plantilla HTML oficial para notificación de nuevo pedido a la administración
 */
export function generateAdminOrderAlertEmailHtml(
  order: AdminOrderAlertData,
  storeName: string = 'AliClip Store'
): string {
  const store = storeName || 'AliClip Store';
  const token = order.accessToken || order.orderId || 'PENDIENTE';
  const priceText = order.price !== undefined && order.price !== null && order.price !== ''
    ? (typeof order.price === 'number' ? `S/ ${order.price.toFixed(2)}` : (String(order.price).startsWith('S/') ? String(order.price) : `S/ ${order.price}`))
    : 'Por confirmar';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Pedido - ${store}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="padding: 24px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">🚨 NUEVO PEDIDO REGISTRADO</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #fecaca;">${store} • Alerta Administrativa</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 26px;">
              <div style="background-color: #1e293b; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #f87171;">📦 Datos del Pedido</h3>
                <p style="margin: 4px 0; font-size: 14px; color: #ffffff;"><strong>Producto:</strong> ${order.productName}</p>
                <p style="margin: 4px 0; font-size: 14px; color: #ffffff;"><strong>Plan:</strong> ${order.planName}</p>
                <p style="margin: 4px 0; font-size: 14px; color: #ffffff;"><strong>Monto:</strong> ${priceText}</p>
                <p style="margin: 4px 0; font-size: 14px; color: #ffffff;"><strong>Método de pago:</strong> ${order.paymentMethod || 'Web'}</p>
                <p style="margin: 4px 0; font-size: 14px; color: #ffffff;"><strong>Código Token:</strong> <span style="font-family: monospace; color: #a78bfa;">${token}</span></p>
              </div>

              <div style="background-color: #0f172a; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #38bdf8;">👤 Datos del Cliente</h3>
                <p style="margin: 4px 0; font-size: 14px; color: #ffffff;"><strong>Nombre:</strong> ${order.clientName}</p>
                <p style="margin: 4px 0; font-size: 14px; color: #ffffff;"><strong>Correo:</strong> ${order.clientEmail}</p>
                <p style="margin: 4px 0; font-size: 14px; color: #ffffff;"><strong>WhatsApp:</strong> ${order.clientPhone}</p>
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://aliclip.site" target="_blank" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px;">
                      Ir al Panel Admin para Despachar
                    </a>
                  </td>
                </tr>
              </table>
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (data.idToken) {
      headers['Authorization'] = `Bearer ${data.idToken}`;
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
 * 3. Envía notificación al administrador ante un nuevo pedido recibido
 */
export async function sendAdminOrderAlertNotification(
  order: AdminOrderAlertData,
  storeName: string = 'AliClip Store'
): Promise<NotificationResult> {
  const waPhone = OFFICIAL_SUPPORT_WHATSAPP_DIGITS;
  const waMessage = buildOrderAlertWhatsAppMessage(order, storeName);
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;

  let emailSent = false;
  try {
    const res = await fetch('/api/notifications/admin-order-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...order,
        senderEmail: OFFICIAL_SUPPORT_EMAIL,
        adminEmail: OFFICIAL_SUPPORT_EMAIL,
        supportWhatsApp: OFFICIAL_SUPPORT_WHATSAPP,
        storeName,
      }),
    });
    if (res.ok) {
      emailSent = true;
    }
  } catch (err) {
    console.warn('Endpoint /api/notifications/admin-order-alert fallback:', err);
  }

  return {
    success: true,
    emailSent,
    waUrl,
    message: waMessage,
  };
}
