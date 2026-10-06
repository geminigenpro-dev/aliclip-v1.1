import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();

// Enable CORS for frontend requests (including Cloudflare Pages, custom domains, or localhost)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

/**
 * Server-Side Gemini Client.
 * CRITICAL SECURITY: GEMINI_API_KEY is read strictly from process.env on the server.
 * It is NEVER bundled into frontend JavaScript, preventing API key leakage on Cloudflare / browser clients.
 */
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno del servidor.');
  }
  return new GoogleGenAI({ apiKey });
}

// 1. Healthcheck Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mode: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 2. Secure Gemini AI Generation Proxy
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'El campo "prompt" es requerido y debe ser una cadena de texto.' });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    return res.json({
      text: response.text || '',
    });
  } catch (error: any) {
    console.error('Error en /api/gemini/generate:', error);
    return res.status(500).json({
      error: error?.message || 'Error procesando solicitud con Gemini AI.',
    });
  }
});

// 3. AI Helper: Product Description & Marketing Copy Generator
app.post('/api/gemini/product-copy', async (req: Request, res: Response) => {
  try {
    const { productName, category, tag } = req.body;
    if (!productName) {
      return res.status(400).json({ error: 'El nombre del producto es requerido.' });
    }

    const ai = getGeminiClient();
    const prompt = `Genera una descripción corta, atractiva y profesional para una tienda digital de membresías y cuentas.
Producto: ${productName}
Categoría: ${category || 'General'}
Etiqueta/Destacado: ${tag || 'Premium'}

Instrucciones:
- Escribe una sola frase persuasiva de máximo 18 palabras.
- Resalta calidad, acceso garantizado o beneficios clave.
- No incluyas comillas ni texto adicional. Solo la descripción.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.json({
      description: response.text?.trim() || '',
    });
  } catch (error: any) {
    console.error('Error en /api/gemini/product-copy:', error);
    return res.status(500).json({
      error: error?.message || 'Error generando descripción con IA.',
    });
  }
});

// Server Initialization: Vite Dev Middleware vs Static Files in Production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Servidor Backend iniciado en http://0.0.0.0:${PORT} [Modo: ${isProduction ? 'Producción' : 'Desarrollo'}]`);
  });
}

startServer();
