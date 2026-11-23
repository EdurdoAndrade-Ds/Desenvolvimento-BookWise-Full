import { afterEach, describe, expect, it, vi } from 'vitest';
import { booksService } from './booksService';

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

describe('booksService', () => {
  it('atualiza um livro com PUT no id informado', async () => {
    const fetchMock = mockFetch({ id: 7, title: 'Duna', price: 59.9, stock: 12 });

    const book = await booksService.update(7, {
      title: 'Duna',
      author: 'Frank Herbert',
      isbn: '9788576570000',
      format: 'PHYSICAL',
      price: 59.9,
      stock: 12,
    });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/books/7');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PUT' });
    expect(book.stock).toBe(12);
  });

  it('envia o ajuste de preco com percentual, tipo e filtro', async () => {
    const fetchMock = mockFetch({
      type: 'DISCOUNT',
      percentage: 8,
      factor: 0.92,
      updatedBooks: 1,
    });

    const result = await booksService.applyPriceAdjustment({
      percentage: 8,
      type: 'DISCOUNT',
      bookId: 7,
    });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/books/price-adjustments');
    const init = fetchMock.mock.calls[0][1] as { method: string; body: string };
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ percentage: 8, type: 'DISCOUNT', bookId: 7 });
    expect(result.updatedBooks).toBe(1);
  });
});
