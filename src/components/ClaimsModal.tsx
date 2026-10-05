import React, { useState } from 'react';
import { X, BookOpen, Send } from 'lucide-react';
import { submitClaimToFirestore } from '../services/storeService';
import { StoreSettings } from '../types';

interface ClaimsModalProps {
  settings: StoreSettings;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ClaimsModal: React.FC<ClaimsModalProps> = ({ settings, onClose, onToast }) => {
  const [correlative] = useState(() => `LR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [typeGood, setTypeGood] = useState('Servicio Digital');
  const [service, setService] = useState('');
  const [category, setCategory] = useState<'Reclamo' | 'Queja'>('Reclamo');
  const [description, setDescription] = useState('');
  const [request, setRequest] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      onToast('Debes aceptar la declaración jurada.');
      return;
    }

    setSubmitting(true);
    try {
      await submitClaimToFirestore({
        code: correlative,
        name,
        document: docNumber,
        phone,
        email,
        typeGood,
        service,
        category,
        description,
        request,
      });

      onToast(`Hoja de ${category} ${correlative} registrada con éxito`);
      onClose();

      // Open WhatsApp to expedite
      const waMsg = `*Hoja de ${category} registrada en Libro Virtual*\n\n*N°:* ${correlative}\n*Cliente:* ${name} (DNI/CE: ${docNumber})\n*Teléfono:* ${phone}\n*Email:* ${email}\n*Servicio:* ${service}\n*Detalle:* ${description}\n*Pedido:* ${request}`;
      const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(waMsg)}`;
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error submitting claim:', err);
      onToast('Error al registrar la reclamación. Inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative max-h-[92vh] flex flex-col text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Libro de Reclamaciones Virtual
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  D.S. 011-2011-PCM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Hoja de Reclamación N°{' '}
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{correlative}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="my-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span>
            Razón Comercial: <strong>{settings.name}{settings.suffix} Digital Store</strong> • Lima, Perú
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Plazo máx. de respuesta: 15 días hábiles</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
          <div className="space-y-2">
            <span className="block font-bold text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1">
              1. Identificación del Consumidor Reclamante
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre y apellidos"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Documento (DNI / CE / RUC) *
                </label>
                <input
                  type="text"
                  required
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="N° de Documento"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+51 900 000 000"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="block font-bold text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1">
              2. Identificación del Bien Contratado
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Tipo de Bien
                </label>
                <select
                  value={typeGood}
                  onChange={(e) => setTypeGood(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Servicio Digital">Servicio Digital / Membresía</option>
                  <option value="Producto">Producto Digital</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Servicio Reclamado (ej. Netflix, ChatGPT Plus) *
                </label>
                <input
                  type="text"
                  required
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="Nombre de la cuenta o servicio"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="block font-bold text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1">
              3. Detalle de la Reclamación
            </span>
            <div className="flex items-center gap-4 py-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="claim_category"
                  value="Reclamo"
                  checked={category === 'Reclamo'}
                  onChange={() => setCategory('Reclamo')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Reclamo</span>
                <span className="text-[10px] text-slate-400">(Disconformidad con el servicio)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="claim_category"
                  value="Queja"
                  checked={category === 'Queja'}
                  onChange={() => setCategory('Queja')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Queja</span>
                <span className="text-[10px] text-slate-400">(Malestar en la atención)</span>
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Descripción de los Hechos *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Indica con detalle lo sucedido (fecha, código de pedido o incidente)..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Pedido Concreto del Consumidor *
              </label>
              <input
                type="text"
                required
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="Ej: Reposición de credencial o revisión del plan contratado"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-start gap-2 text-[10px] text-slate-500 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600"
              />
              <span>
                Declaro ser el titular del servicio o tener autorización y que los datos consignados son
                verdaderos conforme a la legislación peruana.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Registrando...' : 'Registrar Hoja de Reclamación'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
