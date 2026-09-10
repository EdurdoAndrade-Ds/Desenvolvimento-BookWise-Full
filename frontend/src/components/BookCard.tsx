import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import type { Book } from '../types/api';
import { formatCurrency } from '../lib/format';

export default function BookCard({ book }: { book: Book }) {
  const available = (book.stock ?? 0) > 0;
  return (
    <Link
      to={`/books/${book.id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-100 to-slate-100 text-brand-600 dark:from-brand-950 dark:to-slate-800 dark:text-brand-300">
        <BookOpen className="h-16 w-16 transition group-hover:scale-110" />
      </div>
      <div className="space-y-2 p-5">
        <div>
          <h2 className="line-clamp-1 font-semibold text-slate-800 dark:text-slate-100">{book.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{book.author}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-brand-700 dark:text-brand-400">
            {book.price !== undefined ? formatCurrency(book.price) : 'Preço sob consulta'}
          </span>
          <span className={`text-xs font-medium ${available ? 'text-emerald-600' : 'text-red-500'}`}>
            {available ? 'Disponível' : 'Esgotado'}
          </span>
        </div>
      </div>
    </Link>
  );
}
