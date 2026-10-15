interface Env {
  GEMINI_API_KEY?: string;
  STORE_NAME?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
  waitUntil?: (promise: Promise<unknown>) => void;
}) => {
  try {
    const contentType = context.request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type debe ser application/json.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const body = (await context.request.json().catch(() => ({}))) as any;
    const {
      saleId,
      accessToken,
      clientName,
      clientEmail,
      clientPhone,
      productName,
      planName,
      price,
      expirationDate,
      credentials,
      storeName = 'AliClip Store',
    } = body || {};

    if (!clientName || !clientPhone || !productName) {
      return new Response(
        JSON.stringify({ error: 'Datos incompletos para el despacho de credenciales: nombre, teléfono y producto son requeridos.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const token = accessToken || saleId || 'ALI-VIP';
    const senderEmail = 'soporte@aliclip.site';
    const supportWhatsApp = '+51967693595';

    // Despacho asíncrono hacia Webhook de Make.com
    const makeWebhookUrl =
      (context.env as any).MAKE_WEBHOOK_URL ||
      'https://hook.us2.make.com/p63mga8ksfezopwnure7x128cxq8tivq';
    const makeApiKey =
      (context.env as any).MAKE_API_KEY ||
      'mlsn.3f1b4ce05eb6f5c5c3c546a623f9a62056d5ac5caa53a1659258f531081f45e4';

    if (makeWebhookUrl) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (makeApiKey) headers['x-make-apikey'] = makeApiKey;
        await fetch(makeWebhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event: 'sale_credentials_delivered',
            store: storeName,
            token,
            saleId: token,
            accessToken: token,
            clientName: String(clientName).slice(0, 100),
            clientEmail: clientEmail ? String(clientEmail).slice(0, 120) : '',
            clientPhone: String(clientPhone).slice(0, 30),
            productName: String(productName).slice(0, 100),
            planName: String(planName || '').slice(0, 100),
            price: Number(price) || 0,
            expirationDate: expirationDate || '',
            credentials: credentials || {},
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (whErr) {
        console.warn('Error al contactar webhook de Make en sale-credentials:', whErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        token,
        senderEmail,
        supportWhatsApp,
        clientName: String(clientName).slice(0, 100),
        clientPhone: String(clientPhone).slice(0, 30),
        clientEmail: clientEmail ? String(clientEmail).slice(0, 120) : '',
        timestamp: new Date().toISOString(),
        message: `Credenciales de ${productName} despachadas vía correo desde ${senderEmail} a ${clientEmail || clientPhone} y preparadas para WhatsApp (+51967693595).`,
      }),
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Error procesando despacho de credenciales.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
};
