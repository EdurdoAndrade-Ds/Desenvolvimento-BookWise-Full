import { http } from './http';
import type {
  BookRanking,
  BorrowerRanking,
  LibrarySummary,
  LowStockBook,
  MonthlyLoan,
} from '../types/api';

// Relatorios analiticos: as agregacoes sao feitas no banco (SQL nativo),
// o frontend apenas consome os indicadores prontos.
function query(params: Record<string, number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const reportsService = {
  summary: () => http.get<LibrarySummary>('/api/v1/reports/summary'),

  topBooks: (limit?: number) =>
    http.get<BookRanking[]>(`/api/v1/reports/top-books${query({ limit })}`),

  loansByMonth: (months?: number) =>
    http.get<MonthlyLoan[]>(`/api/v1/reports/loans-by-month${query({ months })}`),

  topBorrowers: (limit?: number) =>
    http.get<BorrowerRanking[]>(`/api/v1/reports/top-borrowers${query({ limit })}`),

  lowStock: (threshold?: number) =>
    http.get<LowStockBook[]>(`/api/v1/reports/low-stock${query({ threshold })}`),
};
