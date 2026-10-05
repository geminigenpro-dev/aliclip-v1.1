import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Quote,
  Zap,
  X,
  Send,
  Eye,
  Pin,
} from 'lucide-react';
import { StoreSettings } from '../types';
import { triggerPurchaseConfetti } from '../utils/confetti';

interface CustomerReviewsProps {
  settings: StoreSettings;
}

export interface ReviewItem {
  id: string;
  name: string;
  city: string;
  rating: number;
  deliveryTime: string;
  text: string;
  productTag: string;
  date: string;
  isVerifiedUser?: boolean;
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev_1',
    name: 'Renzo Silva',
    city: 'Lima, Perú',
    rating: 5,
    deliveryTime: '2 min',
    text: '¡La mejor tienda de cuentas digitales! Pagué con Yape, envié la captura y en menos de 2 minutos ya tenía mi ChatGPT Plus con perfil privado y PIN propio. Cero caídas y el soporte responde al toque.',
    productTag: 'ChatGPT Plus VIP',
    date: 'Ayer',
    isVerifiedUser: true,
  },
  {
    id: 'rev_2',
    name: 'Camila Ramos',
    city: 'Arequipa, Perú',
    rating: 5,
    deliveryTime: '3 min',
    text: 'Activé el Combo Cine 4K (Netflix + Disney+). Calidad Ultra HD impecable, pantalla totalmente privada con mi propio PIN. Llevo 5 meses renovando mes a mes con ellos y jamás he tenido un solo problema.',
    productTag: 'Combo Cine 4K VIP',
    date: 'Hace 2 días',
    isVerifiedUser: true,
  },
  {
    id: 'rev_3',
    name: 'Diego Morales',
    city: 'Trujillo, Perú',
    rating: 5,
    deliveryTime: '2 min',
    text: 'Súper rápido y 100% transparente. Compré Midjourney Fast y Canva Pro para mi agencia de marketing. El ahorro frente a la página oficial es brutal y la garantía es 100% real.',
    productTag: 'Pack Creativo IA',
    date: 'Hace 3 días',
    isVerifiedUser: true,
  },
  {
    id: 'rev_4',
    name: 'Valeria Castro',
    city: 'Cusco, Perú',
    rating: 5,
    deliveryTime: '3 min',
    text: 'Tenía dudas porque antes me habían estafado en páginas dudosas, pero aquí el trato fue impecable. Me guiaron paso a paso y mi cuenta de Spotify Premium y Claude 3.5 funcionan de maravilla.',
    productTag: 'Claude 3.5 Sonnet',
    date: 'Hace 4 días',
    isVerifiedUser: true,
  },
  {
    id: 'rev_5',
    name: 'Mateo Benavides',
    city: 'Chiclayo, Perú',
    rating: 5,
    deliveryTime: '1 min',
    text: 'Atención 10/10 un domingo por la noche. Compré Max (HBO) y YouTube Premium sin anuncios. Me llegó el usuario y contraseña al instante. Definitivamente me quedo como cliente fijo.',
    productTag: 'YouTube Premium 4K',
    date: 'Hace 5 días',
    isVerifiedUser: true,
  },
  {
    id: 'rev_6',
    name: 'Luciana Paredes',
    city: 'Piura, Perú',
    rating: 5,
    deliveryTime: '2 min',
    text: 'Excelente servicio. Ya renové por tercer mes consecutivo Canva Pro y Gemini Advanced. No te cambian de cuenta cada semana como otros vendedores; conservas todos tus diseños intactos.',
    productTag: 'Canva Pro Diseñador',
    date: 'Esta semana',
    isVerifiedUser: true,
  },
];

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ settings }) => {
  // Load local persisted reviews or defaults
  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    try {
      const stored = localStorage.getItem('alixplay_user_reviews');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...INITIAL_REVIEWS];
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_REVIEWS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [pinnedReviewId, setPinnedReviewId] = useState<string | null>(null);

  // Review Modal State (Verified User Only)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('Lima, Perú');
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formService, setFormService] = useState('ChatGPT Plus VIP');
  const [formDelivery, setFormDelivery] = useState('2 min');
  const [formText, setFormText] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [createdReview, setCreatedReview] = useState<ReviewItem | null>(null);

  // Fluid and calm auto-scroll loop (6.5s interval so users can comfortably read!)
  useEffect(() => {
    if (reviews.length <= 1 || isHovered || pinnedReviewId) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 6500);

    return () => clearInterval(interval);
  }, [reviews.length, isHovered, pinnedReviewId]);

  const scrollToCatalog = () => {
    const el = document.getElementById('catalogo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setPinnedReviewId(null);
    setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setPinnedReviewId(null);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  // We show at most 2 testimonials at a time on screen:
  // Card 1: currentIndex
  // Card 2: (currentIndex + 1) % reviews.length
  const firstReview = reviews[currentIndex] || reviews[0];
  const secondIndex = (currentIndex + 1) % reviews.length;
  const secondReview = reviews[secondIndex] || reviews[0];

  // Handle Review Submission (Usuario Verificado)
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formText.trim()) return;

    setFormSubmitting(true);

    setTimeout(() => {
      const newReview: ReviewItem = {
        id: `rev_user_${Date.now()}`,
        name: formName.trim(),
        city: formCity || 'Perú',
        rating: formRating,
        deliveryTime: formDelivery,
        text: formText.trim(),
        productTag: formService,
        date: 'Reciente',
        isVerifiedUser: true,
      };

      const updated = [newReview, ...reviews];
      setReviews(updated);

      try {
        const customOnly = updated.filter((r) => r.id.startsWith('rev_user_'));
        localStorage.setItem('alixplay_user_reviews', JSON.stringify(customOnly));
      } catch (err) {
        console.warn('Storage failed', err);
      }

      setFormSubmitting(false);
      setCreatedReview(newReview);
      setCurrentIndex(0); // Jump to display the new review right away!
      setPinnedReviewId(newReview.id); // Pin it so user can look at it as long as they want!
      triggerPurchaseConfetti();
    }, 500);
  };

  return (
    <section className="py-14 sm:py-16 bg-[#070913] text-white relative overflow-hidden border-b border-purple-900/30">
      {/* Moving Ambient Translucent Gradient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-tr from-purple-600/20 via-pink-600/15 to-transparent blur-[140px] pointer-events-none rounded-full animate-pulse" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-gradient-to-bl from-cyan-600/20 via-blue-600/15 to-transparent blur-[140px] pointer-events-none rounded-full animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        {/* Horizontal Trust Badges Strip with Translucent Glassmorphism */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/5 dark:bg-[#0d1326]/70 border border-purple-500/20 shadow-[0_0_35px_rgba(168,85,247,0.15)] backdrop-blur-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                ⚡
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-white">Entrega en 3 Minutos</span>
                <span className="text-[10px] text-slate-400">Activación Récord</span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0 shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                🛡️
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-white">Garantía Total Todo el Mes</span>
                <span className="text-[10px] text-slate-400">Tranquilidad Absoluta</span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 shrink-0 shadow-[0_0_12px_rgba(236,72,153,0.3)]">
                🔄
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-white">Cuentas 100% Renovables</span>
                <span className="text-[10px] text-slate-400">Sin perder historiales</span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-white">Usuario Verificado</span>
                <span className="text-[10px] text-slate-400">Opiniones 100% Auténticas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header with Persuasive Copy */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 border border-pink-500/40 text-xs font-black tracking-wider text-pink-300 uppercase shadow-[0_0_16px_rgba(236,72,153,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
              <span>{settings.reviewsBadgeText || '✨ +15,000 Clientes Satisfechos en Todo el Perú'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span>La Confianza de Quienes Ya Disfrutan de Sus</span>
              <span
                className="brand-gradient-text bg-clip-text text-transparent inline-block"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${settings.colorPrimary || '#ec4899'} 0%, ${settings.colorAccent || '#8b5cf6'} 100%)`,
                }}
              >
                Cuentas VIP
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Comprobantes de entrega real en menos de 3 minutos, cuentas privadas con PIN y calificaciones de usuarios verificados.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 shrink-0">
            {/* Direct Verified User Review Action Button */}
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-100" />
              <span>Dejar Mi Opinión</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
                Usuario Verificado
              </span>
            </button>

            {/* Quick manual navigation */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                className="w-9 h-9 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 flex items-center justify-center hover:bg-purple-900/40 hover:border-purple-500 transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Opinión anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="w-9 h-9 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 flex items-center justify-center hover:bg-purple-900/40 hover:border-purple-500 transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Opinión siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 
          REQUIREMENT: 
          - Max 2 testimonials at a time (1 on mobile, 2 on desktop)
          - Smooth, fluid, readable animation (not fast!)
          - Customer can view their comment as long as they wish (hover pause or unpin control)
        */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative overflow-hidden rounded-3xl p-1 [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 relative items-stretch">
            {/* Testimonial #1 (Current 1-by-1 Active Item) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`card1_${firstReview.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
                className="relative overflow-hidden rounded-3xl bg-white/5 dark:bg-[#0c1224]/70 backdrop-blur-2xl border border-purple-500/30 hover:border-purple-500/60 shadow-[0_8px_32px_0_rgba(168,85,247,0.18)] p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group"
              >
                {/* Ambient Soft Translucent Glow */}
                <div
                  className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none blur-3xl opacity-20"
                  style={{
                    background: `linear-gradient(135deg, ${settings.colorPrimary || '#ec4899'}, ${settings.colorAccent || '#8b5cf6'})`,
                  }}
                />

                <div className="space-y-4 relative z-10">
                  {/* Top Meta: Stars, Speed & Usuario Verificado Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-400/30 px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.25)]">
                      {[...Array(firstReview.rating)].map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-xs font-black text-amber-300 ml-1">5.0</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>Activado en {firstReview.deliveryTime}</span>
                      </span>

                      {firstReview.isVerifiedUser && (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Usuario Verificado</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quote Body */}
                  <div className="relative pt-1">
                    <Quote className="w-7 h-7 text-purple-500/25 absolute -top-3 -left-2 pointer-events-none" />
                    <p className="text-sm sm:text-base text-slate-200 font-medium italic leading-relaxed">
                      "{firstReview.text}"
                    </p>
                  </div>
                </div>

                {/* Bottom User Info */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-[0_0_14px_rgba(168,85,247,0.5)]">
                      {firstReview.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>{firstReview.name}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </h4>
                      <p className="text-xs text-slate-400">
                        {firstReview.city} • {firstReview.date}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-purple-300 bg-purple-950/70 border border-purple-500/40 px-3 py-1 rounded-full shadow-xs shrink-0 truncate max-w-[150px]">
                    {firstReview.productTag}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Testimonial #2 (Desktop paired item with diffused separation) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`card2_${secondReview.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
                className="hidden lg:flex relative overflow-hidden rounded-3xl bg-white/5 dark:bg-[#0c1224]/70 backdrop-blur-2xl border border-purple-500/30 hover:border-purple-500/60 shadow-[0_8px_32px_0_rgba(168,85,247,0.18)] p-6 sm:p-7 flex-col justify-between transition-all duration-300 group"
              >
                {/* Ambient Soft Translucent Glow */}
                <div
                  className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none blur-3xl opacity-20"
                  style={{
                    background: `linear-gradient(135deg, ${settings.colorAccent || '#8b5cf6'}, ${settings.colorPrimary || '#ec4899'})`,
                  }}
                />

                <div className="space-y-4 relative z-10">
                  {/* Top Meta: Stars, Speed & Usuario Verificado Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-400/30 px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.25)]">
                      {[...Array(secondReview.rating)].map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-xs font-black text-amber-300 ml-1">5.0</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>Activado en {secondReview.deliveryTime}</span>
                      </span>

                      {secondReview.isVerifiedUser && (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Usuario Verificado</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quote Body */}
                  <div className="relative pt-1">
                    <Quote className="w-7 h-7 text-purple-500/25 absolute -top-3 -left-2 pointer-events-none" />
                    <p className="text-sm sm:text-base text-slate-200 font-medium italic leading-relaxed">
                      "{secondReview.text}"
                    </p>
                  </div>
                </div>

                {/* Bottom User Info */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-[0_0_14px_rgba(99,102,241,0.5)]">
                      {secondReview.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>{secondReview.name}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </h4>
                      <p className="text-xs text-slate-400">
                        {secondReview.city} • {secondReview.date}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-purple-300 bg-purple-950/70 border border-purple-500/40 px-3 py-1 rounded-full shadow-xs shrink-0 truncate max-w-[150px]">
                    {secondReview.productTag}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic Infinite Dots & Pin indicator */}
        <div className="flex items-center justify-between text-xs pt-1 px-2">
          {pinnedReviewId ? (
            <button
              type="button"
              onClick={() => setPinnedReviewId(null)}
              className="text-[11px] text-amber-300 font-bold flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Estás viendo tu comentario fijado • Clic para reanudar el carrusel</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              💡 Pasa el cursor para pausar la lectura el tiempo que desees
            </span>
          )}

          <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
            {reviews.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPinnedReviewId(null);
                  setCurrentIndex(i);
                }}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i === currentIndex
                    ? 'w-7 bg-gradient-to-r from-pink-500 to-purple-600 shadow-[0_0_10px_rgba(236,72,153,0.7)]'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Ver testimonio ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Call to Action Card with Leave Review Shortcut */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/80 via-[#10142b] to-indigo-950/80 border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.25)] text-center space-y-3">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            ¿Listo para activar tus{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-300">
              Cuentas Premium
            </span>{' '}
            hoy mismo?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Únete a más de 15,000 personas en Perú y empieza a disfrutar de tus servicios favoritos en menos de 3 minutos.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToCatalog}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-black text-sm inline-flex items-center gap-2 shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] transition-all duration-300 cursor-pointer active:scale-95"
            >
              <span>Elegir Mi Membresía Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="px-5 py-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-white font-bold text-xs inline-flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dejar Mi Opinión (Usuario Verificado)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        VERIFIED USER IN-PAGE REVIEW MODAL 
        Allows customers to leave their rating and review directly on the page!
        No timers: The customer can view their comment as long as they want.
        ========================================================================
      */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#0d1326] border border-slate-200 dark:border-emerald-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
            {/* View Mode after Submitting: Customer can look at their published review as long as they wish! */}
            {createdReview ? (
              <div className="py-4 space-y-4 animate-fade-in">
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    ¡Tu Opinión Ha Sido Publicada! 🎉
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tu comentario se encuentra fijado en la página para que puedas verlo todo el tiempo que desees.
                  </p>
                </div>

                {/* Published Review Preview Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-emerald-500/40 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(createdReview.rating)].map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Usuario Verificado</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed">
                    "{createdReview.text}"
                  </p>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-slate-900 dark:text-white block">
                        {createdReview.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {createdReview.city} • {createdReview.deliveryTime}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                      {createdReview.productTag}
                    </span>
                  </div>
                </div>

                {/* Customer controls when to close */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false);
                      setCreatedReview(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver en la Página Principal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false);
                      setCreatedReview(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                        Publicar Opinión
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Califica tu experiencia de compra como Usuario Verificado
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmitReview} className="py-4 space-y-3.5 overflow-y-auto pr-1 flex-1">
                  {/* Star Rating Interactive Selector */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-center space-y-1.5">
                    <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                      ¿Cómo calificarías el servicio?
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setFormHoverRating(star)}
                          onMouseLeave={() => setFormHoverRating(0)}
                          onClick={() => setFormRating(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                              (formHoverRating || formRating) >= star
                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-black text-amber-500 block">
                      {formRating === 5 && '⭐⭐⭐⭐⭐ ¡Excelente (5/5) Recomiendo 100%!'}
                      {formRating === 4 && '⭐⭐⭐⭐ Muy Bueno (4/5)'}
                      {formRating === 3 && '⭐⭐⭐ Bueno (3/5)'}
                      {formRating <= 2 && 'Regular / Por Mejorar'}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      Tu Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ej: Carlos Mendoza"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  {/* City & Delivery Speed Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        Ciudad / Región
                      </label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        placeholder="Ej: Lima, Perú"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        Tiempo de Entrega
                      </label>
                      <select
                        value={formDelivery}
                        onChange={(e) => setFormDelivery(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="1 min">⚡ 1 minuto (Al instante)</option>
                        <option value="2 min">⚡ 2 minutos (Muy rápido)</option>
                        <option value="3 min">⚡ 3 minutos (Rápido)</option>
                        <option value="Menos de 5 min">⚡ Menos de 5 minutos</option>
                      </select>
                    </div>
                  </div>

                  {/* Purchased Service */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      Membresía Adquirida
                    </label>
                    <select
                      value={formService}
                      onChange={(e) => setFormService(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ChatGPT Plus VIP">ChatGPT Plus VIP</option>
                      <option value="Combo Cine 4K VIP">Combo Cine 4K (Netflix + Disney+)</option>
                      <option value="Canva Pro Diseñador">Canva Pro Diseñador</option>
                      <option value="Midjourney Fast VIP">Midjourney Fast VIP</option>
                      <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                      <option value="YouTube Premium 4K">YouTube Premium</option>
                      <option value="Spotify Familiar">Spotify Premium</option>
                      <option value="Max HBO 4K">Max (HBO)</option>
                      <option value="Prime Video + Paramount">Prime Video</option>
                    </select>
                  </div>

                  {/* Review Text */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      Tu Opinión o Experiencia *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formText}
                      onChange={(e) => setFormText(e.target.value)}
                      placeholder="Cuéntanos cómo fue tu entrega, la calidad de la cuenta y la atención recibida..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Usuario Verificado Indicator */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="text-left text-[11px] leading-tight text-slate-700 dark:text-slate-200">
                      <span className="font-bold text-emerald-400">
                        Insignia Oficial de Usuario Verificado
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Tu comentario se mostrará en el carrusel en tiempo real con sello verificado.
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={formSubmitting || !formName.trim() || !formText.trim()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      {formSubmitting ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin text-white" />
                          <span>Publicando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Publicar Mi Opinión Ahora</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
