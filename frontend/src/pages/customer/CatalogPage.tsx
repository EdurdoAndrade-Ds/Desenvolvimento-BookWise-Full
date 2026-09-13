import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import type { Book, Category, Page } from '../../types/api';
import { booksService } from '../../services/booksService';
import { categoriesService } from '../../services/categoriesService';
import { ApiError } from '../../services/http';
import BestsellerBanner from '../../components/BestsellerBanner';
import BookCarousel from '../../components/BookCarousel';
import CategoryFilterBar from '../../components/CategoryFilterBar';

const PAGE_SIZE = 8;

type ExpandedSection = 'popular' | 'latest' | null;

export default function CatalogPage() {
  const [data, setData] = useState<Page<Book> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedSection>(null);

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
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o catálogo.');
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    void load();
    categoriesService
      .listAll()
      .then(setCategories)
      .catch(() => setCategories([]));
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
    (book) => !category || book.categories?.some((item) => item.id === Number(category)),
  );
  const meta = data?.meta;

  const latestBooks = useMemo(
    () =>
      [...(visibleBooks ?? [])].sort((a, b) => {
        const first = a.createdAt ?? '';
        const second = b.createdAt ?? '';
        if (first === second) return b.id - a.id;
        return second.localeCompare(first);
      }),
    [visibleBooks],
  );

  const toggleSection = (section: Exclude<ExpandedSection, null>) =>
    setExpanded((current) => (current === section ? null : section));

  return (
    <div className="space-y-10">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPage(0);
          setQuery(search.trim());
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="find book"
            aria-label="Buscar por título, autor ou ISBN"
            className="w-full rounded-full border border-cream-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-emerald-400 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          search
        </button>
      </form>

      <CategoryFilterBar categories={categories} value={category} onChange={handleCategoryChange} />

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
        <>
          <BookCarousel
            title="Popular"
            books={visibleBooks}
            expanded={expanded === 'popular'}
            onToggleExpanded={() => toggleSection('popular')}
          />
          <BestsellerBanner book={visibleBooks[0]} />
          <BookCarousel
            title="Latest"
            books={latestBooks}
            expanded={expanded === 'latest'}
            onToggleExpanded={() => toggleSection('latest')}
          />
        </>
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
              className="rounded-full border border-cream-200 bg-white px-4 py-2 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
            >
              Anterior
            </button>
            <button
              disabled={meta.page >= meta.totalPages - 1}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-full border border-cream-200 bg-white px-4 py-2 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
