import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface ReceiptQrCodeProps {
  value: string;
  size?: number; // size in px, e.g. 100, 120, 140
  label?: string;
  className?: string;
}

export const ReceiptQrCode: React.FC<ReceiptQrCodeProps> = ({
  value,
  size = 110,
  label = 'VERIFICAR',
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      try {
        const payload = value && value.trim() ? value.trim() : 'https://aliclip.site/garantia';
        const url = await QRCode.toDataURL(payload, {
          width: size * 2.5, // 2.5x retina resolution for ultra-sharp camera scanning
          margin: 1.5, // optimal quiet zone
          errorCorrectionLevel: 'M', // 15% recovery, fast mobile scanning
          color: {
            dark: '#000000', // pure solid black for maximum optical contrast
            light: '#ffffff', // pure white background
          },
        });
        if (isMounted) {
          setDataUrl(url);
        }
      } catch (err) {
        console.warn('Error generating QR code:', err);
      }
    };

    generateQr();
    return () => {
      isMounted = false;
    };
  }, [value, size]);

  return (
    <div
      className={`bg-white rounded-xl p-2 border border-slate-200/90 shadow-xs flex flex-col items-center justify-center shrink-0 select-none ${className}`}
      style={{
        width: size + 16,
      }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="Código QR de Verificación Oficial"
          className="object-contain block rounded-sm"
          style={{
            width: size,
            height: size,
            imageRendering: 'pixelated', // Keep corners and finder patterns crisp
          }}
        />
      ) : (
        <div
          className="bg-slate-100 animate-pulse rounded flex items-center justify-center text-[9px] text-slate-400 font-mono"
          style={{ width: size, height: size }}
        >
          Cargando QR...
        </div>
      )}
      {label && (
        <div className="mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black tracking-wider text-slate-800 uppercase font-mono leading-none">
            {label}
          </span>
        </div>
      )}
    </div>
  );
};
