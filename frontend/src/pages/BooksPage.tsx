import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, Pencil, Percent, BookOpen, RefreshCw } from 'lucide-react';
import BookCover from '../components/BookCover';
import type { Book, Page } from '../types/api';
import { booksService, type PriceAdjustmentResult } from '../services/booksService';
import { ApiError } from '../services/http';
import { formatCurrency, formatBookFormat } from '../lib/format';
import BookFormModal from '../components/BookFormModal';
import PriceAdjustmentModal from '../components/PriceAdjustmentModal';
import { useFeedback } from '../feedback/useFeedback';

const PAGE_SIZE = 8;

export default function BooksPage() {
  const [data, setData] = useState<Page<Book> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [adjusting, setAdjusting] = useState<{ book?: Book } | null>(null);
  const { confirm, notify } = useFeedback();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await booksService.list({ page, size: PAGE_SIZE, q: query });
      setData(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar os livros. O backend está rodando em http://localhost:8080?',
      );
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounce da busca.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      setQuery(search.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (book: Book) => {
    const confirmed = await confirm({
      title: `Remover "${book.title}"?`,
      confirmLabel: 'Remover',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await booksService.remove(book.id);
      await load();
      notify(`Livro "${book.title}" removido.`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erro ao remover o livro.', 'error');
    }
  };

  const handleAdjusted = async (result: PriceAdjustmentResult) => {
    await load();
    const label = result.type === 'DISCOUNT' ? 'Desconto' : 'Aumento';
    notify(
      `${label} de ${result.percentage}% aplicado em ${result.updatedBooks} livro(s) (fator ${result.factor}).`,
    );
  };

  const meta = data?.meta;

  return (
    <div className="space-y-5">
      {/* Barra de acoes */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, autor ou ISBN..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAdjusting({})}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Percent className="h-4 w-4" />
            Aplicar desconto
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Novo livro
          </button>
        </div>
      </div>

      {/* Conteudo */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {error ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Carregando...</div>
        ) : data && data.content.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-400">
            <BookOpen className="h-8 w-8" />
            <p className="text-sm">Nenhum livro encontrado.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium">Capa</th>
                <th className="px-6 py-3 font-medium">Título</th>
                <th className="px-6 py-3 font-medium">Autor</th>
                <th className="px-6 py-3 font-medium">Gênero</th>
                <th className="px-6 py-3 font-medium">Ano</th>
                <th className="px-6 py-3 font-medium">ISBN</th>
                <th className="px-6 py-3 font-medium">Formato</th>
                <th className="px-6 py-3 font-medium">Categorias</th>
                <th className="px-6 py-3 font-medium">Preço</th>
                <th className="px-6 py-3 font-medium">Estoque</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.content.map((book) => (
                <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-3">
                    <BookCover
                      book={book}
                      className="h-14 w-10 rounded"
                      iconClassName="h-5 w-5"
                    />
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {book.title}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{book.author}</td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                    {book.genre ?? '—'}
                  </td>
                  <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                    {book.publishedYear ?? '—'}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {book.isbn}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        book.format === 'PHYSICAL'
                          ? 'bg-brand-100 text-brand-700 dark:bg-brand-600/20 dark:text-brand-300'
                          : 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
                      }`}
                    >
                      {formatBookFormat(book.format)}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {book.categories && book.categories.length > 0 ? (
                        book.categories.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          >
                            {c.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                    {formatCurrency(book.price)}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                    {book.format === 'DIGITAL' ? '—' : (book.stock ?? 0)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => setAdjusting({ book })}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                      title="Ajustar preço"
                    >
                      <Percent className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditing(book)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(book)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginacao */}
      {meta && meta.totalElements > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>
            {meta.totalElements} livro(s) · página {meta.page + 1} de {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={meta.page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Anterior
            </button>
            <button
              disabled={meta.page >= meta.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {showForm && <BookFormModal onClose={() => setShowForm(false)} onSaved={load} />}

      {editing && <BookFormModal book={editing} onClose={() => setEditing(null)} onSaved={load} />}

      {adjusting && (
        <PriceAdjustmentModal
          book={adjusting.book}
          onClose={() => setAdjusting(null)}
          onApplied={handleAdjusted}
        />
      )}
    </div>
  );
}
