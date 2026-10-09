interface Env {
  GEMINI_API_KEY?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY no está configurada en las variables de Cloudflare Pages.' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const body: any = await context.request.json().catch(() => ({}));
    const { productName, category, tag } = body;

    if (!productName) {
      return new Response(
        JSON.stringify({ error: 'El nombre del producto es requerido.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Validación estricta contra inyecciones y comandos maliciosos
    const dangerousPatterns = [
      /<\s*script\b[^>]*>/i,
      /\bon[a-z]{3,15}\s*=/i,
      /\bjavascript\s*:/i,
      /[;&|`]\s*(rm|cat|curl|wget|bash|sh|sudo|chmod)\b/i,
      /\/bin\/(sh|bash)/i,
      /\0/
    ];
    if (dangerousPatterns.some((p) => p.test(productName) || (category && p.test(category)) || (tag && p.test(tag)))) {
      return new Response(
        JSON.stringify({ error: 'Solicitud rechazada: Se detectaron caracteres o comandos no permitidos en el producto.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const prompt = `Genera una descripción corta, atractiva y profesional para una tienda digital de membresías y cuentas.
Producto: ${productName}
Categoría: ${category || 'General'}
Etiqueta/Destacado: ${tag || 'Premium'}

Instrucciones:
- Escribe una sola frase persuasiva de máximo 18 palabras.
- Resalta calidad, acceso garantizado o beneficios clave.
- No incluyas comillas ni texto adicional. Solo la descripción.`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const geminiData: any = await geminiRes.json();

    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: geminiData?.error?.message || 'Error comunicando con Gemini API.' }),
        { status: geminiRes.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const description = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return new Response(JSON.stringify({ description }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Error procesando la solicitud en Cloudflare.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
};
