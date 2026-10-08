import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Upload,
  Sparkles,
  Image as ImageIcon,
  Check,
  Award,
  Link as LinkIcon,
  BookOpen,
  Users,
  Star,
  Video,
} from 'lucide-react';
import { Product } from '../../types';
import { compressImage, resizeAndCompressImageToBase64 } from '../../utils/imageCompressor';
import { uploadFileToFirebaseStorage } from '../../firebase';
import { generateProductDescription } from '../../services/aiService';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  onSave: (product: Product) => Promise<void>;
  onToast: (msg: string) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
  onToast,
}) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [courseLevel, setCourseLevel] = useState('De Cero a Experto');
  const [courseInstructor, setCourseInstructor] = useState('AlixPlay Academy');
  const [courseModules, setCourseModules] = useState('12 Módulos • Video HD');
  const [courseAccessUrl, setCourseAccessUrl] = useState('');
  const [courseCertification, setCourseCertification] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [available, setAvailable] = useState<boolean>(true);
  const [stock, setStock] = useState<number>(25);
  const [p1Name, setP1Name] = useState('Acceso Completo Vitalicio');
  const [p1Price, setP1Price] = useState('S/ 29.00');
  const [p2Name, setP2Name] = useState('');
  const [p2Price, setP2Price] = useState('');
  const [rating, setRating] = useState('5.0');
  const [activationsCount, setActivationsCount] = useState('+1.200 Alumnos');
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (productToEdit) {
      setName(productToEdit.name || '');
      setTag(productToEdit.tag || '🎓 Acceso Vitalicio • Drive');
      setDesc(productToEdit.desc || '');
      setCourseLevel(productToEdit.courseLevel || 'De Cero a Experto');
      setCourseInstructor(productToEdit.courseInstructor || 'AlixPlay Academy');
      setCourseModules(productToEdit.courseModules || '12 Módulos • Video HD');
      setCourseAccessUrl(productToEdit.courseAccessUrl || '');
      setCourseCertification(productToEdit.courseCertification !== false);
      setImageUrl(productToEdit.imageUrl || '');
      setCoverImageUrl(productToEdit.coverImageUrl || '');
      setAvailable(productToEdit.available !== false);
      setStock(typeof productToEdit.stock === 'number' ? productToEdit.stock : 25);
      setP1Name(productToEdit.plans[0]?.name || 'Acceso Completo Vitalicio');
      setP1Price(productToEdit.plans[0]?.price || 'S/ 29.00');
      setP2Name(productToEdit.plans[1]?.name || '');
      setP2Price(productToEdit.plans[1]?.price || '');
      setRating(productToEdit.rating ? String(productToEdit.rating) : '5.0');
      setActivationsCount(productToEdit.activationsCount ? String(productToEdit.activationsCount) : '+1.200 Alumnos');
    } else {
      setName('');
      setTag('🎓 Acceso Vitalicio • Drive');
      setDesc('');
      setCourseLevel('De Cero a Experto');
      setCourseInstructor('AlixPlay Academy');
      setCourseModules('12 Módulos • 40+ Lecciones HD');
      setCourseAccessUrl('');
      setCourseCertification(true);
      setImageUrl('');
      setCoverImageUrl('');
      setAvailable(true);
      setStock(25);
      setP1Name('Acceso Completo Vitalicio');
      setP1Price('S/ 29.00');
      setP2Name('');
      setP2Price('');
      setRating('5.0');
      setActivationsCount('+1.200 Alumnos');
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleGenerateAi = async () => {
    if (!name.trim()) {
      onToast('Ingresa primero el título del curso para sugerir el temario y descripción.');
      return;
    }
    setGeneratingAi(true);
    try {
      const generated = await generateProductDescription(name, 'courses', tag);
      setDesc(generated);
      onToast('¡Descripción académica generada con éxito!');
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
      onToast(`Miniatura optimizada (${Math.round(compressed.dataUrl.length / 1024)} KB)`);
      (async () => {
        try {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
          const downloadURL = await uploadFileToFirebaseStorage(compressed.blob, `courses/${Date.now()}_${safeName}`);
          setImageUrl(downloadURL);
        } catch {
          // keeps dataUrl fallback
        }
      })();
    } catch {
      onToast('Error al procesar la miniatura del curso.');
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
          const downloadURL = await uploadFileToFirebaseStorage(compressed.blob, `course_covers/${Date.now()}_${safeName}`);
          setCoverImageUrl(downloadURL);
        } catch {
          // keeps dataUrl fallback
        }
      })();
    } catch {
      onToast('Error al procesar la portada del curso.');
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

    const plans = [{ name: p1Name || 'Acceso Completo Vitalicio', price: p1Price || 'S/ 29.00' }];
    if (p2Name.trim() && p2Price.trim()) {
      plans.push({ name: p2Name.trim(), price: p2Price.trim() });
    }

    const payload: Product = {
      id: productToEdit?.id || `course_${Date.now()}`,
      name: name.trim(),
      category: 'courses',
      tag: tag.trim() || '🎓 Acceso Vitalicio • Drive',
      desc: desc.trim(),
      imageUrl: safeImg,
      coverImageUrl: safeCover || '',
      courseLevel: courseLevel.trim(),
      courseInstructor: courseInstructor.trim(),
      courseModules: courseModules.trim(),
      courseAccessUrl: courseAccessUrl.trim(),
      courseCertification,
      available,
      stock: Math.max(0, Number(stock) || 0),
      rating: rating.trim() || '5.0',
      activationsCount: activationsCount.trim() || '+1.200 Alumnos',
      plans,
      icon: 'sparkles',
    };

    setSaving(true);
    try {
      await onSave(payload);
      onToast(`Curso "${payload.name}" guardado exitosamente.`);
      onClose();
    } catch (err) {
      console.error(err);
      onToast('Error al guardar el curso.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-2xl w-full border border-amber-200/80 dark:border-amber-900/50 shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-slate-900 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {productToEdit ? 'Editar Curso / Masterclass' : 'Nuevo Curso / Masterclass'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Formación & Academia
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Temario, nivel, instructor, enlace privado Google Drive y cupos de formación académica.
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
          {/* Main Course Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Título del Curso / Masterclass <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Masterclass Automatización con n8n & Agentes IA"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Nivel de Formación
              </label>
              <select
                value={courseLevel}
                onChange={(e) => setCourseLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
              >
                <option value="De Cero a Experto">🚀 De Cero a Experto</option>
                <option value="Principiante">🌱 Principiante / Básico</option>
                <option value="Intermedio">⚡ Nivel Intermedio</option>
                <option value="Masterclass Avanzada">🔥 Masterclass Avanzada</option>
                <option value="Todos los Niveles">🎯 Todos los Niveles</option>
              </select>
            </div>
          </div>

          {/* Instructor & Modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
            <div>
              <label className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Instructor / Autor</span>
              </label>
              <input
                type="text"
                value={courseInstructor}
                onChange={(e) => setCourseInstructor(e.target.value)}
                placeholder="Ej: AlixPlay Academy, Ing. Certificado"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-amber-600" />
                <span>Temario & Duración</span>
              </label>
              <input
                type="text"
                value={courseModules}
                onChange={(e) => setCourseModules(e.target.value)}
                placeholder="Ej: 12 Módulos • 48 Lecciones HD + Recursos"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Access Link & Certification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Enlace Privado Bóveda / Google Drive</span>
              </label>
              <input
                type="text"
                value={courseAccessUrl}
                onChange={(e) => setCourseAccessUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/... (se entrega al alumno)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Certificación
              </label>
              <button
                type="button"
                onClick={() => setCourseCertification(!courseCertification)}
                className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  courseCertification
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                }`}
              >
                <Award className={`w-4 h-4 ${courseCertification ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{courseCertification ? 'Con Certificado' : 'Sin Certificado'}</span>
              </button>
            </div>
          </div>

          {/* Tag & Quick Badges */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Etiqueta / Badge Promocional
              </label>
              <div className="flex items-center gap-1">
                {['🎓 Acceso Vitalicio', '⚡ Actualizado 2025', '🔥 Top Alumnos', '💎 Certificado'].map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => setTag(badge)}
                    className="px-1.5 py-0.5 text-[9.5px] font-bold rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 transition-colors"
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
              placeholder="Ej: 🎓 Acceso Vitalicio • Drive Ilimitado"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          {/* Course Syllabus / Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Temario, Objetivos & Lo que aprenderás
              </label>
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={generatingAi || !name.trim()}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-40"
              >
                <Sparkles className={`w-3.5 h-3.5 ${generatingAi ? 'animate-spin text-amber-500' : ''}`} />
                <span>{generatingAi ? 'Generando temario...' : 'Sugerir con Gemini AI'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Aprende desde las bases hasta técnicas avanzadas. Incluye ejercicios prácticos, prompts listos para copiar, soporte y acceso de por vida..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          {/* Course Pricing Plans */}
          <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40 space-y-2">
            <span className="block text-[10.5px] font-extrabold text-amber-900 dark:text-amber-300 uppercase">
              💰 Inversión / Matrícula (en Soles S/)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Plan Matrícula Principal *</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    value={p1Name}
                    onChange={(e) => setP1Name(e.target.value)}
                    placeholder="Acceso Completo Vitalicio"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                  <input
                    type="text"
                    required
                    value={p1Price}
                    onChange={(e) => setP1Price(e.target.value)}
                    placeholder="S/ 29.00"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Plan VIP / Con Mentoría (Opcional)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={p2Name}
                    onChange={(e) => setP2Name(e.target.value)}
                    placeholder="Acceso VIP + Mentoría"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                  <input
                    type="text"
                    value={p2Price}
                    onChange={(e) => setP2Price(e.target.value)}
                    placeholder="S/ 49.00"
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Images (Square Thumbnail & 16:9 Cover) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Square Thumbnail */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2">
              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Miniatura Cuadrada del Curso
              </label>
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <GraduationCap className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold rounded-lg border border-amber-200 dark:border-amber-800 cursor-pointer text-[11px] inline-flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>{uploadingLogo ? 'Subiendo...' : 'Subir Miniatura'}</span>
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
                  <label className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold rounded-lg border border-amber-200 dark:border-amber-800 cursor-pointer text-[11px] inline-flex items-center gap-1">
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

          {/* Cupos, Availability & Social Proof */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-amber-50/30 dark:bg-slate-800/60 border border-amber-200/50 dark:border-slate-700">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Cupos Disponibles
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
                Estado Inscripción
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
                {available ? '🟢 Cupos Abiertos' : '🔴 Agotado / Cerrado'}
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Calificación Alumnos
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
                Alumnos Matriculados
              </label>
              <input
                type="text"
                value={activationsCount}
                onChange={(e) => setActivationsCount(e.target.value)}
                placeholder="+1.200 Alumnos"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-amber-600 dark:text-amber-400"
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
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black shadow-md shadow-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Curso'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
