export interface ProductPlan {
  name: string;
  price: string;
  desc?: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'ai' | 'streaming' | 'courses' | 'resources' | 'utility';
  tag: string;
  desc: string;
  imageUrl?: string;
  coverImageUrl?: string; // Portada del producto optimizada
  icon?: string;
  available: boolean;
  stock?: number; // Cantidad de unidades disponibles en stock
  selectedPlanIndex?: number;
  plans: ProductPlan[];
  accountType?: 'perfil_privado' | 'perfil_compartido' | 'cuenta_privada' | 'cuenta_compartida';
  durationUnit?: 'dias' | 'meses' | 'anos';
  durationValue?: number;
  durationText?: string;
  customSpecs?: string[];
  customHighlights?: string[];
  order?: number;
  rating?: string | number; // Rating individual del producto (ej: 4.9, 5.0)
  activationsCount?: string | number; // Activaciones del producto (ej: +2.400)
  updatedAt?: string;

  // Campos exclusivos para Cursos & Formación
  courseInstructor?: string; // Instructor o Especialista (ej: Certificado AlixPlay Pro)
  courseLevel?: string; // Nivel de formación (ej: Básico a Avanzado, Masterclass)
  courseModules?: string; // Módulos y duración (ej: 12 Módulos • 28 Horas 4K)
  courseAccessUrl?: string; // Enlace privado de acceso o Google Drive
  courseCertification?: boolean; // Certificado de finalización

  // Campos exclusivos para Recursos & Packs Digitales
  resourceFormat?: string; // Formato de entrega (ej: Google Drive VIP, Notion Bóveda)
  resourceSoftware?: string; // Software compatible (ej: Canva Free/Pro, Premiere, CapCut)
  resourceSize?: string; // Peso / Elementos (ej: +50,000 Plantillas, 45 GB)
  resourceLicense?: string; // Tipo de licencia (ej: Licencia Comercial Libre)
  resourceDownloadUrl?: string; // Enlace directo a Google Drive / Descarga
}

export interface ServiceCredentials {
  email?: string;
  password?: string;
  pin?: string;
  profileName?: string;
  driveLink?: string;
  instructions?: string;
}

export interface SaleRecord {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  accessToken?: string; // Token único o código de pedido (ej: ALI-X784 o TK-1001)
  productId: string;
  productName: string;
  planName: string;
  price: string;
  paymentMethod: string;
  accountType: string;
  durationText: string;
  durationMonths?: number;
  activationDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  status: 'activa' | 'por_vencer' | 'vencida';
  notes?: string;
  serviceCredentials?: ServiceCredentials;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  badge?: string;
  accountNumber: string;
  accountHolder?: string;
  instructions?: string;
  logoUrl?: string; // custom uploaded logo or direct URL
  icon?: string; // fallback icon identifier: 'smartphone', 'wallet', 'credit-card', 'coins', 'bank'
  color: string; // hex color for neon glow highlight (e.g. #8b5cf6, #06b6d4, #f59e0b)
  enabled: boolean;
  order?: number;
}

export interface BenefitsTickerItemSetting {
  text: string;
  sub: string;
}

export interface FaqItemSetting {
  question: string;
  answer: string;
}

export interface AdminSectionConfig {
  id: string; // 'products' | 'courses' | 'resources' | 'sales_history' | 'sales' | 'payments' | 'brand' | 'texts' | 'claims' | 'cloud' | 'security'
  label: string;
  shortLabel?: string;
  subtitle?: string;
  icon: string;
  group: 'GESTIÓN COMERCIAL' | 'PERSONALIZACIÓN' | 'INFRAESTRUCTURA & ACCESO';
  enabled: boolean;
  showInStore?: boolean;
  order: number;
}

export interface StoreCategoryConfig {
  id: 'ai' | 'streaming' | 'courses' | 'resources';
  label: string;
  subtitle?: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface StorefrontSectionConfig {
  id: 'heroCarousel' | 'benefitsTicker' | 'catalog' | 'reviews' | 'payments' | 'purchaseProcess' | 'faq' | 'claims';
  label: string;
  subtitle?: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface StoreSettings {
  name: string;
  suffix: string;
  subtitle: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  announcement: string;
  colorPrimary: string;
  colorAccent: string;
  activeThemePreset?: string;
  creatorUrl: string;
  creatorHandle: string;
  brandFont?: string;
  brandFontWeight?: string;
  brandLetterSpacing?: string;
  brandTextTransform?: 'normal' | 'uppercase' | 'capitalize';
  brandLogoShape?: 'rounded' | 'square' | 'circle';
  brandLogoGlow?: boolean;
  brandIconName?: string;
  tiktokUrl?: string;
  instagramUrl?: string;
  telegramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  showTiktok?: boolean;
  showInstagram?: boolean;
  showTelegram?: boolean;
  showFacebook?: boolean;
  showYoutube?: boolean;
  showTwitter?: boolean;
  logoBase64?: string;
  faviconBase64?: string;
  paymentMethods?: PaymentMethod[];

  // 1. Navbar & Anuncios
  navbarCtaText?: string;
  searchPlaceholder?: string;

  // 2. Banner Principal (Hero) Personalizable
  heroBadgeText?: string;
  heroTitlePrefix?: string;
  heroTitleHighlight?: string;
  heroTitleSuffix?: string;
  heroDescription?: string;
  heroRatingScore?: string;
  heroRatingText?: string;
  heroCtaText?: string;
  heroShowcaseTitle?: string;
  heroCarouselRankBadge?: string;
  heroCarouselInstantBadge?: string;
  heroCarouselGuaranteeText?: string;
  heroCarouselActivationsText?: string;
  heroCarouselActivationsMode?: 'sales_additive' | 'sales_direct' | 'fixed';
  heroCarouselBaseRating?: string;
  heroCarouselRatingVary?: boolean;
  heroCarouselFromText?: string;
  heroCarouselCtaText?: string;
  heroCarouselHintText?: string;

  // 3. Cinta de Beneficios (LED Ticker)
  tickerItems?: BenefitsTickerItemSetting[];

  // 4. Catálogo & Filtros de Productos
  catalogTitle?: string;
  categoryTabAll?: string;
  categoryTabAi?: string;
  categoryTabStreaming?: string;
  categoryTabCourses?: string;
  categoryTabResources?: string;
  catalogStatusText?: string;
  catalogEmptyTitle?: string;
  catalogEmptyDesc?: string;
  catalogEmptyResetText?: string;

  // 5. Proceso de Compra (4 Pasos)
  processSectionBadge?: string;
  processSectionTitle?: string;
  processSectionWaLink?: string;
  processStep1Title?: string;
  processStep1Desc?: string;
  processStep2Title?: string;
  processStep2Desc?: string;
  processStep3Title?: string;
  processStep3Desc?: string;
  processStep4Title?: string;
  processStep4Desc?: string;

  // 6. Métodos de Pago
  paymentSectionBadge?: string;
  paymentSectionTitle?: string;
  paymentSectionSubtitle?: string;
  paymentCardBtnText?: string;

  // 7. Opiniones & Reseñas
  reviewsBadgeText?: string;
  reviewsSectionTitlePrefix?: string;
  reviewsSectionTitleHighlight?: string;
  reviewsSectionDescription?: string;
  reviewsBtnText?: string;
  reviewsStat1Title?: string;
  reviewsStat1Sub?: string;
  reviewsStat2Title?: string;
  reviewsStat2Sub?: string;
  reviewsStat3Title?: string;
  reviewsStat3Sub?: string;

  // 8. Preguntas Frecuentes (FAQ)
  faqSectionBadge?: string;
  faqSectionTitle?: string;
  faqSectionDescription?: string;
  faqItems?: FaqItemSetting[];

  // 9. Pie de Página (Footer)
  footerSlogan?: string;
  footerHours?: string;
  footerTrustNote?: string;
  footerPaymentTitle?: string;
  footerPaymentDesc?: string;
  footerPaymentValidation?: string;
  footerCopyright?: string;
  footerSubtitle?: string;

  // 10. Términos y Condiciones
  termsModalTitle?: string;
  termsModalSubtitle?: string;
  termsCommitmentTitle?: string;
  termsCommitmentText?: string;

  // 11. Gestión Dinámica de Secciones & Navegación
  adminSections?: AdminSectionConfig[];
  storeCategories?: StoreCategoryConfig[];
  storefrontSections?: StorefrontSectionConfig[];

  // 12. Facturación & Comprobantes Digitales Personalizables
  invoiceBusinessName?: string; // Nombre Comercial / Razón Social
  invoiceTaxId?: string; // RUC / NIT / RFC / CIF
  invoiceAddress?: string; // Dirección fiscal o comercial
  invoiceContactEmail?: string; // Correo de contacto en comprobante
  invoiceContactPhone?: string; // Teléfono / WhatsApp en comprobante
  invoicePrefix?: string; // Prefijo o Serie (ej: B001, CP-2026, TK)
  invoiceTitle?: string; // Título del comprobante (ej: "COMPROBANTE DE PAGO DIGITAL")
  invoiceTemplateStyle?: 'modern_neon' | 'corporate_clean' | 'ticket_thermal' | 'official_qr';
  invoiceLogoBase64?: string; // Logo exclusivo para comprobantes
  invoiceStampText?: string; // Texto del sello de garantía oficial
  invoiceHeaderMessage?: string; // Mensaje de bienvenida / agradecimiento
  invoiceFooterTerms?: string; // Términos al pie del comprobante
  invoiceShowQr?: boolean; // Mostrar QR de verificación
  invoicePrimaryColor?: string; // Color de acento de la factura

  updatedAt?: string;
}

export interface Claim {
  id: string;
  code: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  typeGood: string;
  service: string;
  category: 'Reclamo' | 'Queja';
  description: string;
  request: string;
  createdAt: string;
  status: 'pending' | 'in_review' | 'resolved';
}
