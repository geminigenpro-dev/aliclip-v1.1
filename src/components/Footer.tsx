import React from 'react';
import {
  MessageCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  BookOpen,
  Lock,
  ExternalLink,
  Code,
  Sun,
  Moon,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { StoreSettings, PaymentMethod } from '../types';
import { DEFAULT_PAYMENT_METHODS } from '../services/storeService';
import { PaymentMethodLogo } from './PaymentMethodLogo';

interface FooterProps {
  settings: StoreSettings;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenTerms: () => void;
  onOpenClaims: () => void;
  onOpenAdminAuth?: () => void;
  onFilterCategory?: (cat: 'all' | 'ai' | 'streaming') => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  theme,
  onToggleTheme,
  onOpenTerms,
  onOpenClaims,
  onOpenAdminAuth,
}) => {
  const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    `¡Hola ${settings.name}${settings.suffix}! 👋 Quisiera hacer una consulta sobre las cuentas disponibles.`
  )}`;

  // Payment methods configured in store settings or defaults
  const visiblePaymentMethods: PaymentMethod[] = (
    settings.paymentMethods && settings.paymentMethods.length > 0
      ? settings.paymentMethods
      : DEFAULT_PAYMENT_METHODS
  ).filter((m) => m.enabled !== false);

  return (
    <footer className="bg-slate-100/90 dark:bg-[#060812] border-t border-slate-200/90 dark:border-slate-800/90 transition-colors duration-200 text-slate-700 dark:text-slate-300">
      {/* Main Footer Container with bottom clearance for floating actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-28 sm:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {/* Col 1: Marca & Atención Oficial */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 flex items-center justify-center text-white shadow-xs overflow-hidden ${
                  settings.brandLogoShape === 'circle'
                    ? 'rounded-full'
                    : settings.brandLogoShape === 'square'
                    ? 'rounded-md'
                    : 'rounded-xl'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${settings.colorPrimary || '#8b5cf6'} 0%, ${
                    settings.colorAccent || '#06b6d4'
                  } 100%)`,
                }}
              >
                {settings.faviconBase64 ? (
                  <img
                    src={settings.faviconBase64}
                    alt={settings.name}
                    width={20}
                    height={20}
                    loading="lazy"
                    decoding="async"
                    className="w-5 h-5 object-contain"
                  />
                ) : (
                  <Sparkles className="w-4 h-4 text-white" />
                )}
              </div>

              <span
                className="text-lg tracking-tight text-slate-900 dark:text-white transition-all leading-none"
                style={{
                  fontFamily: settings.brandFont ? `"${settings.brandFont}", system-ui, sans-serif` : undefined,
                  fontWeight: settings.brandFontWeight || '900',
                  letterSpacing: settings.brandLetterSpacing || '-0.025em',
                }}
              >
                {settings.name}
                <span
                  className="brand-gradient-text bg-clip-text text-transparent inline-block ml-0.5"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${settings.colorPrimary || '#8b5cf6'} 0%, ${
                      settings.colorAccent || '#06b6d4'
                    } 100%)`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                  }}
                >
                  {settings.suffix}
                </span>
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              Tu tienda digital de confianza para membresías de Inteligencia Artificial y Streaming en Perú. Entrega ágil y garantía total certificada.
            </p>

            {/* Direct WhatsApp Action & Availability */}
            <div className="space-y-2 pt-1">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Contactar por WhatsApp a ${settings.whatsappDisplay}`}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all shadow-xs group"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp: {settings.whatsappDisplay}</span>
              </a>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>Atención: Lunes a Domingo, 8:00 AM - 11:30 PM</span>
              </div>
            </div>
          </div>

          {/* Col 2: Seguridad, Respaldo & Legal */}
          <div className="space-y-3.5">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Garantía &amp; Confianza</span>
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Garantía Oficial AliClip</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  Reemplazo y soporte técnico directo durante todo el período de suscripción adquirido.
                </p>
              </div>

              {/* Legal interactive links */}
              <div className="space-y-1 pt-0.5">
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="w-full text-left text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-2 py-1 transition-colors cursor-pointer group"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Términos del Servicio y Garantía</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenClaims}
                  className="w-full text-left text-xs text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold flex items-center gap-2 py-1 transition-colors cursor-pointer group"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Libro de Reclamaciones (INDECOPI)</span>
                </button>

                <a
                  href="#faq"
                  className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold py-1 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>Preguntas Frecuentes</span>
                </a>
              </div>

              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Transacciones seguras y validadas al instante</span>
              </div>
            </div>
          </div>

          {/* Col 3: Métodos de Pago Disponibles */}
          <div className="space-y-3.5">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <span>Métodos de Pago</span>
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Aceptamos transferencias inmediatas sin comisiones ocultas para tu comodidad:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {visiblePaymentMethods.map((m) => (
                <div
                  key={m.id}
                  title={m.name}
                  className="h-11 px-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-center group overflow-hidden"
                >
                  <PaymentMethodLogo method={m} className="max-h-6.5 max-w-full object-contain" />
                </div>
              ))}
            </div>

            <div className="pt-1">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
                Validación de comprobante en menos de 2 minutos vía WhatsApp.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="mt-10 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-center sm:text-left space-y-0.5">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              © 2026 Aliclip. Todos los derechos reservados.
            </p>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
              Digital Store • Hecho con ❤️ Lima-Perú
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Developer link */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Desarrollado por:</span>
              <a
                href={settings.creatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10.5px] hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <Code className="w-3 h-3 text-indigo-500" />
                <span>{settings.creatorHandle}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            </div>

            {/* Dark / Light Toggle */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="p-2 rounded-xl bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )}
              </button>
            )}

            {/* Discreet Admin Lock */}
            {onOpenAdminAuth && (
              <button
                type="button"
                onClick={onOpenAdminAuth}
                aria-label="Acceso administrativo AliClip"
                title="Panel de Administración"
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-all cursor-pointer opacity-70 hover:opacity-100 flex items-center gap-1.5 border border-slate-300/40 dark:border-slate-700/60"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
