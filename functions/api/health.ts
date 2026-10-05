interface Env {
  GEMINI_API_KEY?: string;
}

export const onRequestGet = async (context: { env: Env }) => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      platform: 'cloudflare-pages-function',
      timestamp: new Date().toISOString(),
      geminiConfigured: Boolean(context.env.GEMINI_API_KEY),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
