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
import { StoreSettings, Product, ProductPlan } from '../types';

interface HeroProps {
  settings: StoreSettings;
  products?: Product[];
  onSelectProduct?: (product: Product, plan: ProductPlan) => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  products = [],
  onSelectProduct,
}) => {
  // Filter top "+ Vendidos" products for the integrated dynamic hero slider
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
    return selected.slice(0, 8);
  }, [products]);

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
                            <span>#{currentIndex + 1} Más Vendido</span>
                          </span>

                          {currentItem.tag && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/70 text-purple-300 border border-purple-500/30">
                              {currentItem.tag}
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Inmediato</span>
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
                            Garantía 100%
                          </span>
                          <span className="text-[10.5px] font-bold text-amber-300 flex items-center gap-1 bg-white/5 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            4.9 (2,400+ activaciones)
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
                            Desde
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
                          <span>Obtener</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Progress Dots inside Banner */}
                  <div className="mt-3 pt-2.5 border-t border-purple-500/20 flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-400 text-[10px]">
                      Clic en el banner para adquirir al instante
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

        {/* Integrated Quick-Click Best Sellers Strip across the Bottom of Hero */}
        {bestSellers.length > 0 && (
          <div className="pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {bestSellers.map((item, idx) => {
                const isActive = idx === currentIndex;
                const plan = (item.plans && item.plans[0]) || { price: 'S/ 25.00' };

                return (
                  <div
                    key={item.id}
                    onClick={() => handleBannerClick(item)}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all duration-300 select-none flex items-center gap-2 backdrop-blur-md ${
                      isActive
                        ? 'bg-purple-500/20 border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/50'
                        : 'bg-white/5 border-purple-900/30 hover:border-purple-500/50 hover:bg-purple-950/30'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-900/80 flex items-center justify-center shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          width={28}
                          height={28}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        renderIcon(item.icon)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10.5px] font-black text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-[9.5px] font-extrabold text-purple-300">
                        {plan.price}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
