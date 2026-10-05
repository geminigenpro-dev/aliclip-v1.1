import { Product, ProductPlan } from '../types';

export interface DurationOption {
  months: number;
  label: string;
  badge?: string;
  discountPercent: number;
  calculatedPrice: string;
  rawPrice: number;
  savingsText?: string;
}

// Extract numeric price from strings like "S/ 45.00" or "45"
export function extractNumericPrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) || parsed <= 0 ? 25.0 : parsed;
}

/**
 * Generates duration tiers (1 Mes, 3 Meses, 6 Meses, 12 Meses) based on base plan price.
 * If product already has plans like '3 Meses', it adapts intelligently.
 */
export function getDurationOptions(basePlan: ProductPlan): DurationOption[] {
  const baseMonthly = extractNumericPrice(basePlan.price);

  return [
    {
      months: 1,
      label: '1 Mes',
      badge: 'Estándar',
      discountPercent: 0,
      calculatedPrice: `S/ ${baseMonthly.toFixed(2)}`,
      rawPrice: baseMonthly,
    },
    {
      months: 3,
      label: '3 Meses',
      badge: 'Ahorro 12%',
      discountPercent: 12,
      calculatedPrice: `S/ ${(baseMonthly * 3 * 0.88).toFixed(2)}`,
      rawPrice: Number((baseMonthly * 3 * 0.88).toFixed(2)),
      savingsText: `Ahorras S/ ${(baseMonthly * 3 * 0.12).toFixed(2)}`,
    },
    {
      months: 6,
      label: '6 Meses',
      badge: 'Popular • Ahorro 18%',
      discountPercent: 18,
      calculatedPrice: `S/ ${(baseMonthly * 6 * 0.82).toFixed(2)}`,
      rawPrice: Number((baseMonthly * 6 * 0.82).toFixed(2)),
      savingsText: `Ahorras S/ ${(baseMonthly * 6 * 0.18).toFixed(2)}`,
    },
    {
      months: 12,
      label: '12 Meses',
      badge: 'Mejor Valor • Ahorro 25%',
      discountPercent: 25,
      calculatedPrice: `S/ ${(baseMonthly * 12 * 0.75).toFixed(2)}`,
      rawPrice: Number((baseMonthly * 12 * 0.75).toFixed(2)),
      savingsText: `Ahorras S/ ${(baseMonthly * 12 * 0.25).toFixed(2)}`,
    },
  ];
}
