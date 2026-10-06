import React, { useState } from 'react';
import {
  X,
  Package,
  Palette,
  Cloud,
  ShieldCheck,
  Plus,
  LogOut,
  Upload,
  Check,
  Trash2,
  Edit,
  Database,
  BookOpen,
  Type,
  Sparkles,
  RefreshCw,
  Globe,
  Share2,
  Zap,
  Flame,
  Crown,
  Rocket,
  Star,
  ExternalLink,
  Send,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  MessageCircle,
  CreditCard,
  Wallet,
  Smartphone,
  Coins,
  Building2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Image as ImageIcon,
  History,
  FileText,
} from 'lucide-react';
import { Product, StoreSettings, Claim, PaymentMethod, SaleRecord } from '../types';
import {
  saveProductToFirestore,
  deleteProductFromFirestore,
  toggleProductAvailability,
  updateProductStock,
  saveSettingsToFirestore,
  seedProductsCollection,
  DEFAULT_PAYMENT_METHODS,
  savePaymentMethodsToFirestore,
} from '../services/storeService';
import { THEME_PRESETS, getThemePresetById } from '../services/themePresets';
import { uploadFileToFirebaseStorage } from '../firebase';
import {
  compressImage,
  resizeAndCompressImageToBase64,
  compressProductImage,
} from '../utils/imageCompressor';
import { generateProductDescription } from '../services/aiService';
import { AdminSalesTab } from './admin/AdminSalesTab';
import { AdminSalesHistoryTab } from './admin/AdminSalesHistoryTab';
import { AdminTextsTab } from './admin/AdminTextsTab';

interface AdminModalProps {
  products: Product[];
  settings: StoreSettings;
  claims: Claim[];
  sales?: SaleRecord[];
  adminUsername: string;
  onClose: () => void;
  onLogout: () => void;
  onToast: (msg: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  products,
  settings,
  claims,
  sales = [],
  adminUsername,
  onClose,
  onLogout,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'sales_history' | 'sales' | 'brand' | 'texts' | 'payments' | 'cloud' | 'claims' | 'security'>('sales_history');

  // Product Form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<'ai' | 'streaming' | 'utility'>('ai');
  const [prodTag, setProdTag] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodCoverImageUrl, setProdCoverImageUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [prodAccountType, setProdAccountType] = useState<'perfil_privado' | 'perfil_compartido' | 'cuenta_privada' | 'cuenta_compartida'>('perfil_privado');
  const [prodDurationUnit, setProdDurationUnit] = useState<'dias' | 'meses' | 'anos'>('meses');
  const [prodDurationValue, setProdDurationValue] = useState<number>(1);
  const [prodAvailable, setProdAvailable] = useState<boolean>(true);
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodP1Name, setProdP1Name] = useState('1 Mes');
  const [prodP1Price, setProdP1Price] = useState('S/ 29.90');
  const [prodP2Name, setProdP2Name] = useState('');
  const [prodP2Price, setProdP2Price] = useState('');
  const [prodRating, setProdRating] = useState('');
  const [prodActivationsCount, setProdActivationsCount] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [generatingAiDesc, setGeneratingAiDesc] = useState(false);

  // Settings form state
  const [brandSettings, setBrandSettings] = useState<StoreSettings>({ ...settings });
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // In-app confirmation dialog state (replaces window.confirm blocked in sandboxed iframes)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP, SVG).');
      return;
    }

    setUploadingLogo(true);
    onToast(`Procesando logotipo "${file.name}"...`);

    try {
      // 1. Immediately compress client-side (max 256x256, quality 0.85)
      // Takes ~30ms, guarantees < 30KB payload
      const compressed = await compressImage(file, 256, 256, 0.85);

      // 2. Immediately display the compressed image in preview and update state!
      setBrandSettings((prev) => ({ ...prev, logoBase64: compressed.dataUrl }));
      setUploadingLogo(false);
      onToast(`Logotipo optimizado (${Math.round(compressed.dataUrl.length / 1024)} KB) y cargado.`);

      // 3. In the background, optionally upload to Firebase Storage if active
      (async () => {
        try {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
          const path = `branding/logo_${Date.now()}_${safeName}`;
          const downloadUrl = await uploadFileToFirebaseStorage(compressed.blob, path);
          setBrandSettings((prev) => ({ ...prev, logoBase64: downloadUrl }));
        } catch {
          // Fallback is already active with the compressed base64
        }
      })();
    } catch (err) {
      console.error('Error procesando el logotipo:', err);
      onToast('No se pudo procesar la imagen seleccionada.');
      setUploadingLogo(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadingFavicon(true);
    onToast(`Procesando favicon "${file.name}"...`);

    try {
      const compressed = await compressImage(file, 64, 64, 0.88);
      setBrandSettings((prev) => ({ ...prev, faviconBase64: compressed.dataUrl }));
      setUploadingFavicon(false);
      onToast('Favicon optimizado y cargado.');
    } catch (err) {
      console.error('Error procesando el favicon:', err);
      onToast('Error al procesar el favicon.');
      setUploadingFavicon(false);
    } finally {
      e.target.value = '';
    }
  };

  const applyColorPreset = (primary: string, accent: string) => {
    setBrandSettings((prev) => ({
      ...prev,
      colorPrimary: primary,
      colorAccent: accent,
    }));
    onToast(`Paleta aplicada: ${primary} & ${accent}`);
  };

  const applyFaviconPreset = (svgData: string, name: string) => {
    setBrandSettings((prev) => ({
      ...prev,
      faviconBase64: svgData,
    }));
    onToast(`Favicon seleccionado: ${name}`);
  };

  // Payment methods state
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payName, setPayName] = useState('');
  const [payBadge, setPayBadge] = useState('');
  const [payAccountNumber, setPayAccountNumber] = useState('');
  const [payAccountHolder, setPayAccountHolder] = useState('');
  const [payInstructions, setPayInstructions] = useState('');
  const [payColor, setPayColor] = useState('#8b5cf6');
  const [payIcon, setPayIcon] = useState('smartphone');
  const [payLogoUrl, setPayLogoUrl] = useState('');
  const [payEnabled, setPayEnabled] = useState(true);
  const [uploadingPayLogo, setUploadingPayLogo] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const openNewPaymentForm = () => {
    setEditingPaymentMethod(null);
    setPayName('');
    setPayBadge('0% comisión');
    setPayAccountNumber('');
    setPayAccountHolder(`${brandSettings.name}${brandSettings.suffix} Oficial`);
    setPayInstructions('Envía una captura clara del comprobante de pago por WhatsApp.');
    setPayColor('#8b5cf6');
    setPayIcon('smartphone');
    setPayLogoUrl('');
    setPayEnabled(true);
    setShowPaymentForm(true);
  };

  const openEditPaymentForm = (pm: PaymentMethod) => {
    setEditingPaymentMethod(pm);
    setPayName(pm.name);
    setPayBadge(pm.badge || '');
    setPayAccountNumber(pm.accountNumber);
    setPayAccountHolder(pm.accountHolder || '');
    setPayInstructions(pm.instructions || '');
    setPayColor(pm.color || '#8b5cf6');
    setPayIcon(pm.icon || 'credit-card');
    setPayLogoUrl(pm.logoUrl || '');
    setPayEnabled(pm.enabled !== false);
    setShowPaymentForm(true);
  };

  const handlePaymentLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP, SVG).');
      return;
    }

    setUploadingPayLogo(true);
    onToast(`Procesando logotipo "${file.name}"...`);

    try {
      const compressed = await compressImage(file, 160, 160, 0.85);
      setPayLogoUrl(compressed.dataUrl);
      setUploadingPayLogo(false);
      onToast(`Logotipo optimizado (${Math.round(compressed.dataUrl.length / 1024)} KB) y cargado.`);
    } catch (err) {
      console.error(err);
      onToast('Error al procesar el logotipo.');
      setUploadingPayLogo(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payName.trim() || !payAccountNumber.trim()) {
      onToast('Por favor completa el nombre y el dato/cuenta a transferir.');
      return;
    }

    const currentMethods: PaymentMethod[] =
      brandSettings.paymentMethods && brandSettings.paymentMethods.length > 0
        ? brandSettings.paymentMethods
        : DEFAULT_PAYMENT_METHODS;

    let updatedMethods: PaymentMethod[];

    if (editingPaymentMethod) {
      updatedMethods = currentMethods.map((m) =>
        m.id === editingPaymentMethod.id
          ? {
              ...m,
              name: payName.trim(),
              badge: payBadge.trim(),
              accountNumber: payAccountNumber.trim(),
              accountHolder: payAccountHolder.trim(),
              instructions: payInstructions.trim(),
              color: payColor,
              icon: payIcon,
              logoUrl: payLogoUrl.trim(),
              enabled: payEnabled,
            }
          : m
      );
    } else {
      const newMethod: PaymentMethod = {
        id: `pay_${Date.now()}`,
        name: payName.trim(),
        badge: payBadge.trim(),
        accountNumber: payAccountNumber.trim(),
        accountHolder: payAccountHolder.trim(),
        instructions: payInstructions.trim(),
        color: payColor,
        icon: payIcon,
        logoUrl: payLogoUrl.trim(),
        enabled: payEnabled,
        order: currentMethods.length + 1,
      };
      updatedMethods = [...currentMethods, newMethod];
    }

    setBrandSettings((prev) => ({ ...prev, paymentMethods: updatedMethods }));
    setShowPaymentForm(false);
    setSavingPayment(true);

    try {
      await savePaymentMethodsToFirestore(updatedMethods);
      onToast(`Método de pago "${payName}" guardado en tiempo real.`);
    } catch (err) {
      console.error(err);
      onToast('Error al guardar método de pago.');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePaymentMethod = (id: string, name: string) => {
    setConfirmDialog({
      title: 'Eliminar método de pago',
      message: `¿Estás seguro de que deseas eliminar el método de pago "${name}"?`,
      confirmText: 'Sí, eliminar',
      onConfirm: async () => {
        const currentMethods: PaymentMethod[] =
          brandSettings.paymentMethods && brandSettings.paymentMethods.length > 0
            ? brandSettings.paymentMethods
            : DEFAULT_PAYMENT_METHODS;

        const updated = currentMethods.filter((m) => m.id !== id);
        setBrandSettings((prev) => ({ ...prev, paymentMethods: updated }));

        try {
          await savePaymentMethodsToFirestore(updated);
          onToast(`Método de pago "${name}" eliminado.`);
        } catch (err) {
          console.error(err);
          onToast('Error al eliminar método de pago.');
        }
      },
    });
  };

  const handleTogglePaymentMethod = async (id: string, current: boolean) => {
    const currentMethods: PaymentMethod[] =
      brandSettings.paymentMethods && brandSettings.paymentMethods.length > 0
        ? brandSettings.paymentMethods
        : DEFAULT_PAYMENT_METHODS;

    const updated = currentMethods.map((m) => (m.id === id ? { ...m, enabled: !current } : m));
    setBrandSettings((prev) => ({ ...prev, paymentMethods: updated }));

    try {
      await savePaymentMethodsToFirestore(updated);
      onToast('Disponibilidad actualizada.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleMovePaymentMethod = async (idx: number, direction: 'up' | 'down') => {
    const currentMethods = [
      ...(brandSettings.paymentMethods && brandSettings.paymentMethods.length > 0
        ? brandSettings.paymentMethods
        : DEFAULT_PAYMENT_METHODS),
    ];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentMethods.length) return;

    const temp = currentMethods[idx];
    currentMethods[idx] = currentMethods[targetIdx];
    currentMethods[targetIdx] = temp;

    setBrandSettings((prev) => ({ ...prev, paymentMethods: currentMethods }));
    try {
      await savePaymentMethodsToFirestore(currentMethods);
    } catch (err) {
      console.error(err);
    }
  };

  // Seeding state
  const [isSeeding, setIsSeeding] = useState(false);

  // Security credentials change
  const [curUser, setCurUser] = useState(adminUsername);
  const [curPass, setCurPass] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [credStatus, setCredStatus] = useState<{ msg: string; success: boolean } | null>(null);

  const openNewForm = () => {
    setEditingId(null);
    setProdName('');
    setProdCategory('ai');
    setProdTag('');
    setProdDesc('');
    setProdImageUrl('');
    setProdCoverImageUrl('');
    setProdAccountType('perfil_privado');
    setProdDurationUnit('meses');
    setProdDurationValue(1);
    setProdAvailable(true);
    setProdStock(10);
    setProdP1Name('1 Mes');
    setProdP1Price('S/ 29.90');
    setProdP2Name('');
    setProdP2Price('');
    setProdRating('');
    setProdActivationsCount('');
    setShowProductForm(true);
  };

  const openEditForm = (p: Product) => {
    setEditingId(p.id);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdTag(p.tag || '');
    setProdDesc(p.desc || '');
    setProdImageUrl(p.imageUrl || '');
    setProdCoverImageUrl(p.coverImageUrl || '');
    setProdAccountType(p.accountType || 'perfil_privado');
    setProdDurationUnit(p.durationUnit || 'meses');
    setProdDurationValue(p.durationValue || 1);
    setProdAvailable(p.available !== false);
    setProdStock(typeof p.stock === 'number' ? p.stock : 10);
    setProdP1Name(p.plans[0]?.name || '1 Mes');
    setProdP1Price(p.plans[0]?.price || 'S/ 29.90');
    setProdP2Name(p.plans[1]?.name || '');
    setProdP2Price(p.plans[1]?.price || '');
    setProdRating(p.rating ? String(p.rating) : '');
    setProdActivationsCount(p.activationsCount ? String(p.activationsCount) : '');
    setShowProductForm(true);
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleGenerateAiDescription = async () => {
    if (!prodName.trim()) {
      onToast('Escribe primero el nombre del producto para generar la descripción.');
      return;
    }
    setGeneratingAiDesc(true);
    try {
      const desc = await generateProductDescription(prodName, prodCategory, prodTag);
      if (desc) {
        setProdDesc(desc);
        onToast('✨ Descripción comercial generada exitosamente.');
      }
    } catch (err: any) {
      console.error('Error con Gemini:', err);
      onToast(err.message || 'No se pudo generar descripción. Verifica GEMINI_API_KEY en el servidor.');
    } finally {
      setGeneratingAiDesc(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP, SVG).');
      return;
    }

    setUploadingImage(true);
    onToast(`Optimizando y procesando "${file.name}"...`);

    try {
      // 1. Immediately compress client-side (max 320x320, quality 0.82)
      // This produces a lightweight image (~15KB - 35KB), avoiding Firestore's 1MB limit entirely!
      const compressed = await compressImage(file, 320, 320, 0.82);

      // Set the compressed dataUrl as safe immediate preview & fallback
      setProdImageUrl(compressed.dataUrl);
      setUploadingImage(false);
      onToast(`Imagen optimizada (${Math.round(compressed.dataUrl.length / 1024)} KB) lista.`);

      // 2. In background, attempt to upload to Firebase Storage if available
      (async () => {
        try {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
          const path = `products/${Date.now()}_${safeName}`;
          const downloadURL = await uploadFileToFirebaseStorage(compressed.blob, path);
          setProdImageUrl(downloadURL);
        } catch {
          // Compressed dataUrl is already set and safe for Firestore
        }
      })();
    } catch (err) {
      console.error('Error compressing image:', err);
      onToast('No se pudo procesar la imagen seleccionada.');
      setUploadingImage(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP).');
      return;
    }

    setUploadingCover(true);
    onToast(`Optimizando portada 16:9 "${file.name}"...`);

    try {
      // Compress to 800x450 (16:9 ratio), quality 0.82 -> lightweight (~25-45KB)
      const compressed = await compressImage(file, 800, 450, 0.82);
      setProdCoverImageUrl(compressed.dataUrl);
      setUploadingCover(false);
      onToast(`Portada optimizada (${Math.round(compressed.dataUrl.length / 1024)} KB) lista.`);

      // Optional background upload to Firebase Storage
      (async () => {
        try {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
          const path = `product_covers/${Date.now()}_${safeName}`;
          const downloadURL = await uploadFileToFirebaseStorage(compressed.blob, path);
          setProdCoverImageUrl(downloadURL);
        } catch {
          // Keep compressed dataUrl
        }
      })();
    } catch (err) {
      console.error('Error compressing cover image:', err);
      onToast('No se pudo procesar la portada seleccionada.');
      setUploadingCover(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    // Safety check: ensure imageUrl does not exceed Firestore's 1,048,487 bytes limit
    let safeImageUrl = prodImageUrl.trim();
    if (safeImageUrl.length > 500000) {
      onToast('Comprimiendo imagen de producto para Firestore...');
      try {
        safeImageUrl = await resizeAndCompressImageToBase64(safeImageUrl, {
          maxWidth: 320,
          maxHeight: 320,
          quality: 0.8,
          maxSizeBytes: 200000,
        });
      } catch (err) {
        console.error('Failed to compress oversized image:', err);
        onToast('La imagen supera el límite permitido de 1MB. Por favor sube otra o usa una URL.');
        return;
      }
    }

    let safeCoverImageUrl = prodCoverImageUrl.trim();
    if (safeCoverImageUrl.length > 500000) {
      onToast('Comprimiendo portada de producto para Firestore...');
      try {
        safeCoverImageUrl = await resizeAndCompressImageToBase64(safeCoverImageUrl, {
          maxWidth: 800,
          maxHeight: 450,
          quality: 0.78,
          maxSizeBytes: 200000,
        });
      } catch (err) {
        console.error('Failed to compress oversized cover:', err);
      }
    }

    setSavingProduct(true);
    const plans = [{ name: prodP1Name || '1 Mes', price: prodP1Price || 'S/ 25.00' }];
    if (prodP2Name.trim() && prodP2Price.trim()) {
      plans.push({ name: prodP2Name.trim(), price: prodP2Price.trim() });
    }

    const durationText = `${prodDurationValue} ${
      prodDurationUnit === 'dias'
        ? prodDurationValue === 1 ? 'Día' : 'Días'
        : prodDurationUnit === 'meses'
        ? prodDurationValue === 1 ? 'Mes' : 'Meses'
        : prodDurationValue === 1 ? 'Año' : 'Años'
    }`;

    const payload: Product = {
      id: editingId || `prod_${Date.now()}`,
      name: prodName.trim(),
      category: prodCategory,
      tag: prodTag.trim() || 'Membresía',
      desc: prodDesc.trim(),
      imageUrl: safeImageUrl,
      coverImageUrl: safeCoverImageUrl || undefined,
      accountType: prodAccountType,
      durationUnit: prodDurationUnit,
      durationValue: Number(prodDurationValue) || 1,
      durationText,
      available: prodAvailable,
      stock: Math.max(0, Number(prodStock) || 0),
      rating: prodRating.trim() || undefined,
      activationsCount: prodActivationsCount.trim() || undefined,
      plans,
      icon: prodCategory === 'ai' ? 'sparkles' : 'film',
    };

    try {
      await saveProductToFirestore(payload);
      onToast(`Producto "${prodName}" guardado en Firestore.`);
      setShowProductForm(false);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('1048487')) {
        onToast('Error: La imagen excede el límite de Firestore. Usa una imagen más liviana.');
      } else {
        onToast('Error al guardar el producto.');
      }
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    setConfirmDialog({
      title: 'Eliminar producto',
      message: `¿Estás seguro de que deseas eliminar el producto "${name}" de la tienda?`,
      confirmText: 'Sí, eliminar producto',
      onConfirm: async () => {
        try {
          await deleteProductFromFirestore(id);
          onToast(`Producto "${name}" eliminado en todos los dispositivos.`);
        } catch (err) {
          console.error(err);
          onToast('Error al eliminar producto.');
        }
      },
    });
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleProductAvailability(id, current);
      onToast(`Disponibilidad actualizada en tiempo real.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await saveSettingsToFirestore(brandSettings);
      onToast('¡Configuración de marca guardada y sincronizada!');
    } catch (err) {
      console.error(err);
      onToast('Error al guardar configuración.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSeed = async (force: boolean) => {
    setIsSeeding(true);
    try {
      const result = await seedProductsCollection(force);
      onToast(result.message);
    } catch (err) {
      console.error(err);
      onToast('Error al inicializar la base de datos.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleChangeCreds = (e: React.FormEvent) => {
    e.preventDefault();
    setCredStatus(null);

    if (newPass !== confirmPass) {
      setCredStatus({ msg: 'Las contraseñas nuevas no coinciden.', success: false });
      return;
    }

    if (newUser.trim().length < 3 || newPass.trim().length < 4) {
      setCredStatus({ msg: 'Usuario min 3 caracteres, contraseña min 4.', success: false });
      return;
    }

    localStorage.setItem(
      'alixplay_local_admin',
      JSON.stringify({ username: newUser.trim(), pass: newPass.trim() })
    );

    setCredStatus({
      msg: `¡Credenciales actualizadas exitosamente! Nuevo usuario: ${newUser}`,
      success: true,
    });
    onToast(`Credenciales actualizadas a: ${newUser}`);
    setCurPass('');
    setNewPass('');
    setConfirmPass('');
    setCurUser(newUser);
  };

  interface AdminNavItem {
    id: 'products' | 'sales_history' | 'sales' | 'brand' | 'texts' | 'payments' | 'cloud' | 'claims' | 'security';
    label: string;
    shortLabel: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string;
    badgeColor: string;
  }

  interface AdminNavGroup {
    group: string;
    items: AdminNavItem[];
  }

  const sidebarNavGroups: AdminNavGroup[] = [
    {
      group: 'GESTIÓN COMERCIAL',
      items: [
        {
          id: 'products',
          label: 'Gestor de Productos',
          shortLabel: 'Productos',
          subtitle: `${products.length} productos y planes`,
          icon: Package,
          badge: products.length.toString(),
          badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
        },
        {
          id: 'sales_history',
          label: 'Historial de Ventas',
          shortLabel: 'Historial',
          subtitle: `${sales.length} ventas con filtros`,
          icon: History,
          badge: sales.length.toString(),
          badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
        },
        {
          id: 'sales',
          label: 'Confirmar Venta',
          shortLabel: 'Nueva Venta',
          subtitle: 'Registrar y descontar stock',
          icon: CheckCircle2,
          badge: '+',
          badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
        },
        {
          id: 'payments',
          label: 'Métodos de Pago',
          shortLabel: 'Pagos',
          subtitle: `${(brandSettings.paymentMethods || DEFAULT_PAYMENT_METHODS).length} pasarelas activas`,
          icon: CreditCard,
          badge: (brandSettings.paymentMethods || DEFAULT_PAYMENT_METHODS).length.toString(),
          badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        },
      ],
    },
    {
      group: 'PERSONALIZACIÓN',
      items: [
        {
          id: 'brand',
          label: 'Marca & Colores',
          shortLabel: 'Marca',
          subtitle: 'Logos, tipografías y estilo',
          icon: Palette,
          badge: 'Editor',
          badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
        },
        {
          id: 'texts',
          label: 'Textos & Contenido Web',
          shortLabel: 'Textos Web',
          subtitle: 'Títulos, pasos, FAQ y footer',
          icon: FileText,
          badge: 'Editable',
          badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
        },
        {
          id: 'claims',
          label: 'Libro de Reclamaciones',
          shortLabel: 'Reclamos',
          subtitle: 'Atención al consumidor',
          icon: BookOpen,
          badge: claims.length.toString(),
          badgeColor:
            claims.length > 0
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        },
      ],
    },
    {
      group: 'INFRAESTRUCTURA & ACCESO',
      items: [
        {
          id: 'cloud',
          label: 'Nube & Semilla',
          shortLabel: 'Nube',
          subtitle: 'Firestore y sincronización',
          icon: Cloud,
          badge: 'En vivo',
          badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
        },
        {
          id: 'security',
          label: 'Seguridad & Acceso',
          shortLabel: 'Seguridad',
          subtitle: 'Credenciales del admin',
          icon: ShieldCheck,
          badge: 'Admin',
          badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
        },
      ],
    },
  ];

  const allNavItems: AdminNavItem[] = sidebarNavGroups.reduce<AdminNavItem[]>(
    (acc, g) => acc.concat(g.items),
    []
  );

  const currentTab: AdminNavItem =
    allNavItems.find((it) => it.id === activeTab) || allNavItems[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 rounded-2xl max-w-6xl w-full h-[92vh] sm:h-[88vh] shadow-2xl border border-slate-200/90 dark:border-slate-800 relative flex flex-col animate-in fade-in zoom-in-95 duration-150 transition-colors overflow-hidden">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-[#0b0f19]/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0"
              style={{
                background: `linear-gradient(135deg, ${settings.colorPrimary} 0%, ${settings.colorAccent} 100%)`,
              }}
            >
              AP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  Panel de Control {settings.name}{settings.suffix}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Firestore en vivo
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gestión integral de membresías, pasarelas de pago, identidad visual y seguridad
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="px-2.5 py-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Lateral Sidebar + Main Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Lateral Sidebar (Desktop / Tablet) */}
          <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0b0f19]/70 justify-between p-3.5 overflow-y-auto">
            <div className="space-y-4">
              {sidebarNavGroups.map((group) => (
                <div key={group.group} className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
                    {group.group}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                                {item.label}
                              </div>
                              <div className={`text-[10px] truncate ${isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                                {item.subtitle}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-md shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Bottom Profile Card */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-extrabold shrink-0">
                    {adminUsername ? adminUsername.slice(0, 2).toUpperCase() : 'AD'}
                  </div>
                  <div className="truncate">
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {adminUsername || 'Administrador'}
                    </div>
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Sesión activa
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>

          {/* Mobile Grid Menu: Compact tactile 6-card grid (replaces awkward horizontal scrollbar) */}
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 p-2 bg-slate-50/90 dark:bg-[#0b0f19]/90 shrink-0">
            <div className="grid grid-cols-3 gap-1.5">
              {allNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
                        <span className="text-[11px] font-bold truncate max-w-[70px]">
                          {item.shortLabel}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-[#0f172a]">
            {/* Content Area Subheader */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <currentTab.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {currentTab.label}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {currentTab.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentTab.subtitle}
                  </p>
                </div>
              </div>
            </div>

        {/* Tab 1: Products */}
        {activeTab === 'products' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Productos activos sincronizados en Firestore
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSeed(true)}
                  disabled={isSeeding}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                  title="Restaura los 16 productos iniciales a Firestore"
                >
                  <Database className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isSeeding ? 'Sembrando...' : 'Sembrar Datos Iniciales'}</span>
                </button>
                <button
                  type="button"
                  onClick={openNewForm}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Producto</span>
                </button>
              </div>
            </div>

            {/* Product Form */}
            {showProductForm && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs animate-in fade-in duration-100">
                <div className="flex items-center justify-between mb-2">
                  <strong className="font-extrabold text-slate-800">
                    {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
                  </strong>
                  <button
                    onClick={() => setShowProductForm(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        placeholder="Ej: ChatGPT Plus"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Categoría
                      </label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none"
                      >
                        <option value="ai">Inteligencia Artificial</option>
                        <option value="streaming">Streaming & Series</option>
                        <option value="utility">Utilidades & Otros</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Etiqueta
                        </label>
                        <button
                          type="button"
                          onClick={() => setProdTag('Oferta Flash')}
                          className="text-[9.5px] font-black text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-0.5"
                          title="Marcar este producto como Oferta Flash para activar el contador regresivo"
                        >
                          🔥 + Oferta Flash
                        </button>
                      </div>
                      <input
                        type="text"
                        value={prodTag}
                        onChange={(e) => setProdTag(e.target.value)}
                        placeholder="Ej: Oferta Flash o GPT-4o"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Descripción corta
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateAiDescription}
                        disabled={generatingAiDesc || !prodName.trim()}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 disabled:opacity-40 disabled:hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Generar descripción comercial usando Gemini AI seguro en el backend"
                      >
                        <Sparkles className={`w-3 h-3 ${generatingAiDesc ? 'animate-spin text-amber-500' : 'text-indigo-500'}`} />
                        <span>{generatingAiDesc ? 'Generando con Gemini...' : 'Sugerir con Gemini AI'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="Breve resumen de beneficios..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none"
                    />
                  </div>

                  {/* Logo Image */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Logotipo / Imagen de la Plataforma
                    </label>
                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                        {uploadingImage ? (
                          <div className="flex flex-col items-center justify-center text-indigo-600">
                            <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : prodImageUrl ? (
                          <img src={prodImageUrl} alt="preview" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Upload className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <label className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-md border border-indigo-200 cursor-pointer text-[11px] inline-flex items-center gap-1 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingImage ? 'Optimizando...' : 'Subir archivo...'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingImage}
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                          {prodImageUrl && (
                            <button
                              type="button"
                              onClick={() => setProdImageUrl('')}
                              className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold"
                            >
                              Quitar
                            </button>
                          )}
                          {prodImageUrl && (
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[170px]">
                              {prodImageUrl.startsWith('http')
                                ? '✓ URL remota / Storage'
                                : `✓ Comprimida (${Math.round(prodImageUrl.length / 1024)} KB)`}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={prodImageUrl}
                          onChange={(e) => setProdImageUrl(e.target.value)}
                          placeholder="O pega una URL externa (https://...)"
                          className="w-full px-2 py-1 text-[11px] rounded border border-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Portada / Banner del Producto (Proporción 16:9 Optimizada) */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                        🖼️ Portada / Banner del Producto (16:9)
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Optimizada para Móvil y Desktop
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {/* 16:9 Aspect Ratio Preview Container */}
                      <div className="w-full sm:w-44 aspect-[16/9] rounded-xl bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative shadow-xs">
                        {uploadingCover ? (
                          <div className="flex flex-col items-center justify-center text-indigo-400">
                            <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-1" />
                            <span className="text-[9px] font-bold">Comprimiendo...</span>
                          </div>
                        ) : prodCoverImageUrl ? (
                          <img
                            src={prodCoverImageUrl}
                            alt="Vista previa portada"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-500 text-center p-2">
                            <ImageIcon className="w-6 h-6 text-slate-500 mb-1" />
                            <span className="text-[9px] font-bold">Sin portada</span>
                            <span className="text-[8px] opacity-75">16:9 automático</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 cursor-pointer text-xs inline-flex items-center gap-1.5 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingCover ? 'Optimizando 16:9...' : 'Subir portada (16:9)...'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingCover}
                              onChange={handleCoverFileUpload}
                              className="hidden"
                            />
                          </label>

                          {prodCoverImageUrl && (
                            <button
                              type="button"
                              onClick={() => setProdCoverImageUrl('')}
                              className="text-rose-600 hover:text-rose-800 text-xs font-semibold px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              Quitar Portada
                            </button>
                          )}

                          {prodCoverImageUrl && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                              ✓ Portada activa
                            </span>
                          )}
                        </div>

                        <input
                          type="text"
                          value={prodCoverImageUrl}
                          onChange={(e) => setProdCoverImageUrl(e.target.value)}
                          placeholder="O pega URL de portada externa (https://...)"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Se visualiza en la tarjeta y en la ventana de <strong>Detalles</strong> al cliente.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Modalidad de Cuenta (Perfil / Cuenta / Privado / Compartido) & Duración */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    {/* Selector de Modalidad de Cuenta */}
                    <div>
                      <label className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center justify-between">
                        <span>Modalidad de Cuenta</span>
                        <span className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-bold">
                          Características
                        </span>
                      </label>
                      <select
                        value={prodAccountType}
                        onChange={(e) => setProdAccountType(e.target.value as any)}
                        className="w-full px-2.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
                      >
                        <option value="perfil_privado">👤 Perfil Privado (con PIN individual)</option>
                        <option value="perfil_compartido">👥 Perfil Compartido (pantalla compartida)</option>
                        <option value="cuenta_privada">🔒 Cuenta Completa Privada (acceso total)</option>
                        <option value="cuenta_compartida">🌐 Cuenta Compartida</option>
                      </select>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Determina si se muestra "PIN Propio" o "100% Privado" en la tarjeta.
                      </p>
                    </div>

                    {/* Selector de Duración (Días / Meses / Años) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                          Duración del Servicio
                        </label>
                        <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                          {prodDurationValue} {
                            prodDurationUnit === 'dias'
                              ? prodDurationValue === 1 ? 'Día' : 'Días'
                              : prodDurationUnit === 'meses'
                              ? prodDurationValue === 1 ? 'Mes' : 'Meses'
                              : prodDurationValue === 1 ? 'Año' : 'Años'
                          }
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={prodDurationValue}
                          onChange={(e) => setProdDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 px-2.5 py-2 text-xs font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                        />
                        <select
                          value={prodDurationUnit}
                          onChange={(e) => setProdDurationUnit(e.target.value as any)}
                          className="flex-1 px-2.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                          <option value="dias">Días</option>
                          <option value="meses">Meses</option>
                          <option value="anos">Años</option>
                        </select>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <span className="text-[9.5px] text-slate-400 font-bold mr-0.5">Rápido:</span>
                        <button
                          type="button"
                          onClick={() => { setProdDurationValue(30); setProdDurationUnit('dias'); }}
                          className="px-1.5 py-0.5 text-[9.5px] font-bold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          30 Días
                        </button>
                        <button
                          type="button"
                          onClick={() => { setProdDurationValue(1); setProdDurationUnit('meses'); }}
                          className="px-1.5 py-0.5 text-[9.5px] font-bold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          1 Mes
                        </button>
                        <button
                          type="button"
                          onClick={() => { setProdDurationValue(3); setProdDurationUnit('meses'); }}
                          className="px-1.5 py-0.5 text-[9.5px] font-bold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          3 Meses
                        </button>
                        <button
                          type="button"
                          onClick={() => { setProdDurationValue(1); setProdDurationUnit('anos'); }}
                          className="px-1.5 py-0.5 text-[9.5px] font-bold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          1 Año
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Availability & Stock Units Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="prodAvailableInput"
                        checked={prodAvailable}
                        onChange={(e) => setProdAvailable(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="prodAvailableInput" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        Disponible para la venta
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Unidades en Stock Disponibles
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={prodStock}
                        onChange={(e) => setProdStock(parseInt(e.target.value) || 0)}
                        placeholder="Ej: 10"
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  {/* Plans */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Plan 1 (Nombre & Precio) *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={prodP1Name}
                          onChange={(e) => setProdP1Name(e.target.value)}
                          placeholder="Ej: 1 Mes VIP"
                          className="w-1/2 px-2 py-1 border rounded text-xs"
                        />
                        <input
                          type="text"
                          required
                          value={prodP1Price}
                          onChange={(e) => setProdP1Price(e.target.value)}
                          placeholder="Ej: S/ 45.00"
                          className="w-1/2 px-2 py-1 border rounded text-xs font-bold text-indigo-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Plan 2 Opcional (Nombre & Precio)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={prodP2Name}
                          onChange={(e) => setProdP2Name(e.target.value)}
                          placeholder="Ej: 3 Meses VIP"
                          className="w-1/2 px-2 py-1 border rounded text-xs"
                        />
                        <input
                          type="text"
                          value={prodP2Price}
                          onChange={(e) => setProdP2Price(e.target.value)}
                          placeholder="Ej: S/ 94.90"
                          className="w-1/2 px-2 py-1 border rounded text-xs font-bold text-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rating y Activaciones personalizadas del Producto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-0.5">
                        Rating Individual (Opcional)
                      </label>
                      <input
                        type="text"
                        value={prodRating}
                        onChange={(e) => setProdRating(e.target.value)}
                        placeholder="Ej: 5.0 o 4.9 (dejar vacío para dinámico)"
                        className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-0.5">
                        Activaciones Individuales (Opcional)
                      </label>
                      <input
                        type="text"
                        value={prodActivationsCount}
                        onChange={(e) => setProdActivationsCount(e.target.value)}
                        placeholder="Ej: +3.200 o +1.500 Activaciones"
                        className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingProduct}
                      className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg shadow-sm"
                    >
                      {savingProduct ? 'Guardando en Firestore...' : 'Guardar Producto'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Logo</th>
                    <th className="p-3">Servicio</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Precio Ref.</th>
                    <th className="p-3">Stock / Unid.</th>
                    <th className="p-3">Disponibilidad</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="w-7 h-7 rounded-lg object-contain p-0.5 border border-slate-200"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[9px]">
                            {p.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        <div>{p.name}</div>
                        <span className="text-[10px] text-slate-400 font-normal">{p.tag}</span>
                      </td>
                      <td className="p-3 text-[10px] font-bold text-slate-500 uppercase">{p.category}</td>
                      <td className="p-3 font-bold text-indigo-600">
                        {p.plans[0]?.price || 'S/ 0.00'}
                      </td>
                      <td className="p-3">
                        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={async () => {
                              const curr = typeof p.stock === 'number' ? p.stock : 10;
                              await updateProductStock(p.id, Math.max(0, curr - 1));
                              onToast(`Stock de "${p.name}" actualizado a ${Math.max(0, curr - 1)}.`);
                            }}
                            className="w-4 h-4 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-black text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="Restar 1"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-100 min-w-[20px] text-center">
                            {p.stock ?? 10}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              const curr = typeof p.stock === 'number' ? p.stock : 10;
                              await updateProductStock(p.id, curr + 1);
                              onToast(`Stock de "${p.name}" actualizado a ${curr + 1}.`);
                            }}
                            className="w-4 h-4 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-black text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="Sumar 1"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => handleToggle(p.id, p.available)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                            p.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.available ? 'Activo' : 'Pausado'}
                        </button>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => openEditForm(p)}
                          className="font-bold text-indigo-600 hover:text-indigo-800 text-xs inline-flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="font-bold text-rose-600 hover:text-rose-800 text-xs inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No hay productos en la base de datos. Haz clic en "Sembrar Datos Iniciales" para cargar el catálogo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Sales History */}
        {activeTab === 'sales_history' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <AdminSalesHistoryTab
              products={products}
              sales={sales || []}
              onToast={onToast}
              onNavigateToRegister={() => setActiveTab('sales')}
            />
          </div>
        )}

        {/* Tab: Sales Confirmation & Tracking */}
        {activeTab === 'sales' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <AdminSalesTab
              products={products}
              sales={sales || []}
              onToast={onToast}
              onNavigateToHistory={() => setActiveTab('sales_history')}
            />
          </div>
        )}

        {/* Tab: Textos & Contenido Web Editable */}
        {activeTab === 'texts' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <AdminTextsTab
              settings={brandSettings}
              onUpdateSettings={(newSettings) => setBrandSettings(newSettings)}
              onToast={onToast}
            />
          </div>
        )}

        {/* Tab 2: Brand & Customization */}
        {activeTab === 'brand' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            {/* Live Interactive Brand & Header Preview */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Previsualización en Tiempo Real
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Los cambios se reflejarán instantáneamente en toda la tienda
                </span>
              </div>

              {/* Real-time Header Preview */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 flex items-center justify-center text-white overflow-hidden shrink-0 transition-all ${
                      brandSettings.brandLogoShape === 'circle'
                        ? 'rounded-full'
                        : brandSettings.brandLogoShape === 'square'
                        ? 'rounded-md'
                        : 'rounded-xl'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${brandSettings.colorPrimary} 0%, ${brandSettings.colorAccent} 100%)`,
                      boxShadow: brandSettings.brandLogoGlow
                        ? `0 0 18px ${brandSettings.colorPrimary}90`
                        : undefined,
                    }}
                  >
                    {brandSettings.logoBase64 ? (
                      <img src={brandSettings.logoBase64} alt="Preview Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <div
                      className="text-xl text-slate-900 leading-none transition-all"
                      style={{
                        fontFamily: brandSettings.brandFont ? `"${brandSettings.brandFont}", system-ui, sans-serif` : undefined,
                        fontWeight: brandSettings.brandFontWeight || '900',
                        letterSpacing: brandSettings.brandLetterSpacing || '-0.025em',
                        textTransform: brandSettings.brandTextTransform || 'normal',
                      }}
                    >
                      {brandSettings.name}
                      <span
                        className="brand-gradient-text bg-clip-text text-transparent inline-block"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${brandSettings.colorPrimary} 0%, ${brandSettings.colorAccent} 100%)`,
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          color: 'transparent',
                        }}
                      >
                        {brandSettings.suffix}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                      {brandSettings.subtitle}
                    </span>
                  </div>
                </div>

                {/* Simulated Floating Social Preview */}
                <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-700">
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider pr-1">
                    Redes Neón:
                  </span>
                  <div className="neon-social-btn neon-tiktok w-6 h-6 rounded-full bg-black flex items-center justify-center text-white cursor-pointer">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                    </svg>
                  </div>
                  <div className="neon-social-btn neon-instagram w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-white cursor-pointer">
                    <Instagram className="w-2.5 h-2.5" />
                  </div>
                  <div className="neon-social-btn neon-telegram w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-white cursor-pointer">
                    <Send className="w-2.5 h-2.5" />
                  </div>
                  <div className="neon-social-btn neon-whatsapp w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white cursor-pointer">
                    <MessageCircle className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Logotipo de la Marca */}
              <div className="space-y-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <strong className="text-slate-900 font-bold">1. Logotipo de la Marca</strong>
                </div>

                {/* Brand Logo Upload */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Imagen del Logotipo (Reescalado y compresión automática)
                  </label>
                  <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200">
                    <div
                      className={`w-10 h-10 flex items-center justify-center text-white overflow-hidden shrink-0 transition-all ${
                        brandSettings.brandLogoShape === 'circle'
                          ? 'rounded-full'
                          : brandSettings.brandLogoShape === 'square'
                          ? 'rounded-md'
                          : 'rounded-xl'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${brandSettings.colorPrimary} 0%, ${brandSettings.colorAccent} 100%)`,
                        boxShadow: brandSettings.brandLogoGlow
                          ? `0 0 14px ${brandSettings.colorPrimary}90`
                          : undefined,
                      }}
                    >
                      {brandSettings.logoBase64 ? (
                        <img src={brandSettings.logoBase64} alt="logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-md border border-indigo-200 cursor-pointer text-[11px] inline-flex items-center gap-1 active:scale-95">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingLogo ? 'Procesando...' : 'Subir Imagen de Logo...'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingLogo}
                            onChange={handleBrandLogoUpload}
                            className="hidden"
                          />
                        </label>
                        {brandSettings.logoBase64 ? (
                          <>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Logo cargado ({Math.round(brandSettings.logoBase64.length / 1024)} KB)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setBrandSettings((prev) => ({ ...prev, logoBase64: '' }))}
                              className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold"
                            >
                              Restablecer a icono
                            </button>
                          </>
                        ) : null}
                      </div>
                      <input
                        type="text"
                        value={brandSettings.logoBase64 || ''}
                        onChange={(e) => setBrandSettings({ ...brandSettings, logoBase64: e.target.value })}
                        placeholder="O pega URL directa (https://...)"
                        className="w-full px-2 py-1 text-[11px] rounded border border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo Shape & Glow Settings */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Forma del Marco
                    </label>
                    <select
                      value={brandSettings.brandLogoShape || 'rounded'}
                      onChange={(e) =>
                        setBrandSettings({
                          ...brandSettings,
                          brandLogoShape: e.target.value as 'rounded' | 'circle' | 'square',
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs"
                    >
                      <option value="rounded">Redondeado Moderno</option>
                      <option value="circle">Circular Completo</option>
                      <option value="square">Cuadrado Compacto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Efecto Neón en Logo
                    </label>
                    <label className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={brandSettings.brandLogoGlow !== false}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, brandLogoGlow: e.target.checked })
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700">Resplandor Neón</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 2: Favicon del Navegador */}
              <div className="space-y-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <strong className="text-slate-900 font-bold">2. Favicon de Pestaña (.ico / .svg / .png)</strong>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Favicon Personalizado
                  </label>
                  <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {brandSettings.faviconBase64 ? (
                        <img src={brandSettings.faviconBase64} alt="favicon" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <Globe className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <label className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-md border border-slate-300 cursor-pointer text-[11px] inline-flex items-center gap-1 active:scale-95">
                          <Upload className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{uploadingFavicon ? 'Procesando...' : 'Subir Favicon...'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingFavicon}
                            onChange={handleFaviconUpload}
                            className="hidden"
                          />
                        </label>
                        {brandSettings.faviconBase64 && (
                          <button
                            type="button"
                            onClick={() => setBrandSettings((prev) => ({ ...prev, faviconBase64: '' }))}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold"
                          >
                            Restablecer
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={brandSettings.faviconBase64 || ''}
                        onChange={(e) => setBrandSettings({ ...brandSettings, faviconBase64: e.target.value })}
                        placeholder="O pega URL de icono..."
                        className="w-full px-2 py-1 text-[11px] rounded border border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Favicon Presets */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                    O elige un Favicon listo en 1 clic:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        applyFaviconPreset(
                          `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234f46e5'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>`,
                          'Estrella Neón'
                        )
                      }
                      className="px-2 py-1 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 font-bold text-[10.5px] flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Star className="w-3 h-3 text-indigo-600" />
                      <span>Estrella</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyFaviconPreset(
                          `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2306b6d4'><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/></svg>`,
                          'Rayo Cyan'
                        )
                      }
                      className="px-2 py-1 rounded bg-white hover:bg-cyan-50 border border-slate-200 text-cyan-700 font-bold text-[10.5px] flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Zap className="w-3 h-3 text-cyan-600" />
                      <span>Rayo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyFaviconPreset(
                          `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f59e0b'><path d='M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z'/></svg>`,
                          'Corona Oro'
                        )
                      }
                      className="px-2 py-1 rounded bg-white hover:bg-amber-50 border border-slate-200 text-amber-700 font-bold text-[10.5px] flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Crown className="w-3 h-3 text-amber-600" />
                      <span>Corona</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyFaviconPreset(
                          `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e11d48'><path d='M12 23c-4.97 0-9-4.03-9-9 0-3.93 2.5-7.3 6.04-8.52.47-.16.98.11 1.09.59.08.35-.06.71-.35.91-1.57 1.11-2.5 2.92-2.5 4.86 0 3.31 2.69 6 6 6s6-2.69 6-6c0-1.03-.27-2.04-.79-2.92-.25-.43-.09-.98.34-1.23.43-.25.98-.09 1.23.34C19.68 9.24 20 10.6 20 12c0 4.97-4.03 9-9 9z'/></svg>`,
                          'Fuego Sunset'
                        )
                      }
                      className="px-2 py-1 rounded bg-white hover:bg-rose-50 border border-slate-200 text-rose-700 font-bold text-[10.5px] flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Flame className="w-3 h-3 text-rose-600" />
                      <span>Fuego</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyFaviconPreset(
                          `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'><polygon points='6 3 18 3 22 9 12 22 2 9 6 3'/></svg>`,
                          'Diamante Esmeralda'
                        )
                      }
                      className="px-2 py-1 rounded bg-white hover:bg-emerald-50 border border-slate-200 text-emerald-700 font-bold text-[10.5px] flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Diamante</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyFaviconPreset(
                          `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237c3aed'><path d='M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3m0 0l8.5-8.5a4.5 4.5 0 0 1 6.36 6.36L15.36 18.36a4.5 4.5 0 0 1-6.36-6.36z'/></svg>`,
                          'Cohete Tech'
                        )
                      }
                      className="px-2 py-1 rounded bg-white hover:bg-purple-50 border border-slate-200 text-purple-700 font-bold text-[10.5px] flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Rocket className="w-3 h-3 text-purple-600" />
                      <span>Cohete</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3: Tipografía que acompaña al logo */}
              <div className="space-y-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <Type className="w-4 h-4 text-indigo-600" />
                  <strong className="text-slate-900 font-bold">3. Tipografía del Logotipo & Textos</strong>
                </div>

                {/* Font Family Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Fuente Tipográfica Oficial
                  </label>
                  <select
                    value={brandSettings.brandFont || 'Plus Jakarta Sans'}
                    onChange={(e) => setBrandSettings({ ...brandSettings, brandFont: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Moderno & Tecnológico)</option>
                    <option value="Outfit">Outfit (Elegante & Geométrico)</option>
                    <option value="Poppins">Poppins (Redondeado & Dinámico)</option>
                    <option value="Montserrat">Montserrat (Premium & Corporativo)</option>
                    <option value="Space Grotesk">Space Grotesk (Ciberpunk / Brutalist)</option>
                    <option value="Inter">Inter (Limpio & Minimalista)</option>
                    <option value="Syne">Syne (Vanguardista & Expresivo)</option>
                    <option value="Orbitron">Orbitron (Futurista / Gaming / Sci-Fi)</option>
                    <option value="Cinzel">Cinzel (Lujoso / Real / Clásico)</option>
                  </select>
                </div>

                {/* Font Weight and Letter Spacing */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Grosor / Peso
                    </label>
                    <select
                      value={brandSettings.brandFontWeight || '900'}
                      onChange={(e) => setBrandSettings({ ...brandSettings, brandFontWeight: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                    >
                      <option value="400">400 - Normal</option>
                      <option value="600">600 - Semibold</option>
                      <option value="700">700 - Bold</option>
                      <option value="800">800 - Extra Bold</option>
                      <option value="900">900 - Black / Ultra Bold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Espaciado (Tracking)
                    </label>
                    <select
                      value={brandSettings.brandLetterSpacing || '-0.025em'}
                      onChange={(e) => setBrandSettings({ ...brandSettings, brandLetterSpacing: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                    >
                      <option value="-0.05em">Ultra Compacto (-0.05em)</option>
                      <option value="-0.025em">Apretado (-0.025em)</option>
                      <option value="0em">Normal (0em)</option>
                      <option value="0.05em">Espaciado (0.05em)</option>
                      <option value="0.1em">Amplio (0.1em)</option>
                      <option value="0.15em">Espaciado Neón (0.15em)</option>
                    </select>
                  </div>
                </div>

                {/* Text Transform and Names */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Mayúsculas / Minúsculas
                    </label>
                    <select
                      value={brandSettings.brandTextTransform || 'normal'}
                      onChange={(e) =>
                        setBrandSettings({
                          ...brandSettings,
                          brandTextTransform: e.target.value as 'normal' | 'uppercase' | 'capitalize',
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                    >
                      <option value="normal">Normal (Como se escriba)</option>
                      <option value="uppercase">MAYÚSCULAS (Todo Capital)</option>
                      <option value="capitalize">Tipo Título (Capitalize)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Nombre & Sufijo
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={brandSettings.name}
                        onChange={(e) => setBrandSettings({ ...brandSettings, name: e.target.value })}
                        placeholder="Nombre"
                        className="w-1/2 px-2 py-1.5 rounded border border-slate-300 font-bold text-xs"
                      />
                      <input
                        type="text"
                        value={brandSettings.suffix}
                        onChange={(e) => setBrandSettings({ ...brandSettings, suffix: e.target.value })}
                        placeholder="Sufijo"
                        className="w-1/2 px-2 py-1.5 rounded border border-slate-300 font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Subtítulo / Lema Comercial
                  </label>
                  <input
                    type="text"
                    value={brandSettings.subtitle}
                    onChange={(e) => setBrandSettings({ ...brandSettings, subtitle: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
                    <span>Frase de la Insignia Superior de Testimonios</span>
                    <span className="text-indigo-600 font-normal">Opiniones de Clientes</span>
                  </label>
                  <input
                    type="text"
                    value={brandSettings.reviewsBadgeText || ''}
                    onChange={(e) => setBrandSettings({ ...brandSettings, reviewsBadgeText: e.target.value })}
                    placeholder="✨ +15,000 Clientes Satisfechos en Todo el Perú"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Modifica el texto persuasivo que encabeza la sección de testimonios (ej: ✨ +15,000 Clientes Satisfechos en Todo el Perú).
                  </span>
                </div>
              </div>

              {/* Card 4: Colores & Paletas de Acento */}
              <div className="space-y-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <Palette className="w-4 h-4 text-indigo-600" />
                  <strong className="text-slate-900 font-bold">4. Colores de Marca & Neón Glow</strong>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <input
                      type="color"
                      value={brandSettings.colorPrimary}
                      onChange={(e) => setBrandSettings({ ...brandSettings, colorPrimary: e.target.value })}
                      className="w-8 h-8 rounded border-0 cursor-pointer shrink-0"
                    />
                    <div className="truncate">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Primario / Neón</span>
                      <span className="font-mono text-xs font-bold">{brandSettings.colorPrimary}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <input
                      type="color"
                      value={brandSettings.colorAccent}
                      onChange={(e) => setBrandSettings({ ...brandSettings, colorAccent: e.target.value })}
                      className="w-8 h-8 rounded border-0 cursor-pointer shrink-0"
                    />
                    <div className="truncate">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Acento / Gradiente</span>
                      <span className="font-mono text-xs font-bold">{brandSettings.colorAccent}</span>
                    </div>
                  </div>
                </div>

                {/* Visual Theme Presets Grid */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-2">
                    Elige un Tema de Diseño Oficial (Armonía Global de Colores):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {THEME_PRESETS.map((preset) => {
                      const isSelected =
                        brandSettings.activeThemePreset === preset.id ||
                        (brandSettings.colorPrimary === preset.primary &&
                          brandSettings.colorAccent === preset.accent);
                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            setBrandSettings({
                              ...brandSettings,
                              colorPrimary: preset.primary,
                              colorAccent: preset.accent,
                              activeThemePreset: preset.id,
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-200 select-none ${
                            isSelected
                              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-400/50 shadow-sm'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-slate-800 dark:text-white">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                            )}
                          </div>
                          {/* Visual Gradient Swatch */}
                          <div
                            className="h-3.5 rounded-md mb-1.5 shadow-2xs"
                            style={{ background: preset.previewBg }}
                          />
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                            {preset.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Redes Sociales Oficiales y Enlaces Modificables */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  <strong className="text-slate-900 font-bold text-sm">
                    5. Redes Sociales Oficiales de la Web & Botón Flotante Neón
                  </strong>
                </div>
                <span className="text-[10.5px] text-slate-500 hidden sm:inline">
                  Redirigen a las redes oficiales con animaciones e iluminación neón
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Coloca los enlaces oficiales de tu marca. Los usuarios podrán abrirlos directamente desde el botón flotante con iluminación neón en la esquina de la pantalla.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* TikTok */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded bg-black text-white flex items-center justify-center text-[9px] font-black">
                        T
                      </div>
                      TikTok Oficial
                    </label>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={brandSettings.showTiktok !== false}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, showTiktok: e.target.checked })
                        }
                        className="rounded text-indigo-600 w-3.5 h-3.5"
                      />
                      Mostrar
                    </label>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={brandSettings.tiktokUrl || ''}
                      onChange={(e) => setBrandSettings({ ...brandSettings, tiktokUrl: e.target.value })}
                      placeholder="https://www.tiktok.com/@alixplay"
                      className="w-full px-2 py-1 text-[11px] rounded border border-slate-300"
                    />
                    {brandSettings.tiktokUrl && (
                      <a
                        href={brandSettings.tiktokUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 text-slate-600 flex items-center justify-center shrink-0"
                        title="Probar enlace"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Instagram */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-rose-500" />
                      Instagram Oficial
                    </label>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={brandSettings.showInstagram !== false}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, showInstagram: e.target.checked })
                        }
                        className="rounded text-indigo-600 w-3.5 h-3.5"
                      />
                      Mostrar
                    </label>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={brandSettings.instagramUrl || ''}
                      onChange={(e) => setBrandSettings({ ...brandSettings, instagramUrl: e.target.value })}
                      placeholder="https://www.instagram.com/aliclip.site"
                      className="w-full px-2 py-1 text-[11px] rounded border border-slate-300"
                    />
                    {brandSettings.instagramUrl && (
                      <a
                        href={brandSettings.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 text-slate-600 flex items-center justify-center shrink-0"
                        title="Probar enlace"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Telegram */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-sky-500" />
                      Canal Telegram Promos
                    </label>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={brandSettings.showTelegram !== false}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, showTelegram: e.target.checked })
                        }
                        className="rounded text-indigo-600 w-3.5 h-3.5"
                      />
                      Mostrar
                    </label>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={brandSettings.telegramUrl || ''}
                      onChange={(e) => setBrandSettings({ ...brandSettings, telegramUrl: e.target.value })}
                      placeholder="https://t.me/alixplay_promos"
                      className="w-full px-2 py-1 text-[11px] rounded border border-slate-300"
                    />
                    {brandSettings.telegramUrl && (
                      <a
                        href={brandSettings.telegramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 text-slate-600 flex items-center justify-center shrink-0"
                        title="Probar enlace"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Facebook */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Facebook className="w-3.5 h-3.5 text-blue-600" />
                      Página de Facebook
                    </label>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={brandSettings.showFacebook !== false}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, showFacebook: e.target.checked })
                        }
                        className="rounded text-indigo-600 w-3.5 h-3.5"
                      />
                      Mostrar
                    </label>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={brandSettings.facebookUrl || ''}
                      onChange={(e) => setBrandSettings({ ...brandSettings, facebookUrl: e.target.value })}
                      placeholder="https://www.facebook.com/alixplay.oficial"
                      className="w-full px-2 py-1 text-[11px] rounded border border-slate-300"
                    />
                    {brandSettings.facebookUrl && (
                      <a
                        href={brandSettings.facebookUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 text-slate-600 flex items-center justify-center shrink-0"
                        title="Probar enlace"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* YouTube */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5 text-red-600" />
                      Canal de YouTube
                    </label>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={brandSettings.showYoutube !== false}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, showYoutube: e.target.checked })
                        }
                        className="rounded text-indigo-600 w-3.5 h-3.5"
                      />
                      Mostrar
                    </label>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={brandSettings.youtubeUrl || ''}
                      onChange={(e) => setBrandSettings({ ...brandSettings, youtubeUrl: e.target.value })}
                      placeholder="https://youtube.com/@alixplay"
                      className="w-full px-2 py-1 text-[11px] rounded border border-slate-300"
                    />
                    {brandSettings.youtubeUrl && (
                      <a
                        href={brandSettings.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 text-slate-600 flex items-center justify-center shrink-0"
                        title="Probar enlace"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Twitter / X */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5 text-blue-400" />
                      X (Twitter) Oficial
                    </label>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={brandSettings.showTwitter === true}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, showTwitter: e.target.checked })
                        }
                        className="rounded text-indigo-600 w-3.5 h-3.5"
                      />
                      Mostrar
                    </label>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={brandSettings.twitterUrl || ''}
                      onChange={(e) => setBrandSettings({ ...brandSettings, twitterUrl: e.target.value })}
                      placeholder="https://x.com/alixplay"
                      className="w-full px-2 py-1 text-[11px] rounded border border-slate-300"
                    />
                    {brandSettings.twitterUrl && (
                      <a
                        href={brandSettings.twitterUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 text-slate-600 flex items-center justify-center shrink-0"
                        title="Probar enlace"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* WhatsApp Contact */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    WhatsApp Ventas (sólo dígitos, ej. 51900000000)
                  </label>
                  <input
                    type="text"
                    value={brandSettings.whatsappNumber}
                    onChange={(e) =>
                      setBrandSettings({ ...brandSettings, whatsappNumber: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="51900000000"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    WhatsApp Texto Visible al Público
                  </label>
                  <input
                    type="text"
                    value={brandSettings.whatsappDisplay}
                    onChange={(e) =>
                      setBrandSettings({ ...brandSettings, whatsappDisplay: e.target.value })
                    }
                    placeholder="+51 900 000 000"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Card: Personalización del Banner Principal (Hero) & Rating en Perú */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                    <Flame className="w-4 h-4 fill-pink-500/20" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Banner Principal (Hero) &amp; Rating en Perú
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Personaliza los títulos, el texto destacado con gradiente, la descripción y las métricas de rating en Perú.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('texts')}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Ver todos los textos web →</span>
                  </button>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                    Visible en Portada
                  </span>
                </div>
              </div>

              {/* Mini Live Preview of the Hero Header */}
              <div className="p-4 rounded-xl bg-[#070913] text-white border border-purple-900/40 space-y-2.5 relative overflow-hidden shadow-inner">
                <div className="absolute top-0 right-0 w-36 h-36 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[9.5px] font-bold text-pink-300 w-fit">
                  <Flame className="w-3 h-3 text-pink-400 fill-pink-400" />
                  <span>{brandSettings.heroBadgeText || 'MEMBRESÍAS DIGITALES PREMIUM • ENTREGA EN 3 MINUTOS'}</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-white leading-tight">
                  {brandSettings.heroTitlePrefix || 'ACCESO'}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-300">
                    {brandSettings.heroTitleHighlight || 'PREMIUM'}
                  </span>{' '}
                  {brandSettings.heroTitleSuffix || 'al Mejor Precio'}
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 max-w-xl">
                  {brandSettings.heroDescription ||
                    'Cuentas 100% privadas y renovables mes a mes con activación inmediata por WhatsApp, garantía de reposición total y soporte técnico 24/7 en Perú.'}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="px-3 py-1 rounded-lg bg-pink-600 text-white font-bold text-[10.5px]">
                    {brandSettings.heroCtaText || 'Explorar Catálogo'}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-purple-500/30 text-[10px]">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="font-black text-white">{brandSettings.heroRatingScore || '4.9 / 5.0'}</span>
                    <span className="text-purple-300 font-semibold">{brandSettings.heroRatingText || '+15,000 Clientes en Perú'}</span>
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-3">
                {/* 1. Insignia Superior (Kicker Badge) */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Insignia Superior (Kicker Badge)
                  </label>
                  <input
                    type="text"
                    value={brandSettings.heroBadgeText ?? 'MEMBRESÍAS DIGITALES PREMIUM • ENTREGA EN 3 MINUTOS'}
                    onChange={(e) =>
                      setBrandSettings({ ...brandSettings, heroBadgeText: e.target.value })
                    }
                    placeholder="MEMBRESÍAS DIGITALES PREMIUM • ENTREGA EN 3 MINUTOS"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>

                {/* 2. Título Principal en 3 Segmentos */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Título Principal del Banner (Segmentos para Efecto Gradiente)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">1. Prefijo (Texto Blanco)</span>
                      <input
                        type="text"
                        value={brandSettings.heroTitlePrefix ?? 'ACCESO'}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, heroTitlePrefix: e.target.value })
                        }
                        placeholder="ACCESO"
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block mb-0.5">
                        2. Palabra con Gradiente Neón
                      </span>
                      <input
                        type="text"
                        value={brandSettings.heroTitleHighlight ?? 'PREMIUM'}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, heroTitleHighlight: e.target.value })
                        }
                        placeholder="PREMIUM"
                        className="w-full px-2.5 py-1.5 text-xs font-black rounded-xl border border-purple-400 bg-purple-50/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">3. Sufijo (Texto Final)</span>
                      <input
                        type="text"
                        value={brandSettings.heroTitleSuffix ?? 'al Mejor Precio'}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, heroTitleSuffix: e.target.value })
                        }
                        placeholder="al Mejor Precio"
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Descripción del Banner */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Descripción / Subtítulo del Banner
                  </label>
                  <textarea
                    rows={2}
                    value={
                      brandSettings.heroDescription ??
                      'Cuentas 100% privadas y renovables mes a mes con activación inmediata por WhatsApp, garantía de reposición total y soporte técnico 24/7 en Perú.'
                    }
                    onChange={(e) =>
                      setBrandSettings({ ...brandSettings, heroDescription: e.target.value })
                    }
                    placeholder="Descripción persuasiva de la propuesta de valor..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 leading-relaxed"
                  />
                </div>

                {/* 4. Rating & Clientes en Perú */}
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Rating y Prueba Social en Perú</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                        Puntaje / Calificación Numérica
                      </label>
                      <input
                        type="text"
                        value={brandSettings.heroRatingScore ?? '4.9 / 5.0'}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, heroRatingScore: e.target.value })
                        }
                        placeholder="4.9 / 5.0"
                        className="w-full px-2.5 py-1.5 text-xs font-black rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                        Texto de Clientes / Reseñas en Perú
                      </label>
                      <input
                        type="text"
                        value={brandSettings.heroRatingText ?? '+15,000 Clientes en Perú'}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, heroRatingText: e.target.value })
                        }
                        placeholder="+15,000 Clientes en Perú"
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Textos de Botón y Sección + Vendidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Texto del Botón de Catálogo (CTA)
                    </label>
                    <input
                      type="text"
                      value={brandSettings.heroCtaText ?? 'Explorar Catálogo'}
                      onChange={(e) =>
                        setBrandSettings({ ...brandSettings, heroCtaText: e.target.value })
                      }
                      placeholder="Explorar Catálogo"
                      className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Título del Carrusel de Destacados
                    </label>
                    <input
                      type="text"
                      value={brandSettings.heroShowcaseTitle ?? '+ Vendidos en Perú (En Vivo)'}
                      onChange={(e) =>
                        setBrandSettings({ ...brandSettings, heroShowcaseTitle: e.target.value })
                      }
                      placeholder="+ Vendidos en Perú (En Vivo)"
                      className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Configuración rápida de Carrusel / Activaciones y Rating */}
                <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-purple-900 dark:text-purple-300">
                      <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                      <span>Textos del Carrusel (+ Vendidos &amp; Activaciones)</span>
                    </div>
                    <span className="text-[9.5px] font-bold text-purple-600 dark:text-purple-400">
                      Carrusel Superior
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-0.5">
                        Texto de Activaciones
                      </label>
                      <input
                        type="text"
                        value={brandSettings.heroCarouselActivationsText ?? '+2.400 Activaciones'}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, heroCarouselActivationsText: e.target.value })
                        }
                        placeholder="+2.400 Activaciones"
                        className="w-full px-2 py-1 text-xs font-black rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-0.5">
                        Rating Base
                      </label>
                      <input
                        type="text"
                        value={brandSettings.heroCarouselBaseRating ?? '4.9'}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, heroCarouselBaseRating: e.target.value })
                        }
                        placeholder="4.9"
                        className="w-full px-2 py-1 text-xs font-black rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-0.5">
                        Distintivo de Rango
                      </label>
                      <input
                        type="text"
                        value={brandSettings.heroCarouselRankBadge ?? 'Más Vendido'}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, heroCarouselRankBadge: e.target.value })
                        }
                        placeholder="Más Vendido"
                        className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-purple-200 dark:border-purple-900/40 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={brandSettings.heroCarouselRatingVary !== false}
                        onChange={(e) =>
                          setBrandSettings({ ...brandSettings, heroCarouselRatingVary: e.target.checked })
                        }
                        className="w-3.5 h-3.5 text-purple-600 rounded"
                      />
                      <span>Variar rating entre productos del carrusel (4.8, 4.9, 5.0...)</span>
                    </label>
                    <span className="text-[9.5px] text-purple-500 font-bold">
                      {brandSettings.heroCarouselRatingVary !== false ? 'Dinámico' : 'Estático'}
                    </span>
                  </div>

                  {/* Selector de Modo de Activaciones por Ventas */}
                  <div className="pt-1.5 border-t border-purple-200 dark:border-purple-900/40">
                    <label className="block text-[9.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Cálculo de Activaciones por Ventas de cada Plataforma
                    </label>
                    <select
                      value={brandSettings.heroCarouselActivationsMode || 'sales_additive'}
                      onChange={(e) =>
                        setBrandSettings({
                          ...brandSettings,
                          heroCarouselActivationsMode: e.target.value as any,
                        })
                      }
                      className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    >
                      <option value="sales_additive">
                        🔥 Dinámico: Base + Ventas Confirmadas de cada Plataforma
                      </option>
                      <option value="sales_direct">
                        📊 Conteo Directo: Mostrar solo ventas confirmadas (+X Activaciones)
                      </option>
                      <option value="fixed">
                        🔒 Fijo: Mostrar texto fijo sin sumar ventas
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Announcement bar */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <strong className="block font-bold text-slate-900">Anuncio Superior de la Tienda (Marquee)</strong>
              <input
                type="text"
                value={brandSettings.announcement}
                onChange={(e) => setBrandSettings({ ...brandSettings, announcement: e.target.value })}
                placeholder="Texto del banner superior..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{savingSettings ? 'Guardando en la Nube...' : 'Aplicar Cambios en Toda la Web'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab: Métodos de Pago Configuración */}
        {activeTab === 'payments' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            {/* Header & Action Bar */}
            <div className="p-4 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50/20 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs"
                    style={{
                      background: `linear-gradient(135deg, ${brandSettings.colorPrimary} 0%, ${brandSettings.colorAccent} 100%)`,
                    }}
                  >
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Métodos de Pago & Cuentas de Cobro
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  Configura las opciones que verán tus clientes al comprar (Yape, Plin, BCP, Binance Pay, etc.) con logotipos y resplandor neón.
                </p>
              </div>

              {!showPaymentForm && (
                <button
                  type="button"
                  onClick={openNewPaymentForm}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-sm hover:shadow transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Método de Pago</span>
                </button>
              )}
            </div>

            {/* Payment Method Creation/Editing Form */}
            {showPaymentForm && (
              <form
                onSubmit={handleSavePaymentMethod}
                className="p-4 bg-white rounded-2xl border-2 border-indigo-200 shadow-lg space-y-4 animate-in fade-in zoom-in-98 duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white"
                      style={{ backgroundColor: payColor }}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <strong className="text-slate-900 font-bold text-xs">
                      {editingPaymentMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                      Nombre del Método (ej. Yape, BCP, Binance Pay) *
                    </label>
                    <input
                      type="text"
                      required
                      value={payName}
                      onChange={(e) => setPayName(e.target.value)}
                      placeholder="ej. Yape / Plin"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                      Etiqueta / Beneficio Rápido
                    </label>
                    <input
                      type="text"
                      value={payBadge}
                      onChange={(e) => setPayBadge(e.target.value)}
                      placeholder="ej. Inmediato • 0% comisión"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                      Dato Principal / Número de Cuenta / Pay ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={payAccountNumber}
                      onChange={(e) => setPayAccountNumber(e.target.value)}
                      placeholder="ej. +51 900 000 000 o 191-99882211-0-45"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-xs"
                    />
                    <span className="text-[9.5px] text-slate-400 mt-0.5 block">
                      Este es el dato que el cliente podrá copiar con un clic.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                      Titular de la Cuenta
                    </label>
                    <input
                      type="text"
                      value={payAccountHolder}
                      onChange={(e) => setPayAccountHolder(e.target.value)}
                      placeholder="ej. Alixplay Store Oficial"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                    Instrucciones para el Cliente (Opcional)
                  </label>
                  <input
                    type="text"
                    value={payInstructions}
                    onChange={(e) => setPayInstructions(e.target.value)}
                    placeholder="ej. Envía comprobante con el número de operación al WhatsApp tras realizar la transferencia."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                </div>

                {/* Logo and Neon Color Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <label className="block text-[10.5px] font-bold text-slate-600 uppercase">
                      Logotipo del Método de Pago
                    </label>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 bg-white shadow-xs"
                        style={{
                          boxShadow: `0 0 12px ${payColor}40`,
                        }}
                      >
                        {payLogoUrl ? (
                          <img
                            src={payLogoUrl}
                            alt="Logo preview"
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <CreditCard className="w-5 h-5" style={{ color: payColor }} />
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-md border border-slate-300 cursor-pointer text-[10.5px] inline-flex items-center gap-1 active:scale-95">
                            <Upload className="w-3 h-3 text-indigo-600" />
                            <span>{uploadingPayLogo ? 'Procesando...' : 'Subir Imagen de Logo...'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingPayLogo}
                              onChange={handlePaymentLogoUpload}
                              className="hidden"
                            />
                          </label>

                          {payLogoUrl && (
                            <button
                              type="button"
                              onClick={() => setPayLogoUrl('')}
                              className="text-rose-600 hover:text-rose-800 text-[10.5px] font-bold"
                            >
                              Quitar
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={payLogoUrl}
                          onChange={(e) => setPayLogoUrl(e.target.value)}
                          placeholder="O pega URL de logo..."
                          className="w-full px-2 py-1 text-[10.5px] rounded border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Neon Glow Color Picker & Presets */}
                  <div className="space-y-1.5">
                    <label className="block text-[10.5px] font-bold text-slate-600 uppercase">
                      Color de Resplandor Neón
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={payColor}
                        onChange={(e) => setPayColor(e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={payColor}
                        onChange={(e) => setPayColor(e.target.value)}
                        className="w-24 px-2 py-1 font-mono text-xs font-bold rounded border border-slate-300 bg-white"
                      />
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
                        style={{
                          backgroundColor: `${payColor}20`,
                          color: payColor,
                          boxShadow: `0 0 10px ${payColor}60`,
                        }}
                      >
                        Vista Neón
                      </span>
                    </div>

                    {/* Quick Color Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { name: 'Yape', color: '#8b5cf6' },
                        { name: 'Binance', color: '#f59e0b' },
                        { name: 'BCP', color: '#06b6d4' },
                        { name: 'Interbank', color: '#10b981' },
                        { name: 'BBVA', color: '#ef4444' },
                        { name: 'PayPal', color: '#3b82f6' },
                        { name: 'Magenta', color: '#ec4899' },
                      ].map((cp) => (
                        <button
                          key={cp.color}
                          type="button"
                          onClick={() => setPayColor(cp.color)}
                          className="w-5 h-5 rounded-full border border-slate-300 active:scale-95 transition-transform"
                          style={{
                            backgroundColor: cp.color,
                            boxShadow: payColor === cp.color ? `0 0 8px ${cp.color}` : undefined,
                            borderColor: payColor === cp.color ? '#000' : '#cbd5e1',
                          }}
                          title={cp.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fallback Icon & Active Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Icono de Reserva (si no hay imagen de logo)
                    </label>
                    <select
                      value={payIcon}
                      onChange={(e) => setPayIcon(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                    >
                      <option value="smartphone">📱 Smartphone / Celular (Yape/Plin)</option>
                      <option value="coins">🪙 Monedas / Cripto (Binance/USDT)</option>
                      <option value="credit-card">💳 Tarjeta de Crédito / Débito</option>
                      <option value="wallet">👛 Billetera Digital</option>
                      <option value="bank">🏦 Banco / Transferencia Directa</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-300 cursor-pointer w-full">
                      <input
                        type="checkbox"
                        checked={payEnabled}
                        onChange={(e) => setPayEnabled(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Método Activo y Visible
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Los clientes podrán seleccionarlo al realizar compras.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPayment}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{savingPayment ? 'Guardando...' : 'Guardar Método de Pago'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of Configured Payment Methods */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-indigo-600" />
                  Métodos de Pago Configurados ({(brandSettings.paymentMethods || DEFAULT_PAYMENT_METHODS).length})
                </span>
                <span className="text-[10.5px] text-slate-500 font-medium">
                  Se reflejan instantáneamente con resplandor neón en el modal de compra
                </span>
              </div>

              {(brandSettings.paymentMethods || DEFAULT_PAYMENT_METHODS).map((pm, idx, arr) => (
                <div
                  key={pm.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white ${
                    pm.enabled !== false
                      ? 'border-slate-200 hover:border-slate-300'
                      : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                  style={{
                    boxShadow: pm.enabled !== false ? `0 0 14px -3px ${pm.color}25` : undefined,
                  }}
                >
                  {/* Left: Logo/Icon + Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 bg-white"
                      style={{
                        boxShadow: `0 0 14px ${pm.color}50`,
                      }}
                    >
                      {pm.logoUrl ? (
                        <img
                          src={pm.logoUrl}
                          alt={pm.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <CreditCard className="w-5 h-5" style={{ color: pm.color }} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-slate-900 font-extrabold text-xs">
                          {pm.name}
                        </strong>
                        {pm.badge && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[9.5px] font-bold"
                            style={{
                              backgroundColor: `${pm.color}15`,
                              color: pm.color,
                            }}
                          >
                            {pm.badge}
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            pm.enabled !== false
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {pm.enabled !== false ? 'Activo' : 'Oculto'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {pm.accountNumber}
                        </span>
                        {pm.accountHolder && (
                          <span className="text-[10px] text-slate-500 font-medium truncate max-w-xs">
                            • {pm.accountHolder}
                          </span>
                        )}
                      </div>

                      {pm.instructions && (
                        <p className="text-[9.5px] text-slate-400 truncate max-w-md mt-0.5">
                          {pm.instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5 mr-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMovePaymentMethod(idx, 'up')}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                        title="Mover arriba"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === arr.length - 1}
                        onClick={() => handleMovePaymentMethod(idx, 'down')}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                        title="Mover abajo"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod(pm.id, pm.enabled !== false)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-colors cursor-pointer ${
                        pm.enabled !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {pm.enabled !== false ? 'Desactivar' : 'Activar'}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEditPaymentForm(pm)}
                      className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                      title="Editar método de pago"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeletePaymentMethod(pm.id, pm.name)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                      title="Eliminar método de pago"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Save & Sync Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={async () => {
                  setSavingPayment(true);
                  try {
                    await savePaymentMethodsToFirestore(
                      brandSettings.paymentMethods || DEFAULT_PAYMENT_METHODS
                    );
                    onToast('¡Métodos de pago guardados y sincronizados!');
                  } catch (err) {
                    console.error(err);
                    onToast('Error al guardar métodos de pago.');
                  } finally {
                    setSavingPayment(false);
                  }
                }}
                disabled={savingPayment}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {savingPayment ? 'Guardando en la Nube...' : 'Guardar y Sincronizar Métodos de Pago'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Cloud & Sync */}
        {activeTab === 'cloud' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-emerald-900 font-bold block">
                  Sincronización en Tiempo Real Activa (Firebase Firestore)
                </strong>
                <span className="text-[11px] text-emerald-700">
                  Cualquier edición, creación o eliminación en esta colección se refleja instantáneamente en
                  todos los dispositivos conectados sin necesidad de recargar la página.
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[11.5px]">
              <div className="flex justify-between py-1 border-b">
                <span>Total de Productos en Firestore:</span>
                <strong className="text-slate-800">{products.length} productos</strong>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Total de Reclamaciones Registradas:</span>
                <strong className="text-slate-800">{claims.length} reclamaciones</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Estado de Conexión:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado en vivo (onSnapshot activo)
                </span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <strong className="text-amber-900 font-bold block">
                Función Semilla de Validación (Seed Data)
              </strong>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Rellena la colección "products" con los 16 productos iniciales preconfigurados de Inteligencia
                Artificial (ChatGPT Plus, Claude Pro, Gemini, Midjourney, etc.) y Streaming (Netflix 4K, Disney+,
                Max, etc.).
              </p>
              <button
                type="button"
                onClick={() => handleSeed(true)}
                disabled={isSeeding}
                className="mt-2 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-1.5"
              >
                <Database className="w-4 h-4" />
                <span>{isSeeding ? 'Ejecutando semilla...' : 'Forzar Semilla de 16 Productos'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Claims */}
        {activeTab === 'claims' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Hojas de Reclamación Virtual recibidas ({claims.length})
            </span>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Servicio</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Detalle</th>
                    <th className="p-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-amber-700">{c.code}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {c.name}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {c.phone} • {c.email}
                        </div>
                      </td>
                      <td className="p-3">{c.service}</td>
                      <td className="p-3 font-bold">{c.category}</td>
                      <td className="p-3 max-w-xs truncate" title={c.description}>
                        {c.description}
                      </td>
                      <td className="p-3 text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {claims.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No hay reclamaciones registradas por el momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Security */}
        {activeTab === 'security' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <strong className="text-xs text-slate-800 block">Actualizar Credenciales Locales</strong>
              <form onSubmit={handleChangeCreds} className="space-y-2.5 max-w-md">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nuevo Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    placeholder="Nuevo usuario"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>

                {credStatus && (
                  <div
                    className={`p-2 rounded-lg text-[11px] font-bold ${
                      credStatus.success
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {credStatus.msg}
                  </div>
                )}

                <button
                  type="submit"
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Nuevas Credenciales</span>
                </button>
              </form>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación estilizado para sustituir window.confirm bloqueado en iframe */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex w-full gap-2.5">
              <button
                type="button"
                disabled={confirmLoading}
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmLoading}
                onClick={async () => {
                  setConfirmLoading(true);
                  try {
                    await confirmDialog.onConfirm();
                  } finally {
                    setConfirmLoading(false);
                    setConfirmDialog(null);
                  }
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {confirmLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {confirmDialog.confirmText || 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
