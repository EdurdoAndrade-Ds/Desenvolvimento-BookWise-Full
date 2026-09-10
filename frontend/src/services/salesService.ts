import { http } from './http';
import type { Sale, Page } from '../types/api';

export interface SaleItemInput {
  bookId: number;
  quantity: number;
  unitPrice?: number;
}

export interface SaleInput {
  userId: number;
  paymentMethod?: string;
  items: SaleItemInput[];
}

export interface ListSalesParams {
  page?: number;
  size?: number;
  userId?: number;
}

function buildQuery(params: ListSalesParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.size !== undefined) search.set('size', String(params.size));
  if (params.userId !== undefined) search.set('userId', String(params.userId));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const salesService = {
  list: (params: ListSalesParams = {}) =>
    http.get<Page<Sale>>(`/api/v1/sales${buildQuery(params)}`),

  getById: (id: number) => http.get<Sale>(`/api/v1/sales/${id}`),

  create: (input: SaleInput) => http.post<Sale>('/api/v1/sales', input),

  cancel: (id: number) => http.post<Sale>(`/api/v1/sales/${id}/cancel`, {}),
};
