import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import type { Book, Category, Page } from '../../types/api';
import { booksService } from '../../services/booksService';
import { categoriesService } from '../../services/categoriesService';
import { ApiError } from '../../services/http';
import BookCard from '../../components/BookCard';

const PAGE_SIZE = 8;

export default function CatalogPage() {
  const [data, setData] = useState<Page<Book> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await booksService.list({
        page,
        size: PAGE_SIZE,
        q: query,
      });
      setData(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar o catálogo.',
      );
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    void load();
    categoriesService.listAll().then(setCategories).catch(() => setCategories([]));
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(0);
      setQuery(search.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(0);
  };

  const visibleBooks = data?.content.filter(
    (book) =>
      !category ||
      book.categories?.some((item) => item.id === Number(category)),
  );
  const meta = data?.meta;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-brand-700 to-brand-500 px-6 py-10 text-white shadow-lg sm:px-10">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-brand-100">
          Portal do cliente
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Encontre sua próxima leitura
        </h1>
        <p className="mt-3 max-w-2xl text-brand-100">
          Explore o acervo BookWise e reserve, empreste ou compre seus livros favoritos.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título, autor ou ISBN..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <select
            value={category}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className="bg-transparent py-3 text-sm outline-none dark:text-slate-200"
          >
            <option value="">Todas as categorias</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p>{error}</p>
          <button
            onClick={load}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-current px-3 py-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      ) : loading ? (
        <div className="py-16 text-center text-slate-400">Carregando catálogo...</div>
      ) : visibleBooks?.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visibleBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-700">
          Nenhum livro encontrado.
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>
            {meta.totalElements} livro(s) · página {meta.page + 1} de {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={meta.page === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
            >
              Anterior
            </button>
            <button
              disabled={meta.page >= meta.totalPages - 1}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
