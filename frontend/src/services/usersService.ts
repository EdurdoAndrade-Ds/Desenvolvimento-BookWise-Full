import { http } from './http';
import type { User, Page } from '../types/api';

export interface UserInput {
  name: string;
  email: string;
  role: User['role'];
}

export interface ListUsersParams {
  page?: number;
  size?: number;
  q?: string;
}

function buildQuery(params: ListUsersParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.size !== undefined) search.set('size', String(params.size));
  if (params.q) search.set('q', params.q);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const usersService = {
  list: (params: ListUsersParams = {}) =>
    http.get<Page<User>>(`/api/v1/users${buildQuery(params)}`),

  getById: (id: number) => http.get<User>(`/api/v1/users/${id}`),

  create: (input: UserInput) => http.post<User>('/api/v1/users', input),

  update: (id: number, input: UserInput) => http.put<User>(`/api/v1/users/${id}`, input),

  remove: (id: number) => http.delete<void>(`/api/v1/users/${id}`),
};
