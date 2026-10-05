/**
 * Servicio de Inteligencia Artificial (Gemini) en el Frontend.
 *
 * SEGURIDAD Y CLOUDFLARE:
 * - Todas las peticiones van a través del backend (/api/gemini/*).
 * - La clave de API de Gemini (GEMINI_API_KEY) permanece 100% protegida en el servidor.
 * - NUNCA se expone en el código cliente de Vite ni en Cloudflare Pages / devtools.
 */

// Si el frontend está separado en Cloudflare Pages y el backend está en otro dominio,
// se puede configurar VITE_API_URL en el entorno de Cloudflare.
// Si están juntos (despliegue full-stack), se usa ruta relativa '/api'.
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export interface AiCopyResponse {
  description: string;
}

export interface AiTextResponse {
  text: string;
}

/**
 * Genera una descripción comercial optimizada para un producto usando Gemini AI desde el backend.
 */
export async function generateProductDescription(
  productName: string,
  category: string,
  tag?: string
): Promise<string> {
  const url = `${API_BASE_URL}/api/gemini/product-copy`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productName,
      category,
      tag,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error del servidor AI (${response.status})`);
  }

  const data: AiCopyResponse = await response.json();
  return data.description;
}

/**
 * Petición genérica de texto al backend de Gemini.
 */
export async function askGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const url = `${API_BASE_URL}/api/gemini/generate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      systemInstruction,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error del servidor AI (${response.status})`);
  }

  const data: AiTextResponse = await response.json();
  return data.text;
}

/**
 * Verifica el estado del backend y si Gemini está configurado en el servidor.
 */
export async function checkBackendStatus(): Promise<{ status: string; geminiConfigured: boolean }> {
  try {
    const url = `${API_BASE_URL}/api/health`;
    const response = await fetch(url);
    if (!response.ok) {
      return { status: 'offline', geminiConfigured: false };
    }
    return await response.json();
  } catch {
    return { status: 'offline', geminiConfigured: false };
  }
}
