import { http } from './http';
import type { Reservation, Page } from '../types/api';

export interface ReservationInput {
  userId: number;
  bookId: number;
  expirationDate?: string;
}

export interface ListReservationsParams {
  page?: number;
  size?: number;
  userId?: number;
}

function buildQuery(params: ListReservationsParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.size !== undefined) search.set('size', String(params.size));
  if (params.userId !== undefined) search.set('userId', String(params.userId));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const reservationsService = {
  list: (params: ListReservationsParams = {}) =>
    http.get<Page<Reservation>>(`/api/v1/reservations${buildQuery(params)}`),

  getById: (id: number) => http.get<Reservation>(`/api/v1/reservations/${id}`),

  create: (input: ReservationInput) => http.post<Reservation>('/api/v1/reservations', input),

  cancel: (id: number) => http.post<Reservation>(`/api/v1/reservations/${id}/cancel`, {}),
};
