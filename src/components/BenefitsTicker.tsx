import React from 'react';
import {
  Zap,
  ShieldCheck,
  Lock,
  CreditCard,
  RefreshCw,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { StoreSettings } from '../types';

interface BenefitsTickerProps {
  settings: StoreSettings;
}

export const BenefitsTicker: React.FC<BenefitsTickerProps> = ({ settings }) => {
  const items = [
    {
      icon: Zap,
      text: 'ENTREGA EN 3 MINUTOS',
      sub: 'ACTIVACIÓN INMEDIATA',
      color: 'text-amber-400',
      badgeColor: 'border-amber-400/40 text-amber-300 bg-amber-500/10',
      glow: 'shadow-[0_0_12px_rgba(251,191,36,0.5)]',
    },
    {
      icon: ShieldCheck,
      text: 'GARANTÍA 100% ACTIVA',
      sub: 'REPOSICIÓN INMEDIATA',
      color: 'text-cyan-400',
      badgeColor: 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10',
      glow: 'shadow-[0_0_12px_rgba(34,211,238,0.5)]',
    },
    {
      icon: Lock,
      text: 'PERFILES 100% PRIVADOS',
      sub: 'CON PIN PERSONAL',
      color: 'text-emerald-400',
      badgeColor: 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10',
      glow: 'shadow-[0_0_12px_rgba(52,211,153,0.5)]',
    },
    {
      icon: CreditCard,
      text: 'PAGOS YAPE, PLIN & BCP',
      sub: 'CERO COMISIONES',
      color: 'text-purple-400',
      badgeColor: 'border-purple-400/40 text-purple-300 bg-purple-500/10',
      glow: 'shadow-[0_0_12px_rgba(192,132,252,0.5)]',
    },
    {
      icon: RefreshCw,
      text: 'CUENTAS RENOVABLES',
      sub: 'SIN PERDER HISTORIAL',
      color: 'text-pink-400',
      badgeColor: 'border-pink-400/40 text-pink-300 bg-pink-500/10',
      glow: 'shadow-[0_0_12px_rgba(244,114,182,0.5)]',
    },
    {
      icon: MessageCircle,
      text: 'SOPORTE WHATSAPP 24/7',
      sub: 'ATENCIÓN DEDICADA',
      color: 'text-emerald-400',
      badgeColor: 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    },
  ];

  // Repeat items for seamless, non-stop LED looping marquee
  const loopedItems = [...items, ...items];

  return (
    <div className="w-full relative overflow-hidden led-screen-bg text-white py-2.5 border-y border-purple-900/50 shadow-[inset_0_1px_4px_rgba(0,0,0,0.8),0_0_15px_rgba(168,85,247,0.15)] select-none">
      {/* LED Display Screen Bezel & Soft Edge Vignette */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#04060c] via-[#04060c]/80 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#04060c] via-[#04060c]/80 to-transparent z-10" />

      {/* Infinite Seamless Scrolling LED Marquee */}
      <div className="animate-led-ticker flex items-center">
        {loopedItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="inline-flex items-center gap-3 px-5 sm:px-7 whitespace-nowrap cursor-default"
            >
              {/* LED Illuminated Item Badge */}
              <div
                className={`flex items-center gap-2 px-2.5 py-1 rounded-md border ${item.badgeColor} ${item.glow} backdrop-blur-xs`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.color} shrink-0 animate-pulse`} />
                <span className="font-mono font-black text-[11px] sm:text-xs tracking-wider">
                  {item.text}
                </span>
                <span className="text-[9.5px] font-bold opacity-75 font-mono">
                  • {item.sub}
                </span>
              </div>

              {/* Glowing LED Separator Dot */}
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.9)] animate-ping" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
