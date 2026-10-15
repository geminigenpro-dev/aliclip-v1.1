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
  // Política de referrers estricta
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // HSTS (HTTP Strict Transport Security)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Restricción de permisos de hardware
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Permitir carga en iframe seguro
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

// -----------------------------------------------------------------------------
// 4. NOTIFICACIONES AUTOMÁTICAS: REGISTRO DE CLIENTE Y ENTREGA DE CREDENCIALES
// -----------------------------------------------------------------------------

// Notificación de copia de registro al correo y WhatsApp (Sincronizado con Make.com vía MAKE_WEBHOOK_URL)
app.post('/api/notifications/registration', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, storeName = 'AliClip Store' } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Nombre, correo y WhatsApp son requeridos para el registro.' });
    }

    const checkName = detectMaliciousPayload(name);
    const checkEmail = detectMaliciousPayload(email);
    const checkPhone = detectMaliciousPayload(phone);

    if (checkName.isMalicious || checkEmail.isMalicious || checkPhone.isMalicious) {
      return res.status(400).json({ error: 'Datos de registro contienen caracteres no permitidos.' });
    }

    const cleanName = sanitizeStrictText(name, 100);
    const cleanEmail = sanitizeStrictText(email, 120);
    const cleanPhone = sanitizeStrictText(phone, 30);
    const clientToken = `CLI-${Date.now().toString().slice(-6)}`;

    // Validación opcional de token de Firebase en desarrollo local
    const authHeader = req.headers.authorization;
    let verifiedEmail = cleanEmail;
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const idToken = authHeader.replace(/^bearer\s+/i, '').trim();
      const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyAzNLYJqHVkdFfWcRYn2Mi4ylhdiFsgkGk';
      try {
        const verifyRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          }
        );
        if (verifyRes.ok) {
          const verifyData: any = await verifyRes.json();
          const userRec = verifyData?.users?.[0];
          if (userRec?.email) {
            verifiedEmail = userRec.email.toLowerCase();
          }
        }
      } catch (verifyErr) {
        console.warn('[SERVER] Advertencia verificando Firebase token:', verifyErr);
      }
    }

    console.log(`[NOTIFICACIÓN REGISTRO] Registro exitoso para: ${verifiedEmail} (Titular: ${cleanName})`);

    // Sincronización asíncrona con Webhook de Make.com
    const makeWebhookUrl =
      process.env.MAKE_WEBHOOK_URL ||
      'https://hook.us2.make.com/p63mga8ksfezopwnure7x128cxq8tivq';
    const makeApiKey =
      process.env.MAKE_API_KEY ||
      'mlsn.3f1b4ce05eb6f5c5c3c546a623f9a62056d5ac5caa53a1659258f531081f45e4';

    if (makeWebhookUrl && makeWebhookUrl.startsWith('http')) {
      const asyncDispatch = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (makeApiKey) {
            headers['x-make-apikey'] = makeApiKey;
          }

          const makeRes = await fetch(makeWebhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              event: 'user_registered_success',
              store: storeName,
              email: verifiedEmail,
              name: cleanName || undefined,
              phone: cleanPhone || undefined,
              clientToken,
              registeredAt: new Date().toISOString(),
              action: 'send_welcome_email',
              supportEmail: 'soporte@aliclip.site',
              supportWhatsApp: '+51967693595',
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          console.log(`[MAKE WEBHOOK ASYNC] Estado respuesta: ${makeRes.status} ${makeRes.statusText}`);
        } catch (whErr: any) {
          console.warn('[MAKE WEBHOOK ASYNC] Error al contactar webhook:', whErr?.message);
        }
      };
      setImmediate(asyncDispatch);
    }

    return res.json({
      success: true,
      clientToken,
      clientName: cleanName,
      clientEmail: verifiedEmail,
      clientPhone: cleanPhone,
      timestamp: new Date().toISOString(),
      message: `Copia de registro enviada exitosamente a ${verifiedEmail} y preparada para WhatsApp.`,
    });
  } catch (err: any) {
    console.error('Error en /api/notifications/registration:', err);
    return res.status(500).json({ error: 'Error procesando notificación de registro.' });
  }
});

// Notificación de alerta de nuevo pedido a administración
app.post('/api/notifications/order-alert', async (req: Request, res: Response) => {
  try {
    const {
      token,
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
    } = req.body;

    const saleToken = token || accessToken || orderId || `ALI-${Date.now().toString().slice(-5)}`;
    const timestamp = new Date().toISOString();

    const makeWebhookUrl =
      process.env.MAKE_WEBHOOK_URL ||
      'https://hook.us2.make.com/p63mga8ksfezopwnure7x128cxq8tivq';
    const makeApiKey =
      process.env.MAKE_API_KEY ||
      'mlsn.3f1b4ce05eb6f5c5c3c546a623f9a62056d5ac5caa53a1659258f531081f45e4';

    if (makeWebhookUrl && makeWebhookUrl.startsWith('http')) {
      const asyncDispatch = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (makeApiKey) {
            headers['x-make-apikey'] = makeApiKey;
          }

          const makeRes = await fetch(makeWebhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              event: 'admin_order_alert',
              store: storeName,
              token: saleToken,
              orderId: saleToken,
              accessToken: saleToken,
              client_name: clientName,
              clientName,
              client_email: clientEmail,
              clientEmail,
              client_phone: clientPhone,
              clientPhone,
              product_name: productName,
              productName,
              plan_name: planName,
              planName,
              price: Number(price) || 0,
              payment_method: paymentMethod || 'Web',
              paymentMethod: paymentMethod || 'Web',
              created_at: timestamp,
              timestamp,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          console.log(`[MAKE WEBHOOK ORDER ALERT] Estado: ${makeRes.status} ${makeRes.statusText}`);
        } catch (whErr: any) {
          console.warn('[MAKE WEBHOOK ORDER ALERT] Error:', whErr?.message);
        }
      };
      setImmediate(asyncDispatch);
    }

    return res.json({
      success: true,
      orderId: saleToken,
      timestamp,
      message: `Alerta de nuevo pedido enviada a administración y webhook de Make.com.`,
    });
  } catch (err: any) {
    console.error('Error en /api/notifications/order-alert:', err);
    return res.status(500).json({ error: 'Error procesando alerta de pedido.' });
  }
});

// Notificación de confirmación de venta y entrega de credenciales de acceso
app.post('/api/notifications/sale-credentials', (req: Request, res: Response) => {
  try {
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
    } = req.body;

    if (!clientName || !clientPhone || !productName) {
      return res.status(400).json({ error: 'Datos incompletos para el despacho de credenciales.' });
    }

    // Validación estricta
    if (
      detectMaliciousPayload(clientName).isMalicious ||
      detectMaliciousPayload(clientPhone).isMalicious ||
      (clientEmail && detectMaliciousPayload(clientEmail).isMalicious)
    ) {
      return res.status(400).json({ error: 'Datos del cliente contienen comandos no permitidos.' });
    }

    const cleanName = sanitizeStrictText(clientName, 100);
    const cleanPhone = sanitizeStrictText(clientPhone, 30);
    const cleanEmail = clientEmail ? sanitizeStrictText(clientEmail, 120) : '';
    const cleanProduct = sanitizeStrictText(productName, 100);
    const token = accessToken || saleId || 'ALI-VIP';

    // Despacho a Make.com
    const makeWebhookUrl =
      process.env.MAKE_WEBHOOK_URL ||
      'https://hook.us2.make.com/p63mga8ksfezopwnure7x128cxq8tivq';
    const makeApiKey =
      process.env.MAKE_API_KEY ||
      'mlsn.3f1b4ce05eb6f5c5c3c546a623f9a62056d5ac5caa53a1659258f531081f45e4';

    if (makeWebhookUrl && makeWebhookUrl.startsWith('http')) {
      const asyncDispatch = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (makeApiKey) headers['x-make-apikey'] = makeApiKey;

          const makeRes = await fetch(makeWebhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              event: 'sale_credentials_delivered',
              store: storeName,
              token,
              saleId: token,
              accessToken: token,
              clientName: cleanName,
              clientEmail: cleanEmail,
              clientPhone: cleanPhone,
              productName: cleanProduct,
              planName: planName || '',
              price: Number(price) || 0,
              expirationDate: expirationDate || '',
              credentials: credentials || {},
              timestamp: new Date().toISOString(),
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          console.log(`[MAKE WEBHOOK CREDENTIALS] Estado: ${makeRes.status} ${makeRes.statusText}`);
        } catch (whErr: any) {
          console.warn('[MAKE WEBHOOK CREDENTIALS] Error:', whErr?.message);
        }
      };
      setImmediate(asyncDispatch);
    }

    console.log(`[NOTIFICACIÓN CREDENCIALES] Venta confirmada: ${cleanProduct} (${token}) enviada a cliente ${cleanName} [Correo: ${cleanEmail || 'N/A'}, WhatsApp: ${cleanPhone}]`);

    return res.json({
      success: true,
      token,
      clientName: cleanName,
      clientPhone: cleanPhone,
      clientEmail: cleanEmail,
      timestamp: new Date().toISOString(),
      message: `Credenciales de ${cleanProduct} sincronizadas en panel del cliente y enviadas a ${cleanEmail || cleanPhone}.`,
    });
  } catch (err: any) {
    console.error('Error en /api/notifications/sale-credentials:', err);
    return res.status(500).json({ error: 'Error procesando despacho de credenciales.' });
  }
});

// Endpoint de prueba directa del Webhook de Make.com
app.post('/api/admin/test-make-webhook', async (_req: Request, res: Response) => {
  const makeWebhookUrl =
    process.env.MAKE_WEBHOOK_URL ||
    'https://hook.us2.make.com/p63mga8ksfezopwnure7x128cxq8tivq';
  const makeApiKey =
    process.env.MAKE_API_KEY ||
    'mlsn.3f1b4ce05eb6f5c5c3c546a623f9a62056d5ac5caa53a1659258f531081f45e4';

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (makeApiKey) headers['x-make-apikey'] = makeApiKey;

    const samplePayload = {
      event: 'user_registered_success',
      store: 'AliClip Store',
      name: 'Cliente Prueba Make',
      email: 'prueba.make@aliclip.site',
      phone: '+51987654321',
      clientToken: `CLI-${Date.now().toString().slice(-5)}`,
      registeredAt: new Date().toISOString(),
      action: 'send_welcome_email',
      supportEmail: 'soporte@aliclip.site',
      supportWhatsApp: '+51967693595',
    };

    const makeRes = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(samplePayload),
    });

    const responseText = await makeRes.text();

    return res.json({
      success: makeRes.ok || makeRes.status === 200,
      statusCode: makeRes.status,
      statusText: makeRes.statusText,
      webhookUrl: makeWebhookUrl,
      hasApiKey: Boolean(makeApiKey),
      responseBody: responseText,
      sampleSent: samplePayload,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Error probando webhook de Make.com',
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
