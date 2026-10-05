import React, { useState } from 'react';
import {
  Share2,
  X,
  Send,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  Twitter,
} from 'lucide-react';
import { StoreSettings } from '../types';

interface SocialDockProps {
  settings: StoreSettings;
}

export const SocialDock: React.FC<SocialDockProps> = ({ settings }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Social networks configuration with their neon characteristics and direct links
  const socialItems = [
    {
      id: 'tiktok',
      name: 'TikTok',
      handle: `@${settings.name.toLowerCase()}${settings.suffix.toLowerCase()}`,
      url: settings.tiktokUrl || 'https://www.tiktok.com',
      enabled: settings.showTiktok !== false,
      neonClass: 'neon-tiktok',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
        </svg>
      ),
      accentColor: '#00f2fe',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      handle: settings.creatorHandle || `@${settings.name.toLowerCase()}${settings.suffix.toLowerCase()}`,
      url: settings.instagramUrl || 'https://www.instagram.com',
      enabled: settings.showInstagram !== false,
      neonClass: 'neon-instagram',
      icon: <Instagram className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />,
      accentColor: '#e1306c',
    },
    {
      id: 'telegram',
      name: 'Telegram',
      handle: 'Canal Oficial & Promos',
      url: settings.telegramUrl || 'https://t.me',
      enabled: settings.showTelegram !== false,
      neonClass: 'neon-telegram',
      icon: <Send className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />,
      accentColor: '#0088cc',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      handle: `${settings.name}${settings.suffix} Oficial`,
      url: settings.facebookUrl || 'https://www.facebook.com',
      enabled: settings.showFacebook !== false,
      neonClass: 'neon-facebook',
      icon: <Facebook className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />,
      accentColor: '#1877f2',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      handle: 'Videos & Tutoriales',
      url: settings.youtubeUrl || 'https://youtube.com',
      enabled: settings.showYoutube !== false && Boolean(settings.youtubeUrl),
      neonClass: 'neon-youtube',
      icon: <Youtube className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />,
      accentColor: '#ff0000',
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      handle: 'Noticias & Updates',
      url: settings.twitterUrl || 'https://x.com',
      enabled: settings.showTwitter === true || (Boolean(settings.twitterUrl) && settings.twitterUrl !== 'https://x.com'),
      neonClass: 'neon-twitter',
      icon: <Twitter className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />,
      accentColor: '#93c5fd',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Soporte',
      handle: settings.whatsappDisplay || '+51 900 000 000',
      url: `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
        `Hola ${settings.name}${settings.suffix}, vengo desde las redes sociales oficiales de la web y deseo consultar por sus membresías.`
      )}`,
      enabled: true,
      neonClass: 'neon-whatsapp',
      icon: <MessageCircle className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />,
      accentColor: '#25d366',
    },
  ];

  const activeSocials = socialItems.filter((item) => item.enabled);

  return (
    <aside aria-label="Redes sociales flotantes" className="fixed bottom-4 left-4 sm:bottom-5 sm:left-5 z-40 flex flex-col items-center gap-2 select-none">
      {/* Expanded list of animated social buttons */}
      <div
        className={`flex flex-col items-center gap-2 transition-all duration-300 ease-out origin-bottom ${
          isOpen
            ? 'scale-100 opacity-100 pointer-events-auto translate-y-0'
            : 'scale-75 opacity-0 pointer-events-none translate-y-4'
        }`}
      >
        {activeSocials.map((item, idx) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`neon-social-btn ${item.neonClass} group relative w-11 h-11 rounded-xl bg-slate-900/90 text-slate-200 border border-slate-700/80 shadow-md flex items-center justify-center cursor-pointer`}
            style={{
              transitionDelay: isOpen ? `${(activeSocials.length - 1 - idx) * 25}ms` : '0ms',
            }}
            aria-label={`${item.name} Oficial`}
          >
            {item.icon}

            {/* Glowing neon hover tooltip badge */}
            <div className="absolute left-13 px-2.5 py-1 rounded-lg bg-slate-900/95 text-white text-[10px] font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 shadow-xl border border-slate-700/90 flex items-center gap-1.5 group-hover:translate-x-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: item.accentColor }}
              />
              <span className="leading-none text-slate-200 font-bold">{item.name}</span>
            </div>
          </a>
        ))}
      </div>

      {/* Main Trigger Floating Dock Button */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-11 h-11 rounded-xl text-white shadow-lg flex items-center justify-center border border-white/20 transition-all duration-300 active:scale-95 cursor-pointer overflow-hidden ${
            !isOpen ? 'neon-dock-pulse hover:scale-105' : 'shadow-indigo-500/40 scale-102'
          }`}
          style={{
            background: `linear-gradient(135deg, ${settings.colorPrimary} 0%, #312e81 50%, ${settings.colorAccent} 100%)`,
            boxShadow: isOpen
              ? `0 0 16px ${settings.colorPrimary}80, 0 6px 16px rgba(0,0,0,0.25)`
              : undefined,
          }}
          title="Redes Sociales Oficiales"
          aria-label="Abrir redes sociales oficiales"
        >
          {/* Subtle neon rotating light inside */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div
            className={`transition-transform duration-300 ease-in-out ${
              isOpen ? 'rotate-180 scale-105 text-rose-300' : 'rotate-0 text-white'
            }`}
          >
            {isOpen ? <X className="w-4 h-4 stroke-[2.5]" /> : <Share2 className="w-4 h-4 stroke-[2.2]" />}
          </div>
        </button>

        {/* Pulse badge indicating official networks when closed */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-slate-900 flex items-center justify-center shadow-sm">
            <span className="w-1 h-1 rounded-full bg-white" />
          </div>
        )}

        {/* Small tooltip on hover when closed (desktop only) */}
        {!isOpen && (
          <div className="absolute left-12 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-slate-900/90 text-white text-[10px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 border border-slate-700 shadow-md hidden sm:block">
            Redes
          </div>
        )}
      </div>
    </aside>
  );
};
