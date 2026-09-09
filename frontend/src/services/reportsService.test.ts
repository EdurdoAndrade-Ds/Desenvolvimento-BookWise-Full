import { afterEach, describe, expect, it, vi } from 'vitest';
import { reportsService } from './reportsService';

function mockFetch(payload: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: () => Promise.resolve(payload),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('reportsService', () => {
  it('busca o resumo sem query string', async () => {
    const fetchMock = mockFetch({ totalBooks: 3, activeLoans: 1 });

    const summary = await reportsService.summary();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/reports/summary');
    expect(summary.totalBooks).toBe(3);
  });

  it('envia apenas os parametros informados nos rankings', async () => {
    const fetchMock = mockFetch([]);

    await reportsService.topBooks(3);
    await reportsService.topBorrowers();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/reports/top-books?limit=3');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/reports/top-borrowers');
  });

  it('usa months e threshold nos relatorios historicos e de estoque', async () => {
    const fetchMock = mockFetch([]);

    await reportsService.loansByMonth(6);
    await reportsService.lowStock(2);

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/reports/loans-by-month?months=6');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/reports/low-stock?threshold=2');
  });
});
