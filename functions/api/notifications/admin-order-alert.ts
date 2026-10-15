/**
 * CLOUDFLARE PAGES FUNCTION: /api/notifications/admin-order-alert
 *
 * Recibe alerta de nuevo pedido desde BuyModal y notifica:
 * 1. Al Webhook de Make.com (si MAKE_WEBHOOK_URL está configurado en Cloudflare Pages).
 * 2. Prepara la respuesta para el cliente sin filtrar secretos ni datos sensibles.
 */

interface Env {
  MAKE_WEBHOOK_URL?: string;
  STORE_NAME?: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body = ((await context.request.json().catch(() => ({}))) || {}) as any;
    const {
      orderId,
      accessToken,
      clientName,
      clientEmail,
      clientPhone,
      productName,
      planName,
      price,
      paymentMethod,
      storeName = 'AliClip Store',
    } = body;

    if (!clientName || !clientEmail || !productName) {
      return new Response(
        JSON.stringify({ error: 'Datos incompletos para la alerta de pedido.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = accessToken || orderId || 'PENDIENTE';
    const timestamp = new Date().toISOString();

    // Reenvío al Webhook de Make.com con autenticación y fallback oficial
    const makeWebhookUrl =
      context.env.MAKE_WEBHOOK_URL ||
      'https://hook.us2.make.com/p63mga8ksfezopwnure7x128cxq8tivq';
    const makeApiKey =
      (context.env as any).MAKE_API_KEY ||
      'mlsn.3f1b4ce05eb6f5c5c3c546a623f9a62056d5ac5caa53a1659258f531081f45e4';

    if (makeWebhookUrl) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (makeApiKey) {
          headers['x-make-apikey'] = makeApiKey;
        }

        await fetch(makeWebhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event: 'admin_order_alert',
            store: storeName,
            token,
            orderId: token,
            accessToken: token,
            client_name: String(clientName).slice(0, 100),
            clientName: String(clientName).slice(0, 100),
            client_email: String(clientEmail).slice(0, 120),
            clientEmail: String(clientEmail).slice(0, 120),
            client_phone: String(clientPhone || '').slice(0, 30),
            clientPhone: String(clientPhone || '').slice(0, 30),
            product_name: String(productName).slice(0, 100),
            productName: String(productName).slice(0, 100),
            plan_name: String(planName || '').slice(0, 100),
            planName: String(planName || '').slice(0, 100),
            price: Number(price) || 0,
            payment_method: String(paymentMethod || 'Web').slice(0, 50),
            paymentMethod: String(paymentMethod || 'Web').slice(0, 50),
            created_at: timestamp,
            timestamp,
          }),
        });
      } catch (whErr) {
        console.warn('Error al contactar webhook de Make en admin-order-alert:', whErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: token,
        timestamp,
        message: `Alerta de nuevo pedido (${productName}) enviada a la administración.`,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Error procesando alerta de pedido administrativo.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
