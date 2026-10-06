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
    const { prompt, systemInstruction } = body;

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'El campo "prompt" es requerido.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload: any = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const geminiData: any = await geminiRes.json();

    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: geminiData?.error?.message || 'Error comunicando con Gemini API.' }),
        { status: geminiRes.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(JSON.stringify({ text }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Error procesando la solicitud en Cloudflare.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
};
