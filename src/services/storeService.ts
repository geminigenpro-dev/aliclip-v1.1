import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, StoreSettings, Claim, PaymentMethod, SaleRecord } from '../types';
import { resizeAndCompressImageToBase64, isSafeFirestoreImageSize } from '../utils/imageCompressor';

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pay_yape',
    name: 'Yape / Plin',
    badge: 'Inmediato • 0% comisión',
    accountNumber: '+51 900 000 000',
    accountHolder: 'AliClip Store Oficial',
    instructions: 'Envía captura del comprobante por WhatsApp tras realizar el yapeo.',
    color: '#8b5cf6', // Violet/Purple neon
    icon: 'smartphone',
    enabled: true,
    order: 1,
  },
  {
    id: 'pay_binance',
    name: 'Binance Pay',
    badge: 'Cripto USDT • Sin comisiones',
    accountNumber: '849201938',
    accountHolder: 'AliClipPay (USDT)',
    instructions: 'Paga directo en USDT mediante Binance Pay ID desde tu app Binance.',
    color: '#f59e0b', // Gold/Amber neon
    icon: 'coins',
    enabled: true,
    order: 2,
  },
  {
    id: 'pay_bcp',
    name: 'BCP Soles',
    badge: 'Transferencia Directa',
    accountNumber: '191-99882211-0-45',
    accountHolder: 'AliClip Store E.I.R.L.',
    instructions: 'CCI: 002-191-0099882211045-52. Acepta transferencias BCP y banca móvil.',
    color: '#06b6d4', // Cyan neon
    icon: 'credit-card',
    enabled: true,
    order: 3,
  },
  {
    id: 'pay_interbank',
    name: 'Interbank Soles',
    badge: 'Transferencia Móvil',
    accountNumber: '200-300400500-1',
    accountHolder: 'AliClip Store Oficial',
    instructions: 'CCI: 003-200-003004005001-33. Transferencias interbancarias inmediatas.',
    color: '#10b981', // Emerald neon
    icon: 'wallet',
    enabled: true,
    order: 4,
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_chatgpt',
    name: 'ChatGPT Plus',
    category: 'ai',
    tag: 'Oferta Flash • GPT-4o',
    desc: 'Acceso prioritario al modelo GPT-4o, análisis avanzado de datos, navegación y generación ilimitada.',
    imageUrl: '',
    icon: 'bot',
    available: true,
    order: 1,
    plans: [
      { name: '1 Mes VIP', price: 'S/ 45.00', desc: 'Perfil privado con PIN' },
      { name: '1 Mes Completo', price: 'S/ 74.90', desc: 'Cuenta privada a tu correo' },
      { name: '3 Meses VIP', price: 'S/ 94.90', desc: 'Ahorro del 15% garantizado' }
    ]
  },
  {
    id: 'prod_claude',
    name: 'Claude Pro',
    category: 'ai',
    tag: 'Sonnet 3.5 & Artifacts',
    desc: '5x más capacidad, límites extendidos de mensajes y razonamiento líder en desarrollo de software.',
    imageUrl: '',
    icon: 'cpu',
    available: true,
    order: 2,
    plans: [
      { name: '1 Mes VIP', price: 'S/ 15.00', desc: 'Perfil exclusivo de alta velocidad' },
      { name: '1 Mes Completo', price: 'S/ 76.00', desc: 'Cuenta privada con garantía' }
    ]
  },
  {
    id: 'prod_gemini',
    name: 'Gemini Advanced',
    category: 'ai',
    tag: 'Google 1.5 Pro',
    desc: 'Ventana de contexto ultra amplia de 1M de tokens e integración directa con Workspace.',
    imageUrl: '',
    icon: 'sparkles',
    available: true,
    order: 3,
    plans: [
      { name: '1 Mes', price: 'S/ 25.00', desc: 'Activación en cuenta Google' },
      { name: '3 Meses', price: 'S/ 75.00', desc: 'Soporte y renovación continua' }
    ]
  },
  {
    id: 'prod_midjourney',
    name: 'Midjourney',
    category: 'ai',
    tag: 'Versión 6.1 Fotorrealista',
    desc: 'Generación fotorrealista de imágenes artísticas por Discord en modo Fast GPU.',
    imageUrl: '',
    icon: 'palette',
    available: true,
    order: 4,
    plans: [
      { name: '1 Mes Fast VIP', price: 'S/ 36.90', desc: 'Servidor dedicado ultra veloz' },
      { name: '1 Mes Estándar', price: 'S/ 48.00', desc: 'Modo Relax ilimitado' }
    ]
  },
  {
    id: 'prod_runway',
    name: 'Runway Gen-3',
    category: 'ai',
    tag: 'Video Generativo Alpha',
    desc: 'Genera clips cinemáticos en alta fidelidad a partir de texto o imágenes.',
    imageUrl: '',
    icon: 'video',
    available: true,
    order: 5,
    plans: [
      { name: '1 Mes Pro', price: 'S/ 39.90', desc: 'Créditos mensuales de generación' }
    ]
  },
  {
    id: 'prod_canva',
    name: 'Canva Pro',
    category: 'ai',
    tag: 'Herramientas Magic AI',
    desc: 'Quita fondos, redimensiona y accede a millones de plantillas y fotos de stock.',
    imageUrl: '',
    icon: 'layout-grid',
    available: true,
    order: 6,
    plans: [
      { name: '1 Mes Personal', price: 'S/ 15.00', desc: 'A tu correo personal' },
      { name: '1 Año Completo', price: 'S/ 38.00', desc: 'Garantía por 365 días' }
    ]
  },
  {
    id: 'prod_leonardo',
    name: 'Leonardo AI',
    category: 'ai',
    tag: 'Phoenix & Motion',
    desc: 'Generación visual orientada a diseño comercial, assets de videojuegos y animación.',
    imageUrl: '',
    icon: 'image',
    available: true,
    order: 7,
    plans: [
      { name: '1 Mes Artisan', price: 'S/ 12.00', desc: 'Tokens para generación diaria' }
    ]
  },
  {
    id: 'prod_elevenlabs',
    name: 'ElevenLabs',
    category: 'ai',
    tag: 'Clonación de Voz IA',
    desc: 'Las voces sintéticas más humanas y expresivas para doblaje y videos de YouTube.',
    imageUrl: '',
    icon: 'mic',
    available: true,
    order: 8,
    plans: [
      { name: '1 Mes Starter', price: 'S/ 109.00', desc: '30,000 caracteres de audio' },
      { name: '1 Mes Creator', price: 'S/ 55.00', desc: '100,000 caracteres + voz clonada' }
    ]
  },
  {
    id: 'prod_netflix',
    name: 'Netflix 4K Ultra HD',
    category: 'streaming',
    tag: 'Oferta Flash • 4K HDR',
    desc: 'Series originales, estrenos y películas en la más alta resolución 4K HDR.',
    imageUrl: '',
    icon: 'tv',
    available: true,
    order: 9,
    plans: [
      { name: '1 Perfil PIN (1 Mes)', price: 'S/ 15.00', desc: 'Perfil privado sin caídas' },
      { name: '1 Perfil PIN (3 Meses)', price: 'S/ 32.00', desc: 'Ahorra en renovación trimestral' },
      { name: 'Cuenta Completa (4 Pantallas)', price: 'S/ 42.00', desc: 'Uso para todo el hogar' }
    ]
  },
  {
    id: 'prod_disney',
    name: 'Disney+ & ESPN',
    category: 'streaming',
    tag: 'Estrenos & Deportes en Vivo',
    desc: 'Todo Disney, Pixar, Marvel, Star Wars y los eventos deportivos de ESPN en directo.',
    imageUrl: '',
    icon: 'film',
    available: true,
    order: 10,
    plans: [
      { name: '1 Perfil PIN (1 Mes)', price: 'S/ 49.00', desc: 'Calidad 4K con PIN privado' },
      { name: 'Cuenta Completa (1 Mes)', price: 'S/ 26.00', desc: 'Uso familiar simultáneo' }
    ]
  },
  {
    id: 'prod_max',
    name: 'Max (HBO) Platino',
    category: 'streaming',
    tag: '4K UHD & Dolby Atmos',
    desc: 'El catálogo legendario de HBO, Warner Bros, Discovery y estrenos de cine.',
    imageUrl: '',
    icon: 'clapperboard',
    available: true,
    order: 11,
    plans: [
      { name: '1 Perfil PIN (1 Mes)', price: 'S/ 15.00', desc: 'Sin cortes y con PIN personal' },
      { name: 'Cuenta Completa', price: 'S/ 22.00', desc: 'Tus 3 pantallas activas' }
    ]
  },
  {
    id: 'prod_prime',
    name: 'Prime Video',
    category: 'streaming',
    tag: 'Películas & Series',
    desc: 'Producciones originales galardonadas y catálogo cinematográfico completo.',
    imageUrl: '',
    icon: 'play-square',
    available: true,
    order: 12,
    plans: [
      { name: '1 Perfil PIN (1 Mes)', price: 'S/ 12.00', desc: 'Full HD con perfil propio' },
      { name: 'Cuenta Completa (1 Mes)', price: 'S/ 16.00', desc: 'Cuenta privada 100%' }
    ]
  },
  {
    id: 'prod_spotify',
    name: 'Spotify Premium',
    category: 'streaming',
    tag: 'Música Sin Anuncios',
    desc: 'Reproducción sin anuncios, modo sin conexión y audio de alta fidelidad.',
    imageUrl: '',
    icon: 'music',
    available: true,
    order: 13,
    plans: [
      { name: '1 Mes Individual', price: 'S/ 12.00', desc: 'A tu propia cuenta' },
      { name: '3 Meses Renovables', price: 'S/ 19.50', desc: 'Sin perder tus playlists' }
    ]
  },
  {
    id: 'prod_youtube',
    name: 'YouTube Premium',
    category: 'streaming',
    tag: 'YouTube Music Incluido',
    desc: 'Videos sin publicidad, reproducción en segundo plano y descargas offline.',
    imageUrl: '',
    icon: 'youtube',
    available: true,
    order: 14,
    plans: [
      { name: '1 Mes a tu Correo', price: 'S/ 19.00', desc: 'Activación por invitación familiar' },
      { name: '3 Meses Continuos', price: 'S/ 23.00', desc: 'Garantía extendida' }
    ]
  },
  {
    id: 'prod_crunchyroll',
    name: 'Crunchyroll Mega Fan',
    category: 'streaming',
    tag: 'Anime en SimuCast',
    desc: 'Episodios estreno directo desde Japón 1 hora después de su emisión en HD.',
    imageUrl: '',
    icon: 'glasses',
    available: true,
    order: 15,
    plans: [
      { name: '1 Perfil PIN (1 Mes)', price: 'S/ 6.90', desc: 'Mega Fan sin publicidad' },
      { name: 'Cuenta Completa (1 Mes)', price: 'S/ 15.00', desc: '4 dispositivos simultáneos' }
    ]
  },
  {
    id: 'prod_paramount',
    name: 'Paramount+',
    category: 'streaming',
    tag: 'Cine & Series Exclusivas',
    desc: 'Blockbusters, realities, contenidos de Showtime y series exclusivas.',
    imageUrl: '',
    icon: 'monitor-play',
    available: true,
    order: 16,
    plans: [
      { name: '1 Perfil PIN (1 Mes)', price: 'S/ 6.50', desc: 'Perfil privado garantizado' }
    ]
  }
];

export const DEFAULT_SETTINGS: StoreSettings = {
  name: 'Ali',
  suffix: 'clip',
  subtitle: 'Digital Store',
  whatsappNumber: '51900000000',
  whatsappDisplay: '+51 900 000 000',
  announcement: 'Cuentas 100% garantizadas, renovables y soporte VIP 24/7',
  colorPrimary: '#4f46e5',
  colorAccent: '#06b6d4',
  creatorUrl: 'https://instagram.com/alfre.ofc',
  creatorHandle: '@alfre.ofc',
  brandFont: 'Plus Jakarta Sans',
  brandFontWeight: '900',
  brandLetterSpacing: '-0.025em',
  brandTextTransform: 'normal',
  brandLogoShape: 'rounded',
  brandLogoGlow: true,
  brandIconName: 'sparkles',
  tiktokUrl: 'https://www.tiktok.com',
  instagramUrl: 'https://www.instagram.com',
  telegramUrl: 'https://t.me',
  facebookUrl: 'https://www.facebook.com',
  youtubeUrl: 'https://youtube.com',
  twitterUrl: 'https://x.com',
  showTiktok: true,
  showInstagram: true,
  showTelegram: true,
  showFacebook: true,
  showYoutube: true,
  showTwitter: false,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  reviewsBadgeText: '✨ +15,000 Clientes Satisfechos en Todo el Perú',
  heroBadgeText: 'MEMBRESÍAS DIGITALES PREMIUM • ENTREGA EN 3 MINUTOS',
  heroTitlePrefix: 'ACCESO',
  heroTitleHighlight: 'PREMIUM',
  heroTitleSuffix: 'al Mejor Precio',
  heroDescription:
    'Cuentas 100% privadas y renovables mes a mes con activación inmediata por WhatsApp, garantía de reposición total y soporte técnico 24/7 en Perú.',
  heroRatingScore: '4.9 / 5.0',
  heroRatingText: '+15,000 Clientes en Perú',
  heroCtaText: 'Explorar Catálogo',
  heroShowcaseTitle: '+ Vendidos en Perú (En Vivo)',
};

const PRODUCTS_COLLECTION = 'products';
const SETTINGS_COLLECTION = 'settings';
const CLAIMS_COLLECTION = 'claims';
const SALES_COLLECTION = 'sales';

/**
 * Real-time listener for the products collection
 */
export function subscribeToProducts(
  onSuccess: (products: Product[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          name: data.name || '',
          category: data.category || 'ai',
          tag: data.tag || '',
          desc: data.desc || '',
          imageUrl: data.imageUrl || '',
          icon: data.icon || 'sparkles',
          available: data.available !== false,
          stock: typeof data.stock === 'number' ? data.stock : 10,
          order: typeof data.order === 'number' ? data.order : 99,
          plans: Array.isArray(data.plans) && data.plans.length > 0 ? data.plans : [
            { name: '1 Mes', price: 'S/ 25.00', desc: 'Plan Estándar' }
          ],
          updatedAt: data.updatedAt,
        });
      });
      // Sort by order or name
      items.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      onSuccess(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

/**
 * Real-time listener for the store settings document
 */
export function subscribeToSettings(
  onSuccess: (settings: StoreSettings) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, SETTINGS_COLLECTION, 'store');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const paymentMethods = Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0
          ? data.paymentMethods
          : DEFAULT_PAYMENT_METHODS;

        // Auto-upgrade legacy brand name if stored as 'Alix'/'play' in existing Firestore document
        const rawName = data.name;
        const rawSuffix = data.suffix;
        const isLegacyBrand = (!rawName || rawName === 'Alix') && (!rawSuffix || rawSuffix === 'play');
        const name = isLegacyBrand ? 'Ali' : rawName || 'Ali';
        const suffix = isLegacyBrand ? 'clip' : (rawSuffix !== undefined ? rawSuffix : 'clip');

        onSuccess({
          ...DEFAULT_SETTINGS,
          ...data,
          name,
          suffix,
          paymentMethods,
        });
      } else {
        // Doc not yet created, return defaults
        onSuccess(DEFAULT_SETTINGS);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/store`);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

/**
 * Real-time listener for the claims collection (Libro de Reclamaciones)
 */
export function subscribeToClaims(
  onSuccess: (claims: Claim[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, CLAIMS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Claim[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Claim);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onSuccess(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, CLAIMS_COLLECTION);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

/**
 * SEED FUNCTION: Adds initial test products to the products collection
 * Used to immediately validate real-time synchronization across devices
 */
export async function seedProductsCollection(force = false): Promise<{ count: number; message: string }> {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  
  try {
    const existing = await getDocs(colRef);
    if (!force && !existing.empty) {
      return {
        count: existing.size,
        message: `La base de datos ya contiene ${existing.size} productos activos.`,
      };
    }

    const batch = writeBatch(db);
    INITIAL_PRODUCTS.forEach((prod, index) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
      batch.set(docRef, {
        ...prod,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      });
    });

    // Also seed default settings if not exists
    const settingsRef = doc(db, SETTINGS_COLLECTION, 'store');
    batch.set(settingsRef, {
      ...DEFAULT_SETTINGS,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    await batch.commit();
    return {
      count: INITIAL_PRODUCTS.length,
      message: `¡Colección 'productos' sembrada con éxito con ${INITIAL_PRODUCTS.length} servicios de IA y Streaming!`,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PRODUCTS_COLLECTION);
    throw error;
  }
}

/**
 * Creates or updates a single product in Firestore
 * Automatically resizes and compresses oversized base64 images to guarantee it never exceeds
 * Firestore's 1,048,487 bytes limit.
 */
export async function saveProductToFirestore(product: Product): Promise<void> {
  const id = product.id || `prod_${Date.now()}`;
  const docRef = doc(db, PRODUCTS_COLLECTION, id);

  let safeImageUrl = product.imageUrl || '';

  // Auto-compress base64 if it's over 400KB or needs reduction
  if (safeImageUrl && safeImageUrl.startsWith('data:') && !isSafeFirestoreImageSize(safeImageUrl, 400000)) {
    try {
      safeImageUrl = await resizeAndCompressImageToBase64(safeImageUrl, {
        maxWidth: 320,
        maxHeight: 320,
        quality: 0.8,
        maxSizeBytes: 200000,
      });
    } catch (compressErr) {
      console.warn('Auto-compression fallback check:', compressErr);
      if (safeImageUrl.length > 950000) {
        throw new Error('La imagen seleccionada supera el límite de Firestore (1 MB). Por favor comprime la imagen o sube una versión más ligera.');
      }
    }
  }

  const payload = {
    ...product,
    imageUrl: safeImageUrl,
    id,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

/**
 * Deletes a product from Firestore
 */
export async function deleteProductFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

/**
 * Toggles product availability
 */
export async function toggleProductAvailability(id: string, current: boolean): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  try {
    await updateDoc(docRef, {
      available: !current,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

/**
 * Updates product stock units and auto-adjusts availability if stock is 0
 */
export async function updateProductStock(id: string, newStock: number): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  try {
    const validStock = Math.max(0, newStock);
    await updateDoc(docRef, {
      stock: validStock,
      available: validStock > 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

/**
 * Updates store settings in Firestore
 */
export async function saveSettingsToFirestore(settings: Partial<StoreSettings>): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, 'store');

  // Prevent oversized image URLs / base64 from breaking the 1MB Firestore document limit
  if (settings.logoBase64 && settings.logoBase64.length > 900000) {
    throw new Error('El logotipo supera el límite de tamaño de Firestore (1 MB). Por favor comprime la imagen antes de guardar.');
  }
  if (settings.faviconBase64 && settings.faviconBase64.length > 900000) {
    throw new Error('El favicon supera el límite de tamaño de Firestore (1 MB). Por favor comprime la imagen antes de guardar.');
  }

  try {
    await setDoc(
      docRef,
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/store`);
  }
}

/**
 * Updates the list of payment methods in Firestore
 */
export async function savePaymentMethodsToFirestore(methods: PaymentMethod[]): Promise<void> {
  await saveSettingsToFirestore({ paymentMethods: methods });
}

/**
 * Submits a new claim to the Libro de Reclamaciones
 */
export async function submitClaimToFirestore(claim: Omit<Claim, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const id = `claim_${Date.now()}`;
  const docRef = doc(db, CLAIMS_COLLECTION, id);
  const fullClaim: Claim = {
    ...claim,
    id,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  try {
    await setDoc(docRef, fullClaim);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${CLAIMS_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Sample initial sales records for admin demo
 */
export const INITIAL_SALES: SaleRecord[] = [
  {
    id: 'sale_1',
    clientName: 'Renzo Silva',
    clientPhone: '+51 987 654 321',
    clientEmail: 'renzo.silva@gmail.com',
    productId: 'prod_chatgpt',
    productName: 'ChatGPT Plus',
    planName: '1 Mes VIP',
    price: 'S/ 45.00',
    paymentMethod: 'Yape',
    accountType: 'Perfil Privado',
    durationText: '1 Mes',
    activationDate: new Date().toISOString().split('T')[0], // Hoy
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'activa',
    notes: 'Activación inmediata por WhatsApp.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sale_2',
    clientName: 'Camila Ramos',
    clientPhone: '+51 912 345 678',
    clientEmail: 'camila.ramos@hotmail.com',
    productId: 'prod_netflix',
    productName: 'Netflix Ultra HD',
    planName: '3 Meses VIP',
    price: 'S/ 39.60',
    paymentMethod: 'Plin',
    accountType: 'Perfil con PIN',
    durationText: '3 Meses',
    activationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Hace 3 días
    expirationDate: new Date(Date.now() + 87 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'activa',
    notes: 'Cliente frecuente, pantalla 3.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sale_3',
    clientName: 'Diego Mendoza',
    clientPhone: '+51 976 123 456',
    clientEmail: 'diego.dev@gmail.com',
    productId: 'prod_claude',
    productName: 'Claude Pro',
    planName: '1 Mes Completo',
    price: 'S/ 76.00',
    paymentMethod: 'Binance Pay',
    accountType: 'Cuenta Privada',
    durationText: '1 Mes',
    activationDate: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Hace 27 días
    expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Vence en 3 días
    status: 'por_vencer',
    notes: 'Programador front-end, recordarle renovación.',
    createdAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sale_4',
    clientName: 'Lucía Fernández',
    clientPhone: '+51 998 765 432',
    clientEmail: 'lucia.design@outlook.com',
    productId: 'prod_canva',
    productName: 'Canva Pro Edu',
    planName: '1 Año Completo',
    price: 'S/ 29.90',
    paymentMethod: 'Yape',
    accountType: 'Cuenta Completa Privada',
    durationText: '1 Año',
    activationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Este mes
    expirationDate: new Date(Date.now() + 350 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'activa',
    notes: 'Activada a su correo personal.',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sale_5',
    clientName: 'Carlos Vásquez',
    clientPhone: '+51 945 888 777',
    clientEmail: 'carlos.v@gmail.com',
    productId: 'prod_disney',
    productName: 'Disney+ Premium',
    planName: '1 Mes',
    price: 'S/ 14.90',
    paymentMethod: 'BCP Transferencia',
    accountType: 'Perfil Compartido',
    durationText: '1 Mes',
    activationDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Mes anterior
    expirationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Vencida
    status: 'vencida',
    notes: 'Enviado recordatorio para nueva recarga.',
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Real-time listener for the sales records
 */
export function subscribeToSales(
  onUpdate: (sales: SaleRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, SALES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: SaleRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<SaleRecord, 'id'>) });
      });

      // Sort by creation date descending (newest first)
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (items.length === 0) {
        onUpdate(INITIAL_SALES);
      } else {
        onUpdate(items);
      }
    },
    (error) => {
      console.warn('Firestore sales subscription offline or permission issue, using initial sales:', error);
      onUpdate(INITIAL_SALES);
      if (onError) onError(error);
    }
  );
}

/**
 * Creates a confirmed sale and automatically decreases the product stock
 */
export async function createSaleRecord(
  saleData: Omit<SaleRecord, 'id' | 'createdAt'>,
  decreaseStock = true
): Promise<SaleRecord> {
  const id = `sale_${Date.now()}`;
  const docRef = doc(db, SALES_COLLECTION, id);
  const fullSale: SaleRecord = {
    ...saleData,
    id,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, fullSale);

    // If requested and a valid productId is provided, automatically decrease stock by 1
    if (decreaseStock && saleData.productId) {
      await decreaseProductStock(saleData.productId, 1).catch((err) => {
        console.warn('Could not auto-decrease stock in Firestore:', err);
      });
    }

    return fullSale;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${SALES_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Decreases available stock of a product by a specified amount (e.g. 1 on sale confirmation)
 */
export async function decreaseProductStock(productId: string, amount = 1): Promise<number> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  try {
    let currentStock = 10;
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      currentStock = typeof data.stock === 'number' ? data.stock : 10;
    }

    const newStock = Math.max(0, currentStock - amount);
    await updateDoc(docRef, {
      stock: newStock,
      available: newStock > 0,
      updatedAt: new Date().toISOString(),
    });
    return newStock;
  } catch (error) {
    console.warn(`Error decreasing stock for ${productId}:`, error);
    return 0;
  }
}

/**
 * Updates status of a sale record
 */
export async function updateSaleStatus(
  saleId: string,
  status: 'activa' | 'por_vencer' | 'vencida'
): Promise<void> {
  const docRef = doc(db, SALES_COLLECTION, saleId);
  try {
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SALES_COLLECTION}/${saleId}`);
    throw error;
  }
}

/**
 * Deletes a sale record
 */
export async function deleteSaleRecord(saleId: string): Promise<void> {
  const docRef = doc(db, SALES_COLLECTION, saleId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SALES_COLLECTION}/${saleId}`);
    throw error;
  }
}

