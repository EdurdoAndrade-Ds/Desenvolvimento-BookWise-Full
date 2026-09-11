import { afterEach, describe, expect, it, vi } from 'vitest';
import { loansService } from './loansService';

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

describe('loansService', () => {
  it('monta a query string apenas com os parametros informados', async () => {
    const fetchMock = mockFetch({ content: [], totalElements: 0 });

    await loansService.list({ page: 1, userId: 7 });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/loans?page=1&userId=7');
  });

  it('lista sem query string quando nao ha parametros', async () => {
    const fetchMock = mockFetch({ content: [], totalElements: 0 });

    await loansService.list();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/loans');
  });

  it('renova um emprestimo via POST', async () => {
    const fetchMock = mockFetch({ id: 1, renewalCount: 1 });

    const loan = await loansService.renew(1);

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/loans/1/renew');
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(loan.renewalCount).toBe(1);
  });
});
