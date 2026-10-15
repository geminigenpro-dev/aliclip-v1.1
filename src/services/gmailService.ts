import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../firebase';

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
];

// In-memory access token cache (CRITICAL: Never stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Clear access token automatically when auth state changes to signed out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

/**
 * Configure Google Auth Provider with full Gmail scopes
 */
function createGmailAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  GMAIL_SCOPES.forEach((scope) => {
    provider.addScope(scope);
  });
  provider.setCustomParameters({
    prompt: 'consent select_account',
    access_type: 'offline',
  });
  return provider;
}

/**
 * Initiates Google Sign-In with Gmail permissions and caches token in memory
 */
export async function signInWithGmail(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const provider = createGmailAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google para Gmail.');
    }

    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    console.error('Error al autenticar con Gmail:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Retrieves the currently active in-memory Gmail access token
 */
export async function getGmailAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

/**
 * Sets or updates the in-memory token (e.g. from existing Google auth credential)
 */
export function setCachedGmailAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

/**
 * Checks if Gmail access is currently authenticated
 */
export function isGmailAuthenticated(): boolean {
  return Boolean(cachedAccessToken);
}

/**
 * Clears the Gmail access token
 */
export function clearGmailAuth(): void {
  cachedAccessToken = null;
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  date: string;
  from: string;
  to: string;
  subject: string;
  isUnread: boolean;
}

export interface GmailMessageDetail extends GmailMessageSummary {
  bodyHtml?: string;
  bodyText?: string;
}

/**
 * Fetch the authenticated user's Gmail profile
 */
export async function fetchGmailProfile(): Promise<GmailProfile> {
  const token = await getGmailAccessToken();
  if (!token) throw new Error('Se requiere autenticación con Google para acceder a Gmail.');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error obteniendo perfil de Gmail (${res.status})`);
  }

  return await res.json();
}

/**
 * List messages with optional search query
 */
export async function listGmailMessages(query: string = '', maxResults: number = 20): Promise<GmailMessageSummary[]> {
  const token = await getGmailAccessToken();
  if (!token) throw new Error('Se requiere autenticación con Google para acceder a Gmail.');

  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  url.searchParams.set('maxResults', String(maxResults));
  if (query) {
    url.searchParams.set('q', query);
  }

  const listRes = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) {
    const err = await listRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error listando correos (${listRes.status})`);
  }

  const listData = await listRes.json();
  const messages = listData.messages || [];

  // Fetch summary headers for top messages
  const messageDetails: GmailMessageSummary[] = await Promise.all(
    messages.slice(0, 15).map(async (m: { id: string; threadId: string }) => {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!msgRes.ok) return null;
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const isUnread = Array.isArray(msgData.labelIds) && msgData.labelIds.includes('UNREAD');

        return {
          id: msgData.id,
          threadId: msgData.threadId,
          snippet: msgData.snippet || '',
          date: getHeader('Date'),
          from: getHeader('From'),
          to: getHeader('To'),
          subject: getHeader('Subject') || '(Sin Asunto)',
          isUnread,
        };
      } catch {
        return null;
      }
    })
  );

  return messageDetails.filter((m): m is GmailMessageSummary => m !== null);
}

/**
 * Fetch full message details including HTML/Text body
 */
export async function getGmailMessage(messageId: string): Promise<GmailMessageDetail> {
  const token = await getGmailAccessToken();
  if (!token) throw new Error('Se requiere autenticación con Google para acceder a Gmail.');

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error obteniendo correo (${res.status})`);
  }

  const data = await res.json();
  const headers = data.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  // Extract body
  let bodyHtml = '';
  let bodyText = '';

  const extractParts = (part: any) => {
    if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = decodeBase64Url(part.body.data);
    } else if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText = decodeBase64Url(part.body.data);
    }
    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(extractParts);
    }
  };

  if (data.payload) {
    if (data.payload.body?.data) {
      if (data.payload.mimeType === 'text/html') {
        bodyHtml = decodeBase64Url(data.payload.body.data);
      } else {
        bodyText = decodeBase64Url(data.payload.body.data);
      }
    }
    if (data.payload.parts) {
      data.payload.parts.forEach(extractParts);
    }
  }

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet || '',
    date: getHeader('Date'),
    from: getHeader('From'),
    to: getHeader('To'),
    subject: getHeader('Subject') || '(Sin Asunto)',
    isUnread: Array.isArray(data.labelIds) && data.labelIds.includes('UNREAD'),
    bodyHtml: bodyHtml || undefined,
    bodyText: bodyText || data.snippet || '',
  };
}

/**
 * Decodes standard base64url encoded string
 */
function decodeBase64Url(input: string): string {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const binStr = atob(base64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

/**
 * Converts a string to base64url encoding
 */
function encodeBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Constructs an RFC 2822 compliant email string
 */
function buildRfc2822Email({
  to,
  subject,
  htmlBody,
  senderName = 'AliClip Store Oficial',
}: {
  to: string;
  subject: string;
  htmlBody: string;
  senderName?: string;
}): string {
  const boundary = `----=_Part_${Date.now()}`;
  return [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    '',
    btoa(unescape(encodeURIComponent(htmlBody))),
    '',
    `--${boundary}--`,
  ].join('\r\n');
}

/**
 * Send an email directly through the Gmail API
 * NOTE: As per guidelines, this MUST only be executed after explicit user confirmation in the UI!
 */
export async function sendGmailMessage({
  to,
  subject,
  htmlBody,
  senderName,
}: {
  to: string;
  subject: string;
  htmlBody: string;
  senderName?: string;
}): Promise<{ id: string; threadId: string }> {
  const token = await getGmailAccessToken();
  if (!token) throw new Error('Se requiere autenticación con Google para enviar correos desde Gmail.');

  const rfcEmail = buildRfc2822Email({ to, subject, htmlBody, senderName });
  const rawBase64Url = encodeBase64Url(rfcEmail);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawBase64Url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error enviando correo con Gmail (${res.status})`);
  }

  return await res.json();
}
