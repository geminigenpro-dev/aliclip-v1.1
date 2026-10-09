import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { detectMaliciousPayload, sanitizeStrictText } from './src/utils/securityValidator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();

// -----------------------------------------------------------------------------
// 1. FORZAR HTTPS EN PRODUCCIÓN
// -----------------------------------------------------------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  if (isProduction) {
    const proto = req.headers['x-forwarded-proto'];
    if (proto && proto !== 'https') {
      const host = req.headers.host || 'aliclip.site';
      return res.redirect(301, `https://${host}${req.url}`);
    }
  }
  next();
});

// -----------------------------------------------------------------------------
// 2. SECURITY HEADERS DEFENSA EN PROFUNDIDAD
// -----------------------------------------------------------------------------
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Prevenir sniffing de tipo MIME
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Filtro XSS legacy
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Política de referrers estricta
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // HSTS (HTTP Strict Transport Security)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Restricción de permisos de hardware
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Permitir carga en iframe de AI Studio mientras previene clickjacking externo
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Enable CORS for frontend requests (including Cloudflare Pages, custom domains, or localhost)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// -----------------------------------------------------------------------------
// 3. AUTENTICACIÓN Y HASHEO CRIPTOGRÁFICO DEL LADO DEL SERVIDOR
// -----------------------------------------------------------------------------
const SERVER_AUTH_SALT = 'aliclip_sec_salt_2026_x9';
const SERVER_AUTH_SECRET = process.env.JWT_SECRET || process.env.GEMINI_API_KEY || 'aliclip_sec_jwt_hmac_key_2026';

function hashPasswordServer(password: string): string {
  return crypto
    .createHash('sha256')
    .update(`${SERVER_AUTH_SALT}:${password.trim()}:${SERVER_AUTH_SALT}`)
    .digest('hex');
}

function generateSessionToken(username: string): string {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
  const payload = `${username}:${expiry}`;
  const hmac = crypto.createHmac('sha256', SERVER_AUTH_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64');
}

function verifySessionToken(token: string): { valid: boolean; user?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [user, expiryStr, hmac] = decoded.split(':');
    if (!user || !expiryStr || !hmac) return { valid: false };
    const expiry = Number(expiryStr);
    if (Date.now() > expiry) return { valid: false };
    const expectedHmac = crypto.createHmac('sha256', SERVER_AUTH_SECRET).update(`${user}:${expiryStr}`).digest('hex');
    if (expectedHmac !== hmac) return { valid: false };
    return { valid: true, user };
  } catch {
    return { valid: false };
  }
}

// Middleware para restringir acceso a registros del lado del servidor
function requireServerAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token de autenticación requerido.' });
  }

  const token = authHeader.split(' ')[1];
  const check = verifySessionToken(token);
  if (!check.valid) {
    return res.status(403).json({ error: 'Acceso denegado: Sesión expirada o token inválido.' });
  }

  (req as any).user = check.user;
  next();
}

// Endpoint de login seguro con verificación de hash
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }

  // Rechazar posibles comandos
  if (detectMaliciousPayload(username).isMalicious || detectMaliciousPayload(password).isMalicious) {
    return res.status(400).json({ error: 'Credenciales inválidas: caracteres sospechosos.' });
  }

  const cleanUser = String(username).trim().toLowerCase();
  const envUser = (process.env.VITE_ADMIN_DEFAULT_USER || 'admin').toLowerCase();
  const envPass = process.env.VITE_ADMIN_DEFAULT_PASS || 'admin';
  const expectedHash = hashPasswordServer(envPass);
  const inputHash = hashPasswordServer(String(password));

  if (cleanUser === envUser && inputHash === expectedHash) {
    const token = generateSessionToken(cleanUser);
    return res.json({
      success: true,
      token,
      user: cleanUser,
      role: 'admin',
      expiresIn: 86400,
    });
  }

  return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
});

// Endpoint de verificación de sesión
app.get('/api/auth/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false });
  }
  const token = authHeader.split(' ')[1];
  const check = verifySessionToken(token);
  return res.json({ authenticated: check.valid, user: check.user });
});

// Endpoint protegido para verificar acceso a registros
app.get('/api/admin/verify-access', requireServerAuth, (req: Request, res: Response) => {
  return res.json({
    authorized: true,
    user: (req as any).user,
    message: 'Acceso concedido a registros protegidos del sistema.',
  });
});

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

    // Validación estricta contra comandos o scripts maliciosos
    const securityCheck = detectMaliciousPayload(prompt);
    if (securityCheck.isMalicious) {
      return res.status(400).json({ error: `Solicitud rechazada: ${securityCheck.reason}` });
    }
    if (systemInstruction && typeof systemInstruction === 'string') {
      const sysCheck = detectMaliciousPayload(systemInstruction);
      if (sysCheck.isMalicious) {
        return res.status(400).json({ error: `Instrucción del sistema rechazada: ${sysCheck.reason}` });
      }
    }

    const cleanPrompt = sanitizeStrictText(prompt, 4000);
    const cleanSys = systemInstruction ? sanitizeStrictText(systemInstruction, 2000) : undefined;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: cleanPrompt,
      config: cleanSys ? { systemInstruction: cleanSys } : undefined,
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
    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ error: 'El nombre del producto es requerido.' });
    }

    // Validación estricta contra inyecciones y comandos
    const nameCheck = detectMaliciousPayload(productName);
    if (nameCheck.isMalicious) {
      return res.status(400).json({ error: `Nombre de producto rechazado: ${nameCheck.reason}` });
    }
    if (category && typeof category === 'string' && detectMaliciousPayload(category).isMalicious) {
      return res.status(400).json({ error: 'Categoría contiene comandos no permitidos.' });
    }
    if (tag && typeof tag === 'string' && detectMaliciousPayload(tag).isMalicious) {
      return res.status(400).json({ error: 'Etiqueta contiene comandos no permitidos.' });
    }

    const cleanProductName = sanitizeStrictText(productName, 100);
    const cleanCategory = category ? sanitizeStrictText(category, 50) : 'General';
    const cleanTag = tag ? sanitizeStrictText(tag, 50) : 'Premium';

    const ai = getGeminiClient();
    const prompt = `Genera una descripción corta, atractiva y profesional para una tienda digital de membresías y cuentas.
Producto: ${cleanProductName}
Categoría: ${cleanCategory}
Etiqueta/Destacado: ${cleanTag}

Instrucciones:
- Escribe una sola frase persuasiva de máximo 18 palabras.
- Resalta calidad, acceso garantizado o beneficios clave.
- No incluyas comillas ni texto adicional. Solo la descripción.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
