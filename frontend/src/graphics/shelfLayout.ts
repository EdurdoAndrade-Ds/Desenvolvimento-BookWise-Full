import type { Book } from '../types/api';
import { colorFromString, hashString, hslToCss } from './procedural';

// Dimensoes em unidades de cena (1 unidade ~ 10 cm).
const MIN_SPINE_THICKNESS = 0.22;
const MAX_SPINE_THICKNESS = 0.44;
const MIN_BOOK_HEIGHT = 1.3;
const MAX_BOOK_HEIGHT = 1.8;
const BOOK_DEPTH = 1.0;
const SHELF_INNER_WIDTH = 4.2;
const BOOKS_PER_SHELF = 6;
const MIN_BOARD_WIDTH = 1.6;
const BOARD_MARGIN = 0.3;
const SHELF_SPACING = 2.2;
const BOOK_GAP = 0.04;
const SHELF_THICKNESS = 0.12;

/** Um livro posicionado na estante, com geometria e cor derivadas do acervo. */
export interface ShelfBook {
  book: Book;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  shelfIndex: number;
}

/** Uma prateleira: tabua horizontal que sustenta um conjunto de livros. */
export interface ShelfBoard {
  index: number;
  y: number;
  width: number;
  depth: number;
  thickness: number;
}

/** Layout completo da estante, pronto para ser renderizado pela cena 3D. */
export interface ShelfLayout {
  books: ShelfBook[];
  boards: ShelfBoard[];
  width: number;
  height: number;
  depth: number;
  /** Topo da estrutura (acima do livro mais alto da primeira prateleira). */
  topY: number;
  /** Base da estrutura, onde a lateral encosta no piso. */
  bottomY: number;
}

function normalizedHash(seed: string, shift: number): number {
  const bits = 8;
  const range = 1 << bits;
  return ((hashString(seed) >>> shift) % range) / range;
}

/** Espessura da lombada derivada do ISBN, para variar sem depender de dado ausente. */
export function spineThickness(book: Book): number {
  const factor = normalizedHash(book.isbn || String(book.id), 0);
  return MIN_SPINE_THICKNESS + factor * (MAX_SPINE_THICKNESS - MIN_SPINE_THICKNESS);
}

/** Altura da capa derivada do titulo, mantendo os livros com alturas distintas. */
export function bookHeight(book: Book): number {
  const factor = normalizedHash(book.title, 8);
  return MIN_BOOK_HEIGHT + factor * (MAX_BOOK_HEIGHT - MIN_BOOK_HEIGHT);
}

/** Cor da capa em CSS, derivada do titulo (mesmo livro sempre com a mesma cor). */
export function bookColor(book: Book): string {
  return hslToCss(colorFromString(book.title));
}

function rowWidth(row: Book[]): number {
  return row.reduce((total, book) => total + spineThickness(book) + BOOK_GAP, -BOOK_GAP);
}

/**
 * Distribui os livros em prateleiras: cada prateleira recebe no maximo
 * BOOKS_PER_SHELF livros (ou o que couber na largura util) e a fileira e
 * centralizada em X, de modo que a estante fique preenchida em qualquer acervo.
 */
export function buildShelfLayout(books: Book[]): ShelfLayout {
  const placed: ShelfBook[] = [];
  const boards: ShelfBoard[] = [];
  const rows: Book[][] = [];
  let current: Book[] = [];

  for (const book of books) {
    const candidate = [...current, book];
    if (
      current.length > 0 &&
      (candidate.length > BOOKS_PER_SHELF || rowWidth(candidate) > SHELF_INNER_WIDTH)
    ) {
      rows.push(current);
      current = [book];
    } else {
      current = candidate;
    }
  }
  if (current.length > 0 || rows.length === 0) rows.push(current);

  const boardWidth = Math.max(MIN_BOARD_WIDTH, ...rows.map((row) => rowWidth(row) + BOARD_MARGIN));

  rows.forEach((row, shelfIndex) => {
    const boardY = shelfIndex * -SHELF_SPACING;
    boards.push({
      index: shelfIndex,
      y: boardY - SHELF_THICKNESS / 2,
      width: boardWidth,
      depth: BOOK_DEPTH + 0.1,
      thickness: SHELF_THICKNESS,
    });
    let cursorX = -rowWidth(row) / 2;
    for (const book of row) {
      const thickness = spineThickness(book);
      const height = bookHeight(book);
      placed.push({
        book,
        size: [thickness, height, BOOK_DEPTH],
        position: [cursorX + thickness / 2, boardY + height / 2, 0],
        color: bookColor(book),
        shelfIndex,
      });
      cursorX += thickness + BOOK_GAP;
    }
  });

  const topY = MAX_BOOK_HEIGHT + SHELF_THICKNESS;
  const bottomY = boards[boards.length - 1].y - SHELF_THICKNESS / 2;
  return {
    books: placed,
    boards,
    width: boardWidth,
    height: topY - bottomY,
    depth: BOOK_DEPTH,
    topY,
    bottomY,
  };
}
