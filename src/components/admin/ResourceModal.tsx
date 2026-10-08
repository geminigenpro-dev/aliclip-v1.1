import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Upload,
  Sparkles,
  Image as ImageIcon,
  Check,
  FolderArchive,
  HardDrive,
  Download,
  Cpu,
  Star,
  ShieldCheck,
  Link as LinkIcon,
} from 'lucide-react';
import { Product } from '../../types';
import { compressImage, resizeAndCompressImageToBase64 } from '../../utils/imageCompressor';
import { uploadFileToFirebaseStorage } from '../../firebase';
import { generateProductDescription } from '../../services/aiService';

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  onSave: (product: Product) => Promise<void>;
  onToast: (msg: string) => void;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
  onToast,
}) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [resourceFormat, setResourceFormat] = useState('Plantillas Editables (Canva)');
  const [resourceSoftware, setResourceSoftware] = useState('Canva Free & Pro');
  const [resourceSize, setResourceSize] = useState('+50.000 Elementos • 45 GB Drive');
  const [resourceLicense, setResourceLicense] = useState('Uso Personal & Comercial Libre');
  const [resourceDownloadUrl, setResourceDownloadUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [available, setAvailable] = useState<boolean>(true);
  const [stock, setStock] = useState<number>(50);
  const [p1Name, setP1Name] = useState('Acceso Permanente Drive');
  const [p1Price, setP1Price] = useState('S/ 19.90');
  const [p2Name, setP2Name] = useState('');
  const [p2Price, setP2Price] = useState('');
  const [rating, setRating] = useState('5.0');
  const [activationsCount, setActivationsCount] = useState('+2.500 Descargas');
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (productToEdit) {
      setName(productToEdit.name || '');
      setTag(productToEdit.tag || '📦 Google Drive • Descarga Inmediata');
      setDesc(productToEdit.desc || '');
      setResourceFormat(productToEdit.resourceFormat || 'Plantillas Editables (Canva)');
      setResourceSoftware(productToEdit.resourceSoftware || 'Canva Free & Pro');
      setResourceSize(productToEdit.resourceSize || '+50.000 Elementos • 45 GB Drive');
      setResourceLicense(productToEdit.resourceLicense || 'Uso Personal & Comercial Libre');
      setResourceDownloadUrl(productToEdit.resourceDownloadUrl || '');
      setImageUrl(productToEdit.imageUrl || '');
      setCoverImageUrl(productToEdit.coverImageUrl || '');
      setAvailable(productToEdit.available !== false);
      setStock(typeof productToEdit.stock === 'number' ? productToEdit.stock : 50);
      setP1Name(productToEdit.plans[0]?.name || 'Acceso Permanente Drive');
      setP1Price(productToEdit.plans[0]?.price || 'S/ 19.90');
      setP2Name(productToEdit.plans[1]?.name || '');
      setP2Price(productToEdit.plans[1]?.price || '');
      setRating(productToEdit.rating ? String(productToEdit.rating) : '5.0');
      setActivationsCount(productToEdit.activationsCount ? String(productToEdit.activationsCount) : '+2.500 Descargas');
    } else {
      setName('');
      setTag('📦 Google Drive • Descarga Inmediata');
      setDesc('');
      setResourceFormat('Plantillas Editables (Canva)');
      setResourceSoftware('Canva Free & Pro');
      setResourceSize('+50.000 Elementos • 45 GB Drive');
      setResourceLicense('Uso Personal & Comercial Libre');
      setResourceDownloadUrl('');
      setImageUrl('');
      setCoverImageUrl('');
      setAvailable(true);
      setStock(50);
      setP1Name('Acceso Permanente Drive');
      setP1Price('S/ 19.90');
      setP2Name('');
      setP2Price('');
      setRating('5.0');
      setActivationsCount('+2.500 Descargas');
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleGenerateAi = async () => {
    if (!name.trim()) {
      onToast('Ingresa primero el nombre del recurso o pack digital.');
      return;
    }
    setGeneratingAi(true);
    try {
      const generated = await generateProductDescription(name, 'resources', tag);
      setDesc(generated);
      onToast('¡Descripción del recurso generada con éxito!');
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
      onToast(`Mockup optimizado (${Math.round(compressed.dataUrl.length / 1024)} KB)`);
      (async () => {
        try {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
          const downloadURL = await uploadFileToFirebaseStorage(compressed.blob, `resources/${Date.now()}_${safeName}`);
          setImageUrl(downloadURL);
        } catch {
          // keeps dataUrl fallback
        }
      })();
    } catch {
      onToast('Error al procesar la portada del recurso.');
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
      onToast(`Banner 16:9 optimizado (${Math.round(compressed.dataUrl.length / 1024)} KB)`);
      (async () => {
        try {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
          const downloadURL = await uploadFileToFirebaseStorage(compressed.blob, `resource_covers/${Date.now()}_${safeName}`);
          setCoverImageUrl(downloadURL);
        } catch {
          // keeps dataUrl fallback
        }
      })();
    } catch {
      onToast('Error al procesar el banner del recurso.');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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

    const plans = [{ name: p1Name || 'Acceso Permanente Drive', price: p1Price || 'S/ 19.90' }];
    if (p2Name.trim() && p2Price.trim()) {
      plans.push({ name: p2Name.trim(), price: p2Price.trim() });
    }

    const payload: Product = {
      id: productToEdit?.id || `resource_${Date.now()}`,
      name: name.trim(),
      category: 'resources',
      tag: tag.trim() || '📦 Google Drive • Descarga Inmediata',
      desc: desc.trim(),
      imageUrl: safeImg,
      coverImageUrl: safeCover || '',
      resourceFormat: resourceFormat.trim(),
      resourceSoftware: resourceSoftware.trim(),
      resourceSize: resourceSize.trim(),
      resourceLicense: resourceLicense.trim(),
      resourceDownloadUrl: resourceDownloadUrl.trim(),
      available,
      stock: Math.max(0, Number(stock) || 0),
      rating: rating.trim() || '5.0',
      activationsCount: activationsCount.trim() || '+2.500 Descargas',
      plans,
      icon: 'sparkles',
    };

    setSaving(true);
    try {
      await onSave(payload);
      onToast(`Recurso "${payload.name}" guardado exitosamente.`);
      onClose();
    } catch (err) {
      console.error(err);
      onToast('Error al guardar el recurso.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-2xl w-full border border-emerald-200/80 dark:border-emerald-900/50 shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-slate-900 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {productToEdit ? 'Editar Recurso / Pack Digital' : 'Nuevo Recurso / Pack Digital'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Descargables & Plantillas
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Packs de plantillas, prompts de IA, librerías, formato y enlace directo a Google Drive.
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
          {/* Main Resource Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Nombre del Recurso / Mega Pack <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mega Pack +5.000 Prompts Premium ChatGPT & Claude"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Formato / Tipo
              </label>
              <select
                value={resourceFormat}
                onChange={(e) => setResourceFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
              >
                <option value="Plantillas Editables (Canva)">🎨 Plantillas Canva</option>
                <option value="Prompts & Guías PDF">🤖 Prompts & Guías IA</option>
                <option value="Packs Gráficos (PSD, AI, PNG)">🖌️ Gráficos PSD / Vector</option>
                <option value="Librería de Video & Audio SFX">🎬 Video & Audio SFX</option>
                <option value="Scripts & Automatización">⚡ Scripts & Código</option>
                <option value="Mega Bóveda Multi-formato">💎 Mega Bóveda Completa</option>
              </select>
            </div>
          </div>

          {/* Software, Size & License */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
            <div>
              <label className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                <span>Software Compatible</span>
              </label>
              <input
                type="text"
                value={resourceSoftware}
                onChange={(e) => setResourceSoftware(e.target.value)}
                placeholder="Ej: Canva Free & Pro, Photoshop"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                <span>Peso / Elementos</span>
              </label>
              <input
                type="text"
                value={resourceSize}
                onChange={(e) => setResourceSize(e.target.value)}
                placeholder="Ej: +50.000 Elementos • 45 GB Drive"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Licencia de Uso</span>
              </label>
              <select
                value={resourceLicense}
                onChange={(e) => setResourceLicense(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
              >
                <option value="Uso Personal & Comercial Libre">Comercial Libre</option>
                <option value="Derechos de Reventa (PLR)">Reventa (PLR)</option>
                <option value="Libre de Regalías">Libre de Regalías</option>
                <option value="Uso Exclusivo Personal">Uso Personal</option>
              </select>
            </div>
          </div>

          {/* Download Private URL */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span>Enlace Privado de Descarga / Google Drive VIP</span>
            </label>
            <input
              type="text"
              value={resourceDownloadUrl}
              onChange={(e) => setResourceDownloadUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/... (se entrega automáticamente al cliente)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          {/* Tag & Quick Badges */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Etiqueta / Badge Comercial
              </label>
              <div className="flex items-center gap-1">
                {['📦 Google Drive', '⚡ 100% Editable', '🔥 Top Ventas', '💎 Licencia Comercial'].map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => setTag(badge)}
                    className="px-1.5 py-0.5 text-[9.5px] font-bold rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 transition-colors"
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
              placeholder="Ej: 📦 Google Drive • Descarga Inmediata"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          {/* Resource Details / Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Descripción & Contenido del Pack
              </label>
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={generatingAi || !name.trim()}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-40"
              >
                <Sparkles className={`w-3.5 h-3.5 ${generatingAi ? 'animate-spin text-emerald-500' : ''}`} />
                <span>{generatingAi ? 'Generando descripción...' : 'Sugerir con Gemini AI'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Pack completo listo para usar y editar. Incluye plantillas optimizadas, guías paso a paso y acceso permanente en la nube..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          {/* Pricing Plans */}
          <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
            <span className="block text-[10.5px] font-extrabold text-emerald-900 dark:text-emerald-300 uppercase">
              💰 Inversión / Descarga (en Soles S/)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Plan Descarga Principal *</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    value={p1Name}
                    onChange={(e) => setP1Name(e.target.value)}
                    placeholder="Acceso Permanente Drive"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                  <input
                    type="text"
                    required
                    value={p1Price}
                    onChange={(e) => setP1Price(e.target.value)}
                    placeholder="S/ 19.90"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Licencia Extendida / Reventa (Opcional)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={p2Name}
                    onChange={(e) => setP2Name(e.target.value)}
                    placeholder="Licencia Reventa PLR"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                  <input
                    type="text"
                    value={p2Price}
                    onChange={(e) => setP2Price(e.target.value)}
                    placeholder="S/ 39.90"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Images (Square Mockup & 16:9 Cover) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Square Mockup */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Mockup Cuadrado del Recurso
              </label>
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Layers className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 cursor-pointer text-[11px] inline-flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>{uploadingLogo ? 'Subiendo...' : 'Subir Mockup'}</span>
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
                  <label className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 cursor-pointer text-[11px] inline-flex items-center gap-1">
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-emerald-50/30 dark:bg-slate-800/60 border border-emerald-200/50 dark:border-slate-700">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Licencias / Stock
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
                Estado Descarga
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
                {available ? '🟢 Descarga Activa' : '🔴 Pausado (Sin Stock)'}
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Calificación
              </label>
              <input
                type="text"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="5.0 ★"
                className="w-full px-2.5 py-1.5 text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Descargas Realizadas
              </label>
              <input
                type="text"
                value={activationsCount}
                onChange={(e) => setActivationsCount(e.target.value)}
                placeholder="+2.500 Descargas"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-emerald-600 dark:text-emerald-400"
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Recurso'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
