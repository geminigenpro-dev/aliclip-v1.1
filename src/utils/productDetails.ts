import { Product, ProductPlan } from '../types';

export interface ProductTechSpecs {
  resolution?: string;
  screens?: string;
  accountType: string;
  downloads?: string;
  devices: string[];
  renewal: string;
  deliveryTime: string;
  guarantee: string;
  highlights: string[];
  requirements?: string;
}

// Extended technical specs and benefits for each platform
export const PRODUCT_SPECS_DATABASE: Record<string, ProductTechSpecs> = {
  prod_chatgpt: {
    resolution: 'Máxima Velocidad GPT-4o',
    screens: '1 Usuario Exclusivo',
    accountType: 'Perfil Privado / Correo Oficial',
    devices: ['Web', 'iOS', 'Android', 'macOS App', 'Windows App'],
    renewal: 'Renovable mes a mes sin perder tus chats ni historial',
    deliveryTime: 'Inmediata (< 3 minutos tras confirmación)',
    guarantee: 'Garantía total de reposición y soporte técnico activo',
    highlights: [
      'Acceso sin restricciones al modelo GPT-4o con visión computacional',
      'Análisis avanzado de datos con subida de PDFs, hojas de cálculo e imágenes',
      'Navegación web en tiempo real y memoria personalizada',
      'Creación y uso ilimitado de GPTs de la tienda oficial',
      'Generación de imágenes fotorrealistas con DALL-E 3',
    ],
    requirements: 'Compatible con cualquier navegador moderno o app oficial de ChatGPT.',
  },
  prod_claude: {
    resolution: 'Sonnet 3.5 & Opus Líder',
    screens: '1 Usuario Dedicado',
    accountType: 'Perfil Exclusivo de Alta Velocidad',
    devices: ['Navegador Web', 'iOS App', 'Android App'],
    renewal: 'Renovación transparente con preservación de proyectos',
    deliveryTime: 'Menos de 3 minutos por WhatsApp',
    guarantee: 'Garantía 100% durante todo el tiempo contratado',
    highlights: [
      '5x más capacidad de mensajes en Sonnet 3.5 comparado al plan gratuito',
      'Entorno interactivo Artifacts para código, interfaces web y SVG en vivo',
      'Ventana de contexto de 200,000 tokens para análisis de código complejo',
      'Procesamiento masivo de documentos técnicos e investigación profunda',
    ],
  },
  prod_netflix: {
    resolution: '4K Ultra HD + HDR10 + Dolby Vision',
    screens: '1 Pantalla Privada con PIN Propio',
    accountType: 'Perfil Exclusivo con Bloqueo de 4 Dígitos',
    devices: ['Smart TV', 'TV Box / Firestick', 'Celulares', 'Tablets', 'PC / Mac'],
    renewal: 'Renovación mensual en la misma cuenta sin perder listas',
    deliveryTime: 'Entrega instantánea (< 2 minutos)',
    guarantee: 'Soporte y reemplazo inmediato ante cualquier bloqueo de hogar',
    highlights: [
      'Acceso a todo el catálogo global en resolución 4K UHD nativa',
      'Perfil propio blindado con PIN personalizado',
      'Audio espacial y Dolby Atmos en títulos compatibles',
      'Descargas habilitadas para visualización sin conexión',
      'Sin problemas de "Hogar Netflix" gracias a cuentas optimizadas para Perú',
    ],
  },
  prod_canva: {
    resolution: 'Descarga en SVG, PNG 4K y PDF Impresión',
    screens: '1 Usuario Pro',
    accountType: 'Activación directa en tu correo personal',
    devices: ['Web', 'Windows', 'Mac', 'Android', 'iPad & iPhone'],
    renewal: 'Renovable de por vida con enlace oficial',
    deliveryTime: 'Automática en menos de 2 minutos',
    guarantee: 'Garantía total de diseño sin pérdida de plantillas',
    highlights: [
      'Herramientas Magic Studio AI (Borrador mágico, Expansión mágica y Texto a imagen)',
      'Acceso a más de 100 millones de fotos, videos, audios y elementos premium',
      'Kit de marcas con paletas de colores y fuentes ilimitadas',
      'Redimensionamiento mágico de diseños con 1 solo clic',
      'Almacenamiento masivo de 1 TB en la nube de Canva',
    ],
  },
  prod_midjourney: {
    resolution: 'Alta Resolución Upscale 4K',
    screens: '1 Servidor Dedicado Fast GPU',
    accountType: 'Servidor Privado Discord',
    devices: ['Discord Desktop', 'Web Midjourney', 'Discord Móvil'],
    renewal: 'Renovación continua con servidor propio',
    deliveryTime: 'Entrega en 3 minutos',
    guarantee: 'Garantía activa durante todo el mes',
    highlights: [
      'Modo Fast GPU prioritario para generar imágenes en segundos',
      'Soporte completo para Midjourney V6.1 y modo Niji anime',
      'Comandos de zoom out, pan, vary subtle y vary strong',
      'Galería privada y derechos comerciales de uso sobre tus creaciones',
    ],
  },
  prod_disney: {
    resolution: '4K Ultra HD + IMAX Enhanced + HDR',
    screens: '1 Pantalla Privada con PIN',
    accountType: 'Perfil Individual con Código PIN',
    devices: ['Smart TV', 'Roku', 'Chromecast', 'Celulares', 'Consolas PS5/Xbox'],
    renewal: 'Renovable mes a mes sin cortes',
    deliveryTime: 'Entrega ágil (< 3 minutos)',
    guarantee: 'Garantía total de servicio',
    highlights: [
      'Incluye transmisiones deportivas en vivo de ESPN y torneos internacionales',
      'Catálogo completo de Disney, Pixar, Marvel, Star Wars y Star+',
      'Calidad IMAX Enhanced y sonido envolvente Dolby Atmos',
      'Sin publicidad y con descargas disponibles en tu móvil',
    ],
  },
  prod_spotify: {
    resolution: 'Audio Muy Alto (320 kbps sin compresión)',
    screens: '1 Dispositivo a la vez en tu propia cuenta',
    accountType: 'Activación en tu cuenta personal de Spotify',
    devices: ['Móvil iOS/Android', 'PC/Mac', 'Smart TV', 'Altavoces Alexa/Google'],
    renewal: 'Renovable sin perder tus playlists ni me gustas',
    deliveryTime: 'Entrega en 3 minutos por WhatsApp',
    guarantee: 'Garantía ante cualquier problema de membresía',
    highlights: [
      'Música 100% sin anuncios ni interrupciones',
      'Saltos de canciones ilimitados y reproducción en orden deseado',
      'Descargas sin conexión de tus álbumes y playlists favoritas',
      'Spotify Connect para controlar la música desde cualquier dispositivo',
    ],
  },
  prod_max: {
    resolution: '4K UHD + Dolby Atmos',
    screens: '1 Pantalla Privada con PIN',
    accountType: 'Perfil Privado con PIN de 4 dígitos',
    devices: ['Smart TV', 'Fire TV', 'Android TV', 'Celulares', 'Laptops'],
    renewal: 'Renovación mensual garantizada',
    deliveryTime: 'Menos de 3 minutos',
    guarantee: 'Soporte prioritario y garantía activa',
    highlights: [
      'Series originales de HBO, Warner Bros, DC Comics y Discovery',
      'Estrenos cinematográficos exclusivos en calidad 4K HDR',
      'Perfil seguro con PIN para que nadie interrumpa tus reproducciones',
    ],
  },
  prod_youtube: {
    resolution: '1080p Premium Bitrate & 4K 60fps',
    screens: 'Multi-dispositivo en tu propia cuenta Google',
    accountType: 'Activación por invitación a tu correo Gmail',
    devices: ['Todos los dispositivos con tu cuenta de YouTube'],
    renewal: 'Renovación mensual continua',
    deliveryTime: 'Entrega en 3 minutos',
    guarantee: 'Garantía total de membresía',
    highlights: [
      'Videos completamente sin anuncios en Smart TV, móvil y PC',
      'Reproducción en segundo plano y con pantalla bloqueada en celulares',
      'Incluye YouTube Music Premium sin costo adicional',
      'Descargas de videos y música para escuchar sin conexión a internet',
    ],
  },
  prod_prime: {
    resolution: '4K Ultra HD + HDR',
    screens: '1 Pantalla Privada con PIN',
    accountType: 'Perfil Personal con PIN',
    devices: ['Smart TV', 'Firestick', 'Celulares', 'Tablets', 'PC'],
    renewal: 'Renovable mes a mes',
    deliveryTime: 'Entrega inmediata',
    guarantee: 'Garantía oficial AliClip',
    highlights: [
      'Series exclusivas de Prime Video Originals y películas de estreno',
      'Audio en español latino y subtítulos en múltiples idiomas',
      'Calidad 4K sin costo adicional',
    ],
  },
};

// Default fallback specs for other products
export function getProductSpecs(product: Product): ProductTechSpecs {
  const byId = PRODUCT_SPECS_DATABASE[product.id];
  if (byId) return byId;

  const isAi = product.category === 'ai';
  const isStreaming = product.category === 'streaming';

  return {
    resolution: isStreaming ? '4K Ultra HD HDR' : 'Alta Velocidad Pro',
    screens: isStreaming ? '1 Pantalla Privada' : '1 Usuario Exclusivo',
    accountType: isStreaming ? 'Perfil Individual' : 'Cuenta con Licencia Activa',
    devices: ['Multiplataforma (PC, Móvil, TV y Web)'],
    renewal: 'Renovable mes a mes con garantía de continuidad',
    deliveryTime: 'Entrega rápida en menos de 3 minutos por WhatsApp',
    guarantee: 'Garantía total de reposición durante el periodo contratado',
    highlights: [
      `Acceso completo a todas las funciones premium de ${product.name}`,
      'Soporte técnico directo vía WhatsApp en horario extendido',
      'Ahorro de hasta el 70% comparado a la suscripción tradicional',
      'Activación garantizada con métodos de pago nacionales (Yape, Plin y bancos)',
    ],
  };
}

// Determines if a product actually supports profile PIN
export function productSupportsPin(product: Product, plan?: ProductPlan): boolean {
  if (plan?.desc?.toLowerCase().includes('pin')) return true;
  const name = product.name.toLowerCase();
  const desc = (product.desc || '').toLowerCase();
  const tag = (product.tag || '').toLowerCase();

  // AI products never use profile PIN
  if (product.category === 'ai') return false;

  // Music & Cloud utilities never use profile PIN
  if (
    name.includes('spotify') ||
    name.includes('youtube') ||
    name.includes('canva') ||
    name.includes('office') ||
    name.includes('duolingo') ||
    name.includes('apple music')
  ) {
    return false;
  }

  // Known streaming services with multi-profile PIN system
  const pinKeywords = ['netflix', 'max', 'disney', 'prime video', 'hbo', 'paramount'];
  return pinKeywords.some((kw) => name.includes(kw) || desc.includes(kw) || tag.includes(kw));
}
