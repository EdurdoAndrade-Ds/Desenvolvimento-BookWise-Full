import { http } from './http';
import type { Book, Page } from '../types/api';

export interface BookInput {
  title: string;
  author: string;
  isbn: string;
  genre?: string;
  publishedYear?: number;
  format: Book['format'];
  price?: number;
  stock?: number;
  categoryIds?: number[];
}

export interface ListBooksParams {
  page?: number;
  size?: number;
  q?: string;
}

function buildQuery(params: ListBooksParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.size !== undefined) search.set('size', String(params.size));
  if (params.q) search.set('q', params.q);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const booksService = {
  list: (params: ListBooksParams = {}) =>
    http.get<Page<Book>>(`/api/v1/books${buildQuery(params)}`),

  getById: (id: number) => http.get<Book>(`/api/v1/books/${id}`),

  create: (input: BookInput) => http.post<Book>('/api/v1/books', input),

  update: (id: number, input: BookInput) => http.put<Book>(`/api/v1/books/${id}`, input),

  remove: (id: number) => http.delete<void>(`/api/v1/books/${id}`),
};
