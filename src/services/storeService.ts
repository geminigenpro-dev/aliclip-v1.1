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
import {
  Product,
  StoreSettings,
  Claim,
  PaymentMethod,
  SaleRecord,
  BenefitsTickerItemSetting,
  FaqItemSetting,
  AdminSectionConfig,
  StoreCategoryConfig,
  StorefrontSectionConfig,
} from '../types';
import { resizeAndCompressImageToBase64, isSafeFirestoreImageSize } from '../utils/imageCompressor';
import { detectMaliciousPayload, sanitizeStrictText } from '../utils/securityValidator';

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pay_yape',
    name: 'Yape / Plin',
    badge: 'Inmediato • 0% comisión',
    accountNumber: (import.meta.env.VITE_PAYMENT_YAPE_NUMBER as string) || '+51 900 000 000',
    accountHolder: (import.meta.env.VITE_PAYMENT_YAPE_HOLDER as string) || 'AliClip Store Oficial',
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
    accountNumber: (import.meta.env.VITE_PAYMENT_BINANCE_ID as string) || '849201938',
    accountHolder: (import.meta.env.VITE_PAYMENT_BINANCE_HOLDER as string) || 'AliClipPay (USDT)',
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
    accountNumber: (import.meta.env.VITE_PAYMENT_BCP_ACCOUNT as string) || '191-99882211-0-45',
    accountHolder: (import.meta.env.VITE_PAYMENT_BCP_HOLDER as string) || 'AliClip Store E.I.R.L.',
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
    accountNumber: (import.meta.env.VITE_PAYMENT_INTERBANK_ACCOUNT as string) || '200-300400500-1',
    accountHolder: (import.meta.env.VITE_PAYMENT_INTERBANK_HOLDER as string) || 'AliClip Store Oficial',
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
  },
  // --- CURSOS DIGITALES & FORMACIÓN ---
  {
    id: 'prod_curso_ia',
    name: 'Masterclass IA & Prompt Engineering',
    category: 'courses',
    tag: 'Certificación • Acceso Vitalicio',
    desc: 'Domina ChatGPT-4o, Claude 3.5, Midjourney y automatizaciones para duplicar tu productividad y ventas.',
    imageUrl: '',
    icon: 'graduation-cap',
    available: true,
    order: 17,
    rating: '5.0',
    activationsCount: '+1.450 Alumnos',
    plans: [
      { name: 'Acceso Completo + Drive', price: 'S/ 29.00', desc: 'Acceso de por vida a grabaciones y recursos' },
      { name: 'VIP + Asesoría WhatsApp', price: 'S/ 49.00', desc: 'Plantillas exclusivas y grupo privado' }
    ]
  },
  {
    id: 'prod_curso_marketing',
    name: 'Curso Tráfico Pago: Meta & TikTok Ads',
    category: 'courses',
    tag: 'E-commerce & Servicios',
    desc: 'Estrategias probadas paso a paso para crear campañas rentables con alto retorno de inversión (ROAS).',
    imageUrl: '',
    icon: 'trending-up',
    available: true,
    order: 18,
    rating: '4.9',
    activationsCount: '+980 Alumnos',
    plans: [
      { name: 'Acceso Vitalicio', price: 'S/ 35.00', desc: 'Módulos actualizados 2026' }
    ]
  },
  {
    id: 'prod_curso_edicion',
    name: 'Master en Edición Viral: CapCut & Premiere',
    category: 'courses',
    tag: 'Creadores de Contenido',
    desc: 'Aprende storytelling, efectos virales de retención, sound design y color grading para Reels y TikTok.',
    imageUrl: '',
    icon: 'clapperboard',
    available: true,
    order: 19,
    rating: '5.0',
    activationsCount: '+1.220 Alumnos',
    plans: [
      { name: 'Pack Formación Pro', price: 'S/ 25.00', desc: 'Clases 4K + Proyectos editables' }
    ]
  },
  // --- RECURSOS & PACKS DIGITALES ---
  {
    id: 'prod_rec_megapack_diseno',
    name: 'Mega Pack +50,000 Plantillas Canva Pro',
    category: 'resources',
    tag: 'Descarga Inmediata • Google Drive',
    desc: 'Plantillas 100% editables para redes sociales, carruseles, flyers, restaurantes, bienes raíces y marcas.',
    imageUrl: '',
    icon: 'layers',
    available: true,
    order: 20,
    rating: '5.0',
    activationsCount: '+3.100 Descargas',
    plans: [
      { name: 'Acceso Permanente Drive', price: 'S/ 19.90', desc: 'Actualizaciones mensuales automáticas' }
    ]
  },
  {
    id: 'prod_rec_prompts_ia',
    name: 'Bóveda de +2,500 Prompts Secretos IA',
    category: 'resources',
    tag: 'Copywriting & Negocios',
    desc: 'Prompts optimizados para ventas, creación de contenido, embudos, SEO, programación y marketing.',
    imageUrl: '',
    icon: 'sparkles',
    available: true,
    order: 21,
    rating: '4.95',
    activationsCount: '+2.450 Descargas',
    plans: [
      { name: 'Bóveda Notion + PDF', price: 'S/ 15.00', desc: 'Compatible con ChatGPT, Claude y Gemini' }
    ]
  },
  {
    id: 'prod_rec_overlays_luts',
    name: 'Super Pack Overlays, LUTs & Sound FX 4K',
    category: 'resources',
    tag: 'Para Premiere, DaVinci & CapCut',
    desc: 'Más de 100GB de transiciones cinematográficas, texturas de papel, efectos de sonido y gradaciones de color.',
    imageUrl: '',
    icon: 'palette',
    available: true,
    order: 22,
    rating: '5.0',
    activationsCount: '+1.800 Descargas',
    plans: [
      { name: 'Descarga Directa Google Drive', price: 'S/ 22.00', desc: 'Enlace de alta velocidad sin límites' }
    ]
  }
];

export const DEFAULT_TICKER_ITEMS: BenefitsTickerItemSetting[] = [
  { text: 'ENTREGA EN 3 MINUTOS', sub: 'ACTIVACIÓN INMEDIATA' },
  { text: 'GARANTÍA 100% ACTIVA', sub: 'REPOSICIÓN INMEDIATA' },
  { text: 'PERFILES 100% PRIVADOS', sub: 'CON PIN PERSONAL' },
  { text: 'PAGOS YAPE, PLIN & BCP', sub: 'CERO COMISIONES' },
  { text: 'CUENTAS RENOVABLES', sub: 'SIN PERDER HISTORIAL' },
  { text: 'SOPORTE WHATSAPP 24/7', sub: 'ATENCIÓN DEDICADA' },
];

export const DEFAULT_FAQ_ITEMS: FaqItemSetting[] = [
  {
    question: '¿En cuánto tiempo entregan la cuenta tras realizar el pago?',
    answer:
      'El tiempo promedio de activación es de 2 a 5 minutos una vez enviado el comprobante a nuestro WhatsApp oficial. Nuestro equipo está conectado de lunes a domingo.',
  },
  {
    question: '¿Las cuentas de ChatGPT Plus y Claude Pro son privadas o compartidas?',
    answer:
      'Ofrecemos ambas opciones claramente identificadas: Cuentas 100% privadas (con tu correo o correo exclusivo nuevo) y Perfiles VIP compartidos de bajo costo. Puedes elegir tu modalidad favorita en el selector de cada tarjeta.',
  },
  {
    question: '¿Qué garantía tengo ante cualquier caída o cambio de política?',
    answer:
      'Cuentas con Garantía Total por los 30 días o el tiempo contratado. Si una cuenta presenta inconvenientes, se restablece o reemplaza sin ningún cobro adicional.',
  },
  {
    question: '¿Puedo renovar la misma cuenta el siguiente mes?',
    answer:
      'Sí. En servicios como Netflix, ChatGPT, Disney+ y Spotify puedes renovar con anticipación para mantener tus perfiles, listas, historial y configuraciones intactas.',
  },
];

export const DEFAULT_ADMIN_SECTIONS: AdminSectionConfig[] = [
  {
    id: 'products',
    label: 'Membresías & Cuentas',
    shortLabel: 'Membresías',
    subtitle: 'Cuentas Streaming & IA',
    icon: 'Package',
    group: 'GESTIÓN COMERCIAL',
    enabled: true,
    showInStore: true,
    order: 1,
  },
  {
    id: 'courses',
    label: 'Gestor de Cursos',
    shortLabel: 'Cursos',
    subtitle: 'Cursos y masterclasses',
    icon: 'GraduationCap',
    group: 'GESTIÓN COMERCIAL',
    enabled: true,
    showInStore: true,
    order: 2,
  },
  {
    id: 'resources',
    label: 'Gestor de Recursos',
    shortLabel: 'Recursos',
    subtitle: 'Packs y plantillas',
    icon: 'Layers',
    group: 'GESTIÓN COMERCIAL',
    enabled: true,
    showInStore: true,
    order: 3,
  },
  {
    id: 'sales_history',
    label: 'Historial de Ventas',
    shortLabel: 'Historial',
    subtitle: 'Ventas con filtros',
    icon: 'History',
    group: 'GESTIÓN COMERCIAL',
    enabled: true,
    showInStore: true,
    order: 4,
  },
  {
    id: 'sales',
    label: 'Confirmar Venta',
    shortLabel: 'Nueva Venta',
    subtitle: 'Registrar y descontar stock',
    icon: 'CheckCircle2',
    group: 'GESTIÓN COMERCIAL',
    enabled: true,
    showInStore: true,
    order: 5,
  },
  {
    id: 'payments',
    label: 'Métodos de Pago',
    shortLabel: 'Pagos',
    subtitle: 'Pasarelas activas',
    icon: 'CreditCard',
    group: 'GESTIÓN COMERCIAL',
    enabled: true,
    showInStore: true,
    order: 6,
  },
  {
    id: 'billing',
    label: 'Facturación & Comprobantes',
    shortLabel: 'Facturación',
    subtitle: 'Personalizar estilo y datos fiscales',
    icon: 'Receipt',
    group: 'GESTIÓN COMERCIAL',
    enabled: true,
    showInStore: true,
    order: 7,
  },
  {
    id: 'brand',
    label: 'Marca & Colores',
    shortLabel: 'Marca',
    subtitle: 'Logos, tipografías y estilo',
    icon: 'Palette',
    group: 'PERSONALIZACIÓN',
    enabled: true,
    showInStore: true,
    order: 8,
  },
  {
    id: 'texts',
    label: 'Textos & Contenido Web',
    shortLabel: 'Textos Web',
    subtitle: 'Títulos, pasos, FAQ y footer',
    icon: 'FileText',
    group: 'PERSONALIZACIÓN',
    enabled: true,
    showInStore: true,
    order: 9,
  },
  {
    id: 'claims',
    label: 'Libro de Reclamaciones',
    shortLabel: 'Reclamos',
    subtitle: 'Atención al consumidor',
    icon: 'BookOpen',
    group: 'PERSONALIZACIÓN',
    enabled: true,
    showInStore: true,
    order: 10,
  },
  {
    id: 'cloud',
    label: 'Nube & Semilla',
    shortLabel: 'Nube',
    subtitle: 'Firestore y sincronización',
    icon: 'Cloud',
    group: 'INFRAESTRUCTURA & ACCESO',
    enabled: true,
    showInStore: true,
    order: 11,
  },
  {
    id: 'security',
    label: 'Seguridad & Acceso',
    shortLabel: 'Seguridad',
    subtitle: 'Credenciales del admin',
    icon: 'ShieldCheck',
    group: 'INFRAESTRUCTURA & ACCESO',
    enabled: true,
    showInStore: true,
    order: 12,
  },
];

/**
 * Merge saved sections with DEFAULT_ADMIN_SECTIONS so newly introduced sections
 * like 'billing' are never hidden when loading existing Firestore data.
 */
export function mergeAdminSectionsWithDefaults(
  savedSections?: AdminSectionConfig[]
): AdminSectionConfig[] {
  if (!Array.isArray(savedSections) || savedSections.length === 0) {
    return [...DEFAULT_ADMIN_SECTIONS];
  }
  const existingMap = new Map(savedSections.map((s) => [s.id, s]));
  const result: AdminSectionConfig[] = [...savedSections];

  DEFAULT_ADMIN_SECTIONS.forEach((defSec) => {
    if (!existingMap.has(defSec.id)) {
      result.push({
        ...defSec,
        enabled: true,
      });
    }
  });

  return result.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export const DEFAULT_STORE_CATEGORIES: StoreCategoryConfig[] = [
  {
    id: 'ai',
    label: 'Inteligencia Artificial',
    subtitle: 'ChatGPT, Claude, Midjourney',
    icon: 'Bot',
    enabled: true,
    order: 1,
  },
  {
    id: 'streaming',
    label: 'Streaming & Series',
    subtitle: 'Netflix, Disney+, Max, Prime',
    icon: 'Film',
    enabled: true,
    order: 2,
  },
  {
    id: 'courses',
    label: 'Cursos & Masterclasses',
    subtitle: 'Academias y formación digital',
    icon: 'GraduationCap',
    enabled: true,
    order: 3,
  },
  {
    id: 'resources',
    label: 'Recursos & Packs Digitales',
    subtitle: 'Plantillas Canva, Prompts, LUTs',
    icon: 'Layers',
    enabled: true,
    order: 4,
  },
];

export const DEFAULT_STOREFRONT_SECTIONS: StorefrontSectionConfig[] = [
  {
    id: 'heroCarousel',
    label: '+ Vendidos en Perú',
    subtitle: 'Carrusel interactivo de membresías top',
    icon: 'Flame',
    enabled: true,
    order: 1,
  },
  {
    id: 'benefitsTicker',
    label: 'Cinta LED de Beneficios',
    subtitle: 'Marquee de ventajas, velocidad y garantías',
    icon: 'Zap',
    enabled: true,
    order: 2,
  },
  {
    id: 'catalog',
    label: 'Catálogo Principal',
    subtitle: 'Grid interactivo de productos y buscador',
    icon: 'Package',
    enabled: true,
    order: 3,
  },
  {
    id: 'reviews',
    label: 'Opiniones & Reseñas',
    subtitle: 'Testimonios reales y valoraciones de clientes',
    icon: 'Star',
    enabled: true,
    order: 4,
  },
  {
    id: 'payments',
    label: 'Métodos de Pago',
    subtitle: 'Pasarelas digitales y transferencias',
    icon: 'CreditCard',
    enabled: true,
    order: 5,
  },
  {
    id: 'purchaseProcess',
    label: 'Proceso de Compra (4 Pasos)',
    subtitle: 'Guía paso a paso para ordenar',
    icon: 'CheckCircle2',
    enabled: true,
    order: 6,
  },
  {
    id: 'faq',
    label: 'Preguntas Frecuentes',
    subtitle: 'Respuestas a dudas comunes',
    icon: 'HelpCircle',
    enabled: true,
    order: 7,
  },
  {
    id: 'claims',
    label: 'Libro de Reclamaciones',
    subtitle: 'Acceso regulatorio a reclamos',
    icon: 'BookOpen',
    enabled: true,
    order: 8,
  },
];

export const DEFAULT_SETTINGS: StoreSettings = {
  name: (import.meta.env.VITE_STORE_NAME as string) || 'Ali',
  suffix: (import.meta.env.VITE_STORE_SUFFIX as string) || 'clip',
  subtitle: (import.meta.env.VITE_STORE_SUBTITLE as string) || 'Digital Store',
  whatsappNumber: (import.meta.env.VITE_STORE_WHATSAPP_NUMBER as string) || '51900000000',
  whatsappDisplay: (import.meta.env.VITE_STORE_WHATSAPP_DISPLAY as string) || '+51 900 000 000',
  announcement: (import.meta.env.VITE_STORE_ANNOUNCEMENT as string) || 'Cuentas 100% garantizadas, renovables y soporte VIP 24/7',
  colorPrimary: '#4f46e5',
  colorAccent: '#06b6d4',
  creatorUrl: (import.meta.env.VITE_STORE_CREATOR_URL as string) || 'https://instagram.com/alfre.ofc',
  creatorHandle: (import.meta.env.VITE_STORE_CREATOR_HANDLE as string) || '@alfre.ofc',
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

  // 1. Navbar & Anuncios
  navbarCtaText: 'WhatsApp Soporte',
  searchPlaceholder: 'Buscar servicio (ej. ChatGPT, Netflix...)',

  // 2. Banner Principal (Hero)
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
  heroCarouselRankBadge: 'Más Vendido',
  heroCarouselInstantBadge: 'Inmediato',
  heroCarouselGuaranteeText: 'Garantía 100%',
  heroCarouselActivationsText: '+2.400 Activaciones',
  heroCarouselActivationsMode: 'sales_additive',
  heroCarouselBaseRating: '4.9',
  heroCarouselRatingVary: true,
  heroCarouselFromText: 'Desde',
  heroCarouselCtaText: 'Obtener',
  heroCarouselHintText: 'Clic en el banner para adquirir al instante',

  // 3. Cinta de Beneficios (LED Ticker)
  tickerItems: DEFAULT_TICKER_ITEMS,

  // 4. Catálogo & Filtros
  catalogTitle: 'Catálogo de Membresías y Cuentas Premium',
  categoryTabAll: 'Todos los Productos',
  categoryTabAi: 'Inteligencia Artificial',
  categoryTabStreaming: 'Streaming & Series',
  categoryTabCourses: 'Cursos & Masterclasses',
  categoryTabResources: 'Recursos & Packs Digitales',
  catalogStatusText: 'servicios disponibles',
  catalogEmptyTitle: 'No encontramos resultados para tu búsqueda',
  catalogEmptyDesc:
    'Intenta buscar con otro nombre como "ChatGPT", "Netflix", "Canva", o contáctanos por WhatsApp para consultar disponibilidad.',
  catalogEmptyResetText: 'Restablecer Catálogo',

  // 5. Proceso de Compra (4 Pasos)
  processSectionBadge: 'Flujo Rápido',
  processSectionTitle: '¿Cómo Comprar en 4 Pasos?',
  processSectionWaLink: 'Atención guiada por WhatsApp',
  processStep1Title: 'Elige tu Plan',
  processStep1Desc: 'Selecciona el servicio y la modalidad (1 mes, 3 meses o perfil privado).',
  processStep2Title: 'Realiza el Pago',
  processStep2Desc: 'Transfiere mediante Yape, Plin, BCP o Binance Pay sin comisiones ocultas.',
  processStep3Title: 'Envía Captura',
  processStep3Desc: 'Comparte el comprobante al WhatsApp oficial para validación inmediata.',
  processStep4Title: 'Recibe tu Acceso',
  processStep4Desc: 'En menos de 3 minutos recibes tus credenciales con garantía total activa.',

  // 6. Métodos de Pago
  paymentSectionBadge: 'Pagos 100% Verificados en Perú',
  paymentSectionTitle: 'Métodos de Pago Inmediatos',
  paymentSectionSubtitle: 'Haz clic en tu método preferido para ver el número o cuenta oficial al instante.',
  paymentCardBtnText: 'Ver datos →',

  // 7. Opiniones & Reseñas
  reviewsBadgeText: '✨ +15,000 Clientes Satisfechos en Todo el Perú',
  reviewsSectionTitlePrefix: 'La Confianza de Quienes Ya Disfrutan de Sus',
  reviewsSectionTitleHighlight: 'Cuentas VIP',
  reviewsSectionDescription:
    'Comprobantes de entrega real en menos de 3 minutos, cuentas privadas con PIN y calificaciones de usuarios verificados.',
  reviewsBtnText: 'Dejar Mi Opinión',
  reviewsStat1Title: 'Cuentas 100% Renovables',
  reviewsStat1Sub: 'Sin perder historiales',
  reviewsStat2Title: 'Usuario Verificado',
  reviewsStat2Sub: 'Opiniones 100% Auténticas',
  reviewsStat3Title: '+15,000 Clientes',
  reviewsStat3Sub: 'En todo el Perú',

  // 8. Preguntas Frecuentes (FAQ)
  faqSectionBadge: 'Dudas Resueltas',
  faqSectionTitle: 'Preguntas Frecuentes',
  faqSectionDescription: 'Todo lo que necesitas saber antes de solicitar tu membresía digital.',
  faqItems: DEFAULT_FAQ_ITEMS,

  // 9. Pie de Página (Footer)
  footerSlogan:
    'Tu tienda digital de confianza para membresías de Inteligencia Artificial y Streaming en Perú. Entrega ágil y garantía total certificada.',
  footerHours: 'Atención: Lunes a Domingo, 8:00 AM - 11:30 PM',
  footerTrustNote: 'Transacciones seguras y validadas al instante',
  footerPaymentTitle: 'Métodos de Pago',
  footerPaymentDesc: 'Aceptamos transferencias inmediatas sin comisiones ocultas para tu comodidad:',
  footerPaymentValidation: 'Validación de comprobante en menos de 2 minutos vía WhatsApp.',
  footerCopyright: '© 2026 Aliclip. Todos los derechos reservados.',
  footerSubtitle: 'Digital Store • Hecho con ❤️ Lima-Perú',

  // 10. Términos y Condiciones
  termsModalTitle: 'Términos, Condiciones y Garantía',
  termsModalSubtitle: 'Transparencia, respaldo y políticas de uso de AliClip',
  termsCommitmentTitle: 'Compromiso de Garantía Total AliClip',
  termsCommitmentText:
    'Todas las cuentas y perfiles adquiridos cuentan con garantía ininterrumpida por el periodo exacto contratado (30 días para planes mensuales o 90 días para planes trimestrales). Ante cualquier eventualidad técnica, nuestro soporte responderá de inmediato.',

  // 11. Gestión Dinámica de Secciones & Navegación
  adminSections: DEFAULT_ADMIN_SECTIONS,
  storeCategories: DEFAULT_STORE_CATEGORIES,
  storefrontSections: DEFAULT_STOREFRONT_SECTIONS,

  // 12. Facturación & Comprobantes Digitales
  invoiceBusinessName: (import.meta.env.VITE_INVOICE_BUSINESS_NAME as string) || 'AliClip Digital Services S.A.C.',
  invoiceTaxId: (import.meta.env.VITE_INVOICE_TAX_ID as string) || '20608945123',
  invoiceAddress: (import.meta.env.VITE_INVOICE_ADDRESS as string) || 'Av. Javier Prado Este 4200, Santiago de Surco, Lima - Perú',
  invoiceContactEmail: (import.meta.env.VITE_INVOICE_CONTACT_EMAIL as string) || 'facturacion@alixperu.com',
  invoiceContactPhone: (import.meta.env.VITE_INVOICE_CONTACT_PHONE as string) || '+51 987 654 321',
  invoicePrefix: (import.meta.env.VITE_INVOICE_PREFIX as string) || 'B001',
  invoiceTitle: 'COMPROBANTE DE PAGO DIGITAL',
  invoiceTemplateStyle: 'modern_neon',
  invoiceLogoBase64: '',
  invoiceStampText: 'GARANTÍA TOTAL 100% ACTIVA • AUTORIZADO ALICLIP',
  invoiceHeaderMessage: '¡Gracias por tu compra! Tu membresía ha sido activada con garantía y respaldo técnico.',
  invoiceFooterTerms: 'Este comprobante digital garantiza el reemplazo inmediato de cuentas durante todo el periodo contratado. Atención y reclamos disponibles 24/7.',
  invoiceShowQr: true,
  invoicePrimaryColor: '#6366f1',
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
          ...data,
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
        } as Product);
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

        const adminSections = mergeAdminSectionsWithDefaults(data.adminSections);

        // Auto-upgrade in Firestore if 'billing' section was not present
        if (
          Array.isArray(data.adminSections) &&
          !data.adminSections.some((s: any) => s.id === 'billing')
        ) {
          saveSettingsToFirestore({
            ...DEFAULT_SETTINGS,
            ...data,
            adminSections,
          }).catch((err) => console.warn('Auto-upgrade billing section in Firestore:', err));
        }

        const storeCategories = Array.isArray(data.storeCategories) && data.storeCategories.length > 0
          ? data.storeCategories
          : DEFAULT_STORE_CATEGORIES;

        const storefrontSections = Array.isArray(data.storefrontSections) && data.storefrontSections.length > 0
          ? data.storefrontSections
          : DEFAULT_STOREFRONT_SECTIONS;

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
          adminSections,
          storeCategories,
          storefrontSections,
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
 * Seeds only products of a specific category ('courses' or 'resources') without overwriting existing memberships
 */
export async function seedCategoryProducts(targetCategory: 'courses' | 'resources'): Promise<{ count: number; message: string }> {
  const items = INITIAL_PRODUCTS.filter((p) => p.category === targetCategory);
  if (items.length === 0) {
    return { count: 0, message: 'No hay productos de plantilla para esta categoría.' };
  }

  try {
    const batch = writeBatch(db);
    items.forEach((prod, index) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
      batch.set(docRef, {
        ...prod,
        order: (targetCategory === 'courses' ? 17 : 20) + index,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });

    await batch.commit();
    const label = targetCategory === 'courses' ? 'cursos digitales' : 'recursos descargables';
    return {
      count: items.length,
      message: `¡Se cargaron ${items.length} ${label} de ejemplo en Firestore con éxito!`,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PRODUCTS_COLLECTION);
    throw error;
  }
}

/**
 * Recursively removes all undefined fields from an object so Firestore operations never fail.
 */
export function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedFields(item)) as unknown as T;
  }

  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleanObj[key] = typeof value === 'object' && value !== null
        ? removeUndefinedFields(value)
        : value;
    }
  }
  return cleanObj as T;
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

  const payload = removeUndefinedFields({
    ...product,
    imageUrl: safeImageUrl,
    id,
    updatedAt: new Date().toISOString(),
  });

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

  // Validación estricta de textos en settings contra código o inyecciones
  for (const [key, val] of Object.entries(settings)) {
    if (typeof val === 'string' && !key.toLowerCase().includes('base64')) {
      const check = detectMaliciousPayload(val);
      if (check.isMalicious) {
        throw new Error(`Configuración rechazada en campo "${key}": ${check.reason}`);
      }
    }
  }

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
      removeUndefinedFields({
        ...settings,
        updatedAt: new Date().toISOString(),
      }),
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
  // Validación estricta contra código malicioso en claims
  const fieldsToCheck = [claim.name, claim.document, claim.phone, claim.email, claim.service, claim.description, claim.request];
  for (const field of fieldsToCheck) {
    if (field) {
      const check = detectMaliciousPayload(field);
      if (check.isMalicious) {
        throw new Error(`Contenido malicioso rechazado: ${check.reason}`);
      }
    }
  }

  const id = `claim_${Date.now()}`;
  const docRef = doc(db, CLAIMS_COLLECTION, id);
  const fullClaim: Claim = removeUndefinedFields({
    ...claim,
    name: sanitizeStrictText(claim.name, 100),
    document: sanitizeStrictText(claim.document, 30),
    phone: sanitizeStrictText(claim.phone, 30),
    email: sanitizeStrictText(claim.email, 120),
    service: sanitizeStrictText(claim.service, 150),
    description: sanitizeStrictText(claim.description, 2000),
    request: sanitizeStrictText(claim.request, 1500),
    id,
    createdAt: new Date().toISOString(),
    status: 'pending',
  });

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
    accessToken: 'ALI-701',
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
    serviceCredentials: {
      email: 'renzo.vip@alixperu.com',
      pin: '4821',
      profileName: 'Perfil Renzo VIP',
      instructions: 'Ingresar con el correo indicado en ChatGPT y seleccionar tu perfil exclusivo con PIN.',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sale_2',
    accessToken: 'ALI-702',
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
    serviceCredentials: {
      email: 'netflix.fam49@alixstream.com',
      pin: '1092',
      profileName: 'Pantalla 3 - Camila',
      instructions: 'Usar perfil 3 con PIN 1092. Válido en TV, Smartphone o Laptop sin caídas.',
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sale_3',
    accessToken: 'ALI-703',
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
    serviceCredentials: {
      email: 'diego.mendoza.pro@gmail.com',
      instructions: 'Cuenta activada a tu correo personal de Claude.ai. Renovación automática disponible.',
    },
    createdAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sale_4',
    accessToken: 'ALI-704',
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
    serviceCredentials: {
      email: 'lucia.design@outlook.com',
      instructions: 'Invitación a equipo Canva Pro aceptada. Acceso a Brand Kit y exportación en alta calidad.',
    },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sale_5',
    accessToken: 'ALI-705',
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
    serviceCredentials: {
      email: 'disney.premium98@alixperu.com',
      profileName: 'Perfil Carlos',
      instructions: 'Suscripción mensual vencida. Puedes reactivar el mismo perfil desde WhatsApp.',
    },
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sale_6',
    accessToken: 'ALI-706',
    clientName: 'Mariana Flores',
    clientPhone: '+51 933 221 144',
    clientEmail: 'mariana.art@gmail.com',
    productId: 'prod_midjourney',
    productName: 'Midjourney',
    planName: '1 Mes Fast VIP',
    price: 'S/ 36.90',
    paymentMethod: 'Yape',
    accountType: 'Perfil Privado',
    durationText: '1 Mes',
    activationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'activa',
    notes: 'Activada en Discord personal.',
    serviceCredentials: {
      email: 'mariana.art@gmail.com',
      instructions: 'Bot de Midjourney añadido a tu servidor privado de Discord. Horas Fast listas para usar.',
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sale_7',
    accessToken: 'ALI-707',
    clientName: 'Jorge Romero',
    clientPhone: '+51 955 443 322',
    clientEmail: 'jorge.romero@gmail.com',
    productId: 'prod_chatgpt',
    productName: 'ChatGPT Plus',
    planName: '3 Meses VIP',
    price: 'S/ 94.90',
    paymentMethod: 'Plin',
    accountType: 'Perfil Privado con PIN',
    durationText: '3 Meses',
    activationDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'activa',
    notes: 'Uso intensivo para tesis de ingeniería.',
    serviceCredentials: {
      email: 'jorge.tesis@alixai.net',
      pin: '7721',
      profileName: 'Perfil Jorge',
      instructions: 'Acceso completo con GPT-4o, Canvas y generación ilimitada.',
    },
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sale_8',
    accessToken: 'ALI-708',
    clientName: 'Valeria Quispe',
    clientPhone: '+51 988 776 655',
    clientEmail: 'valeria.q@gmail.com',
    productId: 'prod_netflix',
    productName: 'Netflix Ultra HD',
    planName: '1 Mes VIP',
    price: 'S/ 14.50',
    paymentMethod: 'Yape',
    accountType: 'Perfil con PIN',
    durationText: '1 Mes',
    activationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'activa',
    notes: 'Smart TV Samsung salón principal.',
    serviceCredentials: {
      email: 'netflix.peru24@alixstream.com',
      pin: '3399',
      profileName: 'Pantalla 4 - Vale',
      instructions: 'Perfil 4 con PIN 3399. Calidad 4K UHD garantizada.',
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sale_9',
    accessToken: 'ALI-709',
    clientName: 'Andrés Morales',
    clientPhone: '+51 922 110 099',
    clientEmail: 'andres.musica@gmail.com',
    productId: 'prod_spotify',
    productName: 'Spotify Individual',
    planName: '3 Meses',
    price: 'S/ 24.00',
    paymentMethod: 'BCP Transferencia',
    accountType: 'Cuenta Privada',
    durationText: '3 Meses',
    activationDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 82 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'activa',
    notes: 'Plan familiar compartido con su correo.',
    serviceCredentials: {
      email: 'andres.musica@gmail.com',
      instructions: 'Vinculado a tu cuenta de Spotify mediante invitación familiar permanente.',
    },
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sale_10',
    accessToken: 'ALI-710',
    clientName: 'Sandra Huamán',
    clientPhone: '+51 966 332 211',
    clientEmail: 'sandra.h@gmail.com',
    productId: 'prod_canva',
    productName: 'Canva Pro',
    planName: '1 Mes Personal',
    price: 'S/ 15.00',
    paymentMethod: 'Yape',
    accountType: 'Cuenta Privada',
    durationText: '1 Mes',
    activationDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'activa',
    notes: 'Kit de marca y fuentes Pro activas.',
    serviceCredentials: {
      email: 'sandra.h@gmail.com',
      instructions: 'Canva Pro activado para tu correo de diseñador.',
    },
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const LOCAL_DELETED_SALES_KEY = 'aliclip_deleted_sales_ids';

export function getDeletedSaleIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_SALES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markSaleAsDeleted(saleId: string): void {
  try {
    const deleted = getDeletedSaleIds();
    if (!deleted.includes(saleId)) {
      deleted.push(saleId);
      localStorage.setItem(LOCAL_DELETED_SALES_KEY, JSON.stringify(deleted));
    }
  } catch (err) {
    console.warn('Could not save deleted sale id locally:', err);
  }
}

/**
 * SEED FUNCTION: Seeds initial sample sales into Firestore
 */
export async function seedSalesCollection(force = false): Promise<{ count: number; message: string }> {
  const colRef = collection(db, SALES_COLLECTION);
  try {
    const existing = await getDocs(colRef);
    if (!force && !existing.empty) {
      return {
        count: existing.size,
        message: `La colección de ventas ya contiene ${existing.size} registros.`,
      };
    }

    const batch = writeBatch(db);
    const deletedIds = new Set(getDeletedSaleIds());
    INITIAL_SALES.forEach((sale) => {
      if (!deletedIds.has(sale.id)) {
        const docRef = doc(db, SALES_COLLECTION, sale.id);
        batch.set(docRef, removeUndefinedFields(sale));
      }
    });

    await batch.commit();
    localStorage.setItem('aliclip_sales_seeded', 'true');
    return {
      count: INITIAL_SALES.length,
      message: `¡Colección 'sales' inicializada con ${INITIAL_SALES.length} ventas!`,
    };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, SALES_COLLECTION);
    } catch {
      // ignore
    }
    throw error;
  }
}

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
      const deletedIds = new Set(getDeletedSaleIds());
      const items: SaleRecord[] = [];
      snapshot.forEach((docSnap) => {
        if (!deletedIds.has(docSnap.id)) {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<SaleRecord, 'id'>) });
        }
      });

      // Sort by creation date descending (newest first)
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const wasSeeded = localStorage.getItem('aliclip_sales_seeded') === 'true';
      if (snapshot.empty && !wasSeeded) {
        // Auto-seed in Firestore in background so docs exist
        seedSalesCollection(false).catch(() => {});
        const fallback = INITIAL_SALES.filter((s) => !deletedIds.has(s.id));
        onUpdate(fallback);
      } else {
        onUpdate(items);
      }
    },
    (error) => {
      console.warn('Firestore sales subscription offline or permission issue, using initial sales:', error);
      const deletedIds = new Set(getDeletedSaleIds());
      const fallback = INITIAL_SALES.filter((s) => !deletedIds.has(s.id));
      onUpdate(fallback);
      if (onError) onError(error);
    }
  );
}

/**
 * Generate human-friendly token for membership lookup
 */
export function generateSaleToken(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `ALI-${l1}${l2}${num}`;
}

/**
 * Creates a confirmed sale and automatically decreases the product stock
 */
export async function createSaleRecord(
  saleData: Omit<SaleRecord, 'id' | 'createdAt'>,
  decreaseStock = true
): Promise<SaleRecord> {
  // Validación estricta contra inyecciones y comandos en datos de venta
  const fields = [saleData.clientName, saleData.clientPhone, saleData.clientEmail, saleData.notes];
  for (const f of fields) {
    if (f) {
      const check = detectMaliciousPayload(f);
      if (check.isMalicious) {
        throw new Error(`Datos de venta rechazados: ${check.reason}`);
      }
    }
  }

  const id = `sale_${Date.now()}`;
  const accessToken = saleData.accessToken || generateSaleToken();
  const docRef = doc(db, SALES_COLLECTION, id);
  const fullSale: SaleRecord = removeUndefinedFields({
    ...saleData,
    clientName: sanitizeStrictText(saleData.clientName, 100),
    clientPhone: sanitizeStrictText(saleData.clientPhone, 40),
    clientEmail: sanitizeStrictText(saleData.clientEmail || '', 120),
    notes: saleData.notes ? sanitizeStrictText(saleData.notes, 1000) : undefined,
    accessToken: sanitizeStrictText(accessToken, 50),
    id,
    createdAt: new Date().toISOString(),
  });

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
 * Helper to search customer purchases by email, token, or phone number
 */
export function queryCustomerPurchases(
  searchQuery: string,
  salesPool: SaleRecord[] = INITIAL_SALES
): {
  matchedType: 'email' | 'token' | 'phone' | 'none';
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  records: SaleRecord[];
} {
  if (!searchQuery || !searchQuery.trim()) {
    return { matchedType: 'none', records: [] };
  }

  // Rechazar queries con código malicioso o inyecciones
  if (detectMaliciousPayload(searchQuery).isMalicious) {
    return { matchedType: 'none', records: [] };
  }

  const rawQuery = searchQuery.trim().toLowerCase();
  if (!rawQuery) {
    return { matchedType: 'none', records: [] };
  }

  // 1. Check exact or prefix match by token / ID
  const normalizedQuery = rawQuery.replace(/[^a-z0-9_-]/g, '');
  const byToken = salesPool.filter((s) => {
    const sId = s.id.toLowerCase();
    const sToken = (s.accessToken || '').toLowerCase();
    return sId === rawQuery || sToken === rawQuery || sToken.replace(/[^a-z0-9]/g, '') === normalizedQuery;
  });

  if (byToken.length > 0) {
    // If found by token, also include any other sales by that same email or phone to show their full history!
    const primary = byToken[0];
    const customerRecords = salesPool.filter((s) => {
      if (s.id === primary.id || (s.accessToken && s.accessToken === primary.accessToken)) return true;
      if (primary.clientEmail && s.clientEmail && s.clientEmail.toLowerCase() === primary.clientEmail.toLowerCase()) return true;
      if (primary.clientPhone && s.clientPhone && s.clientPhone.replace(/[^0-9]/g, '') === primary.clientPhone.replace(/[^0-9]/g, '')) return true;
      return false;
    });

    return {
      matchedType: 'token',
      clientName: primary.clientName,
      clientEmail: primary.clientEmail,
      clientPhone: primary.clientPhone,
      records: customerRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
  }

  // 2. Check match by email (exact or includes if valid email pattern)
  const isEmailPattern = rawQuery.includes('@');
  if (isEmailPattern) {
    const byEmail = salesPool.filter((s) => (s.clientEmail || '').toLowerCase().trim() === rawQuery);
    if (byEmail.length > 0) {
      return {
        matchedType: 'email',
        clientName: byEmail[0].clientName,
        clientEmail: byEmail[0].clientEmail,
        clientPhone: byEmail[0].clientPhone,
        records: byEmail.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      };
    }
  }

  // 3. Check match by phone (cleaned digits)
  const queryDigits = rawQuery.replace(/[^0-9]/g, '');
  if (queryDigits.length >= 7) {
    const byPhone = salesPool.filter((s) => {
      const sDigits = s.clientPhone.replace(/[^0-9]/g, '');
      return sDigits.endsWith(queryDigits) || queryDigits.endsWith(sDigits) || sDigits.includes(queryDigits);
    });

    if (byPhone.length > 0) {
      return {
        matchedType: 'phone',
        clientName: byPhone[0].clientName,
        clientEmail: byPhone[0].clientEmail,
        clientPhone: byPhone[0].clientPhone,
        records: byPhone.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      };
    }
  }

  // 4. Broader substring search across email
  const byFuzzyEmail = salesPool.filter((s) => (s.clientEmail || '').toLowerCase().includes(rawQuery));
  if (byFuzzyEmail.length > 0) {
    return {
      matchedType: 'email',
      clientName: byFuzzyEmail[0].clientName,
      clientEmail: byFuzzyEmail[0].clientEmail,
      clientPhone: byFuzzyEmail[0].clientPhone,
      records: byFuzzyEmail.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
  }

  return { matchedType: 'none', records: [] };
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
  // 1. Immediately record locally so this record never reappears
  markSaleAsDeleted(saleId);

  // 2. Delete document in Firestore
  const docRef = doc(db, SALES_COLLECTION, saleId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore sale deletion error, preserved local deletion:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${SALES_COLLECTION}/${saleId}`);
    } catch {
      // ignore
    }
  }
}

