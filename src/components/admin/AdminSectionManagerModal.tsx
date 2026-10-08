import React, { useState } from 'react';
import {
  X,
  GripVertical,
  Edit2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  LayoutGrid,
  Globe,
  Shield,
  Search,
} from 'lucide-react';
import {
  StoreSettings,
  AdminSectionConfig,
  StoreCategoryConfig,
  StorefrontSectionConfig,
} from '../../types';
import {
  DEFAULT_ADMIN_SECTIONS,
  DEFAULT_STORE_CATEGORIES,
  DEFAULT_STOREFRONT_SECTIONS,
  mergeAdminSectionsWithDefaults,
  saveSettingsToFirestore,
} from '../../services/storeService';
import { AVAILABLE_ADMIN_ICONS, getAdminIcon, AdminIcon } from '../../utils/adminIcons';

interface AdminSectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onToast: (msg: string) => void;
}

export const AdminSectionManagerModal: React.FC<AdminSectionManagerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onToast,
}) => {
  if (!isOpen) return null;

  const [activeManagerTab, setActiveManagerTab] = useState<'admin' | 'categories' | 'storefront'>('admin');
  const [saving, setSaving] = useState(false);

  // Local editable copies
  const [adminSections, setAdminSections] = useState<AdminSectionConfig[]>(() => {
    return mergeAdminSectionsWithDefaults(settings.adminSections);
  });

  const [storeCategories, setStoreCategories] = useState<StoreCategoryConfig[]>(() => {
    return Array.isArray(settings.storeCategories) && settings.storeCategories.length > 0
      ? [...settings.storeCategories].sort((a, b) => a.order - b.order)
      : [...DEFAULT_STORE_CATEGORIES];
  });

  const [storefrontSections, setStorefrontSections] = useState<StorefrontSectionConfig[]>(() => {
    return Array.isArray(settings.storefrontSections) && settings.storefrontSections.length > 0
      ? [...settings.storefrontSections].sort((a, b) => a.order - b.order)
      : [...DEFAULT_STOREFRONT_SECTIONS];
  });

  // State for item currently open in inline editor / icon picker
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [iconPickerOpenForId, setIconPickerOpenForId] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState('');

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Handlers for Admin Sections Drag & Drop
  const handleAdminDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', index.toString());
    } catch {}
  };

  const handleAdminDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleAdminDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...adminSections];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, moved);

    // Reassign order
    const reordered = updated.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setAdminSections(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleAdminDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveAdminSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= adminSections.length) return;

    const updated = [...adminSections];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    setAdminSections(reordered);
  };

  const toggleAdminSectionEnabled = (id: string) => {
    setAdminSections((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const updateAdminSectionField = (id: string, field: keyof AdminSectionConfig, value: any) => {
    setAdminSections((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Handlers for Store Categories
  const moveStoreCategory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= storeCategories.length) return;

    const updated = [...storeCategories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    setStoreCategories(reordered);
  };

  const toggleStoreCategoryEnabled = (id: string) => {
    setStoreCategories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const updateStoreCategoryField = (id: string, field: keyof StoreCategoryConfig, value: any) => {
    setStoreCategories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Handlers for Storefront Blocks
  const toggleStorefrontSectionEnabled = (id: string) => {
    setStorefrontSections((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  // Save all changes
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const newSettings: StoreSettings = {
        ...settings,
        adminSections,
        storeCategories,
        storefrontSections,
        // Also keep legacy tab labels in sync for maximum backward compatibility
        categoryTabAi: storeCategories.find((c) => c.id === 'ai')?.label || settings.categoryTabAi,
        categoryTabStreaming: storeCategories.find((c) => c.id === 'streaming')?.label || settings.categoryTabStreaming,
        categoryTabCourses: storeCategories.find((c) => c.id === 'courses')?.label || settings.categoryTabCourses,
        categoryTabResources: storeCategories.find((c) => c.id === 'resources')?.label || settings.categoryTabResources,
      };

      await saveSettingsToFirestore(newSettings);
      onUpdateSettings(newSettings);
      onToast('¡Secciones, posiciones y visibilidad guardadas con éxito!');
      onClose();
    } catch (err: any) {
      console.error('Error saving section configurations:', err);
      onToast(err?.message || 'Error al guardar la organización de secciones.');
    } finally {
      setSaving(false);
    }
  };

  // Restore defaults
  const handleRestoreDefaults = () => {
    setAdminSections([...DEFAULT_ADMIN_SECTIONS]);
    setStoreCategories([...DEFAULT_STORE_CATEGORIES]);
    setStorefrontSections([...DEFAULT_STOREFRONT_SECTIONS]);
    onToast('Se han restaurado los nombres, iconos y orden por defecto.');
  };

  const filteredIcons = AVAILABLE_ADMIN_ICONS.filter(
    (ico) =>
      ico.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
      ico.id.toLowerCase().includes(iconSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/70 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 rounded-2xl max-w-4xl w-full max-h-[92vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-[#0b0f19]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Personalizar Secciones & Navegación
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Arrastrar & Soltar
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reorganiza posiciones, renombra pestañas, asigna iconos profesionales y activa/desactiva qué secciones ven tus usuarios.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveManagerTab('admin')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeManagerTab === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Panel de Control ({adminSections.filter((s) => s.enabled).length}/{adminSections.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveManagerTab('categories')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeManagerTab === 'categories'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Categorías Tienda ({storeCategories.filter((c) => c.enabled).length}/{storeCategories.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveManagerTab('storefront')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeManagerTab === 'storefront'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Bloques Web ({storefrontSections.filter((s) => s.enabled).length}/{storefrontSections.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-2.5 py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer Todo</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {/* TAB 1: Panel de Control Sections */}
          {activeManagerTab === 'admin' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    <strong>Arrastra</strong> las filas desde el icono <GripVertical className="inline w-3.5 h-3.5" /> para cambiar la posición, o usa las flechas. Haz clic en <strong>Editar</strong> para cambiar nombre o icono.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {adminSections.map((item, index) => {
                  const isDragging = draggedIndex === index;
                  const isOver = dragOverIndex === index;
                  const isEditing = editingItemId === item.id;
                  const isPickingIcon = iconPickerOpenForId === item.id;

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleAdminDragStart(e, index)}
                      onDragOver={(e) => handleAdminDragOver(e, index)}
                      onDrop={(e) => handleAdminDrop(e, index)}
                      onDragEnd={handleAdminDragEnd}
                      className={`rounded-xl border transition-all duration-150 ${
                        isDragging
                          ? 'opacity-40 scale-[0.98] border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/50'
                          : isOver
                          ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/30'
                          : item.enabled
                          ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700'
                          : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/40 opacity-70'
                      }`}
                    >
                      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                        {/* Drag Handle & Position Index */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            title="Arrastrar para ordenar"
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <GripVertical className="w-4 h-4" />
                          </button>
                          <span className="w-5 text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 text-center">
                            #{index + 1}
                          </span>
                        </div>

                        {/* Icon & Label */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Section Icon preview button */}
                          <button
                            type="button"
                            onClick={() => {
                              setIconPickerOpenForId(isPickingIcon ? null : item.id);
                              setIconSearch('');
                            }}
                            title="Cambiar icono profesional"
                            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs group"
                          >
                            <AdminIcon name={item.icon} className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {item.label}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                                {item.group}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {item.subtitle || `Sección: ${item.id}`}
                            </p>
                          </div>
                        </div>

                        {/* Reorder Up/Down & Action controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Order buttons */}
                          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => moveAdminSection(index, 'up')}
                              disabled={index === 0}
                              title="Subir posición"
                              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveAdminSection(index, 'down')}
                              disabled={index === adminSections.length - 1}
                              title="Bajar posición"
                              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Edit inline button */}
                          <button
                            type="button"
                            onClick={() => setEditingItemId(isEditing ? null : item.id)}
                            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                              isEditing
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title="Editar nombre y detalles"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Renombrar</span>
                          </button>

                          {/* Toggle Active Switch */}
                          <button
                            type="button"
                            onClick={() => toggleAdminSectionEnabled(item.id)}
                            title={item.enabled ? 'Sección activa en el panel (clic para ocultar)' : 'Sección oculta (clic para activar)'}
                            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              item.enabled
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {item.enabled ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="hidden sm:inline">Activo</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                                <span className="hidden sm:inline">Oculto</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Inline Renaming Editor */}
                      {isEditing && (
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 rounded-b-xl space-y-3 animate-in fade-in duration-150">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Nombre de la Sección
                              </label>
                              <input
                                type="text"
                                value={item.label}
                                onChange={(e) => updateAdminSectionField(item.id, 'label', e.target.value)}
                                placeholder="Ej. Gestor de Cursos"
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Subtítulo descriptivo
                              </label>
                              <input
                                type="text"
                                value={item.subtitle || ''}
                                onChange={(e) => updateAdminSectionField(item.id, 'subtitle', e.target.value)}
                                placeholder="Ej. Cursos y masterclasses"
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Nombre Corto (Móvil)
                              </label>
                              <input
                                type="text"
                                value={item.shortLabel || ''}
                                onChange={(e) => updateAdminSectionField(item.id, 'shortLabel', e.target.value)}
                                placeholder="Ej. Cursos"
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Haz clic en el icono cuadrado de la izquierda para cambiar el símbolo visual.
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Listo</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Icon Picker Popover */}
                      {isPickingIcon && (
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 rounded-b-xl space-y-2.5 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Selecciona un Icono Profesional:
                              </span>
                              <span className="text-[10px] text-slate-500">
                                (Actual: {item.icon})
                              </span>
                            </div>
                            <div className="relative w-40 sm:w-48">
                              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={iconSearch}
                                onChange={(e) => setIconSearch(e.target.value)}
                                placeholder="Filtrar icono..."
                                className="w-full pl-6 pr-2 py-1 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1">
                            {filteredIcons.map((ico) => {
                              const isSelected = item.icon === ico.id;
                              const IconComp = ico.icon;
                              return (
                                <button
                                  key={ico.id}
                                  type="button"
                                  onClick={() => {
                                    updateAdminSectionField(item.id, 'icon', ico.id);
                                    setIconPickerOpenForId(null);
                                  }}
                                  title={ico.label}
                                  className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer border ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40'
                                  }`}
                                >
                                  <IconComp className="w-4 h-4" />
                                  <span className="text-[9px] font-semibold truncate max-w-full">
                                    {ico.id}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Storefront Categories (IA, Streaming, Cursos, Recursos) */}
          {activeManagerTab === 'categories' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>
                    Controla qué <strong>categorías de productos</strong> pueden ser vistas por los clientes en la tienda. Al desactivar una categoría, se oculta del menú, del catálogo y de la vista pública.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {storeCategories.map((cat, index) => {
                  const isPickingIcon = iconPickerOpenForId === `cat_${cat.id}`;
                  return (
                    <div
                      key={cat.id}
                      className={`rounded-xl border p-3.5 transition-all ${
                        cat.enabled
                          ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
                          : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Order & Icon */}
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 text-[11px] font-mono font-bold text-slate-400 text-center">
                            #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIconPickerOpenForId(isPickingIcon ? null : `cat_${cat.id}`);
                              setIconSearch('');
                            }}
                            title="Cambiar icono de categoría"
                            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                          >
                            <AdminIcon name={cat.icon} className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Title input */}
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Título de Pestaña
                            </label>
                            <input
                              type="text"
                              value={cat.label}
                              onChange={(e) => updateStoreCategoryField(cat.id, 'label', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/30"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Subtítulo / Mención
                            </label>
                            <input
                              type="text"
                              value={cat.subtitle || ''}
                              onChange={(e) => updateStoreCategoryField(cat.id, 'subtitle', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/30"
                            />
                          </div>
                        </div>

                        {/* Controls: Move & Visibility */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => moveStoreCategory(index, 'up')}
                              disabled={index === 0}
                              title="Subir posición"
                              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStoreCategory(index, 'down')}
                              disabled={index === storeCategories.length - 1}
                              title="Bajar posición"
                              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleStoreCategoryEnabled(cat.id)}
                            title={cat.enabled ? 'Mostrar en tienda (clic para ocultar)' : 'Oculta en tienda (clic para activar)'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              cat.enabled
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {cat.enabled ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Visible en Tienda</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                <span>Oculto a Clientes</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Icon Picker for Category */}
                      {isPickingIcon && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 rounded-b-xl space-y-2 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">Seleccionar Icono para {cat.label}:</span>
                            <button
                              type="button"
                              onClick={() => setIconPickerOpenForId(null)}
                              className="text-xs text-slate-400 hover:text-slate-600"
                            >
                              Cerrar
                            </button>
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1">
                            {AVAILABLE_ADMIN_ICONS.map((ico) => {
                              const isSelected = cat.icon === ico.id;
                              const IconComp = ico.icon;
                              return (
                                <button
                                  key={ico.id}
                                  type="button"
                                  onClick={() => {
                                    updateStoreCategoryField(cat.id, 'icon', ico.id);
                                    setIconPickerOpenForId(null);
                                  }}
                                  className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 text-center cursor-pointer border ${
                                    isSelected
                                      ? 'bg-purple-600 text-white border-purple-600'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-400'
                                  }`}
                                >
                                  <IconComp className="w-4 h-4" />
                                  <span className="text-[9px] font-semibold truncate">{ico.id}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Storefront Blocks (Landing Page Sections) */}
          {activeManagerTab === 'storefront' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/60 text-xs text-sky-900 dark:text-sky-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>
                    Activa o desactiva qué <strong>bloques completos</strong> de la página de inicio se muestran a los usuarios visitantes (ej. carrusel de más vendidos, cinta LED, reseñas, métodos de pago, etc.).
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {storefrontSections.map((sec) => (
                  <div
                    key={sec.id}
                    className={`rounded-xl border p-3 flex items-center justify-between gap-3 transition-all ${
                      sec.enabled
                        ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
                        : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <AdminIcon name={sec.icon} className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {sec.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {sec.subtitle}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStorefrontSectionEnabled(sec.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                        sec.enabled
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {sec.enabled ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Oculto</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-[#0b0f19]/80 backdrop-blur-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Los cambios se guardan de forma permanente en Firestore y se reflejan al instante.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Configuración</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
