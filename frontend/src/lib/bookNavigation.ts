import type { Book } from '../types/api';

export function parseBookId(value: string | null): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function studioBook(books: Book[], value: string | null): Book | null {
  return books.find((book) => book.id === parseBookId(value)) ?? books[0] ?? null;
}

export function catalogBook(books: Book[], value: string | null, returned?: Book): Book | null {
  const id = parseBookId(value);
  if (id === null) return null;
  return books.find((book) => book.id === id) ?? (returned?.id === id ? returned : null);
}
