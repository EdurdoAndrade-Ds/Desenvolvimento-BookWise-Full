import type { SaleStatus } from '../types/api';

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Paga',
  CANCELLED: 'Cancelada',
};

export const SALE_STATUS_STYLES: Record<SaleStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  CANCELLED: 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
};
