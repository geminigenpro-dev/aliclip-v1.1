/**
 * CLOUDFLARE PAGES FUNCTION: /api/notifications/registration
 *
 * Flujo de ejecución en Cloudflare Pages:
 * 1. Recibe petición POST con encabezado 'Authorization: Bearer <idToken>'.
 * 2. Valida el token de Firebase Auth utilizando el endpoint oficial de Google Identity Toolkit.
 * 3. Si el token es válido y coincide con el correo, lee el secreto MAKE_WEBHOOK_URL desde context.env.
 * 4. Despacha a Make ÚNICAMENTE: { event: 'registration_success', email, name, registered_at, store }.
 * 5. Ninguna contraseña ni token de acceso se envía a Make.
 */

interface Env {
  MAKE_WEBHOOK_URL?: string;
  FIREBASE_API_KEY?: string;
}

// Clave pública de Firebase Web del proyecto Aliclip (alixplay-store-web)
const DEFAULT_FIREBASE_API_KEY = 'AIzaSyAzNLYJqHVkdFfWcRYn2Mi4ylhdiFsgkGk';

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const authHeader = context.request.headers.get('Authorization') || context.request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Acceso no autorizado: Token de autenticación de Firebase requerido.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticación vacío.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = (await context.request.json().catch(() => ({}))) as any;
    const { name, email, storeName = 'AliClip Store' } = body || {};

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'El correo electrónico es requerido.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. VALIDAR TOKEN DE FIREBASE CONTRA LA API OFICIAL DE GOOGLE IDENTITY TOOLKIT
    const apiKey = context.env.FIREBASE_API_KEY || DEFAULT_FIREBASE_API_KEY;
    const googleVerifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;

    const verifyResponse = await fetch(googleVerifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: 'Token de Firebase inválido o expirado.', details: errorData }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const verifyData = (await verifyResponse.json().catch(() => ({}))) as any;
    const authenticatedUser = verifyData?.users?.[0];

    if (!authenticatedUser || !authenticatedUser.email) {
      return new Response(
        JSON.stringify({ error: 'No se pudo verificar la identidad del usuario en Firebase.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el correo del token verificado por Google coincida con el del payload
    const tokenEmail = authenticatedUser.email.toLowerCase().trim();
    const reqEmail = String(email).toLowerCase().trim();
    if (tokenEmail !== reqEmail) {
      return new Response(
        JSON.stringify({ error: 'El correo del usuario no coincide con el token de autenticación.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const verifiedName = String(name || authenticatedUser.displayName || tokenEmail.split('@')[0]).slice(0, 100);
    const registeredAt = new Date().toISOString();

    // 2. ENVIAR A MAKE SI ESTÁ CONFIGURADO EL SECRETO EN CLOUDFLARE
    const makeWebhookUrl = context.env.MAKE_WEBHOOK_URL;
    let webhookDispatched = false;

    if (makeWebhookUrl && typeof makeWebhookUrl === 'string' && makeWebhookUrl.startsWith('http')) {
      try {
        // Enviar ÚNICAMENTE datos necesarios (sin contraseñas ni tokens)
        const makePayload = {
          event: 'registration_success',
          email: tokenEmail,
          name: verifiedName,
          registered_at: registeredAt,
          store: storeName,
        };

        const makeRes = await fetch(makeWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Aliclip-Cloudflare-Pages-Function/1.0',
          },
          body: JSON.stringify(makePayload),
        });

        webhookDispatched = makeRes.ok;
      } catch (webhookErr) {
        console.warn('Error al contactar webhook de Make en Cloudflare Function:', webhookErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        webhookDispatched,
        email: tokenEmail,
        name: verifiedName,
        message: 'Registro validado y procesado exitosamente.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Error procesando notificación de registro en Cloudflare Function.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
