import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Book } from '../types/api';
import BookExperienceModal from './BookExperienceModal';

vi.mock('../context/useCurrentCustomer', () => ({
  useCurrentCustomer: () => ({ customer: null }),
}));
vi.mock('../lib/webgl', () => ({ isWebGLAvailable: () => false }));
vi.mock('./graphics/BookViewer3D', () => ({ default: () => null }));

function renderBook(fields: Record<string, unknown>) {
  const book: Book = JSON.parse(
    JSON.stringify({
      id: 1,
      title: 'Livro de exemplo',
      author: 'Autor',
      isbn: '1234567890',
      format: 'PHYSICAL',
      ...fields,
    }),
  );
  return renderToStaticMarkup(<BookExperienceModal book={book} onClose={() => {}} />);
}

describe('BookExperienceModal', () => {
  it('shows the publication year and available stock when present', () => {
    const html = renderBook({ publishedYear: 2024, stock: 5 });
    expect(html).toMatch(/Publicação<\/dt><dd[^>]*>2024<\/dd>/);
    expect(html).toContain('14 dias · 5 no acervo');
  });

  it.each([null, undefined])('handles missing metadata (%s) without literal null', (missing) => {
    const html = renderBook({
      publishedYear: missing,
      stock: missing,
      price: missing,
      loanPrice: missing,
    });
    expect(html).toMatch(/Publicação<\/dt><dd[^>]*>—<\/dd>/);
    expect(html).toContain('14 dias · exemplares no acervo');
    expect(html).toContain('Grátis');
    expect(html).not.toContain('null');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
  });

  it('keeps zero stock visible', () => {
    expect(renderBook({ stock: 0 })).toContain('14 dias · 0 no acervo');
  });
});
