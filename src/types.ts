export interface ProductPlan {
  name: string;
  price: string;
  desc?: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'ai' | 'streaming' | 'utility';
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
  updatedAt?: string;
}

export interface SaleRecord {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  productId: string;
  productName: string;
  planName: string;
  price: string;
  paymentMethod: string;
  accountType: string;
  durationText: string;
  activationDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  status: 'activa' | 'por_vencer' | 'vencida';
  notes?: string;
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
  reviewsBadgeText?: string;
  // Banner Principal (Hero) Personalizable
  heroBadgeText?: string;
  heroTitlePrefix?: string;
  heroTitleHighlight?: string;
  heroTitleSuffix?: string;
  heroDescription?: string;
  heroRatingScore?: string;
  heroRatingText?: string;
  heroCtaText?: string;
  heroShowcaseTitle?: string;
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
