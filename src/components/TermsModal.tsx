import React from 'react';
import { X, ShieldCheck, CheckCircle } from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 relative max-h-[90vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Términos, Condiciones y Garantía</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Transparencia, respaldo y políticas de uso de Alixplay</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-slate-600 dark:text-slate-300 pr-1 leading-relaxed">
          <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200">
            <strong className="block font-bold mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Compromiso de Garantía Total Alixplay
            </strong>
            Todas las cuentas y perfiles adquiridos cuentan con <strong>garantía ininterrumpida</strong> por el
            periodo exacto contratado (30 días para planes mensuales o 90 días para planes trimestrales). Ante
            cualquier eventualidad técnica, nuestro soporte responderá de inmediato.
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
              1. Tiempos de Entrega & Activación
            </h4>
            <p>
              Una vez verificado el comprobante de pago mediante Yape, Plin, BCP, Interbank o Binance Pay, la
              entrega de credenciales se realiza en un promedio de <strong>3 a 10 minutos</strong> dentro de
              nuestro horario habitual (8:00 AM a 11:30 PM - Hora de Perú).
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
              2. Modalidades de Membresías (Privadas vs. Perfiles VIP)
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-[11.5px]">
              <li>
                <strong>Cuentas Privadas / Personales:</strong> Son de uso exclusivo para el usuario o su correo
                electrónico directo. No se comparten con terceras personas.
              </li>
              <li>
                <strong>Perfiles VIP Compartidos:</strong> Cuentas administradas donde se le asigna 1 pantalla o
                perfil con PIN exclusivo. El usuario se compromete a no modificar la contraseña principal para
                mantener la estabilidad del servicio.
              </li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
              3. Procedimiento de Soporte y Reposición
            </h4>
            <p>
              En caso de que una plataforma experimente bloqueos de contraseña o cierres por actualización de
              proveedor, nuestro equipo realiza la verificación y <strong>reposición o reactivación en el menor
              tiempo posible</strong> sin costo alguno durante todo el periodo vigente.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
              4. Renovaciones Continuas
            </h4>
            <p>
              Los clientes pueden solicitar su renovación antes de la fecha de corte para conservar sus historiales,
              chats en herramientas de IA (ChatGPT, Claude) y perfiles en plataformas de streaming.
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            Entendido, Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
