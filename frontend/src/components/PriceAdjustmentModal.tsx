import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Book, Category } from '../types/api';
import {
  booksService,
  type PriceAdjustmentResult,
  type PriceAdjustmentType,
} from '../services/booksService';
import { categoriesService } from '../services/categoriesService';
import { ApiError } from '../services/http';

interface PriceAdjustmentModalProps {
  onClose: () => void;
  onApplied: (result: PriceAdjustmentResult) => void;
  /** Livro pre-selecionado quando o ajuste parte de uma linha da tabela. */
  book?: Book;
}

type Scope = 'BOOK' | 'CATEGORY' | 'ALL';

export default function PriceAdjustmentModal({
  onClose,
  onApplied,
  book,
}: PriceAdjustmentModalProps) {
  const [type, setType] = useState<PriceAdjustmentType>('DISCOUNT');
  const [percentage, setPercentage] = useState('8');
  const [scope, setScope] = useState<Scope>(book ? 'BOOK' : 'ALL');
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bookId, setBookId] = useState<number | ''>(book ? book.id : '');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([booksService.list({ size: 200 }), categoriesService.listAll()])
      .then(([bookPage, categoryList]) => {
        setBooks(bookPage.content);
        setCategories(categoryList);
      })
      .catch(() => setError('Não foi possível carregar livros/categorias.'));
  }, []);

  const factor =
    Number.isFinite(Number(percentage)) && percentage !== ''
      ? type === 'DISCOUNT'
        ? 1 - Number(percentage) / 100
        : 1 + Number(percentage) / 100
      : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = Number(percentage);
    if (!Number.isFinite(value) || value <= 0 || value > 90) {
      setError('Informe um percentual entre 0,01 e 90.');
      return;
    }
    if (scope === 'BOOK' && bookId === '') {
      setError('Selecione o livro.');
      return;
    }
    if (scope === 'CATEGORY' && categoryId === '') {
      setError('Selecione a categoria.');
      return;
    }
    setSaving(true);
    try {
      const result = await booksService.applyPriceAdjustment({
        percentage: value,
        type,
        bookId: scope === 'BOOK' ? Number(bookId) : undefined,
        categoryId: scope === 'CATEGORY' ? Number(categoryId) : undefined,
      });
      onApplied(result);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao aplicar o ajuste de preço.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Ajustar preços
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Operação</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PriceAdjustmentType)}
                className={inputClass}
              >
                <option value="DISCOUNT">Desconto</option>
                <option value="INCREASE">Aumento</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Percentual (%)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="90"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Aplicar em</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
              className={inputClass}
            >
              <option value="BOOK">Um livro</option>
              <option value="CATEGORY">Uma categoria</option>
              <option value="ALL">Todo o acervo</option>
            </select>
          </label>

          {scope === 'BOOK' && (
            <label className="block">
              <span className={labelClass}>Livro</span>
              <select
                value={bookId}
                onChange={(e) => setBookId(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          {scope === 'CATEGORY' && (
            <label className="block">
              <span className={labelClass}>Categoria</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {factor !== null && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              SQL executado no banco:{' '}
              <code>UPDATE books SET price = ROUND(price * {factor.toFixed(4)}, 2)</code>
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Aplicando...' : 'Aplicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelClass = 'mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300';

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
