import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { StoreSettings, FaqItemSetting } from '../types';

interface FaqSectionProps {
  settings?: StoreSettings;
}

const DEFAULT_FAQ_LIST: FaqItemSetting[] = [
  {
    question: '¿En cuánto tiempo entregan la cuenta tras realizar el pago?',
    answer:
      'El tiempo promedio de activación es de 2 a 5 minutos una vez enviado el comprobante a nuestro WhatsApp oficial. Nuestro equipo está conectado de lunes a domingo.',
  },
  {
    question: '¿Las cuentas de ChatGPT Plus y Claude Pro son privadas o compartidas?',
    answer:
      'Ofrecemos ambas opciones claramente identificadas: Cuentas 100% privadas (con tu correo o correo exclusivo nuevo) y Perfiles VIP compartidos de bajo costo. Puedes elegir tu modalidad favorita en el selector de cada tarjeta.',
  },
  {
    question: '¿Qué garantía tengo ante cualquier caída o cambio de política?',
    answer:
      'Cuentas con Garantía Total por los 30 días o el tiempo contratado. Si una cuenta presenta inconvenientes, se restablece o reemplaza sin ningún cobro adicional.',
  },
  {
    question: '¿Puedo renovar la misma cuenta el siguiente mes?',
    answer:
      'Sí. En servicios como Netflix, ChatGPT, Disney+ y Spotify puedes renovar con anticipación para mantener tus perfiles, listas, historial y configuraciones intactas.',
  },
];

export const FaqSection: React.FC<FaqSectionProps> = ({ settings }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const faqList = settings?.faqItems && settings.faqItems.length > 0 ? settings.faqItems : DEFAULT_FAQ_LIST;

  return (
    <section id="faq" className="py-8 bg-slate-50 dark:bg-[#0b0f19] border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
            {settings?.faqSectionBadge || 'Dudas Resueltas'}
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {settings?.faqSectionTitle || 'Preguntas Frecuentes'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {settings?.faqSectionDescription || 'Todo lo que necesitas saber antes de solicitar tu membresía digital.'}
          </p>
        </div>

        <div className="space-y-2">
          {faqList.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-3.5 font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-3.5 pt-0 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
