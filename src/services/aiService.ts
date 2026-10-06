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
  try {
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

    if (response.ok) {
      const data: AiCopyResponse = await response.json();
      if (data.description) {
        return data.description;
      }
    }
  } catch {
    // Backend proxy offline / static host mode fallback
  }

  // Fallback inteligente para despliegues estáticos (Cloudflare Pages) sin backend activo:
  const cleanName = productName.trim();
  const isStreaming = category === 'streaming' || /netflix|disney|prime|hbo|max|spotify|paramount/i.test(cleanName);
  const isAi = category === 'ai' || /chatgpt|claude|midjourney|gemini|canva|cursor/i.test(cleanName);

  if (isStreaming) {
    return `Acceso Ultra HD 4K garantizado para ${cleanName}, con soporte inmediato y renovación continua sin caídas.`;
  } else if (isAi) {
    return `Membresía premium de ${cleanName} con acceso ilimitado a modelos avanzados, velocidad óptima y garantía total AliClip.`;
  }
  return `Membresía digital oficial de ${cleanName} con entrega rápida por WhatsApp y garantía certificada en Perú.`;
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
