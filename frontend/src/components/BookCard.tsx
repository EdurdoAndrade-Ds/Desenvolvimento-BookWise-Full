import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import BookCover from './BookCover';
import type { Book } from '../types/api';
import { formatCurrency } from '../lib/format';

type BookCardVariant = 'card' | 'shelf';

interface BookCardProps {
  book: Book;
  variant?: BookCardVariant;
  /** Quando informado, o card abre a experiencia do livro em vez de navegar. */
  onSelect?: (book: Book) => void;
}

export default function BookCard({ book, variant = 'card', onSelect }: BookCardProps) {
  const available = (book.stock ?? 0) > 0;

  if (variant === 'shelf') {
    return (
      <CardShell book={book} onSelect={onSelect} className="group block w-full space-y-2">
        <BookCover
          book={book}
          className="h-52 overflow-hidden rounded-2xl shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg"
          iconClassName="h-12 w-12"
          imageClassName="transition group-hover:scale-105"
        />
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {book.title}
          </h3>
          <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{book.author}</p>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell
      book={book}
      onSelect={onSelect}
      className="group block w-full overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <BookCover
        book={book}
        className="h-40"
        iconClassName="h-16 w-16 transition group-hover:scale-110"
        imageClassName="transition group-hover:scale-105"
      />
      <div className="space-y-2 p-5">
        <div>
          <h2 className="line-clamp-1 font-semibold text-slate-800 dark:text-slate-100">
            {book.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{book.author}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-brand-700 dark:text-brand-400">
            {book.price !== undefined ? formatCurrency(book.price) : 'Preço sob consulta'}
          </span>
          <span
            className={`text-xs font-medium ${available ? 'text-emerald-600' : 'text-red-500'}`}
          >
            {available ? 'Disponível' : 'Esgotado'}
          </span>
        </div>
      </div>
    </CardShell>
  );
}

/** Torna o card clicavel: abre a experiencia do livro ou navega para a rota. */
function CardShell({
  book,
  onSelect,
  className,
  children,
}: {
  book: Book;
  onSelect?: (book: Book) => void;
  className: string;
  children: ReactNode;
}) {
  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(book)} className={`text-left ${className}`}>
        {children}
      </button>
    );
  }
  return (
    <Link to={`/books/${book.id}`} className={className}>
      {children}
    </Link>
  );
}
