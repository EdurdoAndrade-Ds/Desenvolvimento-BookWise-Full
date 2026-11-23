import type { ReservationStatus } from '../types/api';

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  ACTIVE: 'Ativa',
  FULFILLED: 'Atendida',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
};

export const RESERVATION_STATUS_STYLES: Record<ReservationStatus, string> = {
  ACTIVE: 'bg-brand-100 text-brand-700 dark:bg-brand-600/20 dark:text-brand-300',
  FULFILLED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  CANCELLED: 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
};
