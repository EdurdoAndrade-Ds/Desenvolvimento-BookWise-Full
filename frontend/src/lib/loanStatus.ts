import type { LoanStatus } from '../types/api';

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  ACTIVE: 'Ativo',
  RETURNED: 'Devolvido',
  LATE: 'Atrasado',
};

export const LOAN_STATUS_STYLES: Record<LoanStatus, string> = {
  ACTIVE: 'bg-brand-100 text-brand-700 dark:bg-brand-600/20 dark:text-brand-300',
  RETURNED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  LATE: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
};
