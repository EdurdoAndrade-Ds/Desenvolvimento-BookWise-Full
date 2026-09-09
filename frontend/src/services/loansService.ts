import { http } from './http';
import type { Loan, Page } from '../types/api';

export interface LoanItemInput {
  bookId: number;
  quantity: number;
}

export interface LoanInput {
  userId: number;
  dueDate?: string;
  items: LoanItemInput[];
}

export interface ListLoansParams {
  page?: number;
  size?: number;
  userId?: number;
}

function buildQuery(params: ListLoansParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.size !== undefined) search.set('size', String(params.size));
  if (params.userId !== undefined) search.set('userId', String(params.userId));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const loansService = {
  list: (params: ListLoansParams = {}) =>
    http.get<Page<Loan>>(`/api/v1/loans${buildQuery(params)}`),

  getById: (id: number) => http.get<Loan>(`/api/v1/loans/${id}`),

  create: (input: LoanInput) => http.post<Loan>('/api/v1/loans', input),

  renew: (id: number) => http.post<Loan>(`/api/v1/loans/${id}/renew`, {}),

  return: (id: number) => http.post<Loan>(`/api/v1/loans/${id}/return`, {}),
};
