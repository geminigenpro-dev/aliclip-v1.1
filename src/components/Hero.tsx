import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Star,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Bot,
  Cpu,
  Palette,
  Video,
  LayoutGrid,
  Image as ImageIcon,
  Mic,
  Tv,
  Film,
  Clapperboard,
  PlaySquare,
  Music,
  Glasses,
  MonitorPlay,
} from 'lucide-react';
import { StoreSettings, Product, ProductPlan, SaleRecord } from '../types';

// Conteo de ventas confirmadas para un producto o plataforma
export const getProductSalesCount = (product: Product, sales: SaleRecord[] = []): number => {
  if (!sales || sales.length === 0) return 0;
  const pId = (product.id || '').toLowerCase().trim();
  const pName = (product.name || '').toLowerCase().trim();

  return sales.filter((s) => {
    // 1. Coincidencia directa de ID
    if (s.productId && s.productId.toLowerCase().trim() === pId) return true;

    // 2. Coincidencia por nombre o alias clave de plataforma
    if (s.productName) {
      const sName = s.productName.toLowerCase().trim();
      if (sName === pName) return true;
      if (sName.includes(pName) || pName.includes(sName)) return true;

      const keywords = [
        'chatgpt', 'netflix', 'canva', 'claude', 'disney', 'spotify',
        'youtube', 'prime', 'max', 'hbo', 'midjourney', 'capcut',
        'gemini', 'runway', 'elevenlabs', 'leonardo', 'crunchyroll',
        'paramount', 'apple', 'office', 'windows'
      ];
      for (const kw of keywords) {
        if (pName.includes(kw) && sName.includes(kw)) return true;
      }
    }
    return false;
  }).length;
};

// Formato de miles con punto (ej: 2.400, 3.150)
const formatNumberWithDots = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

interface HeroProps {
  settings: StoreSettings;
  products?: Product[];
  sales?: SaleRecord[];
  onSelectProduct?: (product: Product, plan: ProductPlan) => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  products = [],
  sales = [],
  onSelectProduct,
}) => {
  // Filter top "+ Vendidos" products for the integrated dynamic hero slider
  // Ordenados prioritariamente por número de ventas confirmadas en vivo
  const bestSellers = React.useMemo(() => {
    if (!products || products.length === 0) return [];

    const tagged = products.filter((p) => {
      const tag = (p.tag || '').toLowerCase();
      const desc = (p.desc || '').toLowerCase();
      const name = p.name.toLowerCase();
      return (
        tag.includes('top') ||
        tag.includes('ventas') ||
        tag.includes('best') ||
        tag.includes('flash') ||
        tag.includes('popular') ||
        name.includes('chatgpt') ||
        name.includes('netflix') ||
        name.includes('canva') ||
        name.includes('midjourney') ||
        desc.includes('4k') ||
        desc.includes('más vendid')
      );
    });

    const selected = tagged.length >= 3 ? tagged : products;

    // Ordenar de mayor a menor según el número de ventas confirmadas de cada plataforma
    const sorted = [...selected].sort((a, b) => {
      const salesA = getProductSalesCount(a, sales);
      const salesB = getProductSalesCount(b, sales);
      if (salesB !== salesA) return salesB - salesA;
      return (a.order || 99) - (b.order || 99);
    });

    return sorted.slice(0, 8);
  }, [products, sales]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [clickedId, setClickedId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Smooth infinite loop auto-rotation for the integrated + Vendidos banner
  useEffect(() => {
    if (bestSellers.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bestSellers.length);
    }, 3800);

    return () => clearInterval(interval);
  }, [bestSellers.length, isPaused]);

  const scrollToCatalog = () => {
    const el = document.getElementById('catalogo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBannerClick = (product: Product) => {
    setClickedId(product.id);

    const defaultPlan = (product.plans && product.plans[0]) || {
      name: 'Estándar',
      price: 'S/ 25.00',
      desc: 'Plan Estándar',
    };

    if (onSelectProduct) {
      setTimeout(() => {
        onSelectProduct(product, defaultPlan);
        setClickedId(null);
      }, 150);
    } else {
      scrollToCatalog();
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? bestSellers.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % bestSellers.length);
  };

  // Calificaciones realistas que varían de forma dinámica entre productos en el carrusel
  const RATING_VARIATIONS = ['4.9', '5.0', '4.8', '4.95', '5.0', '4.85', '4.9', '4.92'];

  const getItemRating = (item: Product, idx: number): string => {
    if (item.rating) return String(item.rating);
    if (settings.heroCarouselRatingVary === false) {
      return settings.heroCarouselBaseRating || '4.9';
    }
    const salesCount = getProductSalesCount(item, sales);
    // Plataformas líderes con más ventas confirmadas obtienen calificaciones estelares
    if (salesCount >= 3) return '5.0';
    if (salesCount >= 2) return '4.95';
    return RATING_VARIATIONS[idx % RATING_VARIATIONS.length];
  };

  // El número de activaciones varía según el número de confirmaciones de ventas realizadas de cada plataforma
  const getItemActivations = (item: Product, _idx: number): string => {
    const confirmedCount = getProductSalesCount(item, sales);
    const mode = settings.heroCarouselActivationsMode || 'sales_additive';

    if (mode === 'fixed') {
      return item.activationsCount
        ? String(item.activationsCount)
        : (settings.heroCarouselActivationsText || '+2.400 Activaciones');
    }

    if (mode === 'sales_direct') {
      return `+${confirmedCount} Activaciones`;
    }

    // Modo principal (sales_additive):
    // Cada plataforma parte de una base ponderada y suma en vivo cada venta confirmada
    const baseText = settings.heroCarouselActivationsText || '+2.400 Activaciones';
    const numMatch = baseText.replace(/\./g, '').match(/\d+/);
    const globalBase = numMatch ? parseInt(numMatch[0], 10) : 2400;

    // Volúmenes de base iniciales reconocidos por plataforma comercial
    const platformWeights: Record<string, number> = {
      prod_netflix: 3120,
      prod_chatgpt: 2400,
      prod_canva: 1880,
      prod_spotify: 2140,
      prod_youtube: 1760,
      prod_disney: 1450,
      prod_midjourney: 1310,
      prod_claude: 1140,
      prod_prime: 1230,
      prod_max: 1370,
      prod_gemini: 980,
      prod_capcut: 1610,
      prod_apple_music: 1090,
      prod_crunchyroll: 1240,
      prod_runway: 880,
      prod_elevenlabs: 910,
      prod_leonardo: 830,
    };

    let baseActivations = platformWeights[item.id];
    if (!baseActivations) {
      const lower = (item.name || '').toLowerCase();
      if (lower.includes('netflix')) baseActivations = 3120;
      else if (lower.includes('chatgpt')) baseActivations = 2400;
      else if (lower.includes('canva')) baseActivations = 1880;
      else if (lower.includes('spotify')) baseActivations = 2140;
      else if (lower.includes('youtube')) baseActivations = 1760;
      else if (lower.includes('disney')) baseActivations = 1450;
      else if (lower.includes('midjourney')) baseActivations = 1310;
      else if (lower.includes('claude')) baseActivations = 1140;
      else {
        // Variación determinística según hash de ID
        const offset = ((item.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 7) - 3) * 160;
        baseActivations = Math.max(500, globalBase + offset);
      }
    }

    // Si el producto tiene un número explícito personalizado en su ficha, respetarlo como base
    if (item.activationsCount) {
      const explicitNum = String(item.activationsCount).replace(/\./g, '').match(/\d+/);
      if (explicitNum) {
        baseActivations = parseInt(explicitNum[0], 10);
      }
    }

    // SUMAR EL NÚMERO DE VENTAS CONFIRMADAS DE CADA PLATAFORMA
    const totalActivations = baseActivations + confirmedCount;
    const formattedNum = formatNumberWithDots(totalActivations);

    // Conservar el sufijo (ej: "Activaciones" o texto configurado por el usuario)
    const suffix = baseText.replace(/[+\d.,]/g, '').trim() || 'Activaciones';
    return `+${formattedNum} ${suffix}`;
  };

  const renderIcon = (iconName?: string) => {
    const iconClass = 'w-7 h-7 sm:w-8 sm:h-8 text-purple-400';
    switch (iconName) {
      case 'bot':
        return <Bot className={iconClass} />;
      case 'cpu':
        return <Cpu className={iconClass} />;
      case 'palette':
        return <Palette className={iconClass} />;
      case 'video':
        return <Video className={iconClass} />;
      case 'layout-grid':
        return <LayoutGrid className={iconClass} />;
      case 'image':
        return <ImageIcon className={iconClass} />;
      case 'mic':
        return <Mic className={iconClass} />;
      case 'tv':
        return <Tv className={iconClass} />;
      case 'film':
        return <Film className={iconClass} />;
      case 'clapperboard':
        return <Clapperboard className={iconClass} />;
      case 'play-square':
        return <PlaySquare className={iconClass} />;
      case 'music':
        return <Music className={iconClass} />;
      case 'glasses':
        return <Glasses className={iconClass} />;
      case 'monitor-play':
        return <MonitorPlay className={iconClass} />;
      default:
        return <Sparkles className={iconClass} />;
    }
  };

  const currentItem = bestSellers[currentIndex] || bestSellers[0];
  const primaryPlan = (currentItem && currentItem.plans && currentItem.plans[0]) || {
    name: 'Estándar',
    price: 'S/ 25.00',
  };

  return (
    <section
      id="mas-vendidos"
      className="w-full relative overflow-hidden bg-[#070913] text-white select-none border-b border-purple-900/30"
    >
      {/* Dynamic Ambient Background Glow Elements (Diffused Translucent Gradients) */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[550px] h-[320px] bg-gradient-to-tr from-pink-600/20 via-purple-600/15 to-transparent rounded-full blur-[110px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[550px] h-[320px] bg-gradient-to-bl from-cyan-600/20 via-blue-600/15 to-transparent rounded-full blur-[110px] pointer-events-none animate-pulse" />

      {/* Subtle Starry Grid Texture */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10 space-y-6">
        {/* Main Hero Split: Left Value Proposition + Right + Vendidos Dynamic Translucent Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Heading, Value Proposition & Stats */}
          <div className="lg:col-span-6 space-y-3.5 text-center lg:text-left">
            {/* Top Kicker Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-[10.5px] font-black text-pink-300 uppercase tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              <Flame className="w-3.5 h-3.5 text-pink-400 fill-pink-400 animate-pulse" />
              <span>
                {settings.heroBadgeText || 'MEMBRESÍAS DIGITALES PREMIUM • ENTREGA EN 3 MINUTOS'}
              </span>
            </div>

            {/* High-Impact Animated Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black text-white tracking-tight leading-[1.12]">
              {settings.heroTitlePrefix || 'ACCESO'}{' '}
              <span className="animate-gradient-text text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 via-cyan-300 to-pink-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.45)]">
                {settings.heroTitleHighlight || 'PREMIUM'}
              </span>{' '}
              {settings.heroTitleSuffix || 'al Mejor Precio'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {settings.heroDescription ||
                'Cuentas 100% privadas y renovables mes a mes con activación inmediata por WhatsApp, garantía de reposición total y soporte técnico 24/7 en Perú.'}
            </p>

            {/* Action Buttons & Trust Counter */}
            <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <button
                type="button"
                onClick={scrollToCatalog}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_24px_rgba(236,72,153,0.45)] hover:shadow-[0_0_32px_rgba(168,85,247,0.6)] transition-all duration-300 cursor-pointer active:scale-95"
              >
                <span>{settings.heroCtaText || 'Explorar Catálogo'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Compact Trust Score Badge (Rating en Perú) */}
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-purple-500/25 backdrop-blur-md">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="text-left leading-tight">
                  <span className="text-[11px] font-black text-white block">
                    {settings.heroRatingScore || '4.9 / 5.0'}
                  </span>
                  <span className="text-[9.5px] text-purple-300 font-bold block">
                    {settings.heroRatingText || '+15,000 Clientes en Perú'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Integrated + Vendidos Slider with Blurred Translucent Gradients */}
          <div className="lg:col-span-6 relative">
            {/* Header pill of the integrated showcase */}
            <div className="flex items-center justify-between gap-2 mb-2 px-1">
              <div className="flex items-center gap-1.5 text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-rose-400 font-black tracking-wider uppercase text-[11px]">
                  {settings.heroShowcaseTitle || '+ Vendidos en Perú (En Vivo)'}
                </span>
              </div>

              {/* Quick Navigation Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-9 h-9 min-h-[36px] rounded-lg border border-purple-500/30 bg-white/5 hover:bg-purple-900/40 text-slate-300 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  aria-label="Producto anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-9 h-9 min-h-[36px] rounded-lg border border-purple-500/30 bg-white/5 hover:bg-purple-900/40 text-slate-300 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  aria-label="Producto siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Translucent Blurred Slider Card with Diffused Edge Mask */}
            <div className="relative overflow-hidden rounded-3xl p-1 [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)]">
              {currentItem && (
                <div
                  onClick={() => handleBannerClick(currentItem)}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  onTouchStart={() => setIsPaused(true)}
                  onTouchEnd={() => setIsPaused(false)}
                  className={`relative overflow-hidden rounded-3xl bg-white/5 dark:bg-[#0c1224]/75 backdrop-blur-2xl border border-purple-500/35 hover:border-purple-400/60 shadow-[0_12px_40px_0_rgba(168,85,247,0.22)] p-5 sm:p-6 transition-all duration-300 cursor-pointer select-none group ${
                    clickedId === currentItem.id ? 'scale-[0.98]' : ''
                  }`}
                >
                  {/* Dynamic Translucent Gradient Ambient Glow inside card */}
                  <div
                    className="absolute -top-14 -right-14 w-60 h-60 opacity-30 rounded-full pointer-events-none blur-3xl transition-all duration-700"
                    style={{
                      background: `linear-gradient(135deg, ${settings.colorPrimary || '#ec4899'}, ${settings.colorAccent || '#8b5cf6'})`,
                    }}
                  />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentItem.id}
                      initial={{ opacity: 0, x: 25 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -25 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5"
                    >
                      {/* Left side: Rank, Details & Perks */}
                      <div className="flex-1 space-y-2.5 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                          {/* Rank Badge */}
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)] flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-white" />
                            <span>#{currentIndex + 1} {settings.heroCarouselRankBadge || 'Más Vendido'}</span>
                          </span>

                          {currentItem.tag && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/70 text-purple-300 border border-purple-500/30">
                              {currentItem.tag}
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-emerald-400" />
                            <span>{settings.heroCarouselInstantBadge || 'Inmediato'}</span>
                          </span>
                        </div>

                        <div>
                          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-purple-300 transition-colors">
                            {currentItem.name}
                          </h2>
                          <p className="text-xs text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                            {currentItem.desc}
                          </p>
                        </div>

                        {/* Perks */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                          <span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1 bg-white/5 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            {settings.heroCarouselGuaranteeText || 'Garantía 100%'}
                          </span>
                          <span className="text-[10.5px] font-bold text-amber-300 flex items-center gap-1 bg-white/5 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {getItemRating(currentItem, currentIndex)} ({getItemActivations(currentItem, currentIndex)})
                          </span>
                        </div>
                      </div>

                      {/* Right side: Icon, Price & CTA */}
                      <div className="shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-purple-500/30 backdrop-blur-xl space-y-2 min-w-[130px] sm:min-w-[145px]">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-purple-500/20 via-pink-500/15 to-transparent border border-purple-400/30 flex items-center justify-center p-2 relative group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                          {currentItem.imageUrl ? (
                            <img
                              src={currentItem.imageUrl}
                              alt={currentItem.name}
                              width={64}
                              height={64}
                              decoding="async"
                              className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                            />
                          ) : (
                            renderIcon(currentItem.icon)
                          )}
                        </div>

                        <div className="text-center">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                            {settings.heroCarouselFromText || 'Desde'}
                          </span>
                          <div className="text-lg font-black text-white leading-none">
                            {primaryPlan.price}
                          </div>
                          <span className="text-[9.5px] text-emerald-400 font-bold block mt-0.5">
                            {primaryPlan.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBannerClick(currentItem);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl font-black text-[11px] text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>{settings.heroCarouselCtaText || 'Obtener'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Progress Dots inside Banner */}
                  <div className="mt-3 pt-2.5 border-t border-purple-500/20 flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-400 text-[10px]">
                      {settings.heroCarouselHintText || 'Clic en el banner para adquirir al instante'}
                    </span>

                    <div className="flex items-center gap-1">
                      {bestSellers.map((prod, idx) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentIndex(idx);
                          }}
                          className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                            idx === currentIndex
                              ? 'w-5 bg-gradient-to-r from-pink-500 to-purple-600 shadow-[0_0_8px_rgba(236,72,153,0.7)]'
                              : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                          }`}
                          aria-label={`Ver ${prod.name}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
