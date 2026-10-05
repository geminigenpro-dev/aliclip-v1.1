export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primary: string;
  accent: string;
  gradientText: string;
  gradientBtn: string;
  badgeGlow: string;
  borderGlow: string;
  previewBg: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'cyber-neon',
    name: 'Cyber Neon (Estilo Oficial)',
    description: 'Magenta y púrpura vibrante con acentos azul eléctrico (inspirado en la referencia)',
    primary: '#ec4899',
    accent: '#8b5cf6',
    gradientText: 'from-pink-400 via-purple-400 to-indigo-400',
    gradientBtn: 'from-pink-500 via-purple-600 to-indigo-600',
    badgeGlow: 'rgba(236, 72, 153, 0.45)',
    borderGlow: 'rgba(168, 85, 247, 0.35)',
    previewBg: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
  },
  {
    id: 'electric-violet',
    name: 'Electric Violet',
    description: 'Púrpura intenso y azul real de alto contraste y elegancia nocturna',
    primary: '#a855f7',
    accent: '#3b82f6',
    gradientText: 'from-purple-400 via-indigo-400 to-blue-400',
    gradientBtn: 'from-purple-600 via-indigo-600 to-blue-600',
    badgeGlow: 'rgba(168, 85, 247, 0.45)',
    borderGlow: 'rgba(99, 102, 241, 0.35)',
    previewBg: 'linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #3b82f6 100%)',
  },
  {
    id: 'cosmic-cyan',
    name: 'Cosmic Cyan',
    description: 'Cian láser y turquesa tecnológico con máxima luminosidad',
    primary: '#06b6d4',
    accent: '#3b82f6',
    gradientText: 'from-cyan-300 via-sky-400 to-blue-400',
    gradientBtn: 'from-cyan-500 via-sky-600 to-blue-600',
    badgeGlow: 'rgba(6, 182, 212, 0.45)',
    borderGlow: 'rgba(59, 130, 246, 0.35)',
    previewBg: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 50%, #3b82f6 100%)',
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    description: 'Verde esmeralda y menta neón que transmite seguridad y confianza inmediata',
    primary: '#10b981',
    accent: '#06b6d4',
    gradientText: 'from-emerald-400 via-teal-400 to-cyan-400',
    gradientBtn: 'from-emerald-500 via-teal-600 to-cyan-600',
    badgeGlow: 'rgba(16, 185, 129, 0.45)',
    borderGlow: 'rgba(6, 182, 212, 0.35)',
    previewBg: 'linear-gradient(135deg, #10b981 0%, #0d9488 50%, #06b6d4 100%)',
  },
  {
    id: 'sunset-gold',
    name: 'Sunset Amber & Gold',
    description: 'Dorado oro y ámbar fuego con calidez y prestigio exclusivo',
    primary: '#f59e0b',
    accent: '#ef4444',
    gradientText: 'from-amber-400 via-orange-400 to-rose-400',
    gradientBtn: 'from-amber-500 via-orange-600 to-rose-600',
    badgeGlow: 'rgba(245, 158, 11, 0.45)',
    borderGlow: 'rgba(239, 68, 68, 0.35)',
    previewBg: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #e11d48 100%)',
  },
  {
    id: 'crimson-ruby',
    name: 'Crimson Ruby',
    description: 'Rojo carmesí seductor y fucsia intenso para compras de impulso',
    primary: '#e11d48',
    accent: '#a855f7',
    gradientText: 'from-rose-400 via-pink-400 to-purple-400',
    gradientBtn: 'from-rose-600 via-pink-600 to-purple-600',
    badgeGlow: 'rgba(225, 29, 72, 0.45)',
    borderGlow: 'rgba(168, 85, 247, 0.35)',
    previewBg: 'linear-gradient(135deg, #e11d48 0%, #c026d3 50%, #7c3aed 100%)',
  },
];

export const getThemePresetById = (id?: string): ThemePreset => {
  return THEME_PRESETS.find((t) => t.id === id) || THEME_PRESETS[0];
};
