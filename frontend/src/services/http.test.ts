import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, http } from './http';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('http', () => {
  it('retorna undefined para respostas 204', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(null) }),
    );

    await expect(http.delete('/api/v1/books/1')).resolves.toBeUndefined();
  });

  it('lanca ApiError com a mensagem do backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Estoque insuficiente' }),
      }),
    );

    await expect(http.post('/api/v1/loans', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Estoque insuficiente',
    });
  });

  it('usa mensagem padrao quando a resposta nao tem corpo JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('sem corpo')),
      }),
    );

    await expect(http.get('/api/v1/loans')).rejects.toBeInstanceOf(ApiError);
  });
});
