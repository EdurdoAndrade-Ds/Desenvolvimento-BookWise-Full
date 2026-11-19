import type { Fine } from '../types/api';

export const FINE_STATUS_LABELS: Record<Fine['paymentStatus'], string> = {
  PENDING: 'Pendente',
  PAID: 'Paga',
};

export const FINE_STATUS_STYLES: Record<Fine['paymentStatus'], string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
};
