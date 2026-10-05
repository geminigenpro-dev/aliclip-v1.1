import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { SaleRecord } from '../../types';

interface AdminSalesChartProps {
  sales: SaleRecord[];
  totalSalesCount?: number;
}

type PeriodMode = 'diario' | 'mensual';
type MetricMode = 'revenue' | 'count';

interface ChartDataPoint {
  key: string;
  label: string;
  fullDate: string;
  revenue: number;
  count: number;
  services: { [name: string]: number };
}

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const AdminSalesChart: React.FC<AdminSalesChartProps> = ({ sales, totalSalesCount }) => {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('diario');
  const [metricMode, setMetricMode] = useState<MetricMode>('revenue');

  // Process data for daily and monthly bar charts
  const chartData = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    const dateMap = new Map<string, ChartDataPoint>();

    sales.forEach((sale) => {
      const rawDateStr = sale.activationDate || sale.createdAt?.split('T')[0] || '';
      if (!rawDateStr) return;

      const dateObj = new Date(rawDateStr + 'T12:00:00Z');
      if (isNaN(dateObj.getTime())) return;

      const priceNum = parseFloat(sale.price.replace(/[^0-9.]/g, '')) || 0;
      const srvName = sale.productName || 'Servicio';

      if (periodMode === 'diario') {
        const key = rawDateStr; // YYYY-MM-DD
        const day = dateObj.getUTCDate();
        const month = MONTH_NAMES[dateObj.getUTCMonth()];
        const label = `${day} ${month}`;

        if (!dateMap.has(key)) {
          dateMap.set(key, {
            key,
            label,
            fullDate: key,
            revenue: 0,
            count: 0,
            services: {},
          });
        }
        const point = dateMap.get(key)!;
        point.revenue += priceNum;
        point.count += 1;
        point.services[srvName] = (point.services[srvName] || 0) + 1;
      } else {
        // Mensual: YYYY-MM
        const year = dateObj.getUTCFullYear();
        const monthIdx = dateObj.getUTCMonth();
        const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
        const label = `${MONTH_NAMES[monthIdx]} ${year}`;

        if (!dateMap.has(key)) {
          dateMap.set(key, {
            key,
            label,
            fullDate: label,
            revenue: 0,
            count: 0,
            services: {},
          });
        }
        const point = dateMap.get(key)!;
        point.revenue += priceNum;
        point.count += 1;
        point.services[srvName] = (point.services[srvName] || 0) + 1;
      }
    });

    // Sort chronologically ascending
    const sorted = Array.from(dateMap.values()).sort((a, b) => a.key.localeCompare(b.key));

    // Round revenue
    return sorted.map((p) => ({
      ...p,
      revenue: parseFloat(p.revenue.toFixed(2)),
    }));
  }, [sales, periodMode]);

  // Compute key highlights for the top pills
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { totalRevenue: 0, totalCount: 0, peakLabel: '-', peakValue: 0, avgValue: 0 };
    }

    let totalRevenue = 0;
    let totalCount = 0;
    let peakValue = 0;
    let peakLabel = '-';

    chartData.forEach((d) => {
      totalRevenue += d.revenue;
      totalCount += d.count;

      const currentVal = metricMode === 'revenue' ? d.revenue : d.count;
      if (currentVal > peakValue) {
        peakValue = currentVal;
        peakLabel = d.label;
      }
    });

    const divisor = chartData.length || 1;
    const avgValue = metricMode === 'revenue' ? totalRevenue / divisor : totalCount / divisor;

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalCount,
      peakLabel,
      peakValue: metricMode === 'revenue' ? `S/ ${peakValue.toFixed(2)}` : `${peakValue} ventas`,
      avgValue: metricMode === 'revenue' ? `S/ ${avgValue.toFixed(2)}` : `${avgValue.toFixed(1)} v/p`,
    };
  }, [chartData, metricMode]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ChartDataPoint = payload[0].payload;
      const topServices = Object.entries(data.services || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      return (
        <div className="p-3 bg-slate-900/95 dark:bg-slate-950/95 text-white rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md text-xs space-y-1.5 min-w-[190px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1">
            <span className="font-extrabold text-[11px] text-indigo-300 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-400" />
              {data.fullDate}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200">
              {data.count} {data.count === 1 ? 'venta' : 'ventas'}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-[10.5px] text-slate-400">Total Facturado:</span>
            <span className="text-sm font-black text-emerald-400">
              S/ {data.revenue.toFixed(2)}
            </span>
          </div>

          {topServices.length > 0 && (
            <div className="pt-1 border-t border-slate-800 text-[10px]">
              <span className="text-slate-400 font-semibold block mb-0.5">Servicios:</span>
              <div className="space-y-0.5">
                {topServices.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-slate-300">
                    <span className="truncate max-w-[130px]">{name}</span>
                    <span className="font-bold text-indigo-300">x{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Header and Control Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Tendencia &amp; Gráfico de Ventas
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Recharts Interactivo
            </span>
            {typeof totalSalesCount === 'number' && totalSalesCount !== sales.length && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Filtrando {sales.length} de {totalSalesCount}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Analiza el comportamiento y el volumen de ingresos de forma visual por día o por mes.
          </p>
        </div>

        {/* Dual Mode Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Toggle: Diario vs Mensual */}
          <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPeriodMode('diario')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                periodMode === 'diario'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Diario
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('mensual')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                periodMode === 'mensual'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Mensual
            </button>
          </div>

          {/* Metric Toggle: Ingresos (S/) vs Cantidad */}
          <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMetricMode('revenue')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                metricMode === 'revenue'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>Ingresos (S/)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('count')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                metricMode === 'count'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Package className="w-3 h-3" />
              <span>Cantidad</span>
            </button>
          </div>
        </div>
      </div>

      {/* Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
            Total {periodMode === 'diario' ? 'en Días con Ventas' : 'en Meses'}:
          </span>
          <span className="font-black text-slate-900 dark:text-white">
            {metricMode === 'revenue' ? `S/ ${stats.totalRevenue}` : `${stats.totalCount} ventas`}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
            Pico Más Alto:
          </span>
          <span className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{stats.peakValue} ({stats.peakLabel})</span>
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hidden sm:flex items-center justify-between">
          <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
            Promedio {periodMode === 'diario' ? 'Diario' : 'Mensual'}:
          </span>
          <span className="font-black text-emerald-600 dark:text-emerald-400">
            {stats.avgValue}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      {chartData.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center p-4">
          <BarChart3 className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            No hay registros de ventas para graficar
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Las ventas confirmadas se representarán en este gráfico automáticamente.
          </p>
        </div>
      ) : (
        <div className="w-full h-64 sm:h-72 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                {/* Purple-to-Indigo Bar Gradient */}
                <linearGradient id="salesBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                </linearGradient>
                {/* Emerald Gradient for Revenue */}
                <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#94a3b8"
                opacity={0.2}
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1', opacity: 0.5 }}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) =>
                  metricMode === 'revenue' ? `S/${val}` : val.toString()
                }
              />

              <Tooltip content={<CustomTooltip />} />

              <Bar
                dataKey={metricMode === 'revenue' ? 'revenue' : 'count'}
                name={metricMode === 'revenue' ? 'Ingresos (S/)' : 'Ventas'}
                fill={metricMode === 'revenue' ? 'url(#revenueBarGradient)' : 'url(#salesBarGradient)'}
                radius={[6, 6, 0, 0]}
                maxBarSize={55}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
