import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Package,
  Clock,
  Phone,
  MessageCircle,
  Trash2,
  Download,
  Flame,
  CheckCircle2,
  DollarSign,
  Users,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Product, SaleRecord } from '../../types';
import { updateSaleStatus, deleteSaleRecord } from '../../services/storeService';
import { AdminSalesChart } from './AdminSalesChart';

interface AdminSalesHistoryTabProps {
  products: Product[];
  sales: SaleRecord[];
  onToast: (msg: string) => void;
  onNavigateToRegister?: () => void;
}

export const AdminSalesHistoryTab: React.FC<AdminSalesHistoryTabProps> = ({
  products,
  sales,
  onToast,
  onNavigateToRegister,
}) => {
  // Chart visibility
  const [showChart, setShowChart] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'activa' | 'por_vencer' | 'vencida'>('todas');
  const [datePreset, setDatePreset] = useState<'todas' | 'hoy' | '7dias' | 'este_mes' | 'mes_anterior'>('todas');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Extract unique services from products and existing sales
  const availableServices = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.name));
    sales.forEach((s) => {
      if (s.productName) set.add(s.productName);
    });
    return Array.from(set).sort();
  }, [products, sales]);

  // Set date preset shortcuts
  const handleApplyDatePreset = (preset: 'todas' | 'hoy' | '7dias' | 'este_mes' | 'mes_anterior') => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'todas') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'hoy') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7dias') {
      const past7 = new Date(today);
      past7.setDate(today.getDate() - 7);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'este_mes') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'mes_anterior') {
      const firstDayPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayPrev = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(firstDayPrev.toISOString().split('T')[0]);
      setEndDate(lastDayPrev.toISOString().split('T')[0]);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setServiceFilter('todos');
    setStatusFilter('todas');
    setDatePreset('todas');
    setStartDate('');
    setEndDate('');
    onToast('Filtros restablecidos.');
  };

  // Filtered sales calculation
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // 1. Text Search (Client name, phone, email, notes)
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesClient = sale.clientName.toLowerCase().includes(q);
        const matchesPhone = sale.clientPhone.toLowerCase().includes(q);
        const matchesEmail = sale.clientEmail ? sale.clientEmail.toLowerCase().includes(q) : false;
        const matchesNotes = sale.notes ? sale.notes.toLowerCase().includes(q) : false;
        const matchesProduct = sale.productName.toLowerCase().includes(q);

        if (!matchesClient && !matchesPhone && !matchesEmail && !matchesNotes && !matchesProduct) {
          return false;
        }
      }

      // 2. Service Filter
      if (serviceFilter !== 'todos') {
        if (sale.productName.toLowerCase() !== serviceFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Status Filter
      if (statusFilter !== 'todas') {
        if (sale.status !== statusFilter) {
          return false;
        }
      }

      // 4. Date Range Filter (compares against activationDate or creation date)
      const saleDate = sale.activationDate || sale.createdAt?.split('T')[0] || '';
      if (startDate && saleDate < startDate) {
        return false;
      }
      if (endDate && saleDate > endDate) {
        return false;
      }

      return true;
    });
  }, [sales, searchQuery, serviceFilter, statusFilter, startDate, endDate]);

  // Financial Metrics of filtered sales
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    const clientSet = new Set<string>();

    filteredSales.forEach((sale) => {
      clientSet.add(sale.clientPhone || sale.clientName);
      // Clean price string: e.g. "S/ 45.00" -> 45.00
      const cleanNum = parseFloat(sale.price.replace(/[^0-9.]/g, ''));
      if (!isNaN(cleanNum)) {
        totalRevenue += cleanNum;
      }
    });

    const activeCount = filteredSales.filter((s) => s.status === 'activa').length;
    const expiringCount = filteredSales.filter((s) => {
      const exp = new Date(s.expirationDate).getTime();
      const diffDays = Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 5;
    }).length;

    return {
      totalSales: filteredSales.length,
      totalRevenue: totalRevenue.toFixed(2),
      uniqueClients: clientSet.size,
      activeCount,
      expiringCount,
    };
  }, [filteredSales]);

  // Update sale status in Firestore / state
  const handleStatusChange = async (saleId: string, newStatus: 'activa' | 'por_vencer' | 'vencida') => {
    try {
      await updateSaleStatus(saleId, newStatus);
      onToast(`Estado actualizado a: ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      onToast('Error al actualizar el estado de la venta.');
    }
  };

  // Delete sale with confirmation
  const handleDeleteSale = async (saleId: string, clientName: string) => {
    if (window.confirm(`¿Eliminar el registro de venta de ${clientName}?`)) {
      try {
        await deleteSaleRecord(saleId);
        onToast(`Registro de venta de ${clientName} eliminado.`);
      } catch (err) {
        console.error(err);
        onToast('Error al eliminar la venta.');
      }
    }
  };

  // WhatsApp quick contact
  const handleOpenWhatsApp = (sale: SaleRecord) => {
    const cleanPhone = sale.clientPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    const text = `¡Hola ${sale.clientName}! 👋 Te saludamos de AliClip Store. Te escribimos respecto a tu membresía de *${sale.productName}* (${sale.accountType}, plan ${sale.durationText}), activa hasta el *${sale.expirationDate}*. ¿Tienes alguna duda o necesitas asistencia? ¡Estamos atentos para servirte!`;
    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Export filtered sales to CSV
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      onToast('No hay ventas para exportar con los filtros actuales.');
      return;
    }

    const headers = [
      'ID Venta',
      'Cliente',
      'Telefono',
      'Email',
      'Servicio',
      'Plan',
      'Modalidad',
      'Duracion',
      'Precio',
      'Metodo de Pago',
      'Fecha Activacion',
      'Fecha Vencimiento',
      'Estado',
      'Notas',
    ];

    const rows = filteredSales.map((s) => [
      `"${s.id}"`,
      `"${s.clientName.replace(/"/g, '""')}"`,
      `"${s.clientPhone}"`,
      `"${s.clientEmail || ''}"`,
      `"${s.productName.replace(/"/g, '""')}"`,
      `"${s.planName.replace(/"/g, '""')}"`,
      `"${s.accountType.replace(/"/g, '""')}"`,
      `"${s.durationText}"`,
      `"${s.price}"`,
      `"${s.paymentMethod}"`,
      `"${s.activationDate}"`,
      `"${s.expirationDate}"`,
      `"${s.status}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historial_ventas_aloclip_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onToast('Archivo CSV descargado exitosamente.');
  };

  const nowTime = Date.now();

  return (
    <div className="space-y-5">
      {/* Top Header & Fast Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-white dark:from-slate-800/60 dark:via-purple-950/20 dark:to-slate-900/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Historial de Ventas &amp; Clientes
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {filteredSales.length} {filteredSales.length === 1 ? 'venta' : 'ventas'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consulta, filtra por fechas y servicios, y da seguimiento detallado a cada suscripción vendida.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer border ${
              showChart
                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
            title={showChart ? 'Ocultar gráfico de barras de ventas' : 'Mostrar gráfico de barras de ventas'}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{showChart ? 'Ocultar Gráfico' : 'Ver Gráfico'}</span>
          </button>

          {onNavigateToRegister && (
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>+ Registrar Venta</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Descargar reporte en formato Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Ventas Filtradas
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {metrics.totalSales}
          </div>
          <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
            {metrics.uniqueClients} {metrics.uniqueClients === 1 ? 'cliente único' : 'clientes únicos'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
          <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
            Monto Acumulado
          </span>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5 flex items-center gap-0.5">
            <span>S/ {metrics.totalRevenue}</span>
          </div>
          <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400">
            Ingreso de este filtro
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 shadow-2xs">
          <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
            Servicios Activos
          </span>
          <div className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
            {metrics.activeCount}
          </div>
          <span className="text-[10.5px] text-indigo-600 dark:text-indigo-400">
            Vigentes en curso
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
          <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
            Por Vencer (≤ 5 días)
          </span>
          <div className="text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5 flex items-center gap-1">
            <Flame className="w-4 h-4 text-amber-500 fill-current" />
            <span>{metrics.expiringCount}</span>
          </div>
          <span className="text-[10.5px] text-amber-600 dark:text-amber-400">
            Oportunidad renovación
          </span>
        </div>
      </div>

      {/* Visualización de Datos Recharts: Gráfico de Barras Diario o Mensual */}
      {showChart && (
        <div className="transition-all">
          <AdminSalesChart
            sales={filteredSales}
            totalSalesCount={sales.length}
          />
        </div>
      )}

      {/* Advanced Filter Control Box */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            Filtros por Fecha, Servicio y Cliente
          </span>

          {(searchQuery || serviceFilter !== 'todos' || statusFilter !== 'todas' || startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Búsqueda por Cliente */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Buscar Cliente / Teléfono
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre, WhatsApp o nota..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 2. Filtro por Servicio */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Filtrar por Servicio
            </label>
            <div className="relative">
              <Package className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="todos">Todos los servicios ({availableServices.length})</option>
                {availableServices.map((srv) => (
                  <option key={srv} value={srv}>
                    {srv}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Filtro Fecha Desde */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
              <span>Fecha Desde</span>
              {startDate && <span className="text-[9px] text-indigo-500 font-bold">Activo</span>}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('todas');
              }}
              className="w-full px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* 4. Filtro Fecha Hasta */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
              <span>Fecha Hasta</span>
              {endDate && <span className="text-[9px] text-indigo-500 font-bold">Activo</span>}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('todas');
              }}
              className="w-full px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        {/* Date presets & Status tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Rango rápido:</span>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('todas')}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                datePreset === 'todas' && !startDate && !endDate
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('hoy')}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                datePreset === 'hoy'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('7dias')}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                datePreset === '7dias'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Últimos 7 días
            </button>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('este_mes')}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                datePreset === 'este_mes'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Este mes
            </button>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('mes_anterior')}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                datePreset === 'mes_anterior'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Mes anterior
            </button>
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Estado:</span>
            {(['todas', 'activa', 'por_vencer', 'vencida'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? st === 'activa'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : st === 'por_vencer'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : st === 'vencida'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {st === 'todas' ? 'Todos' : st === 'por_vencer' ? 'Por vencer' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sales List Table */}
      {filteredSales.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">
            No se encontraron ventas con los filtros seleccionados
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery || serviceFilter !== 'todos' || startDate || endDate
              ? 'Prueba modificando las fechas o el servicio seleccionado para ver más registros.'
              : 'Aún no hay ventas registradas en el sistema. Puedes confirmar una desde el botón de nueva venta.'}
          </p>
          {(searchQuery || serviceFilter !== 'todos' || startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="p-3.5">Cliente &amp; Contacto</th>
                <th className="p-3.5">Servicio Adquirido</th>
                <th className="p-3.5">Monto &amp; Pago</th>
                <th className="p-3.5">Activación &rarr; Vencimiento</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredSales.map((sale) => {
                const expDate = new Date(sale.expirationDate).getTime();
                const daysLeft = Math.ceil((expDate - nowTime) / (1000 * 60 * 60 * 24));

                return (
                  <tr
                    key={sale.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors"
                  >
                    {/* Cliente */}
                    <td className="p-3.5">
                      <div className="font-black text-slate-900 dark:text-white">
                        {sale.clientName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{sale.clientPhone}</span>
                      </div>
                      {sale.clientEmail && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {sale.clientEmail}
                        </div>
                      )}
                    </td>

                    {/* Servicio & Modalidad */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{sale.productName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
                          {sale.accountType}
                        </span>
                        <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                          {sale.durationText}
                        </span>
                      </div>
                      {sale.notes && (
                        <p className="text-[10px] text-slate-400 italic mt-1 line-clamp-1 max-w-[220px]">
                          "{sale.notes}"
                        </p>
                      )}
                    </td>

                    {/* Monto & Pago */}
                    <td className="p-3.5">
                      <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {sale.price}
                      </div>
                      <span className="inline-block mt-0.5 text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        {sale.paymentMethod}
                      </span>
                    </td>

                    {/* Fechas & Días Restantes */}
                    <td className="p-3.5">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>{sale.activationDate}</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {sale.expirationDate}
                        </span>
                      </div>
                      <div className="mt-1">
                        {daysLeft < 0 ? (
                          <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">
                            Venció hace {Math.abs(daysLeft)} días
                          </span>
                        ) : daysLeft <= 3 ? (
                          <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.2 rounded border border-red-200 dark:border-red-800 animate-pulse flex items-center gap-1 inline-flex">
                            <Flame className="w-2.5 h-2.5 fill-current" />
                            ¡Vence en {daysLeft} {daysLeft === 1 ? 'día' : 'días'}!
                          </span>
                        ) : daysLeft <= 7 ? (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                            Quedan {daysLeft} días
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                            {daysLeft} días restantes
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="p-3.5">
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
                    <td className="p-3.5 text-right">
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
                          onClick={() => handleDeleteSale(sale.id, sale.clientName)}
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
  );
};
