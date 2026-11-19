import { http } from './http';
import type { Category, Page } from '../types/api';

export interface CategoryInput {
  name: string;
  description?: string;
  parentId?: number | null;
}

export interface ListCategoriesParams {
  page?: number;
  size?: number;
  q?: string;
}

function buildQuery(params: ListCategoriesParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.size !== undefined) search.set('size', String(params.size));
  if (params.q) search.set('q', params.q);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const categoriesService = {
  list: (params: ListCategoriesParams = {}) =>
    http.get<Page<Category>>(`/api/v1/categories${buildQuery(params)}`),

  listAll: () => http.get<Category[]>('/api/v1/categories/all'),

  getById: (id: number) => http.get<Category>(`/api/v1/categories/${id}`),

  create: (input: CategoryInput) => http.post<Category>('/api/v1/categories', input),

  update: (id: number, input: CategoryInput) =>
    http.put<Category>(`/api/v1/categories/${id}`, input),

  remove: (id: number) => http.delete<void>(`/api/v1/categories/${id}`),
};
