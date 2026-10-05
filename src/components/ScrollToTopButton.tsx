import React, { useState, useEffect } from 'react';
import { ArrowUp, Rocket } from 'lucide-react';

interface ScrollToTopButtonProps {
  primaryColor?: string;
  accentColor?: string;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  primaryColor = '#ec4899',
  accentColor = '#8b5cf6',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [parallaxOffset, setParallaxOffset] = useState({ y: 0, rotate: 0 });

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100)) : 0;

          setScrollProgress(progress);
          setIsVisible(scrollY > 320);

          // Parallax calculation: Subtle dynamic floating depth based on scroll rate and scroll progress
          const offset = Math.sin(scrollY / 120) * 6;
          const tilt = Math.cos(scrollY / 150) * 4;
          setParallaxOffset({ y: offset, rotate: tilt });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  // Circular progress dimensions
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className="fixed bottom-18 sm:bottom-20 right-4 sm:right-5 z-30 transition-all duration-300 ease-out select-none pointer-events-none"
      style={{
        transform: `translate3d(0, ${parallaxOffset.y}px, 0) rotate(${parallaxOffset.rotate}deg)`,
      }}
    >
      {/* Subtle ambient glow behind the button */}
      <div
        className="absolute inset-0 rounded-full blur-md opacity-40 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${primaryColor}90 0%, ${accentColor}60 70%, transparent 100%)`,
        }}
      />

      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Volver arriba"
        title={`Volver arriba (${Math.round(scrollProgress)}%)`}
        className="pointer-events-auto relative group w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0d1326]/90 hover:bg-[#121933] border border-white/20 dark:border-purple-500/40 shadow-lg backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
      >
        {/* SVG Progress Circle Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"
          viewBox="0 0 52 52"
        >
          {/* Background track circle */}
          <circle
            cx="26"
            cy="26"
            r={radius}
            className="stroke-slate-700/40"
            strokeWidth="2.5"
            fill="transparent"
          />
          {/* Animated Progress Circle */}
          <circle
            cx="26"
            cy="26"
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-[stroke-dashoffset] duration-150 ease-out"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor={accentColor} />
            </linearGradient>
          </defs>
        </svg>

        {/* Central Icon: Arrow transforms to Rocket on hover with parallax lift */}
        <div className="relative z-10 flex items-center justify-center text-white transition-transform duration-300 group-hover:-translate-y-0.5">
          <ArrowUp className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:text-pink-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
        </div>

        {/* Floating Percentage Tooltip on Hover */}
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-[#0a0f1d] border border-purple-500/30 text-[10px] font-black text-pink-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md">
          {Math.round(scrollProgress)}%
        </span>
      </button>
    </div>
  );
};
