import { describe, expect, it } from 'vitest';
import type { Book } from '../types/api';
import { catalogBook, parseBookId, studioBook } from './bookNavigation';

const books = [
  { id: 1, title: 'Primeiro' },
  { id: 9, title: 'Escolhido' },
] as Book[];
describe('cover studio book navigation', () => {
  it('preselects the URL book rather than the first book', () => {
    expect(studioBook(books, '9')).toBe(books[1]);
    expect(studioBook(books, '1')).toBe(books[0]);
  });
  it.each([null, '', 'abc', '-1', '0', '1.5', '1e2', '9007199254740992'])(
    'safely defaults for missing or invalid id %s',
    (value) => {
      expect(parseBookId(value)).toBeNull();
      expect(studioBook(books, value)).toBe(books[0]);
      expect(catalogBook(books, value)).toBeNull();
    },
  );
  it('handles unknown ids and empty catalogs', () => {
    expect(studioBook(books, '500')).toBe(books[0]);
    expect(studioBook([], '9')).toBeNull();
    expect(catalogBook(books, '500')).toBeNull();
  });
  it('reopens loaded books and reuses navigation data for books outside the current page', () => {
    expect(catalogBook(books, '9')).toBe(books[1]);
    const returned = { id: 500, title: 'Outra página' } as Book;
    expect(catalogBook(books, '500', returned)).toBe(returned);
    expect(catalogBook(books, '501', returned)).toBeNull();
  });
});
