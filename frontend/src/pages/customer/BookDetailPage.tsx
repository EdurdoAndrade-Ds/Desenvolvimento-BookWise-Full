import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, ShoppingCart } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Book } from '../../types/api';
import { booksService } from '../../services/booksService';
import { loansService } from '../../services/loansService';
import { reservationsService } from '../../services/reservationsService';
import { salesService } from '../../services/salesService';
import { ApiError } from '../../services/http';
import { formatCurrency } from '../../lib/format';
import { useCurrentCustomer } from '../../context/CurrentCustomerContext';

type Action = 'reserve' | 'borrow' | 'buy';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customer } = useCurrentCustomer();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const result = await booksService.getById(Number(id));
      setBook(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar o livro.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (action: Action) => {
    if (!customer || !book) return;

    setBusy(action);
    setError(null);
    setSuccess(null);
    try {
      if (action === 'reserve') {
        await reservationsService.create({
          userId: customer.id,
          bookId: book.id,
        });
        setSuccess('Reserva realizada com sucesso.');
      } else if (action === 'borrow') {
        await loansService.create({
          userId: customer.id,
          items: [{ bookId: book.id, quantity: 1 }],
        });
        setSuccess('Empréstimo realizado com sucesso.');
      } else {
        await salesService.create({
          userId: customer.id,
          paymentMethod: 'Portal',
          items: [{ bookId: book.id, quantity: 1 }],
        });
        setSuccess('Compra realizada com sucesso.');
      }
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Não há estoque suficiente para concluir esta ação.'
          : err instanceof ApiError
            ? err.message
            : 'Não foi possível concluir a ação.',
      );
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-slate-400">Carregando livro...</div>;
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Livro não encontrado
        </h1>
        <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  if (!book) {
    return <p className="text-red-600">{error ?? 'Livro indisponível.'}</p>;
  }

  const available = (book.stock ?? 0) > 0;
  const disabledReason = !customer
    ? 'Selecione um cliente no cabeçalho para continuar.'
    : !available
      ? 'Este livro está esgotado para empréstimos e compras.'
      : undefined;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          {success}
        </div>
      )}

      <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[minmax(16rem,24rem)_1fr] md:p-10 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex min-h-72 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-slate-100 text-brand-600 dark:from-brand-950 dark:to-slate-800 dark:text-brand-300">
          <BookOpen className="h-32 w-32" />
        </div>

        <div className="flex flex-col">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {book.genre ?? 'Acervo BookWise'}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">
              {book.title}
            </h1>
            <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">{book.author}</p>
            <p className="mt-6 text-sm leading-6 text-slate-600 dark:text-slate-300">
              ISBN: {book.isbn} · {book.publishedYear ?? 'Ano não informado'} ·{' '}
              {book.format === 'PHYSICAL' ? 'Físico' : 'Digital'}
            </p>
          </div>

          <div className="mt-auto pt-8">
            <div className="flex items-end justify-between gap-4">
              <span className="text-2xl font-bold text-brand-700 dark:text-brand-400">
                {book.price !== undefined
                  ? formatCurrency(book.price)
                  : 'Preço sob consulta'}
              </span>
              <span
                className={`text-sm font-medium ${
                  available ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {available ? `${book.stock} disponível(is)` : 'Esgotado'}
              </span>
            </div>

            {disabledReason && (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
                {disabledReason}
              </p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button
                disabled={!customer || busy !== null}
                onClick={() => runAction('reserve')}
                className="rounded-xl border border-brand-200 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-brand-800 dark:text-brand-300 dark:hover:bg-brand-950"
              >
                Reservar
              </button>
              <button
                disabled={!customer || !available || busy !== null}
                onClick={() => runAction('borrow')}
                className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === 'borrow' ? 'Processando...' : 'Emprestar'}
              </button>
              <button
                disabled={!customer || !available || busy !== null}
                onClick={() => runAction('buy')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShoppingCart className="h-4 w-4" />
                {busy === 'buy' ? 'Processando...' : 'Comprar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
