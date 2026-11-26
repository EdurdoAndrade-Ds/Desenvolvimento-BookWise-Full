import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Book } from '../types/api';
import BookFormModal from './BookFormModal';

describe('BookFormModal', () => {
  const props = { onClose: () => {}, onSaved: () => {} };

  it('keeps a new form viewport bounded, with separate scroll body and footer', () => {
    const html = renderToStaticMarkup(<BookFormModal {...props} />);
    expect(html).toContain('aria-label="Novo livro"');
    expect(html).toContain('max-lg:max-h-[calc(100dvh-2rem)]');
    expect(html).toContain('max-lg:overflow-y-auto');
    expect(html).toContain('aria-label="Fechar formulário"');
    expect(html).toMatch(
      /<\/div><div class="mt-4 flex shrink-0[^>]+>.*Cancelar.*Salvar<\/button><\/div><\/form>/,
    );
    expect(html).toContain('value=""');
  });

  it('retains the edit form values and actions', () => {
    const book: Book = {
      id: 9,
      title: 'Livro',
      author: 'Autor',
      isbn: '123',
      format: 'PHYSICAL',
      price: 25,
      loanPrice: 4,
      stock: 0,
    };
    const html = renderToStaticMarkup(<BookFormModal {...props} book={book} />);
    expect(html).toContain('aria-label="Editar livro"');
    for (const value of ['Livro', 'Autor', '123', '25', '4', '0']) {
      expect(html).toContain(`value="${value}"`);
    }
    expect(html).toContain('Cancelar');
    expect(html).toContain('Salvar');
  });
});
