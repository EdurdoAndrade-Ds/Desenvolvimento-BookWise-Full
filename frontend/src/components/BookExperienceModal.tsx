import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Book } from '../types/api';
import BookViewer3D from './graphics/BookViewer3D';
import BookCover from './BookCover';
import { formatBookFormat, formatCurrency } from '../lib/format';
import { isWebGLAvailable } from '../lib/webgl';
import { loansService } from '../services/loansService';
import { reservationsService } from '../services/reservationsService';
import { salesService } from '../services/salesService';
import { ApiError } from '../services/http';
import { useCurrentCustomer } from '../context/useCurrentCustomer';

/** Prazo padrao de emprestimo configurado em bookwise.loan.default-days. */
const LOAN_DAYS = 14;

type Action = 'reserve' | 'borrow' | 'buy';

interface BookExperienceModalProps {
  book: Book;
  onClose: () => void;
  /** Disparado depois de uma acao concluida, para o catalogo recarregar o estoque. */
  onCompleted?: () => void;
}

/**
 * Experiencia do livro selecionado: a capa vai para o centro da tela, gira com
 * o arraste, aproxima com o scroll e revela os dados e as acoes do acervo ao
 * ser aberta.
 */
export default function BookExperienceModal({
  book,
  onClose,
  onCompleted,
}: BookExperienceModalProps) {
  const [coverOpen, setCoverOpen] = useState(false);
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { customer } = useCurrentCustomer();
  const webglAvailable = isWebGLAvailable();

  useEffect(() => {
    setCoverOpen(false);
    setError(null);
    setSuccess(null);
  }, [book.id]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const category = book.categories?.[0]?.name ?? book.genre;
  const inStock = (book.stock ?? 0) > 0;
  const availability =
    book.stock === undefined ? 'exemplares no acervo' : `${book.stock} no acervo`;

  const runAction = async (action: Action) => {
    if (!customer) {
      setSuccess(null);
      setError('Selecione um cliente no cabeçalho para continuar.');
      return;
    }

    setBusy(action);
    setError(null);
    setSuccess(null);
    try {
      if (action === 'reserve') {
        await reservationsService.create({ userId: customer.id, bookId: book.id });
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
      onCompleted?.();
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Experiência 3D de ${book.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative h-[82vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-b from-[#2c1a10] to-[#12100f] shadow-2xl"
      >
        <div className="pointer-events-none absolute left-6 top-6 z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cream-100/80">
            Exploração do livro
          </p>
          <p className="mt-1 text-sm text-cream-100/60">{book.title}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar experiência do livro"
          className="absolute right-6 top-6 z-10 rounded-full bg-white/90 p-3 text-slate-700 shadow hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="absolute inset-0">
          {webglAvailable ? (
            <BookViewer3D
              book={book}
              coverOpen={coverOpen}
              onCoverClick={() => setCoverOpen((open) => !open)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-cream-100">
              <BookCover book={book} className="h-48 w-32 rounded-xl" />
              <p className="text-sm">
                Este navegador não expõe WebGL, então mostramos a capa em 2D.
              </p>
            </div>
          )}
        </div>

        <aside
          aria-hidden={!coverOpen}
          className={`absolute inset-x-0 bottom-0 z-10 max-h-[70%] overflow-auto bg-[#f6f3ec] px-8 py-9 shadow-2xl transition-transform duration-300 sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[25rem] dark:bg-slate-900 ${
            coverOpen
              ? 'translate-y-0 sm:translate-x-0'
              : 'translate-y-full sm:translate-y-0 sm:translate-x-full'
          }`}
        >
          {category ? (
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#8a6b4f] dark:text-brand-300">
              {category}
            </p>
          ) : null}
          <h2 className="mt-3 font-serif text-4xl leading-tight text-[#1d1b18] dark:text-slate-100">
            {book.title}
          </h2>
          <p className="mt-2 text-sm text-[#8a6b4f] dark:text-slate-400">{book.author}</p>

          <div className="mt-8 border-t border-[#e0d9cc] pt-6 dark:border-slate-800">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#9b9488] dark:text-slate-500">
              Sobre o livro
            </p>
            <dl className="mt-4 space-y-2 text-sm text-[#4d4842] dark:text-slate-300">
              <Row label="ISBN" value={book.isbn} />
              <Row label="Formato" value={formatBookFormat(book.format)} />
              <Row
                label="Publicação"
                value={book.publishedYear === undefined ? '—' : String(book.publishedYear)}
              />
            </dl>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 border-t border-[#e0d9cc] pt-6 dark:border-slate-800">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#9b9488] dark:text-slate-500">
                Empréstimo
              </p>
              <p className="mt-2 font-serif text-2xl text-[#1d1b18] dark:text-slate-100">Grátis</p>
              <p className="mt-1 text-xs text-[#9b9488] dark:text-slate-500">
                {LOAN_DAYS} dias · {availability}
              </p>
              <button
                type="button"
                disabled={!inStock || busy !== null}
                onClick={() => void runAction('borrow')}
                className="mt-4 inline-flex w-full items-center justify-center whitespace-nowrap rounded-md border border-[#d5ccbd] px-2 py-2.5 text-[0.8rem] font-semibold text-[#1d1b18] hover:bg-[#ece7dd] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {busy === 'borrow' ? 'Processando...' : 'Emprestar agora'}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void runAction('reserve')}
                className="mt-2 w-full text-[0.75rem] font-medium text-[#8a6b4f] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-300"
              >
                {busy === 'reserve' ? 'Processando...' : 'Reservar'}
              </button>
            </div>
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#9b9488] dark:text-slate-500">
                Compra
              </p>
              <p className="mt-2 font-serif text-2xl text-[#1d1b18] dark:text-slate-100">
                {formatCurrency(book.price)}
              </p>
              <p className="mt-1 text-xs text-[#9b9488] dark:text-slate-500">
                {formatBookFormat(book.format).toLowerCase()}
              </p>
              <button
                type="button"
                disabled={!inStock || busy !== null}
                onClick={() => void runAction('buy')}
                className="mt-4 inline-flex w-full items-center justify-center whitespace-nowrap rounded-md bg-[#2a211b] px-2 py-2.5 text-[0.8rem] font-semibold text-[#f6f3ec] hover:bg-[#3b2f26] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === 'buy' ? 'Processando...' : 'Comprar livro'}
              </button>
            </div>
          </div>

          {error ? (
            <p className="mt-5 rounded-md bg-[#f6e7e2] px-3 py-2 text-xs text-[#8a3a27] dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="mt-5 rounded-md bg-[#e6efe4] px-3 py-2 text-xs text-[#2f5d3a] dark:bg-emerald-950/40 dark:text-emerald-300">
              {success}
            </p>
          ) : null}

          <p className="mt-6 flex items-center gap-2 border-t border-[#e0d9cc] pt-5 text-xs text-[#6f6a62] dark:border-slate-800 dark:text-slate-400">
            <span
              className={`h-2 w-2 rounded-full ${inStock ? 'bg-emerald-600' : 'bg-[#c08457]'}`}
            />
            {inStock ? 'Disponível para empréstimo e compra' : 'Sem exemplares disponíveis'}
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[#9b9488] dark:text-slate-500">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
