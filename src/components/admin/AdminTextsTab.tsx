import React, { useState } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Sparkles,
  Search,
  MessageCircle,
  Flame,
  Zap,
  ShoppingBag,
  CreditCard,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StoreSettings, FaqItemSetting, BenefitsTickerItemSetting } from '../../types';
import { DEFAULT_FAQ_ITEMS, DEFAULT_TICKER_ITEMS, saveSettingsToFirestore } from '../../services/storeService';

interface AdminTextsTabProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onToast: (msg: string) => void;
}

export const AdminTextsTab: React.FC<AdminTextsTabProps> = ({
  settings,
  onUpdateSettings,
  onToast,
}) => {
  const [localSettings, setLocalSettings] = useState<StoreSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hero: true,
    navbar: false,
    ticker: false,
    catalog: false,
    process: false,
    payments: false,
    reviews: false,
    faq: false,
    footer: false,
    terms: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    Object.keys(expandedSections).forEach((k) => (all[k] = true));
    setExpandedSections(all);
  };

  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    Object.keys(expandedSections).forEach((k) => (all[k] = false));
    setExpandedSections(all);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettingsToFirestore(localSettings);
      onUpdateSettings(localSettings);
      onToast('¡Todos los textos de la web se han guardado y actualizado con éxito!');
    } catch (err: any) {
      console.error('Error saving texts:', err);
      onToast(err?.message || 'Error al guardar los textos.');
    } finally {
      setSaving(false);
    }
  };

  // FAQ management
  const faqList: FaqItemSetting[] = localSettings.faqItems && localSettings.faqItems.length > 0
    ? localSettings.faqItems
    : DEFAULT_FAQ_ITEMS;

  const handleUpdateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqList];
    updated[index] = { ...updated[index], [field]: value };
    setLocalSettings({ ...localSettings, faqItems: updated });
  };

  const handleAddFaq = () => {
    const updated = [
      ...faqList,
      { question: 'Nueva Pregunta Frecuente', answer: 'Escribe aquí la respuesta clara y detallada.' },
    ];
    setLocalSettings({ ...localSettings, faqItems: updated });
  };

  const handleRemoveFaq = (index: number) => {
    if (faqList.length <= 1) {
      onToast('Debes mantener al menos una pregunta frecuente.');
      return;
    }
    const updated = faqList.filter((_, i) => i !== index);
    setLocalSettings({ ...localSettings, faqItems: updated });
  };

  const handleResetFaqs = () => {
    setLocalSettings({ ...localSettings, faqItems: DEFAULT_FAQ_ITEMS });
    onToast('Preguntas frecuentes restablecidas a los valores originales.');
  };

  // Ticker management
  const tickerList: BenefitsTickerItemSetting[] = localSettings.tickerItems && localSettings.tickerItems.length > 0
    ? localSettings.tickerItems
    : DEFAULT_TICKER_ITEMS;

  const handleUpdateTicker = (index: number, field: 'text' | 'sub', value: string) => {
    const updated = [...tickerList];
    updated[index] = { ...updated[index], [field]: value.toUpperCase() };
    setLocalSettings({ ...localSettings, tickerItems: updated });
  };

  const handleResetTicker = () => {
    setLocalSettings({ ...localSettings, tickerItems: DEFAULT_TICKER_ITEMS });
    onToast('Cinta de beneficios restablecida a los valores originales.');
  };

  const matchesSearch = (text: string) => {
    if (!searchFilter.trim()) return true;
    return text.toLowerCase().includes(searchFilter.toLowerCase());
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Action Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 dark:border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Editor de Contenido &amp; Textos Web
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Personaliza al 100% todos los textos, títulos, pasos, FAQ, banners y avisos de la tienda.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-black text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Todos los Textos'}</span>
          </button>
        </div>
      </div>

      {/* Quick Search & Expand Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar sección o frase..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={expandAll}
            className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
          >
            Expandir todos
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
          >
            Colapsar todos
          </button>
        </div>
      </div>

      {/* SECTION 1: HERO BANNER */}
      {(matchesSearch('hero') || matchesSearch('banner') || matchesSearch('titulo') || matchesSearch('rating')) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('hero')}
            className="w-full p-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  1. Banner Principal (Hero) &amp; Rating en Perú
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Insignia superior, titular con gradiente, propuesta de valor, botón CTA y rating de Perú.
                </p>
              </div>
            </div>
            {expandedSections.hero ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.hero && (
            <div className="p-4 sm:p-5 space-y-4 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Insignia Superior (Kicker Badge)
                </label>
                <input
                  type="text"
                  value={localSettings.heroBadgeText ?? 'MEMBRESÍAS DIGITALES PREMIUM • ENTREGA EN 3 MINUTOS'}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroBadgeText: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Título Principal del Banner (Segmentado para Efecto Neón)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">1. Prefijo (Blanco)</span>
                    <input
                      type="text"
                      value={localSettings.heroTitlePrefix ?? 'ACCESO'}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroTitlePrefix: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block mb-0.5">2. Neón Gradiente</span>
                    <input
                      type="text"
                      value={localSettings.heroTitleHighlight ?? 'PREMIUM'}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroTitleHighlight: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-black rounded-xl border border-purple-400 bg-purple-50/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">3. Sufijo</span>
                    <input
                      type="text"
                      value={localSettings.heroTitleSuffix ?? 'al Mejor Precio'}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroTitleSuffix: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Descripción / Propuesta de Valor
                </label>
                <textarea
                  rows={2}
                  value={localSettings.heroDescription ?? 'Cuentas 100% privadas y renovables mes a mes con activación inmediata por WhatsApp, garantía de reposición total y soporte técnico 24/7 en Perú.'}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroDescription: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Botón Catálogo (CTA)
                  </label>
                  <input
                    type="text"
                    value={localSettings.heroCtaText ?? 'Explorar Catálogo'}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroCtaText: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Puntaje Numérico
                  </label>
                  <input
                    type="text"
                    value={localSettings.heroRatingScore ?? '4.9 / 5.0'}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroRatingScore: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Texto de Clientes en Perú
                  </label>
                  <input
                    type="text"
                    value={localSettings.heroRatingText ?? '+15,000 Clientes en Perú'}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroRatingText: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Título Carrusel + Vendidos
                  </label>
                  <input
                    type="text"
                    value={localSettings.heroShowcaseTitle ?? '+ Vendidos en Perú (En Vivo)'}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroShowcaseTitle: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Sub-tarjeta: Textos del Carrusel / Banner (+ Vendidos / Activaciones) */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-purple-500/30 dark:border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Textos del Carrusel Destacado (+ Vendidos &amp; Activaciones)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                    En Vivo al Inicio
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">
                      Texto de Activaciones (Badge de Confianza)
                    </label>
                    <input
                      type="text"
                      value={localSettings.heroCarouselActivationsText ?? '+2.400 Activaciones'}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroCarouselActivationsText: e.target.value })}
                      placeholder="+2.400 Activaciones"
                      className="w-full px-3 py-1.5 text-xs font-black rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs"
                    />
                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Ej: +2.400 Activaciones, +1,800 Clientes, etc.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">
                      Rating Base del Carrusel
                    </label>
                    <input
                      type="text"
                      value={localSettings.heroCarouselBaseRating ?? '4.9'}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroCarouselBaseRating: e.target.value })}
                      placeholder="4.9"
                      className="w-full px-3 py-1.5 text-xs font-black rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs"
                    />
                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Puntaje estelar de referencia (ej: 4.9, 5.0).
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">
                      Distintivo de Rango (Top Venta)
                    </label>
                    <input
                      type="text"
                      value={localSettings.heroCarouselRankBadge ?? 'Más Vendido'}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroCarouselRankBadge: e.target.value })}
                      placeholder="Más Vendido"
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Aparece como: #1 Más Vendido, #2 Más Vendido...
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">
                      Texto de Garantía
                    </label>
                    <input
                      type="text"
                      value={localSettings.heroCarouselGuaranteeText ?? 'Garantía 100%'}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroCarouselGuaranteeText: e.target.value })}
                      placeholder="Garantía 100%"
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">
                      Texto de Entrega Inmediata
                    </label>
                    <input
                      type="text"
                      value={localSettings.heroCarouselInstantBadge ?? 'Inmediato'}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroCarouselInstantBadge: e.target.value })}
                      placeholder="Inmediato"
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">
                      Texto de Precio (Prefijo)
                    </label>
                    <input
                      type="text"
                      value={localSettings.heroCarouselFromText ?? 'Desde'}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroCarouselFromText: e.target.value })}
                      placeholder="Desde"
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">
                      Texto del Botón de la Tarjeta
                    </label>
                    <input
                      type="text"
                      value={localSettings.heroCarouselCtaText ?? 'Obtener'}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroCarouselCtaText: e.target.value })}
                      placeholder="Obtener"
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">
                      Mensaje de Ayuda Inferior
                    </label>
                    <input
                      type="text"
                      value={localSettings.heroCarouselHintText ?? 'Clic en el banner para adquirir al instante'}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroCarouselHintText: e.target.value })}
                      placeholder="Clic en el banner para adquirir al instante"
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                    />
                  </div>
                </div>

                {/* Switch de variación de Rating */}
                <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="heroCarouselRatingVaryInput"
                      checked={localSettings.heroCarouselRatingVary !== false}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroCarouselRatingVary: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <label htmlFor="heroCarouselRatingVaryInput" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                      Variar puntuación de rating entre productos del carrusel (ej: 4.8, 4.9, 5.0, 4.95)
                    </label>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                    {localSettings.heroCarouselRatingVary !== false ? 'Activo (Rating dinámico)' : 'Fijo (Mismo rating)'}
                  </span>
                </div>

                {/* Modo de cálculo de Activaciones según Ventas Confirmadas */}
                <div className="pt-2 border-t border-purple-500/20 space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase">
                    Comportamiento de Activaciones por Ventas de cada Plataforma
                  </label>
                  <select
                    value={localSettings.heroCarouselActivationsMode || 'sales_additive'}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        heroCarouselActivationsMode: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="sales_additive">
                      🔥 Dinámico en Vivo: Base + Ventas Confirmadas de cada Plataforma (Recomendado)
                    </option>
                    <option value="sales_direct">
                      📊 Conteo Directo: Mostrar solo el número de ventas confirmadas (ej: +8 Activaciones)
                    </option>
                    <option value="fixed">
                      🔒 Fijo: Mostrar siempre el texto configurado sin variar por ventas
                    </option>
                  </select>
                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400">
                    Al confirmar ventas en el panel, el contador de la plataforma correspondiente sube automáticamente en tiempo real.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: NAVBAR & ANUNCIOS */}
      {(matchesSearch('navbar') || matchesSearch('anuncio') || matchesSearch('buscador') || matchesSearch('menu')) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('navbar')}
            className="w-full p-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  2. Barra Superior, Anuncio &amp; Menú
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cinta de promoción relámpago, texto del botón de WhatsApp y texto de ayuda del buscador.
                </p>
              </div>
            </div>
            {expandedSections.navbar ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.navbar && (
            <div className="p-4 sm:p-5 space-y-3.5 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Texto de la Barra Superior de Anuncios (Marquee Superior)
                </label>
                <input
                  type="text"
                  value={localSettings.announcement ?? 'Cuentas 100% garantizadas, renovables y soporte VIP 24/7'}
                  onChange={(e) => setLocalSettings({ ...localSettings, announcement: e.target.value })}
                  placeholder="⚡ PROMOCIÓN: ..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Texto del Botón de WhatsApp en el Menú
                  </label>
                  <input
                    type="text"
                    value={localSettings.navbarCtaText ?? 'WhatsApp Soporte'}
                    onChange={(e) => setLocalSettings({ ...localSettings, navbarCtaText: e.target.value })}
                    placeholder="WhatsApp Soporte"
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Texto Placeholder del Buscador de Productos
                  </label>
                  <input
                    type="text"
                    value={localSettings.searchPlaceholder ?? 'Buscar servicio (ej. ChatGPT, Netflix...)'}
                    onChange={(e) => setLocalSettings({ ...localSettings, searchPlaceholder: e.target.value })}
                    placeholder="Buscar servicio (ej. ChatGPT, Netflix...)"
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: CINTA DE BENEFICIOS LED */}
      {(matchesSearch('ticker') || matchesSearch('cinta') || matchesSearch('beneficios') || matchesSearch('led')) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('ticker')}
            className="w-full p-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  3. Cinta Animada LED de Beneficios
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Edita los 6 mensajes luminosos que giran continuamente debajo del banner principal.
                </p>
              </div>
            </div>
            {expandedSections.ticker ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.ticker && (
            <div className="p-4 sm:p-5 space-y-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500">6 Elementos de la Cinta Marquee:</span>
                <button
                  type="button"
                  onClick={handleResetTicker}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer Originales</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tickerList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400">
                      <span>ÍTEM #{idx + 1}</span>
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-0.5">
                        Texto Principal
                      </label>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => handleUpdateTicker(idx, 'text', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs font-mono font-black rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-0.5">
                        Subtítulo / Aclaración
                      </label>
                      <input
                        type="text"
                        value={item.sub}
                        onChange={(e) => handleUpdateTicker(idx, 'sub', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: CATALOGO & FILTROS */}
      {(matchesSearch('catalogo') || matchesSearch('filtro') || matchesSearch('pestañas') || matchesSearch('buscar')) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('catalog')}
            className="w-full p-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  4. Catálogo de Productos &amp; Filtros de Categoría
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Nombres de las pestañas de categorías, contador de productos y mensajes de búsqueda vacía.
                </p>
              </div>
            </div>
            {expandedSections.catalog ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.catalog && (
            <div className="p-4 sm:p-5 space-y-4 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Pestaña "Todos"
                  </label>
                  <input
                    type="text"
                    value={localSettings.categoryTabAll ?? 'Todos los Productos'}
                    onChange={(e) => setLocalSettings({ ...localSettings, categoryTabAll: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Pestaña "Inteligencia Artificial"
                  </label>
                  <input
                    type="text"
                    value={localSettings.categoryTabAi ?? 'Inteligencia Artificial'}
                    onChange={(e) => setLocalSettings({ ...localSettings, categoryTabAi: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Pestaña "Streaming &amp; Series"
                  </label>
                  <input
                    type="text"
                    value={localSettings.categoryTabStreaming ?? 'Streaming & Series'}
                    onChange={(e) => setLocalSettings({ ...localSettings, categoryTabStreaming: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Texto del Contador de Catálogo
                </label>
                <input
                  type="text"
                  value={localSettings.catalogStatusText ?? 'servicios disponibles'}
                  onChange={(e) => setLocalSettings({ ...localSettings, catalogStatusText: e.target.value })}
                  placeholder="servicios disponibles"
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">
                  Mensaje Cuando No Hay Resultados de Búsqueda
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-0.5">
                      Título
                    </label>
                    <input
                      type="text"
                      value={localSettings.catalogEmptyTitle ?? 'No encontramos resultados para tu búsqueda'}
                      onChange={(e) => setLocalSettings({ ...localSettings, catalogEmptyTitle: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-0.5">
                      Texto del Botón
                    </label>
                    <input
                      type="text"
                      value={localSettings.catalogEmptyResetText ?? 'Restablecer Catálogo'}
                      onChange={(e) => setLocalSettings({ ...localSettings, catalogEmptyResetText: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-0.5">
                    Descripción / Sugerencia
                  </label>
                  <textarea
                    rows={2}
                    value={localSettings.catalogEmptyDesc ?? 'Intenta buscar con otro nombre como "ChatGPT", "Netflix", "Canva", o contáctanos por WhatsApp para consultar disponibilidad.'}
                    onChange={(e) => setLocalSettings({ ...localSettings, catalogEmptyDesc: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: PROCESO DE COMPRA (4 PASOS) */}
      {(matchesSearch('proceso') || matchesSearch('pasos') || matchesSearch('compra') || matchesSearch('flujo')) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('process')}
            className="w-full p-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  5. Proceso de Compra (¿Cómo Comprar en 4 Pasos?)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Insignia, título principal, enlace de WhatsApp y el título y descripción de los 4 pasos.
                </p>
              </div>
            </div>
            {expandedSections.process ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.process && (
            <div className="p-4 sm:p-5 space-y-4 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Insignia de Sección
                  </label>
                  <input
                    type="text"
                    value={localSettings.processSectionBadge ?? 'Flujo Rápido'}
                    onChange={(e) => setLocalSettings({ ...localSettings, processSectionBadge: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Título de Sección
                  </label>
                  <input
                    type="text"
                    value={localSettings.processSectionTitle ?? '¿Cómo Comprar en 4 Pasos?'}
                    onChange={(e) => setLocalSettings({ ...localSettings, processSectionTitle: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Texto Enlace de WhatsApp
                  </label>
                  <input
                    type="text"
                    value={localSettings.processSectionWaLink ?? 'Atención guiada por WhatsApp'}
                    onChange={(e) => setLocalSettings({ ...localSettings, processSectionWaLink: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {/* Paso 1 */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2">
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 block">PASO 01</span>
                  <input
                    type="text"
                    value={localSettings.processStep1Title ?? 'Elige tu Plan'}
                    onChange={(e) => setLocalSettings({ ...localSettings, processStep1Title: e.target.value })}
                    placeholder="Título Paso 1"
                    className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <textarea
                    rows={2}
                    value={localSettings.processStep1Desc ?? 'Selecciona el servicio y la modalidad (1 mes, 3 meses o perfil privado).'}
                    onChange={(e) => setLocalSettings({ ...localSettings, processStep1Desc: e.target.value })}
                    placeholder="Descripción Paso 1"
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                {/* Paso 2 */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2">
                  <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 block">PASO 02</span>
                  <input
                    type="text"
                    value={localSettings.processStep2Title ?? 'Realiza el Pago'}
                    onChange={(e) => setLocalSettings({ ...localSettings, processStep2Title: e.target.value })}
                    placeholder="Título Paso 2"
                    className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <textarea
                    rows={2}
                    value={localSettings.processStep2Desc ?? 'Transfiere mediante Yape, Plin, BCP o Binance Pay sin comisiones ocultas.'}
                    onChange={(e) => setLocalSettings({ ...localSettings, processStep2Desc: e.target.value })}
                    placeholder="Descripción Paso 2"
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                {/* Paso 3 */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2">
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block">PASO 03</span>
                  <input
                    type="text"
                    value={localSettings.processStep3Title ?? 'Envía Captura'}
                    onChange={(e) => setLocalSettings({ ...localSettings, processStep3Title: e.target.value })}
                    placeholder="Título Paso 3"
                    className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <textarea
                    rows={2}
                    value={localSettings.processStep3Desc ?? 'Comparte el comprobante al WhatsApp oficial para validación inmediata.'}
                    onChange={(e) => setLocalSettings({ ...localSettings, processStep3Desc: e.target.value })}
                    placeholder="Descripción Paso 3"
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                {/* Paso 4 */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2">
                  <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 block">PASO 04</span>
                  <input
                    type="text"
                    value={localSettings.processStep4Title ?? 'Recibe tu Acceso'}
                    onChange={(e) => setLocalSettings({ ...localSettings, processStep4Title: e.target.value })}
                    placeholder="Título Paso 4"
                    className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <textarea
                    rows={2}
                    value={localSettings.processStep4Desc ?? 'En menos de 3 minutos recibes tus credenciales con garantía total activa.'}
                    onChange={(e) => setLocalSettings({ ...localSettings, processStep4Desc: e.target.value })}
                    placeholder="Descripción Paso 4"
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 6: METODOS DE PAGO */}
      {(matchesSearch('pago') || matchesSearch('metodos') || matchesSearch('yape') || matchesSearch('plin')) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('payments')}
            className="w-full p-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  6. Sección Métodos de Pago
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Títulos, subtítulos y texto del botón de cada pasarela.
                </p>
              </div>
            </div>
            {expandedSections.payments ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.payments && (
            <div className="p-4 sm:p-5 space-y-3.5 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Insignia de la Sección
                  </label>
                  <input
                    type="text"
                    value={localSettings.paymentSectionBadge ?? 'Pagos 100% Verificados en Perú'}
                    onChange={(e) => setLocalSettings({ ...localSettings, paymentSectionBadge: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Título de la Sección
                  </label>
                  <input
                    type="text"
                    value={localSettings.paymentSectionTitle ?? 'Métodos de Pago Inmediatos'}
                    onChange={(e) => setLocalSettings({ ...localSettings, paymentSectionTitle: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Subtítulo / Instrucciones
                  </label>
                  <input
                    type="text"
                    value={localSettings.paymentSectionSubtitle ?? 'Haz clic en tu método preferido para ver el número o cuenta oficial al instante.'}
                    onChange={(e) => setLocalSettings({ ...localSettings, paymentSectionSubtitle: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Texto del Botón en Tarjeta
                  </label>
                  <input
                    type="text"
                    value={localSettings.paymentCardBtnText ?? 'Ver datos →'}
                    onChange={(e) => setLocalSettings({ ...localSettings, paymentCardBtnText: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 7: OPINIONES & RESEÑAS */}
      {(matchesSearch('opiniones') || matchesSearch('reseñas') || matchesSearch('reviews') || matchesSearch('clientes')) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('reviews')}
            className="w-full p-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  7. Opiniones, Testimonios &amp; Prueba Social
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Insignia, titular con gradiente, botón de dejar opinión y las 3 tarjetas de métricas.
                </p>
              </div>
            </div>
            {expandedSections.reviews ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.reviews && (
            <div className="p-4 sm:p-5 space-y-4 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Insignia de la Sección
                  </label>
                  <input
                    type="text"
                    value={localSettings.reviewsBadgeText ?? '✨ +15,000 Clientes Satisfechos en Todo el Perú'}
                    onChange={(e) => setLocalSettings({ ...localSettings, reviewsBadgeText: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Texto del Botón "Dejar Mi Opinión"
                  </label>
                  <input
                    type="text"
                    value={localSettings.reviewsBtnText ?? 'Dejar Mi Opinión'}
                    onChange={(e) => setLocalSettings({ ...localSettings, reviewsBtnText: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Prefijo del Título
                  </label>
                  <input
                    type="text"
                    value={localSettings.reviewsSectionTitlePrefix ?? 'La Confianza de Quienes Ya Disfrutan de Sus'}
                    onChange={(e) => setLocalSettings({ ...localSettings, reviewsSectionTitlePrefix: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Palabra Destacada (Neón)
                  </label>
                  <input
                    type="text"
                    value={localSettings.reviewsSectionTitleHighlight ?? 'Cuentas VIP'}
                    onChange={(e) => setLocalSettings({ ...localSettings, reviewsSectionTitleHighlight: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-black rounded-xl border border-purple-400 bg-purple-50/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Descripción de la Sección
                </label>
                <textarea
                  rows={2}
                  value={localSettings.reviewsSectionDescription ?? 'Comprobantes de entrega real en menos de 3 minutos, cuentas privadas con PIN y calificaciones de usuarios verificados.'}
                  onChange={(e) => setLocalSettings({ ...localSettings, reviewsSectionDescription: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase">Tarjeta Estadística 1</span>
                  <input
                    type="text"
                    value={localSettings.reviewsStat1Title ?? 'Garantía Total Todo el Mes'}
                    onChange={(e) => setLocalSettings({ ...localSettings, reviewsStat1Title: e.target.value })}
                    className="w-full px-2 py-1 text-xs font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    value={localSettings.reviewsStat1Sub ?? 'Tranquilidad Absoluta'}
                    onChange={(e) => setLocalSettings({ ...localSettings, reviewsStat1Sub: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500"
                  />
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-1.5">
                  <span className="text-[10px] font-bold text-pink-500 uppercase">Tarjeta Estadística 2</span>
                  <input
                    type="text"
                    value={localSettings.reviewsStat2Title ?? 'Cuentas 100% Renovables'}
                    onChange={(e) => setLocalSettings({ ...localSettings, reviewsStat2Title: e.target.value })}
                    className="w-full px-2 py-1 text-xs font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    value={localSettings.reviewsStat2Sub ?? 'Sin perder historiales'}
                    onChange={(e) => setLocalSettings({ ...localSettings, reviewsStat2Sub: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500"
                  />
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">Tarjeta Estadística 3</span>
                  <input
                    type="text"
                    value={localSettings.reviewsStat3Title ?? 'Usuario Verificado'}
                    onChange={(e) => setLocalSettings({ ...localSettings, reviewsStat3Title: e.target.value })}
                    className="w-full px-2 py-1 text-xs font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    value={localSettings.reviewsStat3Sub ?? 'Opiniones 100% Auténticas'}
                    onChange={(e) => setLocalSettings({ ...localSettings, reviewsStat3Sub: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 8: PREGUNTAS FRECUENTES (FAQ) */}
      {(matchesSearch('faq') || matchesSearch('preguntas') || matchesSearch('dudas') || matchesSearch('respuestas')) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('faq')}
            className="w-full p-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  8. Preguntas Frecuentes (FAQ)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Títulos, subtítulo y gestor completo de preguntas y respuestas (agregar, editar o eliminar).
                </p>
              </div>
            </div>
            {expandedSections.faq ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.faq && (
            <div className="p-4 sm:p-5 space-y-4 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Insignia de la Sección
                  </label>
                  <input
                    type="text"
                    value={localSettings.faqSectionBadge ?? 'Dudas Resueltas'}
                    onChange={(e) => setLocalSettings({ ...localSettings, faqSectionBadge: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Título de la Sección
                  </label>
                  <input
                    type="text"
                    value={localSettings.faqSectionTitle ?? 'Preguntas Frecuentes'}
                    onChange={(e) => setLocalSettings({ ...localSettings, faqSectionTitle: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Descripción / Subtítulo
                  </label>
                  <input
                    type="text"
                    value={localSettings.faqSectionDescription ?? 'Todo lo que necesitas saber antes de solicitar tu membresía digital.'}
                    onChange={(e) => setLocalSettings({ ...localSettings, faqSectionDescription: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* FAQ items list */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Preguntas y Respuestas Activas ({faqList.length}):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetFaqs}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Originales</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddFaq}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar Pregunta</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {faqList.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                          PREGUNTA #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-0.5">
                          Pregunta
                        </label>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-0.5">
                          Respuesta
                        </label>
                        <textarea
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 9: PIE DE PAGINA (FOOTER) */}
      {(matchesSearch('footer') || matchesSearch('pie') || matchesSearch('copyright') || matchesSearch('horario')) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('footer')}
            className="w-full p-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  9. Pie de Página (Footer) &amp; Avisos Legales
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Slogan, horarios, notas de confianza, validación y créditos de copyright.
                </p>
              </div>
            </div>
            {expandedSections.footer ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.footer && (
            <div className="p-4 sm:p-5 space-y-4 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Slogan de la Tienda (Columna 1)
                </label>
                <textarea
                  rows={2}
                  value={localSettings.footerSlogan ?? 'Tu tienda digital de confianza para membresías de Inteligencia Artificial y Streaming en Perú. Entrega ágil y garantía total certificada.'}
                  onChange={(e) => setLocalSettings({ ...localSettings, footerSlogan: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Horario de Atención Visible
                  </label>
                  <input
                    type="text"
                    value={localSettings.footerHours ?? 'Atención: Lunes a Domingo, 8:00 AM - 11:30 PM'}
                    onChange={(e) => setLocalSettings({ ...localSettings, footerHours: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Nota de Confianza (Columna 2)
                  </label>
                  <input
                    type="text"
                    value={localSettings.footerTrustNote ?? 'Transacciones seguras y validadas al instante'}
                    onChange={(e) => setLocalSettings({ ...localSettings, footerTrustNote: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Título de Métodos de Pago
                  </label>
                  <input
                    type="text"
                    value={localSettings.footerPaymentTitle ?? 'Métodos de Pago'}
                    onChange={(e) => setLocalSettings({ ...localSettings, footerPaymentTitle: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Nota de Validación de Pagos
                  </label>
                  <input
                    type="text"
                    value={localSettings.footerPaymentValidation ?? 'Validación de comprobante en menos de 2 minutos vía WhatsApp.'}
                    onChange={(e) => setLocalSettings({ ...localSettings, footerPaymentValidation: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Descripción de Métodos de Pago
                </label>
                <input
                  type="text"
                  value={localSettings.footerPaymentDesc ?? 'Aceptamos transferencias inmediatas sin comisiones ocultas para tu comodidad:'}
                  onChange={(e) => setLocalSettings({ ...localSettings, footerPaymentDesc: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Texto de Copyright (Pie Inferior)
                  </label>
                  <input
                    type="text"
                    value={localSettings.footerCopyright ?? `© 2026 ${localSettings.name}${localSettings.suffix}. Todos los derechos reservados.`}
                    onChange={(e) => setLocalSettings({ ...localSettings, footerCopyright: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Subtítulo de Ubicación / Creación
                  </label>
                  <input
                    type="text"
                    value={localSettings.footerSubtitle ?? 'Digital Store • Hecho con ❤️ Lima-Perú'}
                    onChange={(e) => setLocalSettings({ ...localSettings, footerSubtitle: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 10: TÉRMINOS Y CONDICIONES */}
      {(matchesSearch('terminos') || matchesSearch('condiciones') || matchesSearch('garantia') || matchesSearch('legal')) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('terms')}
            className="w-full p-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  10. Términos, Condiciones &amp; Garantía
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Títulos, subtítulo y el texto del compromiso de garantía en el modal de términos.
                </p>
              </div>
            </div>
            {expandedSections.terms ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.terms && (
            <div className="p-4 sm:p-5 space-y-4 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Título del Modal de Términos
                  </label>
                  <input
                    type="text"
                    value={localSettings.termsModalTitle ?? 'Términos, Condiciones y Garantía'}
                    onChange={(e) => setLocalSettings({ ...localSettings, termsModalTitle: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Subtítulo del Modal
                  </label>
                  <input
                    type="text"
                    value={localSettings.termsModalSubtitle ?? `Transparencia, respaldo y políticas de uso de ${localSettings.name}${localSettings.suffix}`}
                    onChange={(e) => setLocalSettings({ ...localSettings, termsModalSubtitle: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Título del Compromiso de Garantía
                </label>
                <input
                  type="text"
                  value={localSettings.termsCommitmentTitle ?? `Compromiso de Garantía Total ${localSettings.name}${localSettings.suffix}`}
                  onChange={(e) => setLocalSettings({ ...localSettings, termsCommitmentTitle: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Texto del Compromiso de Garantía
                </label>
                <textarea
                  rows={3}
                  value={localSettings.termsCommitmentText ?? 'Todas las cuentas y perfiles adquiridos cuentan con garantía ininterrumpida por el periodo exacto contratado (30 días para planes mensuales o 90 días para planes trimestrales). Ante cualquier eventualidad técnica, nuestro soporte responderá de inmediato.'}
                  onChange={(e) => setLocalSettings({ ...localSettings, termsCommitmentText: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Save Action Bar */}
      <div className="sticky bottom-4 z-20 p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 text-white border border-slate-800 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Los cambios se guardan de inmediato en la base de datos y se reflejan en tiempo real para todos los visitantes.</span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Guardando...' : 'Guardar Todos los Textos'}</span>
        </button>
      </div>
    </div>
  );
};
