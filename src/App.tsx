import { useState, useEffect, lazy, Suspense } from 'react';
import {
  Grid,
  Bot,
  Film,
  GraduationCap,
  Layers,
  SearchX,
  MessageCircle,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BenefitsTicker } from './components/BenefitsTicker';
import { ProductCard } from './components/ProductCard';
import { SocialDock } from './components/SocialDock';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { LazySection } from './components/LazySection';
import { SeoHead } from './components/SeoHead';

// Lazy-loaded heavy below-the-scroll sections to optimize initial page load
const CustomerReviews = lazy(() =>
  import('./components/CustomerReviews').then((m) => ({ default: m.CustomerReviews }))
);
const PaymentMethods = lazy(() =>
  import('./components/PaymentMethods').then((m) => ({ default: m.PaymentMethods }))
);
const PurchaseProcess = lazy(() =>
  import('./components/PurchaseProcess').then((m) => ({ default: m.PurchaseProcess }))
);
const FaqSection = lazy(() =>
  import('./components/FaqSection').then((m) => ({ default: m.FaqSection }))
);
const Footer = lazy(() =>
  import('./components/Footer').then((m) => ({ default: m.Footer }))
);

// Lazy-loaded on-demand modals
const BuyModal = lazy(() =>
  import('./components/BuyModal').then((m) => ({ default: m.BuyModal }))
);
const TermsModal = lazy(() =>
  import('./components/TermsModal').then((m) => ({ default: m.TermsModal }))
);
const ClaimsModal = lazy(() =>
  import('./components/ClaimsModal').then((m) => ({ default: m.ClaimsModal }))
);
const AdminModal = lazy(() =>
  import('./components/AdminModal').then((m) => ({ default: m.AdminModal }))
);
const AdminAuthModal = lazy(() =>
  import('./components/AdminAuthModal').then((m) => ({ default: m.AdminAuthModal }))
);
const QuickViewModal = lazy(() =>
  import('./components/QuickViewModal').then((m) => ({ default: m.QuickViewModal }))
);
const MyPurchasesModal = lazy(() =>
  import('./components/MyPurchasesModal').then((m) => ({ default: m.MyPurchasesModal }))
);
import {
  subscribeToProducts,
  subscribeToSettings,
  subscribeToClaims,
  subscribeToSales,
  seedProductsCollection,
  DEFAULT_SETTINGS,
  DEFAULT_STORE_CATEGORIES,
  DEFAULT_STOREFRONT_SECTIONS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
} from './services/storeService';
import { getAdminIcon } from './utils/adminIcons';
import { Product, ProductPlan, StoreSettings, Claim, SaleRecord } from './types';

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>(INITIAL_SALES);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [category, setCategory] = useState<'all' | 'ai' | 'streaming' | 'courses' | 'resources'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ProductPlan | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showClaims, setShowClaims] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMyPurchases, setShowMyPurchases] = useState(false);
  const [myPurchasesQuery, setMyPurchasesQuery] = useState('');

  // Admin session
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('alixplay_admin_session') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState(() => {
    return sessionStorage.getItem('alixplay_admin_user') || 'admin';
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Theme state with local storage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('alixplay_theme');
        if (stored === 'dark' || stored === 'light') {
          return stored;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } catch (e) {
        console.error(e);
      }
    }
    return 'light';
  });

  // Apply dark mode class to html element and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('alixplay_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  // Sync across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'alixplay_theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Hash route listener for #cursos and #recursos
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#cursos') {
        setCategory('courses');
      } else if (hash === '#recursos') {
        setCategory('resources');
      } else if (hash === '#streaming') {
        setCategory('streaming');
      } else if (hash === '#ia') {
        setCategory('ai');
      } else if (hash === '#mis-compras' || hash === '#compras' || hash === '#mis-pedidos') {
        setShowMyPurchases(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Real-time Firestore Subscriptions (deferred after initial paint for optimal FCP/LCP/TBT)
  useEffect(() => {
    let unsubProducts: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;
    let unsubClaims: (() => void) | undefined;
    let unsubSales: (() => void) | undefined;

    const timer = setTimeout(() => {
      // 1. Subscribe to products
      unsubProducts = subscribeToProducts(
        (items) => {
          if (items && items.length > 0) {
            setProducts(items);
          }
          setLoading(false);
          // Auto-seed if completely empty on initial load
          if (items.length === 0) {
            seedProductsCollection(false).catch(console.error);
          }
        },
        (err) => {
          console.error('Error in products subscription:', err);
          setLoading(false);
        }
      );

      // 2. Subscribe to settings
      unsubSettings = subscribeToSettings(
        (newSettings) => {
          setSettings(newSettings);
          // Update document title and primary styles dynamically
          document.title = `${newSettings.name}${newSettings.suffix} • ${newSettings.subtitle}`;
          document.documentElement.style.setProperty('--brand-primary', newSettings.colorPrimary);
          document.documentElement.style.setProperty('--brand-accent', newSettings.colorAccent);

          // Calculate dynamic neon glow shadows from hex colors
          const hexToRgba = (hex: string, alpha: number) => {
            const clean = hex.replace('#', '');
            if (clean.length === 6) {
              const r = parseInt(clean.substring(0, 2), 16);
              const g = parseInt(clean.substring(2, 4), 16);
              const b = parseInt(clean.substring(4, 6), 16);
              return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }
            return hex;
          };

          document.documentElement.style.setProperty(
            '--brand-primary-glow',
            hexToRgba(newSettings.colorPrimary, 0.38)
          );
          document.documentElement.style.setProperty(
            '--brand-accent-glow',
            hexToRgba(newSettings.colorAccent, 0.38)
          );

          // Update browser favicon dynamically
          let favEl = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
          if (!favEl) {
            favEl = document.createElement('link');
            favEl.id = 'dynamic-favicon';
            favEl.rel = 'icon';
            document.head.appendChild(favEl);
          }
          if (newSettings.faviconBase64) {
            favEl.href = newSettings.faviconBase64;
          } else {
            favEl.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${encodeURIComponent(
              newSettings.colorPrimary
            )}'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>`;
          }
        },
        (err) => {
          console.error('Error in settings subscription:', err);
        }
      );

      // 3. Claims subscription only if admin session or claim modal is opened
      if (isAdmin || showClaims || showAdminPanel) {
        unsubClaims = subscribeToClaims(
          (claimList) => {
            setClaims(claimList);
          },
          (err) => {
            console.error('Error in claims subscription:', err);
          }
        );
      }

      // 4. Sales records subscription only if admin session, admin panel or customer purchases is open
      if (isAdmin || showAdminPanel || showMyPurchases) {
        unsubSales = subscribeToSales(
          (salesList) => {
            setSales(salesList);
          },
          (err) => {
            console.error('Error in sales subscription:', err);
          }
        );
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      if (unsubProducts) unsubProducts();
      if (unsubSettings) unsubSettings();
      if (unsubClaims) unsubClaims();
      if (unsubSales) unsubSales();
    };
  }, [isAdmin, showClaims, showAdminPanel, showMyPurchases]);

  // Keyboard shortcut & hash detection for discreet admin login
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (isAdmin) setShowAdminPanel(true);
        else setShowAdminAuth(true);
      }
    };

    const handleHash = () => {
      if (window.location.hash === '#admin' || window.location.hash === '#panel') {
        if (isAdmin) setShowAdminPanel(true);
        else setShowAdminAuth(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHash);
    };
  }, [isAdmin]);

  // Triple-click on brand logo handler
  let clickCount = 0;
  let clickTimer: NodeJS.Timeout | null = null;
  const handleBrandTripleClick = () => {
    clickCount++;
    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 1200);

    if (clickCount >= 3) {
      clickCount = 0;
      if (isAdmin) setShowAdminPanel(true);
      else setShowAdminAuth(true);
    }
  };

  const handleAdminLoginSuccess = (user: string) => {
    setIsAdmin(true);
    setAdminUsername(user);
    sessionStorage.setItem('alixplay_admin_session', 'true');
    sessionStorage.setItem('alixplay_admin_user', user);
    setShowAdminPanel(true);
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminUsername('');
    sessionStorage.removeItem('alixplay_admin_session');
    sessionStorage.removeItem('alixplay_admin_user');
    setShowAdminPanel(false);
    showToast('Sesión de administrador cerrada. Panel oculto.');
  };

  // Configured store categories
  const configuredCategories = Array.isArray(settings.storeCategories) && settings.storeCategories.length > 0
    ? [...settings.storeCategories].sort((a, b) => a.order - b.order)
    : DEFAULT_STORE_CATEGORIES;

  const isCategoryEnabled = (catId: string) => {
    if (catId === 'all') return true;
    const cat = configuredCategories.find((c) => c.id === catId);
    return cat ? cat.enabled !== false : true;
  };

  // If active category was disabled in admin, auto-fallback to 'all'
  useEffect(() => {
    if (category !== 'all' && !isCategoryEnabled(category)) {
      setCategory('all');
    }
  }, [settings.storeCategories, category]);

  // Filter products by category and search (hiding products from disabled categories)
  const filteredProducts = products.filter((p) => {
    if (p.category && !isCategoryEnabled(p.category)) {
      return false;
    }
    const matchesCat = category === 'all' || p.category === category;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.tag.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const totalAll = products.filter((p) => !p.category || isCategoryEnabled(p.category)).length;
  const totalAi = products.filter((p) => p.category === 'ai').length;
  const totalStreaming = products.filter((p) => p.category === 'streaming').length;
  const totalCourses = products.filter((p) => p.category === 'courses').length;
  const totalResources = products.filter((p) => p.category === 'resources').length;

  const getCategoryCount = (catId: string) => {
    if (catId === 'ai') return totalAi;
    if (catId === 'streaming') return totalStreaming;
    if (catId === 'courses') return totalCourses;
    if (catId === 'resources') return totalResources;
    return totalAll;
  };

  // Storefront blocks visibility
  const storefrontConfig = Array.isArray(settings.storefrontSections) && settings.storefrontSections.length > 0
    ? settings.storefrontSections
    : DEFAULT_STOREFRONT_SECTIONS;

  const isSectionEnabled = (secId: string) => {
    const sec = storefrontConfig.find((s) => s.id === secId);
    return sec ? sec.enabled !== false : true;
  };

  const handleDirectBuyFromCard = (product: Product, plan: ProductPlan) => {
    setSelectedProduct(product);
    setSelectedPlan(plan);
  };

  const openWhatsAppLink = (message: string) => {
    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRequestCombo = (name: string, price: string) => {
    openWhatsAppLink(`¡Hola ${settings.name}${settings.suffix}! 👋 Quiero ordenar el combo promocional *${name}* (${price}). ¿Tienen disponibilidad inmediata para enviar comprobante?`);
  };

  const handleCustomComboPrompt = () => {
    openWhatsAppLink(`¡Hola ${settings.name}${settings.suffix}! 👋 Quisiera armar un combo personalizado de membresías (IA + Streaming). ¿Qué descuento me pueden ofrecer?`);
  };

  const floatingWaUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    `Hola ${settings.name}${settings.suffix}, deseo consultar por una membresía`
  )}`;

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#F8FAFC] dark:bg-[#0b0f19] text-[#0F172A] dark:text-slate-100 transition-colors duration-200">
      {/* Dynamic SEO Meta Tags & Schema.org JSON-LD */}
      <SeoHead
        settings={settings}
        products={products}
        selectedProduct={selectedProduct}
      />

      {/* Toast Notification (Positioned at bottom-center so it never covers the header or logo) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-950/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        settings={settings}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isAdmin={isAdmin}
        adminUsername={adminUsername}
        onOpenAdmin={() => setShowAdminPanel(true)}
        onLogoutAdmin={handleAdminLogout}
        onOpenTerms={() => setShowTerms(true)}
        onOpenMyPurchases={() => setShowMyPurchases(true)}
        onBrandClick={handleBrandTripleClick}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSelectCategory={(cat) => {
          setCategory(cat);
          const el = document.getElementById('catalogo');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Top Main Hero Banner with Integrated + Vendidos Translucent Loop Slider */}
      <Hero
        settings={settings}
        products={products}
        sales={sales}
        onSelectProduct={handleDirectBuyFromCard}
      />

      {/* Animated LED Screen Ticker (Infinite Seamless Loop Marquee) */}
      {isSectionEnabled('benefitsTicker') && <BenefitsTicker settings={settings} />}

      {/* Catalog Section - Immediate First Viewport Access */}
      <main id="catalogo" className="pt-2 pb-12 bg-slate-50 dark:bg-[#070913] flex-1 transition-colors duration-200">
        <h2 className="sr-only">Catálogo de Membresías y Cuentas Premium</h2>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-3">
          {/* Category Filter Bar - Futuristic Cosmic Segmented Controls */}
          <div className="bg-white/80 dark:bg-[#0e1322]/90 backdrop-blur-xl rounded-2xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-2.5 transition-colors">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCategory('all')}
                aria-label="Ver todos los productos"
                className={`min-h-[42px] px-3.5 py-2 rounded-xl font-black transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  category === 'all'
                    ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-[0_0_18px_rgba(168,85,247,0.45)]'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{settings.categoryTabAll || 'Todos los Productos'}</span>
                <span
                  className={`ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-md ${
                    category === 'all'
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {totalAll}
                </span>
              </button>

              {configuredCategories
                .filter((cat) => cat.enabled !== false)
                .map((cat) => {
                  const IconComp = getAdminIcon(cat.icon);
                  const isSelected = category === cat.id;
                  const count = getCategoryCount(cat.id);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      aria-label={`Filtrar por ${cat.label}`}
                      className={`min-h-[42px] px-3.5 py-2 rounded-xl font-black transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-[0_0_18px_rgba(168,85,247,0.45)]'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                      <span>{cat.label}</span>
                      <span
                        className={`ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-md ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
            </div>

            {/* Right Side Status Indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-2 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                {loading ? 'Cargando membresías...' : `${filteredProducts.length} ${settings.catalogStatusText || 'servicios disponibles'}`}
              </span>
            </div>
          </div>

          {/* Search feedback */}
          {searchQuery && (
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-800 dark:text-indigo-200 flex items-center justify-between">
              <span>Resultados para: "{searchQuery}"</span>
              <button
                onClick={() => setSearchQuery('')}
                className="font-bold underline text-indigo-600 dark:text-indigo-400 cursor-pointer"
              >
                Ver todo el catálogo
              </button>
            </div>
          )}

          {/* Anchor targets for direct deep-linking */}
          <div id="cursos" className="scroll-mt-24" />
          <div id="recursos" className="scroll-mt-24" />

          {/* Cursos Spotlight Section Header Banner */}
          {category === 'courses' && isCategoryEnabled('courses') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/10 border border-amber-500/30 dark:border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Academia & Cursos Digitales
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      Acceso Vitalicio 24/7
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                      Material en Google Drive
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {settings.categoryTabCourses || 'Cursos & Masterclasses Especializadas'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-2xl">
                    Formaciones completas en Inteligencia Artificial, Marketing y Edición Viral. Incluyen clases grabadas en alta resolución, proyectos editables y asesoría por WhatsApp.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => openWhatsAppLink(`¡Hola ${settings.name}${settings.suffix}! 👋 Deseo consultar por el catálogo completo de cursos y masterclasses disponibles.`)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Consultar Cursos</span>
                </button>
              </div>
            </div>
          )}

          {/* Recursos Spotlight Section Header Banner */}
          {category === 'resources' && isCategoryEnabled('resources') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 dark:border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Bóveda de Recursos & Packs Digitales
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                      Descarga Inmediata
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-800 dark:text-indigo-300">
                      +100GB en Google Drive
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {settings.categoryTabResources || 'Recursos & Mega Packs Descargables'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-2xl">
                    Mega packs de plantillas Canva editables, bóvedas de prompts para ChatGPT/Midjourney, overlays 4K y LUTs cinematográficos con enlaces permanentes y entrega automática.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => openWhatsAppLink(`¡Hola ${settings.name}${settings.suffix}! 👋 Deseo consultar por los packs de recursos y plantillas descargables.`)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Pedir Enlace Drive</span>
                </button>
              </div>
            </div>
          )}

          {/* Products Grid - Compact Responsive Grid for Mobile & Desktop */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-[#0e1322]/80 rounded-2xl sm:rounded-3xl border border-slate-800 p-3 sm:p-4 h-64 sm:h-72 animate-pulse flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-800 rounded-full w-16" />
                    <div className="h-4 bg-slate-800 rounded-full w-12" />
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-800/80 mx-auto" />
                  <div className="space-y-1.5">
                    <div className="h-4 bg-slate-800 rounded w-3/4 mx-auto" />
                    <div className="h-2.5 bg-slate-850 rounded w-1/2 mx-auto" />
                  </div>
                  <div className="h-8 bg-slate-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4.5">
              {filteredProducts.map((prod, idx) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  settings={settings}
                  onSelectProduct={handleDirectBuyFromCard}
                  onQuickView={(p, plan) => {
                    setQuickViewProduct(p);
                    setSelectedPlan(plan);
                  }}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center mb-3">
                <SearchX className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {settings.catalogEmptyTitle || 'No encontramos resultados para tu búsqueda'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                {settings.catalogEmptyDesc ||
                  'Intenta buscar con otro nombre como "ChatGPT", "Netflix", "Canva", o contáctanos por WhatsApp para consultar disponibilidad.'}
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                {settings.catalogEmptyResetText || 'Restablecer Catálogo'}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Lazy-Loaded Below-The-Scroll Sections to optimize initial load & FCP */}
      {isSectionEnabled('reviews') && (
        <LazySection id="opiniones" minHeight="480px">
          <Suspense
            fallback={
              <div className="py-16 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto" />
              </div>
            }
          >
            <CustomerReviews settings={settings} />
          </Suspense>
        </LazySection>
      )}

      {isSectionEnabled('payments') && (
        <LazySection minHeight="400px">
          <Suspense
            fallback={
              <div className="py-14 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto" />
              </div>
            }
          >
            <PaymentMethods
              settings={settings}
              onOpenPaymentInfo={() => {
                if (products.length > 0) {
                  setSelectedProduct(products[0]);
                  setSelectedPlan(products[0].plans[0] || null);
                }
              }}
            />
          </Suspense>
        </LazySection>
      )}

      {isSectionEnabled('purchaseProcess') && (
        <LazySection minHeight="340px">
          <Suspense
            fallback={
              <div className="py-12 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto" />
              </div>
            }
          >
            <PurchaseProcess settings={settings} />
          </Suspense>
        </LazySection>
      )}

      {isSectionEnabled('faq') && (
        <LazySection id="faq" minHeight="450px">
          <Suspense
            fallback={
              <div className="py-14 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto" />
              </div>
            }
          >
            <FaqSection settings={settings} />
          </Suspense>
        </LazySection>
      )}

      <LazySection minHeight="320px">
        <Suspense
          fallback={
            <div className="py-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto" />
            </div>
          }
        >
          <Footer
            settings={settings}
            onFilterCategory={(cat) => setCategory(cat as any)}
            onOpenTerms={() => setShowTerms(true)}
            onOpenClaims={() => setShowClaims(true)}
            onOpenMyPurchases={() => setShowMyPurchases(true)}
            onOpenAdminAuth={() => {
              if (isAdmin) setShowAdminPanel(true);
              else setShowAdminAuth(true);
            }}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        </Suspense>
      </LazySection>

      {/* Floating Neon Social Dock */}
      <SocialDock settings={settings} />

      {/* Scroll to Top Button with Parallax and Scroll Progress */}
      <ScrollToTopButton
        primaryColor={settings.colorPrimary}
        accentColor={settings.colorAccent}
      />

      {/* Floating WhatsApp Button (Compact & Discreet) */}
      <a
        href={floatingWaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group"
        aria-label="Contactar por WhatsApp"
        title="WhatsApp Soporte"
      >
        <MessageCircle className="w-5 h-5 text-white" />

        {/* Discreet online status indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-slate-900"></span>
        </span>

        {/* Compact Hover Tooltip */}
        <span className="absolute right-12 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900/95 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 border border-slate-700/80 shadow-xl hidden sm:flex items-center gap-1.5 group-hover:-translate-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>WhatsApp Soporte</span>
        </span>
      </a>

      {/* On-Demand Modals with Suspense */}
      <Suspense fallback={null}>
        {quickViewProduct && (
          <QuickViewModal
            product={quickViewProduct}
            settings={settings}
            onClose={() => setQuickViewProduct(null)}
            onProceedToBuy={(prod, plan) => {
              setQuickViewProduct(null);
              setSelectedProduct(prod);
              setSelectedPlan(plan);
            }}
          />
        )}

        {selectedProduct && (
          <BuyModal
            product={selectedProduct}
            plan={selectedPlan}
            settings={settings}
            onClose={() => {
              setSelectedProduct(null);
              setSelectedPlan(null);
            }}
            onToast={showToast}
            onSaleCreated={(newSale) => {
              setSales((prev) => [newSale, ...prev.filter((s) => s.id !== newSale.id)]);
            }}
            onOpenMyPurchases={(q) => {
              if (q) setMyPurchasesQuery(q);
              setShowMyPurchases(true);
            }}
          />
        )}

        {showTerms && (
          <TermsModal
            settings={settings}
            onClose={() => setShowTerms(false)}
          />
        )}

        {showClaims && (
          <ClaimsModal
            settings={settings}
            onClose={() => setShowClaims(false)}
            onToast={showToast}
          />
        )}

        {showAdminAuth && (
          <AdminAuthModal
            onClose={() => setShowAdminAuth(false)}
            onSuccess={handleAdminLoginSuccess}
            onToast={showToast}
          />
        )}

        {showAdminPanel && (
          <AdminModal
            products={products}
            settings={settings}
            claims={claims}
            sales={sales}
            adminUsername={adminUsername}
            onClose={() => setShowAdminPanel(false)}
            onLogout={handleAdminLogout}
            onToast={showToast}
          />
        )}

        {showMyPurchases && (
          <MyPurchasesModal
            isOpen={showMyPurchases}
            onClose={() => {
              setShowMyPurchases(false);
              setMyPurchasesQuery('');
            }}
            settings={settings}
            sales={sales}
            onToast={showToast}
            initialQuery={myPurchasesQuery}
          />
        )}
      </Suspense>
    </div>
  );
}
