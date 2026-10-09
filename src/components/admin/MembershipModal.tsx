import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Upload,
  Sparkles,
  Image as ImageIcon,
  Check,
  Film,
  Zap,
} from 'lucide-react';
import { Product } from '../../types';
import { compressImage, resizeAndCompressImageToBase64 } from '../../utils/imageCompressor';
import { uploadFileToFirebaseStorage } from '../../firebase';
import { generateProductDescription } from '../../services/aiService';
import {
  validateDescriptiveText,
  detectMaliciousPayload,
  sanitizeSingleLine,
} from '../../utils/securityValidator';

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  onSave: (product: Product) => Promise<void>;
  onToast: (msg: string) => void;
}

export const MembershipModal: React.FC<MembershipModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
  onToast,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'ai' | 'streaming' | 'utility'>('ai');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [accountType, setAccountType] = useState<'perfil_privado' | 'perfil_compartido' | 'cuenta_privada' | 'cuenta_compartida'>('perfil_privado');
  const [durationUnit, setDurationUnit] = useState<'dias' | 'meses' | 'anos'>('meses');
  const [durationValue, setDurationValue] = useState<number>(1);
  const [available, setAvailable] = useState<boolean>(true);
  const [stock, setStock] = useState<number>(10);
  const [p1Name, setP1Name] = useState('1 Mes VIP');
  const [p1Price, setP1Price] = useState('S/ 25.00');
  const [p2Name, setP2Name] = useState('');
  const [p2Price, setP2Price] = useState('');
  const [rating, setRating] = useState('4.9');
  const [activationsCount, setActivationsCount] = useState('+2.400 Activaciones');
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (productToEdit) {
      setName(productToEdit.name || '');
      setCategory(
        productToEdit.category === 'streaming' || productToEdit.category === 'utility'
          ? productToEdit.category
          : 'ai'
      );
      setTag(productToEdit.tag || '');
      setDesc(productToEdit.desc || '');
      setImageUrl(productToEdit.imageUrl || '');
      setCoverImageUrl(productToEdit.coverImageUrl || '');
      setAccountType(productToEdit.accountType || 'perfil_privado');
      setDurationUnit(productToEdit.durationUnit || 'meses');
      setDurationValue(productToEdit.durationValue || 1);
      setAvailable(productToEdit.available !== false);
      setStock(typeof productToEdit.stock === 'number' ? productToEdit.stock : 10);
      setP1Name(productToEdit.plans[0]?.name || '1 Mes VIP');
      setP1Price(productToEdit.plans[0]?.price || 'S/ 25.00');
      setP2Name(productToEdit.plans[1]?.name || '');
      setP2Price(productToEdit.plans[1]?.price || '');
      setRating(productToEdit.rating ? String(productToEdit.rating) : '4.9');
      setActivationsCount(productToEdit.activationsCount ? String(productToEdit.activationsCount) : '+2.400 Activaciones');
    } else {
      setName('');
      setCategory('ai');
      setTag('⚡ Entrega en 3 Min');
      setDesc('');
      setImageUrl('');
      setCoverImageUrl('');
      setAccountType('perfil_privado');
      setDurationUnit('meses');
      setDurationValue(1);
      setAvailable(true);
      setStock(10);
      setP1Name('1 Mes VIP');
      setP1Price('S/ 25.00');
      setP2Name('');
      setP2Price('');
      setRating('4.9');
      setActivationsCount('+2.400 Activaciones');
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleGenerateAi = async () => {
    if (!name.trim()) {
      onToast('Ingresa primero el nombre del servicio para sugerir su descripción.');
      return;
    }
    setGeneratingAi(true);
    try {
      const generated = await generateProductDescription(name, category, tag);
      setDesc(generated);
      onToast('¡Descripción comercial generada con éxito!');
    } catch {
      onToast('No se pudo generar la descripción automáticamente.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const compressed = await compressImage(file, 320, 320, 0.82);
      setImageUrl(compressed.dataUrl);
      onToast(`Logotipo optimizado (${Math.round(compressed.dataUrl.length / 1024)} KB)`);
      (async () => {
        try {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
          const downloadURL = await uploadFileToFirebaseStorage(compressed.blob, `products/${Date.now()}_${safeName}`);
          setImageUrl(downloadURL);
        } catch {
          // keeps dataUrl fallback
        }
      })();
    } catch {
      onToast('Error al procesar la imagen del logotipo.');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const compressed = await compressImage(file, 800, 450, 0.82);
      setCoverImageUrl(compressed.dataUrl);
      onToast(`Portada 16:9 optimizada (${Math.round(compressed.dataUrl.length / 1024)} KB)`);
      (async () => {
        try {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
          const downloadURL = await uploadFileToFirebaseStorage(compressed.blob, `product_covers/${Date.now()}_${safeName}`);
          setCoverImageUrl(downloadURL);
        } catch {
          // keeps dataUrl fallback
        }
      })();
    } catch {
      onToast('Error al procesar la portada.');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Validación estricta del nombre del producto
    const nameVal = validateDescriptiveText(name, { label: 'Nombre del servicio', minLength: 2, maxLength: 80, required: true });
    if (!nameVal.valid) {
      onToast(`⚠️ ${nameVal.error}`);
      return;
    }

    // Validación de etiqueta y descripción
    const tagVal = validateDescriptiveText(tag, { label: 'Etiqueta comercial', maxLength: 60 });
    if (!tagVal.valid) {
      onToast(`⚠️ ${tagVal.error}`);
      return;
    }

    const descVal = validateDescriptiveText(desc, { label: 'Descripción', minLength: 5, maxLength: 800 });
    if (!descVal.valid) {
      onToast(`⚠️ ${descVal.error}`);
      return;
    }

    // Validación de nombres y precios de planes
    const planItems = [p1Name, p1Price, p2Name, p2Price];
    for (const p of planItems) {
      if (p) {
        const check = detectMaliciousPayload(p);
        if (check.isMalicious) {
          onToast(`⚠️ Plan o precio rechazado: ${check.reason}`);
          return;
        }
      }
    }

    let safeImg = imageUrl.trim();
    if (safeImg.length > 500000) {
      try {
        safeImg = await resizeAndCompressImageToBase64(safeImg, { maxWidth: 320, maxHeight: 320, quality: 0.8 });
      } catch {
        // fallback
      }
    }

    let safeCover = coverImageUrl.trim();
    if (safeCover.length > 500000) {
      try {
        safeCover = await resizeAndCompressImageToBase64(safeCover, { maxWidth: 800, maxHeight: 450, quality: 0.78 });
      } catch {
        // fallback
      }
    }

    const plans = [{ name: p1Name || '1 Mes VIP', price: p1Price || 'S/ 25.00' }];
    if (p2Name.trim() && p2Price.trim()) {
      plans.push({ name: p2Name.trim(), price: p2Price.trim() });
    }

    const durationText = `${durationValue} ${
      durationUnit === 'dias'
        ? durationValue === 1 ? 'Día' : 'Días'
        : durationUnit === 'meses'
        ? durationValue === 1 ? 'Mes' : 'Meses'
        : durationValue === 1 ? 'Año' : 'Años'
    }`;

    const payload: Product = {
      id: productToEdit?.id || `prod_${Date.now()}`,
      name: name.trim(),
      category,
      tag: tag.trim() || 'Membresía Digital',
      desc: desc.trim(),
      imageUrl: safeImg,
      coverImageUrl: safeCover || '',
      accountType,
      durationUnit,
      durationValue: Number(durationValue) || 1,
      durationText,
      available,
      stock: Math.max(0, Number(stock) || 0),
      rating: rating.trim() || '4.9',
      activationsCount: activationsCount.trim() || '+2.400 Activaciones',
      plans,
      icon: category === 'ai' ? 'sparkles' : 'film',
    };

    setSaving(true);
    try {
      await onSave(payload);
      onToast(`Membresía "${payload.name}" guardada con éxito.`);
      onClose();
    } catch (err) {
      console.error(err);
      onToast('Error al guardar la membresía.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {productToEdit ? 'Editar Membresía & Cuenta' : 'Nueva Membresía & Cuenta'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Streaming & IA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configura cuentas completas, perfiles con PIN, duración y precios de suscripción.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto max-h-[78vh] space-y-4 text-xs">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Servicio / Plataforma <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: ChatGPT Plus, Netflix VIP, Spotify Premium"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
              >
                <option value="ai">🤖 Inteligencia Artificial</option>
                <option value="streaming">🎬 Streaming & Series</option>
                <option value="utility">⚙️ Utilidades & Software</option>
              </select>
            </div>
          </div>

          {/* Tag & Quick Badges */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Etiqueta / Badge Comercial
              </label>
              <div className="flex items-center gap-1">
                {['🔥 Oferta Flash', '⚡ Entrega en 3 Min', '🛡️ Garantía 100%', '4K UHD'].map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => setTag(badge)}
                    className="px-1.5 py-0.5 text-[9.5px] font-bold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {badge}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Ej: ⚡ Entrega en 3 Minutos • 4K UHD Ultra"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          {/* Commercial Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Descripción & Beneficios
              </label>
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={generatingAi || !name.trim()}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40"
              >
                <Sparkles className={`w-3.5 h-3.5 ${generatingAi ? 'animate-spin text-amber-500' : ''}`} />
                <span>{generatingAi ? 'Generando con IA...' : 'Sugerir con Gemini AI'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Acceso exclusivo a perfil privado con PIN personal, garantía total de reemplazo y entrega inmediata..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          {/* Account Modality & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Modalidad de Cuenta
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
              >
                <option value="perfil_privado">👤 Perfil Privado (con PIN individual)</option>
                <option value="cuenta_privada">🔒 Cuenta Completa Privada (acceso total)</option>
                <option value="perfil_compartido">👥 Perfil Compartido</option>
                <option value="cuenta_compartida">🌐 Cuenta Compartida</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                  Duración del Servicio
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setDurationValue(1); setDurationUnit('meses'); }}
                    className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  >
                    1 Mes
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDurationValue(3); setDurationUnit('meses'); }}
                    className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  >
                    3 Meses
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={durationValue}
                  onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-2.5 py-2 text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-black"
                />
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as any)}
                  className="flex-1 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                >
                  <option value="dias">Días</option>
                  <option value="meses">Meses</option>
                  <option value="anos">Años</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
              💰 Planes de Suscripción (en Soles S/)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Plan Principal *</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    value={p1Name}
                    onChange={(e) => setP1Name(e.target.value)}
                    placeholder="1 Mes VIP"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                  <input
                    type="text"
                    required
                    value={p1Price}
                    onChange={(e) => setP1Price(e.target.value)}
                    placeholder="S/ 25.00"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Plan Secundario / Oferta</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={p2Name}
                    onChange={(e) => setP2Name(e.target.value)}
                    placeholder="3 Meses VIP (Opcional)"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                  <input
                    type="text"
                    value={p2Price}
                    onChange={(e) => setP2Price(e.target.value)}
                    placeholder="S/ 69.00"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Images (Square Logo & 16:9 Cover) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Square Logo */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Logotipo / Icono Cuadrado
              </label>
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Package className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 cursor-pointer text-[11px] inline-flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>{uploadingLogo ? 'Subiendo...' : 'Subir Imagen'}</span>
                    <input type="file" accept="image/*" disabled={uploadingLogo} onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="O URL externa https://..."
                    className="w-full px-2 py-1 text-[10px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* 16:9 Cover */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Portada 16:9 Banner
              </label>
              <div className="flex items-center gap-2.5">
                <div className="w-16 h-10 rounded-lg bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                  {coverImageUrl ? (
                    <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 cursor-pointer text-[11px] inline-flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>{uploadingCover ? 'Subiendo...' : 'Subir 16:9'}</span>
                    <input type="file" accept="image/*" disabled={uploadingCover} onChange={handleCoverUpload} className="hidden" />
                  </label>
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="O URL 16:9 externa..."
                    className="w-full px-2 py-1 text-[10px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stock, Availability & Social Proof */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Stock / Unidades
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-2.5 py-1.5 text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Disponibilidad
              </label>
              <button
                type="button"
                onClick={() => setAvailable(!available)}
                className={`w-full py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  available
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                }`}
              >
                {available ? '🟢 Activo en Venta' : '🔴 Pausado (Sin Stock)'}
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Calificación (Rating)
              </label>
              <input
                type="text"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="4.9"
                className="w-full px-2.5 py-1.5 text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Activaciones / Ventas
              </label>
              <input
                type="text"
                value={activationsCount}
                onChange={(e) => setActivationsCount(e.target.value)}
                placeholder="+2.400 Activaciones"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-purple-600 dark:text-purple-400"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Membresía'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
