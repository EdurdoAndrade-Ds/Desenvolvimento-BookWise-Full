import type { Book } from '../types/api';
import { hashString } from './procedural';

// Dimensoes em unidades de cena (1 unidade ~ 10 cm).
export const FACED_BOOK_WIDTH = 0.8;
export const FACED_BOOK_HEIGHT = 2.15;
export const FACED_BOOK_DEPTH = 0.3;
const BOOK_GAP = 0.14;
const ROW_SPACING = 2.85;
const BOARD_THICKNESS = 0.18;
const BOARD_OVERHANG = 0.6;
const BOARD_DEPTH = 1;

export const FACED_BOOK_STEP = FACED_BOOK_WIDTH + BOOK_GAP;

/** Tons empoeirados da vitrine, no clima das capas impressas da livraria. */
const COVER_PALETTE = [
  '#c6a49e',
  '#9ba98b',
  '#c79a92',
  '#8f9098',
  '#a59cb1',
  '#9aa7b1',
  '#d8b681',
  '#b0857f',
  '#aab49b',
  '#cbb9a0',
  '#8d7f8c',
  '#7f8d80',
];

/** Cor empoeirada da capa, estavel para o mesmo livro. */
export function facedCoverColor(book: Book): string {
  const seed = hashString(book.title || String(book.id));
  return COVER_PALETTE[seed % COVER_PALETTE.length];
}

/** Um livro exposto com a capa voltada para a camera. */
export interface FacedBook {
  /** Identificador do lugar na vitrine (o mesmo livro pode repetir). */
  key: string;
  book: Book;
  position: [number, number, number];
  color: string;
  rowIndex: number;
}

/** Tabua horizontal que sustenta uma fileira de livros expostos. */
export interface FacedBoard {
  index: number;
  y: number;
  width: number;
  depth: number;
  thickness: number;
}

/** Vitrine completa: livros de frente, tabuas e dimensoes da estrutura. */
export interface StorefrontShelf {
  books: FacedBook[];
  boards: FacedBoard[];
  width: number;
  height: number;
  depth: number;
  topY: number;
  bottomY: number;
}

/**
 * Preenche as fileiras da vitrine com a capa de frente, centralizando cada
 * fileira em X e empilhando as fileiras de cima para baixo. Quando o acervo
 * carregado e menor que os lugares disponiveis, os livros se repetem para a
 * estante ficar cheia, como na vitrine de uma loja.
 */
export function buildStorefrontShelf(
  books: Book[],
  booksPerRow: number,
  rowCount = 1,
): StorefrontShelf {
  const perRow = Math.max(1, booksPerRow);
  const rows: Book[][] = [];
  if (books.length === 0) {
    rows.push([]);
  } else {
    for (let rowIndex = 0; rowIndex < Math.max(1, rowCount); rowIndex += 1) {
      rows.push(
        Array.from(
          { length: perRow },
          (_, column) => books[(rowIndex * perRow + column) % books.length],
        ),
      );
    }
  }

  const step = FACED_BOOK_STEP;
  const widest = Math.max(...rows.map((row) => row.length), 1);
  const boardWidth = widest * step - BOOK_GAP + BOARD_OVERHANG;

  const placed: FacedBook[] = [];
  const boards: FacedBoard[] = [];

  rows.forEach((row, rowIndex) => {
    const boardY = rowIndex * -ROW_SPACING;
    boards.push({
      index: rowIndex,
      y: boardY - BOARD_THICKNESS / 2,
      width: boardWidth,
      depth: BOARD_DEPTH,
      thickness: BOARD_THICKNESS,
    });
    const rowWidth = row.length * step - BOOK_GAP;
    row.forEach((book, columnIndex) => {
      placed.push({
        key: `${rowIndex}-${columnIndex}-${book.id}`,
        book,
        position: [
          -rowWidth / 2 + FACED_BOOK_WIDTH / 2 + columnIndex * step,
          boardY + FACED_BOOK_HEIGHT / 2,
          0,
        ],
        color: facedCoverColor(book),
        rowIndex,
      });
    });
  });

  const topY = FACED_BOOK_HEIGHT;
  const bottomY = -(rows.length - 1) * ROW_SPACING - BOARD_THICKNESS;
  return {
    books: placed,
    boards,
    width: boardWidth,
    height: topY - bottomY,
    depth: BOARD_DEPTH,
    topY,
    bottomY,
  };
}
