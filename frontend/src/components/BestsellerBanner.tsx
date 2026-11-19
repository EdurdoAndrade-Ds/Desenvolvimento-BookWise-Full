import { Link } from 'react-router-dom';
import type { Book } from '../types/api';
import BookCover from './BookCover';

interface BestsellerBannerProps {
  book?: Book;
  /** Quando informado, o banner abre a experiencia do livro em vez de navegar. */
  onSelect?: (book: Book) => void;
}

export default function BestsellerBanner({ book, onSelect }: BestsellerBannerProps) {
  const actionClassName =
    'inline-block rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600';

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-cream-100 to-cream-200 p-6 shadow-sm sm:p-10 dark:from-slate-900 dark:to-slate-800">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="max-w-md space-y-3 text-center sm:text-left">
          <h2 className="text-2xl font-extrabold leading-tight text-slate-800 sm:text-3xl dark:text-slate-100">
            2023 year 50 most popular bestseller
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Uma seleção dos títulos mais procurados do acervo BookWise, reunidos para você descobrir
            sua próxima leitura.
          </p>
          {onSelect && book ? (
            <button type="button" onClick={() => onSelect(book)} className={actionClassName}>
              view out
            </button>
          ) : (
            <Link to={book ? `/books/${book.id}` : '/'} className={actionClassName}>
              view out
            </Link>
          )}
        </div>
        {book && (
          <div className="w-32 shrink-0 sm:w-40">
            <BookCover
              book={book}
              className="h-48 overflow-hidden rounded-2xl shadow-lg sm:h-56"
              iconClassName="h-12 w-12"
            />
          </div>
        )}
      </div>
    </section>
  );
}
