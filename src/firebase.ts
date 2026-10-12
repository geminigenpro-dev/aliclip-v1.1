import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Firebase client configuration with environment variable support and optional local config fallback
const resolvedFirebaseConfig = {
  ...firebaseConfig,
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || firebaseConfig?.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfig?.authDomain,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfig?.projectId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfig?.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfig?.messagingSenderId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || firebaseConfig?.appId,
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || (firebaseConfig as any)?.measurementId,
  databaseURL: (import.meta.env.VITE_FIREBASE_DATABASE_URL as string) || (firebaseConfig as any)?.databaseURL,
};

export const app = initializeApp(resolvedFirebaseConfig);

// Initialize Firestore (handles named DB or default project database)
const dbId =
  (import.meta.env.VITE_FIREBASE_DATABASE_ID as string) ||
  (firebaseConfig as { firestoreDatabaseId?: string })?.firestoreDatabaseId;
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Uploads a file or blob to Firebase Storage and returns its download URL.
 * Includes a timeout safeguard so the UI never hangs if Storage rules or CORS block the request.
 */
export async function uploadFileToFirebaseStorage(file: File | Blob, path: string): Promise<string> {
  const uploadPromise = (async () => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  })();

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Firebase Storage timeout: servicio no configurado o bloqueado por CORS.'));
    }, 3000);
  });

  try {
    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (err) {
    throw err;
  }
}

export {
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
};
export type { User };

/**
 * Traduce los códigos de error oficiales de Firebase Authentication a mensajes claros en español.
 */
export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Ocurrió un error inesperado al procesar la autenticación.';
  }

  const code = (error as { code?: string }).code || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya está registrado. Por favor, inicia sesión con tu contraseña.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico ingresado no es válido.';
    case 'auth/user-not-found':
      return 'No existe una cuenta registrada con este correo electrónico. Puedes crear una nueva cuenta.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo electrónico o contraseña incorrectos. Verifica tus datos e intenta nuevamente.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos consecutivos. El acceso ha sido bloqueado temporalmente por seguridad. Inténtalo más tarde.';
    case 'auth/network-request-failed':
      return 'Error de conexión de red. Verifica tu conexión a internet y vuelve a intentar.';
    case 'auth/popup-closed-by-user':
      return 'La ventana de autenticación de Google fue cerrada antes de completar el inicio de sesión.';
    case 'auth/cancelled-popup-request':
      return 'Se abrió otra ventana de autenticación y se canceló la solicitud anterior.';
    case 'auth/popup-blocked':
      return 'Tu navegador bloqueó la ventana emergente de Google. Por favor, habilita las ventanas emergentes (pop-ups) para este sitio.';
    case 'auth/unauthorized-domain':
      return 'Dominio no autorizado en Firebase. Agrega tu dominio (ej. aliclip.site o tu URL de Cloudflare) en Firebase Console > Authentication > Settings > Dominios autorizados.';
    case 'auth/operation-not-allowed':
      return 'El proveedor de inicio de sesión (Google o Correo) no está habilitado en Firebase Console. Ve a Authentication > Sign-in method y actívalo.';
    case 'auth/user-disabled':
      return 'Esta cuenta de usuario ha sido inhabilitada por administración.';
    default:
      return (error as Error).message || 'No se pudo completar la operación de autenticación.';
  }
}

