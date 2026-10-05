import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
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
  Star,
  Zap,
  ShieldCheck,
  Check,
  Eye,
  Clock,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Product, ProductPlan, StoreSettings } from '../types';
import { getProductRating } from '../utils/productRatings';
import { getProductSpecs, productSupportsPin } from '../utils/productDetails';
import { getDurationOptions, DurationOption } from '../utils/durationPricing';

interface ProductCardProps {
  product: Product;
  settings: StoreSettings;
  onSelectProduct: (product: Product, selectedPlan: ProductPlan) => void;
  onQuickView: (product: Product, selectedPlan: ProductPlan) => void;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  settings,
  onSelectProduct,
  onQuickView,
  index = 0,
}) => {
  const [selectedDurationMonths, setSelectedDurationMonths] = useState<number>(1);
  const [isHovered, setIsHovered] = useState(false);

  const basePlan =
    product.plans && product.plans.length > 0
      ? product.plans[0]
      : { name: 'Estándar', price: 'S/ 25.00', desc: 'Plan Estándar' };

  const durationOptions = getDurationOptions(basePlan);
  const selectedDuration =
    durationOptions.find((d) => d.months === selectedDurationMonths) || durationOptions[0];

  const stockUnits = product.stock ?? 10;
  const isAvailable = product.available && stockUnits > 0;
  const ratingInfo = getProductRating(product);
  const hasPin = productSupportsPin(product, basePlan);
  const specs = getProductSpecs(product);

  // Active plan customized by duration
  const activePlan: ProductPlan = {
    name: `${basePlan.name} (${selectedDuration.label})`,
    price: selectedDuration.calculatedPrice,
    desc: `${selectedDuration.label} de servicio oficial con garantía`,
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickView(product, activePlan);
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectProduct(product, activePlan);
  };

  const renderIcon = (iconName?: string) => {
    const iconClass = 'w-6 h-6 sm:w-7 sm:h-7 text-indigo-500 group-hover:text-pink-500 transition-colors duration-300';
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.04, 0.25),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="h-full flex flex-col"
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative h-full flex flex-col justify-between rounded-2xl sm:rounded-3xl p-3 sm:p-4 transition-all duration-300 backdrop-blur-xl bg-white/95 dark:bg-[#0c101d]/95 border border-slate-200/90 dark:border-slate-800 hover:border-purple-500/60 shadow-sm hover:shadow-xl dark:hover:shadow-[0_12px_35px_rgba(168,85,247,0.18)] overflow-hidden"
        style={{
          boxShadow: isHovered
            ? `0 12px 35px -8px ${settings.colorPrimary || '#8b5cf6'}35, 0 0 20px -4px ${settings.colorAccent || '#ec4899'}20`
            : undefined,
          borderColor: isHovered ? (settings.colorPrimary || '#a855f7') : undefined,
        }}
      >
        {/* Ambient Top Glow Line on Hover */}
        <div
          className="absolute top-0 left-4 right-4 h-0.5 sm:h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, ${settings.colorPrimary || '#ec4899'}, ${settings.colorAccent || '#8b5cf6'})`,
          }}
        />

        {/* Top Badges Row */}
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
              {product.category === 'ai' ? 'IA & Pro' : 'Streaming 4K'}
            </span>

            {/* Stock Availability / Urgent Scarcity Badge (< 3 units) */}
            {isAvailable ? (
              stockUnits <= 3 ? (
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse ${
                    stockUnits === 1
                      ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.7)]'
                      : stockUnits === 2
                      ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.6)]'
                      : 'bg-amber-400 text-slate-950 font-black shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                  }`}
                >
                  <Flame className="w-2.5 h-2.5 fill-current shrink-0" />
                  <span>{stockUnits === 1 ? '¡Última unidad!' : `¡Últimas ${stockUnits} unid.!`}</span>
                </span>
              ) : (
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                    En Stock ({stockUnits})
                  </span>
                </div>
              )
            ) : (
              <span className="text-[9.5px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                Agotado
              </span>
            )}
          </div>

          {/* Product Center Image or High-Performance Cover Showcase */}
          <div className="relative my-1.5 sm:my-2 flex items-center justify-center">
            {product.coverImageUrl ? (
              <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 relative group-hover:border-purple-400/50 group-hover:shadow-[0_0_24px_rgba(168,85,247,0.25)] transition-all duration-300 bg-slate-900 shadow-xs">
                <img
                  src={product.coverImageUrl}
                  alt={product.name}
                  width={240}
                  height={150}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={handleQuickViewClick}
                  aria-label={`Ver detalles de ${product.name}`}
                  className="absolute inset-0 bg-black/45 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-0.5 text-white text-[10px] font-bold cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-cyan-300" />
                  <span className="leading-none text-[9.5px]">Detalles</span>
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-b from-purple-500/10 via-indigo-500/5 to-transparent border border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-2 relative group-hover:border-purple-400/50 group-hover:shadow-[0_0_24px_rgba(168,85,247,0.25)] transition-all duration-300">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    width={80}
                    height={80}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain filter drop-shadow-sm transform transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="transform transition-transform duration-300 group-hover:scale-110">
                    {renderIcon(product.icon)}
                  </div>
                )}

                {/* Quick View Floating Pill on Image */}
                <button
                  type="button"
                  onClick={handleQuickViewClick}
                  aria-label={`Ver detalles de ${product.name}`}
                  className="absolute inset-0 bg-black/45 backdrop-blur-xs rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-0.5 text-white text-[10px] font-bold cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-cyan-300" />
                  <span className="leading-none text-[9.5px]">Detalles</span>
                </button>
              </div>
            )}
          </div>

          {/* Product Title & Authentic Distinct Rating */}
          <div className="text-center mt-1.5">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors truncate">
              {product.name}
            </h3>

            {/* Distinct Star Ratings per Platform */}
            <div className="flex items-center justify-center gap-1 mt-0.5 mb-1.5 text-[10px] sm:text-[11px]">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < ratingInfo.starsCount
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-300 dark:fill-slate-700 text-slate-300 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="font-black text-slate-900 dark:text-white">
                {ratingInfo.formattedScore}
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[100px] sm:max-w-none">
                {ratingInfo.formattedCount}
              </span>
            </div>

            {/* Compact Perks Chips (PIN Propio ONLY if platform applies or configured accountType) */}
            <div className="flex flex-wrap items-center justify-center gap-1 my-1.5">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 text-purple-500" />
                &lt;3m
              </span>

              {product.accountType === 'cuenta_privada' ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                  Cuenta Privada
                </span>
              ) : product.accountType === 'perfil_compartido' ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 text-sky-500" />
                  Perfil Compartido
                </span>
              ) : product.accountType === 'cuenta_compartida' ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 text-indigo-500" />
                  Cuenta Compartida
                </span>
              ) : hasPin ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                  PIN Propio
                </span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5 text-cyan-500" />
                  100% Privado
                </span>
              )}

              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hidden xs:inline-flex">
                Garantía
              </span>
            </div>
          </div>

          {/* Interactive Duration Selector (1 Mes, 3 Meses, 6 Meses, 12 Meses) */}
          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>Tiempo:</span>
              </span>
              {selectedDuration.discountPercent > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  -{selectedDuration.discountPercent}% OFF
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1">
              {durationOptions.map((opt) => {
                const isSelected = opt.months === selectedDurationMonths;
                return (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDurationMonths(opt.months);
                    }}
                    aria-label={`Duración ${opt.label} para ${product.name}`}
                    className={`py-1 px-0.5 rounded-lg text-[9.5px] sm:text-[10px] font-extrabold border transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 dark:bg-purple-600 text-white border-purple-500 shadow-xs scale-102'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {opt.label.replace(' Meses', 'M').replace(' Mes', 'M')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pricing & Compact Actions */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block leading-none">
                Por {selectedDuration.label}:
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {selectedDuration.calculatedPrice}
              </span>
            </div>
            <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
              Activo
            </span>
          </div>

          {/* Action Buttons: Vista Rápida & Comprar */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleQuickViewClick}
              aria-label={`Ver detalles técnicos de ${product.name}`}
              className="min-h-[38px] px-2 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              <span className="truncate">Detalles</span>
            </button>

            <button
              type="button"
              onClick={handleBuyClick}
              disabled={!isAvailable}
              aria-label={`Comprar ${product.name} ${selectedDuration.label}`}
              className={`min-h-[38px] px-2 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                !isAvailable
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                  : stockUnits <= 3
                  ? stockUnits === 3
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-400/50 animate-pulse border border-amber-300'
                    : stockUnits === 2
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black shadow-lg shadow-rose-500/50 animate-pulse border border-rose-400/60'
                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black shadow-xl shadow-red-600/60 animate-pulse border border-red-500'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white hover:shadow-md'
              }`}
            >
              {stockUnits <= 3 && isAvailable ? (
                <Flame className={`w-3.5 h-3.5 shrink-0 ${stockUnits === 3 ? 'text-slate-950 fill-slate-950' : 'text-white fill-white'}`} />
              ) : (
                <Zap className="w-3.5 h-3.5 fill-white shrink-0" />
              )}
              <span className="truncate">
                {stockUnits <= 3 && isAvailable
                  ? stockUnits === 1
                    ? '¡Última disponible!'
                    : stockUnits === 2
                    ? '¡Solo quedan 2!'
                    : '¡Últimas 3 unid.!'
                  : 'Comprar'}
              </span>
              <ChevronRight className={`w-3 h-3 opacity-80 shrink-0 ${stockUnits === 3 ? 'text-slate-950' : 'text-white'}`} />
            </button>
          </div>
        </div>

        {/* Subtle Animated Slide-Up Panel on Hover (Zero Card Expansion) */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 p-3 sm:p-3.5 rounded-b-2xl sm:rounded-b-3xl bg-white/95 dark:bg-[#0c1122]/98 backdrop-blur-xl border-t border-purple-500/30 dark:border-purple-500/40 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between ${
            isHovered
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : 'translate-y-[102%] opacity-0 pointer-events-none'
          }`}
          style={{
            maxHeight: '84%',
          }}
        >
          <div className="space-y-1.5 overflow-hidden">
            {/* Drawer Grab Indicator & Category Spec */}
            <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-200/70 dark:border-slate-800">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
                Características Clave
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 truncate max-w-[100px]">
                {specs.resolution || 'Calidad Pro'}
              </span>
            </div>

            {/* Key specs bullet list */}
            <div className="space-y-1 text-[10.5px]">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold leading-tight">
                <Check className="w-3 h-3 text-emerald-500 shrink-0 stroke-[2.5]" />
                <span className="truncate">{hasPin ? 'Perfil privado con PIN' : specs.accountType}</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold leading-tight">
                <ShieldCheck className="w-3 h-3 text-sky-500 shrink-0" />
                <span className="truncate">{specs.renewal}</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold leading-tight">
                <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">Entrega en &lt;3 min por WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Quick Drawer Actions */}
          <div className="pt-2 mt-1 border-t border-slate-200/70 dark:border-slate-800 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleQuickViewClick}
              className="min-h-[32px] py-1 px-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Eye className="w-3 h-3 text-indigo-500" />
              <span>Ver Más</span>
            </button>
            <button
              type="button"
              onClick={handleBuyClick}
              className="min-h-[32px] py-1 px-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-black flex items-center justify-center gap-0.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <span>{selectedDuration.calculatedPrice}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
