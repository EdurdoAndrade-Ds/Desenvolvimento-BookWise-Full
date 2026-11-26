import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
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
  return renderToStaticMarkup(
    <StaticRouter location="/">
      <BookExperienceModal book={book} onClose={() => {}} />
    </StaticRouter>,
  );
}

describe('BookExperienceModal', () => {
  it.each(['1234567890', ''])(
    'separates the mobile toolbar from scrolling metadata (ISBN %s)',
    (isbn) => {
      const html = renderBook({ isbn });
      expect(html).toMatch(/<\/button><\/div><div data-book-sheet-content/);
      expect(html.indexOf('data-book-sheet-toolbar')).toBeLessThan(
        html.indexOf('data-book-sheet-content'),
      );
      expect(html.indexOf('data-book-sheet-content')).toBeLessThan(html.indexOf('ISBN'));
      expect(html).toContain('max-lg:overflow-y-auto');
      expect(html).toContain('lg:contents');
      expect(html).not.toContain('sticky top-0');
    },
  );
  it('offers the selected book in the cover studio without replacing library actions', () => {
    const html = renderBook({ id: 42 });
    expect(html).toContain('Analisar capa');
    expect(html).toContain('href="/cover-studio?book=42"');
    expect(html).toContain('lucide-crop');
    expect(html).toContain('Voltar ao 3D / Espiar');
    for (const action of ['Reservar', 'Emprestar', 'Comprar']) expect(html).toContain(action);
  });
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
