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

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    // 1. Extraer y validar encabezado de autorización con Firebase ID Token
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
    if (!idToken) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticación vacío.' }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Validar el Firebase ID Token contra la API de Google Identity Toolkit
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

    // 3. Obtener datos del cuerpo de la petición (opcional para nombre si no vino en el token)
    const body: any = await context.request.json().catch(() => ({}));
    const verifiedEmail = String(verifiedUser.email).trim().toLowerCase();
    const resolvedName =
      (body?.name && typeof body.name === 'string' && body.name.trim()) ||
      verifiedUser.displayName ||
      '';

    // 4. Leer secreto MAKE_WEBHOOK_URL configurado en Cloudflare Pages
    const makeWebhookUrl = context.env.MAKE_WEBHOOK_URL;
    if (!makeWebhookUrl || typeof makeWebhookUrl !== 'string' || !makeWebhookUrl.startsWith('http')) {
      return new Response(
        JSON.stringify({
          error:
            'MAKE_WEBHOOK_URL no está configurado como secreto en las variables de entorno de Cloudflare Pages.',
        }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Preparar ÚNICAMENTE los datos necesarios para Make (sin contraseñas ni tokens)
    const makePayload: Record<string, string> = {
      event: 'user_registered_success',
      email: verifiedEmail,
      registeredAt: new Date().toISOString(),
    };

    if (resolvedName) {
      makePayload.name = String(resolvedName).slice(0, 100);
    }

    // 6. Enviar petición HTTP POST al Webhook de Make
    const makeRes = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(makePayload),
    });

    if (!makeRes.ok) {
      const errorText = await makeRes.text().catch(() => '');
      return new Response(
        JSON.stringify({
          error: `Make respondió con estado ${makeRes.status}: ${errorText || 'Error en el webhook'}`,
        }),
        {
          status: 502,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        event: 'user_registered_success',
        email: verifiedEmail,
        name: resolvedName || null,
        message: 'Notificación de registro enviada exitosamente a Make.',
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
