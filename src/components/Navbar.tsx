import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  X,
  SlidersHorizontal,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Sun,
  Moon,
  Grid,
  Flame,
  CreditCard,
  HelpCircle,
  Menu,
} from 'lucide-react';
import { StoreSettings } from '../types';

interface NavbarProps {
  settings: StoreSettings;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isAdmin: boolean;
  adminUsername: string;
  onOpenAdmin: () => void;
  onLogoutAdmin: () => void;
  onOpenTerms: () => void;
  onBrandClick: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  searchQuery,
  onSearchChange,
  isAdmin,
  adminUsername,
  onOpenAdmin,
  onLogoutAdmin,
  onOpenTerms,
  onBrandClick,
  theme = 'light',
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDark = theme === 'dark';
  const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    `Hola ${settings.name}${settings.suffix}, deseo consultar por una membresía`
  )}`;

  return (
    <>
      {/* Top Announcement Bar */}
      <div
        className="text-white text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 font-medium flex items-center justify-between shadow-sm z-50 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${settings.colorPrimary} 0%, #3730a3 50%, ${settings.colorAccent} 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
              ⚡ Entrega en 3 min
            </span>
            <span className="truncate font-semibold">{settings.announcement}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[11px]">
            <span className="hidden md:inline-flex items-center gap-1 opacity-90">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Pagos con Yape, Plin y Binance
            </span>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Contactar por WhatsApp al ${settings.whatsappDisplay}`}
              className="font-bold underline hover:text-cyan-200 transition-colors flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{settings.whatsappDisplay}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-4 lg:gap-6">
            {/* Logo */}
            <button
              type="button"
              onClick={onBrandClick}
              aria-label={`Inicio de ${settings.name}${settings.suffix}`}
              className="flex items-center gap-2.5 shrink-0 group select-none cursor-pointer outline-none focus:outline-none focus:ring-0 text-left bg-transparent border-none p-0"
            >
              <div
                className={`w-9 h-9 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-all overflow-hidden ${
                  settings.brandLogoShape === 'circle'
                    ? 'rounded-full'
                    : settings.brandLogoShape === 'square'
                    ? 'rounded-md'
                    : 'rounded-xl'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${settings.colorPrimary} 0%, ${settings.colorAccent} 100%)`,
                  boxShadow: settings.brandLogoGlow ? `0 0 16px ${settings.colorPrimary}80` : undefined,
                }}
              >
                {settings.logoBase64 ? (
                  <img src={settings.logoBase64} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className="text-xl tracking-tight text-slate-900 dark:text-white leading-none transition-colors"
                  style={{
                    fontFamily: settings.brandFont ? `"${settings.brandFont}", system-ui, sans-serif` : undefined,
                    fontWeight: settings.brandFontWeight || '900',
                    letterSpacing: settings.brandLetterSpacing || '-0.025em',
                    textTransform: settings.brandTextTransform || 'normal',
                  }}
                >
                  {settings.name}
                  <span
                    className="brand-gradient-text bg-clip-text text-transparent inline-block"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${settings.colorPrimary} 0%, ${settings.colorAccent} 100%)`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                    }}
                  >
                    {settings.suffix}
                  </span>
                </span>
                <span className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                  {settings.subtitle}
                </span>
              </div>
            </button>

            {/* Desktop Search Bar */}
            <div className="flex-1 max-w-xs xl:max-w-sm hidden md:block">
              <div className="relative group">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar servicio (ej. ChatGPT, Netflix...)"
                  className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
                {searchQuery ? (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="hidden xl:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-700/60 rounded pointer-events-none">
                    /
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Compact Navigation Dock (Desktop) */}
            <nav className="hidden lg:flex items-center p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md shadow-2xs">
              <a
                href="#mas-vendidos"
                className="px-2.5 py-1.5 rounded-xl text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
              >
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                <span>+ Vendidos</span>
              </a>

              <a
                href="#catalogo"
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
              >
                <Grid className="w-3.5 h-3.5 text-indigo-500" />
                <span>Catálogo</span>
              </a>

              <a
                href="#pagos"
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                <span>Pagos</span>
              </a>

              <button
                type="button"
                onClick={onOpenTerms}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-700/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Garantía</span>
              </button>

              <a
                href="#faq"
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-700/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
              >
                <HelpCircle className="w-3.5 h-3.5 text-sky-500" />
                <span>FAQ</span>
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Dark Mode Theme Toggle Button */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  title={isDark ? 'Modo Oscuro Activo • Clic para Modo Claro' : 'Modo Claro Activo • Clic para Modo Oscuro'}
                  className="p-2 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-90 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-amber-400 dark:border-slate-700 shadow-2xs hover:shadow-sm"
                  style={{
                    boxShadow: isDark ? '0 0 12px rgba(245, 158, 11, 0.25)' : undefined,
                  }}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400 rotate-0 transition-transform duration-500 hover:rotate-90" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-700 rotate-0 transition-transform duration-500 hover:-rotate-45" />
                  )}
                </button>
              )}

              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={onOpenAdmin}
                    className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="hidden sm:inline">Panel Admin</span>
                    <span className="px-1.5 py-0.5 text-[9px] rounded bg-indigo-600 text-white font-bold leading-none">
                      {adminUsername || 'Admin'}
                    </span>
                  </button>
                  <button
                    onClick={onLogoutAdmin}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold flex items-center transition-colors cursor-pointer"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Comprar membresía por WhatsApp al ${settings.whatsappDisplay}`}
                className="min-h-[40px] px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:shadow transition-all active:scale-95 shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden xs:inline">WhatsApp</span>
              </a>

              {/* Dynamic Mobile & Tablet Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
                aria-expanded={mobileMenuOpen}
                className={`lg:hidden p-2 rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-90 ${
                  mobileMenuOpen
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 dark:border-slate-700'
                }`}
              >
                {mobileMenuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar (always accessible on small screens) */}
          <div className="pb-2.5 md:hidden">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar ChatGPT, Netflix, Canva, Max..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Mobile & Tablet Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-[#0b0f19]/98 backdrop-blur-xl px-3 sm:px-6 py-3.5 animate-in slide-in-from-top-2 fade-in duration-200 shadow-xl transition-colors">
            <div className="max-w-7xl mx-auto space-y-3">
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                <span>Navegación Rápida</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En línea
                </span>
              </div>

              {/* Grid of Navigation Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="#mas-vendidos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/50 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Flame className="w-4 h-4 fill-rose-500 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-rose-700 dark:text-rose-300">+ Vendidos VIP</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Las membresías top en demanda</div>
                  </div>
                </a>

                <a
                  href="#catalogo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800/80 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Grid className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Catálogo Completo</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">IA, streaming y servicios digitales</div>
                  </div>
                </a>

                <a
                  href="#pagos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 hover:border-emerald-200 dark:hover:border-emerald-800/80 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Métodos de Pago</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Yape, Plin, Binance y bancos</div>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTerms();
                  }}
                  className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-amber-50/80 dark:hover:bg-amber-950/40 hover:border-amber-200 dark:hover:border-amber-800/80 transition-all group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Garantía & Términos</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Reemplazo 100% garantizado</div>
                  </div>
                </button>

                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-sky-50/80 dark:hover:bg-sky-950/40 hover:border-sky-200 dark:hover:border-sky-800/80 transition-all sm:col-span-2 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Preguntas Frecuentes (FAQ)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Dudas sobre activación, cuentas y soporte</div>
                  </div>
                </a>
              </div>

              {/* Mobile Footer Links in Drawer */}
              <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate pr-2">
                  ⚡ {settings.announcement}
                </span>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1 shrink-0 hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{settings.whatsappDisplay}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

