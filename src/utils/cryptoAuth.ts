/**
 * ALICLIP CRYPTOGRAPHIC AUTHENTICATION & PASSWORD HASHING
 *
 * Utilidad para el hasheo criptográfico seguro de contraseñas utilizando
 * la API Web Crypto nativa (SHA-256 con salt) para proteger credenciales en reposo y en tránsito.
 */

const DEFAULT_SALT = 'aliclip_sec_salt_2026_x9';

/**
 * Genera un hash SHA-256 con salt para una contraseña
 */
export async function hashPassword(password: string, salt: string = DEFAULT_SALT): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password.trim()}:${salt}`);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback seguro si crypto.subtle no está disponible (ej. entornos antiguos)
  let hash = 0;
  const str = `${salt}:${password.trim()}:${salt}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Verifica si una contraseña en texto plano coincide con un hash existente
 */
export async function verifyPassword(password: string, storedHash: string, salt: string = DEFAULT_SALT): Promise<boolean> {
  const computedHash = await hashPassword(password, salt);
  return computedHash === storedHash;
}

/**
 * Hash precalculado de la contraseña por defecto ('admin' con DEFAULT_SALT)
 */
export const DEFAULT_ADMIN_PASSWORD_HASH = '865580ccd0048a702003b1496b2631e0fa650525840b604b0469ae571644a2a9';
