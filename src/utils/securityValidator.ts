/**
 * ALICLIP SECURITY VALIDATOR & INPUT SANITIZER
 *
 * Módulo de defensa en profundidad para validar y rechazar cualquier tipo de código malicioso,
 * comandos de shell, inyecciones XSS, SQLi, scripts ocultos o payloads disfrazados de texto normal.
 */

// 1. Patrones sospechosos de inyección de scripts, XSS y protocolos peligrosos
const SCRIPT_INJECTION_PATTERNS = [
  /<\s*script\b[^>]*>/i,
  /<\s*\/\s*script\s*>/i,
  /<\s*(iframe|object|embed|applet|meta|link|base)\b/i,
  /\bon[a-z]{3,15}\s*=/i, // onload=, onerror=, onclick=, onmouseover=, etc.
  /\bjavascript\s*:/i,
  /\bvbscript\s*:/i,
  /\bdata\s*:\s*text\/html/i,
  /\blivescript\s*:/i,
  /\beval\s*\(/i,
  /\b(setTimeout|setInterval)\s*\(\s*["'`]/i,
  /\bdocument\s*\.\s*(cookie|location|write|domain)/i,
  /\bwindow\s*\.\s*(location|open|document)/i,
];

// 2. Patrones sospechosos de ejecución de comandos de terminal / shell injection
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`]\s*(rm|cat|ls|curl|wget|bash|sh|zsh|kill|chmod|chown|sudo|su|nc|netcat|python|perl|php|ruby)\b/i,
  /\$\(\s*[^)]+\s*\)/, // $(command)
  /`[^`]{2,}`/, // `command`
  /\/bin\/(sh|bash|zsh|dash)/i,
  /\b(powershell(\.exe)?|cmd\.exe)\b/i,
  /;\s*echo\b/i,
  /\b(2>&1|>\s*\/dev\/null|<\s*\/etc)/i,
];

// 3. Patrones de SQL Injection y manipulación de base de datos
const SQL_INJECTION_PATTERNS = [
  /('\s*--|\bOR\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i,
  /\bUNION\s+(ALL\s+)?SELECT\b/i,
  /\bDROP\s+(TABLE|DATABASE|VIEW)\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bUPDATE\s+\w+\s+SET\b/i,
  /\bEXEC(\s+|\()+/i,
];

// 4. Patrones de Directory Traversal y acceso a archivos de sistema
const PATH_TRAVERSAL_PATTERNS = [
  /(\.\.\/|\.\.\\){2,}/,
  /\/etc\/(passwd|shadow|hosts|group)/i,
  /C:\\(Windows|System32)/i,
];

// 5. Caracteres de control nulos o secuencias binarias
const CONTROL_CHAR_PATTERNS = [
  /\0|%00|\\x00/i,
];

export interface ValidationResult {
  valid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * Escanea un texto para detectar si contiene código o comandos maliciosos disfrazados.
 */
export function detectMaliciousPayload(input: unknown): { isMalicious: boolean; reason?: string } {
  if (typeof input !== 'string') {
    return { isMalicious: false };
  }

  const str = input.trim();
  if (!str) return { isMalicious: false };

  // 1. Control chars
  for (const pattern of CONTROL_CHAR_PATTERNS) {
    if (pattern.test(str)) {
      return { isMalicious: true, reason: 'Caracteres nulos o secuencias de control no permitidas.' };
    }
  }

  // 2. Scripts / XSS
  for (const pattern of SCRIPT_INJECTION_PATTERNS) {
    if (pattern.test(str)) {
      return { isMalicious: true, reason: 'Intento de inyección de script o código HTML no permitido.' };
    }
  }

  // 3. Command Injection
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(str)) {
      return { isMalicious: true, reason: 'Comandos de consola o caracteres de ejecución bloqueados.' };
    }
  }

  // 4. SQL Injection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(str)) {
      return { isMalicious: true, reason: 'Secuencias de inyección SQL detectadas.' };
    }
  }

  // 5. Path Traversal
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(str)) {
      return { isMalicious: true, reason: 'Rutas relativas o acceso al sistema de archivos bloqueado.' };
    }
  }

  return { isMalicious: false };
}

/**
 * Sanitiza texto eliminando etiquetas HTML peligrosas y normalizando caracteres
 */
export function sanitizeStrictText(input: string, maxLength = 1000): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '') // Elimina etiquetas HTML
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '') // Elimina caracteres de control
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitiza texto de una sola línea (nombres, títulos, códigos)
 */
export function sanitizeSingleLine(input: string, maxLength = 150): string {
  return sanitizeStrictText(input, maxLength).replace(/[\r\n\t]+/g, ' ');
}

/**
 * Validación estricta para Nombres de Persona o Cliente
 * Permite letras (incluyendo tildes y ñ), espacios, apóstrofes y guiones.
 * Rechaza símbolos de programación (<, >, ;, {, }, $, etc.) y comandos.
 */
export function validateCustomerName(name: string, label = 'Nombre'): ValidationResult {
  const check = detectMaliciousPayload(name);
  if (check.isMalicious) {
    return { valid: false, sanitized: '', error: `${label}: ${check.reason}` };
  }

  const clean = sanitizeSingleLine(name, 100);
  if (!clean) {
    return { valid: false, sanitized: '', error: `${label} es obligatorio.` };
  }

  if (clean.length < 2) {
    return { valid: false, sanitized: clean, error: `${label} debe tener al menos 2 caracteres.` };
  }

  // Rechazar símbolos peligrosos o matemáticos/de shell en nombres
  const safeNameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'\-_]+$/;
  if (!safeNameRegex.test(clean)) {
    return {
      valid: false,
      sanitized: clean,
      error: `${label} contiene símbolos o caracteres no permitidos. Solo se admiten letras y espacios.`,
    };
  }

  return { valid: true, sanitized: clean };
}

/**
 * Validación estricta para Correos Electrónicos
 * Rechaza saltos de línea (Header Injection), comillas o scripts.
 */
export function validateCustomerEmail(email: string, label = 'Correo electrónico'): ValidationResult {
  const check = detectMaliciousPayload(email);
  if (check.isMalicious) {
    return { valid: false, sanitized: '', error: `${label}: ${check.reason}` };
  }

  const clean = email.trim().toLowerCase().slice(0, 120);
  if (!clean) {
    return { valid: false, sanitized: '', error: `${label} es obligatorio.` };
  }

  // Estricto RFC 5322 simplificado: sin espacios, sin comillas, sin caracteres extraños
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
  if (!emailRegex.test(clean) || clean.includes(' ') || clean.includes('<') || clean.includes('>')) {
    return { valid: false, sanitized: clean, error: `Por favor ingresa un ${label.toLowerCase()} válido.` };
  }

  return { valid: true, sanitized: clean };
}

/**
 * Validación estricta para Teléfonos y WhatsApp
 * Solo permite dígitos, prefijo '+', espacios o guiones. Rechaza cualquier texto o comando.
 */
export function validatePhoneNumber(phone: string, label = 'Teléfono'): ValidationResult {
  const check = detectMaliciousPayload(phone);
  if (check.isMalicious) {
    return { valid: false, sanitized: '', error: `${label}: ${check.reason}` };
  }

  const clean = phone.trim().slice(0, 25);
  if (!clean) {
    return { valid: false, sanitized: '', error: `${label} es obligatorio.` };
  }

  // Solo dígitos, +, espacios y guiones
  const phoneRegex = /^[+]?[\d\s\-()]{6,25}$/;
  if (!phoneRegex.test(clean)) {
    return { valid: false, sanitized: clean, error: `${label} solo debe contener números válidos.` };
  }

  return { valid: true, sanitized: clean };
}

/**
 * Validación estricta para Documentos de Identidad (DNI, RUC, CE)
 */
export function validateIdentityDocument(doc: string, label = 'Documento de identidad'): ValidationResult {
  const check = detectMaliciousPayload(doc);
  if (check.isMalicious) {
    return { valid: false, sanitized: '', error: `${label}: ${check.reason}` };
  }

  const clean = doc.trim().replace(/\s+/g, '').slice(0, 20);
  if (!clean) {
    return { valid: false, sanitized: '', error: `${label} es obligatorio.` };
  }

  // Solo alfanumérico limpio (DNI 8 dígitos, RUC 11 dígitos, CE alfanumérico)
  const docRegex = /^[a-zA-Z0-9\-]{5,15}$/;
  if (!docRegex.test(clean)) {
    return { valid: false, sanitized: clean, error: `${label} debe tener entre 5 y 15 dígitos o caracteres válidos.` };
  }

  return { valid: true, sanitized: clean };
}

/**
 * Validación estricta para Textos descriptivos, Notas, Reclamos o Reseñas
 */
export function validateDescriptiveText(
  text: string,
  options: {
    label?: string;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
  } = {}
): ValidationResult {
  const { label = 'Texto', minLength = 3, maxLength = 2000, required = false } = options;

  if (!text || !text.trim()) {
    if (required) {
      return { valid: false, sanitized: '', error: `${label} es requerido.` };
    }
    return { valid: true, sanitized: '' };
  }

  const check = detectMaliciousPayload(text);
  if (check.isMalicious) {
    return { valid: false, sanitized: '', error: `${label}: ${check.reason}` };
  }

  const clean = sanitizeStrictText(text, maxLength);
  if (required && clean.length < minLength) {
    return { valid: false, sanitized: clean, error: `${label} debe tener al menos ${minLength} caracteres.` };
  }

  return { valid: true, sanitized: clean };
}

/**
 * Validación estricta para Búsqueda (Search Query)
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  const check = detectMaliciousPayload(query);
  if (check.isMalicious) {
    return ''; // Descarta búsquedas con payloads
  }
  return query
    .replace(/[<>{};$]/g, '')
    .trim()
    .slice(0, 80);
}

/**
 * Validación estricta para URLs (Enlaces de soporte, comprobantes o perfiles)
 */
export function validateSafeUrl(url: string, label = 'Enlace'): ValidationResult {
  if (!url || !url.trim()) {
    return { valid: true, sanitized: '' };
  }

  const check = detectMaliciousPayload(url);
  if (check.isMalicious) {
    return { valid: false, sanitized: '', error: `${label}: ${check.reason}` };
  }

  const clean = url.trim();
  // Solo se permiten protocolos http y https
  if (!/^https?:\/\//i.test(clean)) {
    return { valid: false, sanitized: clean, error: `${label} debe ser una dirección web válida (ej. https://...).` };
  }

  try {
    const parsed = new URL(clean);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, sanitized: clean, error: `${label}: Protocolo no permitido.` };
    }
    return { valid: true, sanitized: parsed.href };
  } catch {
    return { valid: false, sanitized: clean, error: `${label}: Formato de URL inválido.` };
  }
}
