import { http } from './http';
import type { Fine, Page } from '../types/api';

export interface ListFinesParams {
  page?: number;
  size?: number;
  userId?: number;
}

function buildQuery(params: ListFinesParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.size !== undefined) search.set('size', String(params.size));
  if (params.userId !== undefined) search.set('userId', String(params.userId));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const finesService = {
  list: (params: ListFinesParams = {}) =>
    http.get<Page<Fine>>(`/api/v1/fines${buildQuery(params)}`),

  getById: (id: number) => http.get<Fine>(`/api/v1/fines/${id}`),

  pay: (id: number) => http.post<Fine>(`/api/v1/fines/${id}/pay`, {}),
};
