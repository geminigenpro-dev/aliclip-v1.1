import React from 'react';
import { PaymentMethod } from '../types';

export const YapeLogo: React.FC<{ className?: string }> = ({ className = 'h-6 w-auto' }) => (
  <svg
    viewBox="0 0 100 34"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Logo Yape"
  >
    <rect width="100" height="34" rx="7" fill="#742284" />
    <g fill="#FFFFFF">
      {/* y */}
      <path d="M22 9h4l3.5 7.2L33 9h4l-5.8 10.5V25h-3.4v-5.5L22 9z" />
      {/* a */}
      <path d="M42 14c2.5 0 4.2 1.6 4.2 4.1v6.9h-3.2v-1.8c-.8 1.2-2 2-3.6 2-2.3 0-3.9-1.5-3.9-3.7 0-2.3 1.8-3.7 4.3-3.7h3.2v-.3c0-1.2-.8-1.9-2.1-1.9-1.2 0-2.1.5-2.5 1.4l-2.8-.8c.8-1.8 2.5-2.5 5.1-2.5zm2 6.1h-2.8c-1.1 0-1.8.6-1.8 1.6 0 1 .7 1.6 1.8 1.6 1.5 0 2.8-1 2.8-2.4v-.8z" />
      {/* p */}
      <path d="M50 14.3h3.2v1.6c.8-1.1 2.1-1.9 3.7-1.9 2.9 0 5 2.2 5 5.8 0 3.5-2.1 5.8-5 5.8-1.5 0-2.8-.7-3.6-1.8V30H50V14.3zm6.6 3.6c-1.7 0-2.9 1.3-2.9 3.3 0 2 1.2 3.3 2.9 3.3 1.6 0 2.8-1.3 2.8-3.3 0-2-1.2-3.3-2.8-3.3z" />
      {/* e */}
      <path d="M65.5 19.8c.1 3 2 4.5 4.4 4.5 1.6 0 2.9-.6 3.6-1.9l2.6 1.3c-1.2 2-3.5 3.1-6.2 3.1-4.1 0-7.1-2.7-7.1-6.5 0-3.9 2.9-6.6 6.9-6.6 4.2 0 6.7 2.9 6.7 6.5v.7h-10.9zm7.7-2.1c-.2-1.9-1.4-3.1-3.3-3.1-1.9 0-3.2 1.2-3.5 3.1h6.8z" />
    </g>
    <circle cx="85" cy="17" r="4.2" fill="#00D4B2" />
  </svg>
);

export const PlinLogo: React.FC<{ className?: string }> = ({ className = 'h-6 w-auto' }) => (
  <svg
    viewBox="0 0 95 34"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Logo Plin"
  >
    <rect width="95" height="34" rx="7" fill="#00D4B2" />
    <circle cx="21" cy="17" r="9" fill="#002D72" />
    <circle cx="21" cy="17" r="4" fill="#00D4B2" />
    <g fill="#002D72" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">
      <text x="36" y="23" fontSize="17" letterSpacing="-0.5px">
        plin
      </text>
    </g>
  </svg>
);

export const DualYapePlinLogo: React.FC<{ className?: string }> = ({
  className = 'h-6 w-auto',
}) => (
  <div className="flex items-center gap-1.5 justify-center">
    <YapeLogo className={className} />
    <PlinLogo className={className} />
  </div>
);

export const BcpLogo: React.FC<{ className?: string }> = ({ className = 'h-6 w-auto' }) => (
  <svg
    viewBox="0 0 100 34"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Logo BCP"
  >
    <rect width="100" height="34" rx="7" fill="#002A8F" />
    <g
      fill="#FFFFFF"
      fontWeight="900"
      fontStyle="italic"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      <text x="14" y="24" fontSize="20" letterSpacing="-0.5px">
        BCP
      </text>
    </g>
    <path d="M72 10l9 7-9 7h8l9-7-9-7h-8z" fill="#FF7800" />
  </svg>
);

export const InterbankLogo: React.FC<{ className?: string }> = ({ className = 'h-6 w-auto' }) => (
  <svg
    viewBox="0 0 115 34"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Logo Interbank"
  >
    <rect width="115" height="34" rx="7" fill="#009B3A" />
    <circle cx="20" cy="17" r="8" fill="#0039A6" />
    <path d="M20 12v10M16 17h8" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    <g fill="#FFFFFF" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">
      <text x="35" y="23" fontSize="15" letterSpacing="-0.3px">
        Interbank
      </text>
    </g>
  </svg>
);

export const BinancePayLogo: React.FC<{ className?: string }> = ({
  className = 'h-6 w-auto',
}) => (
  <svg
    viewBox="0 0 125 34"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Logo Binance Pay"
  >
    <rect width="125" height="34" rx="7" fill="#181A20" />
    <g fill="#F0B90B">
      <path d="M19 17l-3-3 3-3 3 3-3 3z" />
      <path d="M14 17l-2-2 2-2 2 2-2 2z" />
      <path d="M24 17l-2-2 2-2 2 2-2 2z" />
      <path d="M19 10l-2-2 2-2 2 2-2 2z" />
      <path d="M19 24l-2-2 2-2 2 2-2 2z" />
    </g>
    <g fill="#FFFFFF" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">
      <text x="34" y="22" fontSize="13" letterSpacing="0.2px">
        BINANCE <tspan fill="#F0B90B">PAY</tspan>
      </text>
    </g>
  </svg>
);

export const BbvaLogo: React.FC<{ className?: string }> = ({ className = 'h-6 w-auto' }) => (
  <svg
    viewBox="0 0 100 34"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Logo BBVA"
  >
    <rect width="100" height="34" rx="7" fill="#004481" />
    <g fill="#FFFFFF" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">
      <text x="50" y="24" fontSize="19" textAnchor="middle" letterSpacing="0.5px">
        BBVA
      </text>
    </g>
  </svg>
);

interface PaymentMethodLogoProps {
  method: PaymentMethod;
  className?: string;
}

export const PaymentMethodLogo: React.FC<PaymentMethodLogoProps> = ({
  method,
  className = 'h-6 max-h-7 max-w-full object-contain',
}) => {
  if (method.logoUrl) {
    return (
      <img
        src={method.logoUrl}
        alt={method.name}
        className={className}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  const id = (method.id || '').toLowerCase();
  const name = (method.name || '').toLowerCase();

  if (name.includes('yape') && name.includes('plin')) {
    return <DualYapePlinLogo className={className} />;
  }
  if (id.includes('yape') || name.includes('yape')) {
    return <YapeLogo className={className} />;
  }
  if (id.includes('plin') || name.includes('plin')) {
    return <PlinLogo className={className} />;
  }
  if (id.includes('binance') || name.includes('binance') || name.includes('usdt')) {
    return <BinancePayLogo className={className} />;
  }
  if (id.includes('bcp') || name.includes('bcp')) {
    return <BcpLogo className={className} />;
  }
  if (id.includes('interbank') || name.includes('interbank')) {
    return <InterbankLogo className={className} />;
  }
  if (id.includes('bbva') || name.includes('bbva')) {
    return <BbvaLogo className={className} />;
  }

  // Fallback branded logo badge
  return (
    <div
      className="px-3 py-1 rounded-md flex items-center justify-center font-black text-[11px] text-white shadow-2xs tracking-wide uppercase"
      style={{ backgroundColor: method.color || '#4f46e5' }}
    >
      {method.name}
    </div>
  );
};
