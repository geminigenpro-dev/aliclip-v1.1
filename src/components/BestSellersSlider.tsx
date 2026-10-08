import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  Sparkles,
  ArrowRight,
  Star,
  Zap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
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
import { Product, ProductPlan, StoreSettings } from '../types';
import { getProductRating } from '../utils/productRatings';

interface BestSellersSliderProps {
  products: Product[];
  settings: StoreSettings;
  onSelectProduct: (product: Product, plan: ProductPlan) => void;
}

export const BestSellersSlider: React.FC<BestSellersSliderProps> = ({
  products,
  settings,
  onSelectProduct,
}) => {
  // Filter and prioritize top "+ Vendidos" products
  const bestSellers = React.useMemo(() => {
    if (!products || products.length === 0) return [];

    // Prioritize products explicitly tagged with top sales, flash or best seller
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

    // If we have at least 3, use them; otherwise use first 6 available products
    const selected = tagged.length >= 3 ? tagged : products;
    return selected.slice(0, 8);
  }, [products]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [clickedId, setClickedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Infinite fast and fluid auto-scroll loop
  useEffect(() => {
    if (bestSellers.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bestSellers.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [bestSellers.length]);

  if (bestSellers.length === 0) return null;

  const handleBannerClick = (product: Product) => {
    setClickedId(product.id);

    const defaultPlan = (product.plans && product.plans[0]) || {
      name: 'Estándar',
      price: 'S/ 25.00',
      desc: 'Plan Estándar',
    };

    setTimeout(() => {
      onSelectProduct(product, defaultPlan);
      setClickedId(null);
    }, 180);
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
    const iconClass = 'w-7 h-7 sm:w-8 sm:h-8 text-purple-600 dark:text-indigo-400';
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

  return (
    <section className="relative py-6 sm:py-8 overflow-hidden">
      {/* Dynamic Ambient Background Glow Elements (Diffused Translucent Gradients) */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-pink-500/20 via-purple-500/15 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-gradient-to-bl from-cyan-500/20 via-blue-500/15 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <Flame className="w-3.5 h-3.5 fill-rose-500 animate-pulse text-rose-500" />
              <span>Los Más Solicitados en Perú</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>+ Vendidos</span>
              <span
                className="brand-gradient-text bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${settings.colorPrimary || '#ec4899'} 0%, ${settings.colorAccent || '#8b5cf6'} 100%)`,
                }}
              >
                VIP
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Membresías con entrega récord en menos de 3 minutos y garantía oficial permanente.
            </p>
          </div>

          {/* Slider Quick Navigation Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handlePrev}
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Translucent Blurred Slider Container with Diffused Edge Mask */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-3xl p-1 [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]"
        >
          {/* Main Translucent Hero Slide Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-white/40 dark:bg-[#0c1122]/60 backdrop-blur-2xl border border-white/60 dark:border-purple-500/20 shadow-2xl transition-all duration-500">
            {/* Ambient dynamic background gradient that shifts with the active item */}
            <div
              className="absolute inset-0 opacity-25 dark:opacity-30 pointer-events-none transition-all duration-700 blur-2xl"
              style={{
                background: `radial-gradient(circle at 70% 50%, ${settings.colorPrimary || '#ec4899'} 0%, ${settings.colorAccent || '#8b5cf6'} 50%, transparent 100%)`,
              }}
            />

            {/* Slider Content Wrapper */}
            <div className="relative p-5 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
              {bestSellers.map((item, idx) => {
                const isActive = idx === currentIndex;
                if (!isActive) return null;

                const primaryPlan = (item.plans && item.plans[0]) || {
                  name: 'Estándar',
                  price: 'S/ 25.00',
                  desc: 'Plan Estándar',
                };

                const isThisClicked = clickedId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => handleBannerClick(item)}
                    className={`w-full flex flex-col lg:flex-row items-center justify-between gap-6 cursor-pointer select-none group ${
                      isThisClicked ? 'scale-[0.98]' : ''
                    }`}
                  >
                    {/* Left: Product Rank + Identity + Perks */}
                    <div className="flex-1 space-y-3.5 text-center lg:text-left">
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                        {/* Rank Badge */}
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 fill-white" />
                          <span>#{idx + 1} Más Vendido</span>
                        </span>

                        {/* Tag Badge */}
                        {item.tag && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/70 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 backdrop-blur-md">
                            {item.tag}
                          </span>
                        )}

                        <span className="px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-600/40 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-500" />
                          <span>Entrega Inmediata</span>
                        </span>
                      </div>

                      <div>
                        <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      {/* Ratings + Verified Buyer Count */}
                      <div className="flex items-center justify-center lg:justify-start gap-2 text-xs">
                        <div className="flex items-center text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="font-black text-slate-800 dark:text-slate-200">
                          {getProductRating(item).formattedScore} / 5.0
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          • {getProductRating(item).reviewCount} opiniones verificadas
                        </span>
                      </div>

                      {/* Benefit Highlights */}
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          Garantía de Reemplazo 100%
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          Activación en 3 Minutos por WhatsApp
                        </span>
                      </div>
                    </div>

                    {/* Right: HD Showcase + Dynamic Glowing Buy CTA */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-4 shrink-0 p-3 sm:p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-purple-900/40 backdrop-blur-xl shadow-lg">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-tr from-purple-500/20 via-pink-500/10 to-transparent border border-purple-300/40 dark:border-purple-600/40 flex items-center justify-center p-3 relative group-hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
                          />
                        ) : (
                          renderIcon(item.icon)
                        )}
                        <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-md">
                          Top #1
                        </span>
                      </div>

                      <div className="text-center sm:text-left lg:text-center space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Precio Preferencial
                        </span>
                        <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                          {primaryPlan.price}
                        </div>
                        <span className="text-[10px] text-emerald-500 font-bold block">
                          Plan: {primaryPlan.name}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBannerClick(item);
                        }}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:shadow-[0_0_35px_rgba(168,85,247,0.8)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Obtener Ahora</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Slider Bottom Progress Track & Interactive Dots */}
            <div className="px-6 pb-4 pt-1 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/60 text-xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Membresías con activación en tiempo récord • Clic para ordenar</span>
              </span>

              {/* Dots indicator */}
              <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
                {bestSellers.map((prod, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'w-6 bg-gradient-to-r from-pink-500 to-purple-600 shadow-[0_0_8px_rgba(236,72,153,0.7)]'
                          : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                      }`}
                      aria-label={`Ver ${prod.name}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
