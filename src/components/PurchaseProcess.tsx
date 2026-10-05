import React from 'react';
import { ArrowRight } from 'lucide-react';
import { StoreSettings } from '../types';

interface PurchaseProcessProps {
  settings: StoreSettings;
}

export const PurchaseProcess: React.FC<PurchaseProcessProps> = ({ settings }) => {
  const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    `Hola ${settings.name}${settings.suffix}, deseo consultar por una membresía`
  )}`;

  return (
    <section className="py-7 bg-white dark:bg-[#0b0f19] border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Flujo Rápido
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">¿Cómo Comprar en 4 Pasos?</h2>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Atención guiada por WhatsApp</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              01
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Elige tu Plan</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Selecciona el servicio y la modalidad (1 mes, 3 meses o perfil privado).
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              02
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Realiza el Pago</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Transfiere mediante Yape, Plin, BCP o Binance Pay sin comisiones ocultas.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              03
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Envía Captura</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Comparte el comprobante al WhatsApp oficial para validación inmediata.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              04
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Recibe tu Acceso</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                En menos de 3 minutos recibes tus credenciales con garantía total activa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
