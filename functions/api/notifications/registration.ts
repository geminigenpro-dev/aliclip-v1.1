interface Env {
  MAKE_WEBHOOK_URL?: string;
  FIREBASE_API_KEY?: string;
  VITE_FIREBASE_API_KEY?: string;
  STORE_NAME?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

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
    // 1. Validar Content-Type
    const contentType = context.request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type debe ser application/json.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Extraer y validar encabezado de autorización con Firebase ID Token
    const authHeader =
      context.request.headers.get('Authorization') ||
      context.request.headers.get('authorization');

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return new Response(
        JSON.stringify({
          error: 'Acceso no autorizado: Se requiere token de autenticación de Firebase (Bearer token).',
        }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    const idToken = authHeader.replace(/^bearer\s+/i, '').trim();
    if (!idToken || idToken.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticación de Firebase no válido o corrupto.' }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Validar el Firebase ID Token contra la API de Google Identity Toolkit
    const firebaseApiKey =
      context.env.FIREBASE_API_KEY ||
      context.env.VITE_FIREBASE_API_KEY ||
      'AIzaSyAzNLYJqHVkdFfWcRYn2Mi4ylhdiFsgkGk';

    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!verifyRes.ok) {
      const errData: any = await verifyRes.json().catch(() => ({}));
      const reason = errData?.error?.message || 'Token inválido o expirado';
      return new Response(
        JSON.stringify({
          error: `Autenticación rechazada por Firebase: ${reason}.`,
        }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    const verifyData: any = await verifyRes.json();
    const verifiedUser = verifyData?.users?.[0];

    if (!verifiedUser || !verifiedUser.email) {
      return new Response(
        JSON.stringify({
          error: 'No se pudo verificar la identidad del usuario en Firebase.',
        }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    const verifiedEmail = String(verifiedUser.email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(verifiedEmail)) {
      return new Response(
        JSON.stringify({ error: 'El correo electrónico verificado no cumple con el formato estándar.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validar y procesar datos del cuerpo de la petición
    const body: any = await context.request.json().catch(() => ({}));
    const rawName = body?.name && typeof body.name === 'string' ? body.name.trim() : '';
    const resolvedName = rawName || verifiedUser.displayName || '';

    // 5. Validar formato y existencia del secreto MAKE_WEBHOOK_URL con fallback oficial
    const makeWebhookUrl =
      context.env.MAKE_WEBHOOK_URL ||
      'https://hook.us2.make.com/p63mga8ksfezopwnure7x128cxq8tivq';
    const makeApiKey =
      (context.env as any).MAKE_API_KEY ||
      'mlsn.3f1b4ce05eb6f5c5c3c546a623f9a62056d5ac5caa53a1659258f531081f45e4';

    // 6. Preparar datos limpios y completos para Make.com
    const makePayload: Record<string, any> = {
      event: 'user_registered_success',
      store: context.env.STORE_NAME || 'AliClip Store',
      email: verifiedEmail,
      name: resolvedName ? String(resolvedName).slice(0, 100) : 'Cliente',
      phone: body?.phone ? String(body.phone).slice(0, 30) : '',
      clientToken: `CLI-${Date.now().toString().slice(-6)}`,
      registeredAt: new Date().toISOString(),
      action: 'send_welcome_email',
      supportEmail: 'soporte@aliclip.site',
      supportWhatsApp: '+51967693595',
    };

    // 7. Ejecución asíncrona garantizada mediante context.waitUntil (desacopla latencia de Make del cliente)
    const asyncWebhookTask = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (makeApiKey) {
          headers['x-make-apikey'] = makeApiKey;
        }

        const makeRes = await fetch(makeWebhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(makePayload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log(`[MAKE WEBHOOK ASYNC] Estado de entrega: ${makeRes.status} ${makeRes.statusText}`);
      } catch (err: any) {
        console.warn('[MAKE WEBHOOK ASYNC] Error en despacho asíncrono hacia Make:', err?.message || err);
      }
    })();

    if (typeof context.waitUntil === 'function') {
      context.waitUntil(asyncWebhookTask);
    } else {
      asyncWebhookTask.catch((err) => {
        console.warn('[MAKE WEBHOOK] Advertencia en tarea asíncrona:', err);
      });
    }

    // 8. Respuesta inmediata y confirmada al cliente
    return new Response(
      JSON.stringify({
        success: true,
        queued: true,
        event: 'user_registered_success',
        email: verifiedEmail,
        name: resolvedName || null,
        message: 'Registro validado y notificación enviada asíncronamente a Make.',
        timestamp: new Date().toISOString(),
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
      JSON.stringify({
        error: error?.message || 'Error procesando notificación en Cloudflare Pages.',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
};
