import React, { useState } from 'react';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  Package,
  Search,
  Filter,
  Trash2,
  MessageCircle,
  AlertTriangle,
  Flame,
  Check,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Product, SaleRecord } from '../../types';
import { createSaleRecord, updateSaleStatus, deleteSaleRecord } from '../../services/storeService';
import {
  validateCustomerName,
  validatePhoneNumber,
  validateCustomerEmail,
  validateDescriptiveText,
  detectMaliciousPayload,
} from '../../utils/securityValidator';

interface AdminSalesTabProps {
  products: Product[];
  sales: SaleRecord[];
  onToast: (msg: string) => void;
  onNavigateToHistory?: () => void;
}

export const AdminSalesTab: React.FC<AdminSalesTabProps> = ({
  products,
  sales,
  onToast,
  onNavigateToHistory,
}) => {
  // New Sale Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [planName, setPlanName] = useState(products[0]?.plans[0]?.name || '1 Mes VIP');
  const [price, setPrice] = useState(products[0]?.plans[0]?.price || 'S/ 29.90');
  const [paymentMethod, setPaymentMethod] = useState('Yape');
  const [accountType, setAccountType] = useState('Perfil Privado con PIN');
  const [durationValue, setDurationValue] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<'dias' | 'meses' | 'anos'>('meses');
  const [activationDate, setActivationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [autoDiscountStock, setAutoDiscountStock] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingSale, setSavingSale] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'activa' | 'por_vencer' | 'vencida'>('todas');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Calculate expiration date automatically from activation date + duration
  const calculateExpirationDate = (start: string, val: number, unit: 'dias' | 'meses' | 'anos') => {
    try {
      const d = new Date(start || Date.now());
      if (unit === 'dias') d.setDate(d.getDate() + val);
      else if (unit === 'meses') d.setMonth(d.getMonth() + val);
      else if (unit === 'anos') d.setFullYear(d.getFullYear() + val);
      return d.toISOString().split('T')[0];
    } catch {
      return start;
    }
  };

  const expirationDate = calculateExpirationDate(activationDate, durationValue, durationUnit);

  const durationText = `${durationValue} ${
    durationUnit === 'dias'
      ? durationValue === 1 ? 'Día' : 'Días'
      : durationUnit === 'meses'
      ? durationValue === 1 ? 'Mes' : 'Meses'
      : durationValue === 1 ? 'Año' : 'Años'
  }`;

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setPlanName(prod.plans[0]?.name || '1 Mes VIP');
      setPrice(prod.plans[0]?.price || 'S/ 29.90');
      if (prod.accountType === 'cuenta_privada') {
        setAccountType('Cuenta Completa Privada');
      } else if (prod.accountType === 'perfil_compartido') {
        setAccountType('Perfil Compartido');
      } else {
        setAccountType('Perfil Privado con PIN');
      }
      if (prod.durationValue && prod.durationUnit) {
        setDurationValue(prod.durationValue);
        setDurationUnit(prod.durationUnit);
      }
    }
  };

  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      onToast('Por favor ingresa al menos el nombre y teléfono del cliente.');
      return;
    }

    // Validación estricta del nombre
    const nameVal = validateCustomerName(clientName, 'Nombre del cliente');
    if (!nameVal.valid) {
      onToast(`⚠️ ${nameVal.error}`);
      return;
    }

    // Validación estricta del teléfono
    const phoneVal = validatePhoneNumber(clientPhone, 'Teléfono del cliente');
    if (!phoneVal.valid) {
      onToast(`⚠️ ${phoneVal.error}`);
      return;
    }

    // Validación estricta de correo (si fue ingresado)
    let safeEmail = '';
    if (clientEmail.trim()) {
      const emailVal = validateCustomerEmail(clientEmail, 'Correo del cliente');
      if (!emailVal.valid) {
        onToast(`⚠️ ${emailVal.error}`);
        return;
      }
      safeEmail = emailVal.sanitized;
    }

    // Validación estricta de notas
    const notesVal = validateDescriptiveText(notes, { label: 'Notas', maxLength: 1000 });
    if (!notesVal.valid) {
      onToast(`⚠️ ${notesVal.error}`);
      return;
    }

    setSavingSale(true);
    try {
      const newSale = await createSaleRecord(
        {
          clientName: nameVal.sanitized,
          clientPhone: phoneVal.sanitized,
          clientEmail: safeEmail,
          productId: selectedProduct?.id || 'prod_custom',
          productName: selectedProduct?.name || 'Servicio Digital',
          planName: planName.trim(),
          price: price.trim(),
          paymentMethod,
          accountType,
          durationText,
          activationDate,
          expirationDate,
          status: 'activa',
          notes: notesVal.sanitized,
        },
        autoDiscountStock
      );

      onToast(
        `¡Venta confirmada para ${newSale.clientName}! ${
          autoDiscountStock ? 'Stock descontado (-1 unid.).' : ''
        }`
      );

      // Reset form fields
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setNotes('');
    } catch (err) {
      console.error('Error confirming sale:', err);
      onToast('Error al registrar la venta. Inténtalo de nuevo.');
    } finally {
      setSavingSale(false);
    }
  };

  const handleStatusChange = async (saleId: string, newStatus: 'activa' | 'por_vencer' | 'vencida') => {
    try {
      await updateSaleStatus(saleId, newStatus);
      onToast(`Estado actualizado a: ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      onToast('Error al actualizar estado.');
    }
  };

  // In-app confirmation dialog state
  const [saleToDelete, setSaleToDelete] = useState<{ id: string; clientName: string; productName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!saleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSaleRecord(saleToDelete.id);
      onToast(`Registro de venta de ${saleToDelete.clientName} eliminado con éxito.`);
      setSaleToDelete(null);
    } catch (err) {
      console.error(err);
      onToast('Error al eliminar venta.');
    } finally {
      setIsDeleting(false);
    }
  };

  // WhatsApp client contact
  const handleOpenWhatsApp = (sale: SaleRecord) => {
    const cleanPhone = sale.clientPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    const text = `¡Hola ${sale.clientName}! 👋 Te saludamos de AliClip. Te confirmamos la activación de tu membresía de *${sale.productName}* (${sale.accountType}, plan ${sale.durationText}). Válido hasta el *${sale.expirationDate}*. ¿Tienes alguna duda o necesitas soporte? ¡Estamos para ayudarte!`;
    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Metrics
  const nowTime = new Date().getTime();
  const activeCount = sales.filter((s) => s.status === 'activa').length;
  const expiringCount = sales.filter((s) => {
    const exp = new Date(s.expirationDate).getTime();
    const diffDays = Math.ceil((exp - nowTime) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 5;
  }).length;

  // Filtered sales
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.clientPhone.includes(searchQuery) ||
      s.productName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'todas') return true;
    return s.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
            Total Ventas
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {sales.length}
          </div>
          <span className="text-[10.5px] text-slate-500 dark:text-slate-400">Registradas</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block tracking-wider">
            Ventas Activas
          </span>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
            {activeCount}
          </div>
          <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400">Servicios vigentes</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block tracking-wider">
            Por Vencer (≤ 5d)
          </span>
          <div className="text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5 flex items-center gap-1">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>{expiringCount}</span>
          </div>
          <span className="text-[10.5px] text-amber-600 dark:text-amber-400">Para renovación</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase block tracking-wider">
            Descuento de Stock
          </span>
          <div className="text-xl font-black text-purple-700 dark:text-purple-300 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
            <span>Automático</span>
          </div>
          <span className="text-[10.5px] text-purple-600 dark:text-purple-400">-1 al confirmar</span>
        </div>
      </div>

      {/* Section 1: Formulario de Confirmación y Registro de Venta */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Registrar &amp; Confirmar Venta
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Guarda los datos del cliente, calcula fechas de vencimiento y descuenta unidades de stock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToHistory && (
              <button
                type="button"
                onClick={onNavigateToHistory}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <span>Ver Historial con Filtros</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {selectedProduct && typeof selectedProduct.stock === 'number' && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Stock de {selectedProduct.name}:</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-md inline-block ${
                  selectedProduct.stock <= 3
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {selectedProduct.stock} unidades disponibles
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleConfirmSale} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Producto Adquirido */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Producto / Servicio Adquirido *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({typeof p.stock === 'number' ? `${p.stock} unid.` : 'En stock'})
                  </option>
                ))}
              </select>
            </div>

            {/* Modalidad de Cuenta */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Modalidad de Acceso
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              >
                <option value="Perfil Privado con PIN">🔒 Perfil Privado con PIN</option>
                <option value="Perfil Compartido">👥 Perfil Compartido</option>
                <option value="Cuenta Completa Privada">✨ Cuenta Completa Privada</option>
                <option value="Cuenta Compartida">🔄 Cuenta Compartida</option>
              </select>
            </div>

            {/* Plan y Precio */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Precio Cobrado (S/)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Plan (ej: 1 Mes VIP)"
                  className="w-1/2 px-2.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="S/ 45.00"
                  className="w-1/2 px-2.5 py-2 text-xs font-black text-indigo-600 dark:text-indigo-400 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Nombre Completo del Cliente *
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Renzo Silva"
                  className="w-full pl-8 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                WhatsApp / Teléfono *
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Ej: +51 987 654 321"
                  className="w-full pl-8 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Método de Pago Usado
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              >
                <option value="Yape">Yape</option>
                <option value="Plin">Plin</option>
                <option value="BCP Soles">BCP Soles</option>
                <option value="Interbank">Interbank</option>
                <option value="Binance Pay">Binance Pay (USDT)</option>
                <option value="BBVA">BBVA</option>
              </select>
            </div>
          </div>

          {/* Fechas & Duración */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/50">
            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-500" />
                <span>Fecha de Activación</span>
              </label>
              <input
                type="date"
                value={activationDate}
                onChange={(e) => setActivationDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Duración del Servicio
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={durationValue}
                  onChange={(e) => setDurationValue(parseInt(e.target.value) || 1)}
                  className="w-20 px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as any)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                >
                  <option value="dias">Día(s)</option>
                  <option value="meses">Mes(es)</option>
                  <option value="anos">Año(s)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Fecha de Finalización (Auto)</span>
              </label>
              <input
                type="date"
                readOnly
                value={expirationDate}
                className="w-full px-2.5 py-1.5 text-xs font-black text-purple-700 dark:text-purple-300 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-100/50 dark:bg-purple-900/40 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Notas y Checkbox de Stock */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoDiscountStockInput"
                checked={autoDiscountStock}
                onChange={(e) => setAutoDiscountStock(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="autoDiscountStockInput" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                Descontar automáticamente 1 unidad del stock de este producto
              </label>
            </div>

            <button
              type="submit"
              disabled={savingSale}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savingSale ? 'Registrando...' : 'Confirmar Venta & Descontar Stock'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Listado y Control de Clientes / Ventas */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Historial de Ventas &amp; Clientes Activos ({filteredSales.length})
            </h4>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente o servicio..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="todas">Todas</option>
              <option value="activa">Solo Activas</option>
              <option value="por_vencer">Por Vencer</option>
              <option value="vencida">Vencidas</option>
            </select>
          </div>
        </div>

        {/* Sales Table / Cards */}
        {filteredSales.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No hay ventas registradas con el filtro actual.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="p-3">Cliente &amp; Contacto</th>
                  <th className="p-3">Servicio / Modalidad</th>
                  <th className="p-3">Monto &amp; Pago</th>
                  <th className="p-3">Activación &rarr; Vencimiento</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredSales.map((sale) => {
                  const expDate = new Date(sale.expirationDate).getTime();
                  const daysLeft = Math.ceil((expDate - nowTime) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      {/* Cliente */}
                      <td className="p-3">
                        <div className="font-black text-slate-900 dark:text-white">
                          {sale.clientName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{sale.clientPhone}</span>
                        </div>
                      </td>

                      {/* Servicio */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {sale.productName}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                            {sale.accountType}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({sale.durationText})
                          </span>
                        </div>
                      </td>

                      {/* Monto */}
                      <td className="p-3">
                        <div className="font-black text-emerald-600 dark:text-emerald-400">
                          {sale.price}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {sale.paymentMethod}
                        </div>
                      </td>

                      {/* Fechas & Días Restantes */}
                      <td className="p-3">
                        <div className="text-[11px] text-slate-700 dark:text-slate-300">
                          {sale.activationDate} &rarr; <span className="font-bold">{sale.expirationDate}</span>
                        </div>
                        <div className="mt-0.5">
                          {daysLeft < 0 ? (
                            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                              Venció hace {Math.abs(daysLeft)} días
                            </span>
                          ) : daysLeft <= 3 ? (
                            <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 animate-pulse flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5 fill-current" />
                              ¡Vence en {daysLeft} días!
                            </span>
                          ) : daysLeft <= 7 ? (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              Quedan {daysLeft} días
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {daysLeft} días restantes
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="p-3">
                        <select
                          value={sale.status}
                          onChange={(e) => handleStatusChange(sale.id, e.target.value as any)}
                          className={`text-[10.5px] font-black px-2 py-1 rounded-lg border cursor-pointer ${
                            sale.status === 'activa'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : sale.status === 'por_vencer'
                              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                          }`}
                        >
                          <option value="activa">Activa</option>
                          <option value="por_vencer">Por Vencer</option>
                          <option value="vencida">Vencida</option>
                        </select>
                      </td>

                      {/* Acciones */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(sale)}
                            title="Contactar al cliente por WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSaleToDelete({ id: sale.id, clientName: sale.clientName, productName: sale.productName })}
                            title="Eliminar registro"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminar venta registrada */}
      {saleToDelete && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              ¿Eliminar registro de venta?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar la venta registrada de <strong className="text-slate-700 dark:text-slate-200">{saleToDelete.clientName}</strong> ({saleToDelete.productName})? Esta acción no se puede deshacer.
            </p>
            <div className="flex w-full gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSaleToDelete(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Sí, eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
