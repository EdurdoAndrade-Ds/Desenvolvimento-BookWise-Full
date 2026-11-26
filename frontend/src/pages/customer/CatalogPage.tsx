import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import type { Book, BookRanking, Category } from '../../types/api';
import { booksService } from '../../services/booksService';
import { categoriesService } from '../../services/categoriesService';
import { reportsService } from '../../services/reportsService';
import { ApiError } from '../../services/http';
import { useCart } from '../../cart/useCart';
import HeroSection from '../../components/store/HeroSection';
import CabinetSection from '../../components/store/CabinetSection';
import CategoriesSection from '../../components/store/CategoriesSection';
import FeaturedSection from '../../components/store/FeaturedSection';
import LibrarySection from '../../components/store/LibrarySection';
import ForYouSection from '../../components/store/ForYouSection';
import ReadingRoomSection from '../../components/store/ReadingRoomSection';
import PlansSection from '../../components/store/PlansSection';
import { useAddToBag } from '../../components/store/useStoreActions';
import { badgeFor, launchIds, orderByPopularity } from '../../lib/storefront';

// A API nao limita o tamanho da pagina; o acervo e carregado inteiro (em lotes) para a
// loja filtrar, ordenar e recomendar no cliente sem novas chamadas.
const BATCH_SIZE = 200;
const POPULAR_LIMIT = 5;

async function loadAllBooks(): Promise<Book[]> {
  const first = await booksService.list({ page: 0, size: BATCH_SIZE });
  const books = [...first.content];
  for (let page = 1; page < first.meta.totalPages; page += 1) {
    const next = await booksService.list({ page, size: BATCH_SIZE });
    books.push(...next.content);
  }
  return books;
}

export default function CatalogPage() {
  const [searchParams] = useSearchParams();
  const { purchaseVersion } = useCart();
  const addToBag = useAddToBag();

  const [books, setBooks] = useState<Book[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ranking, setRanking] = useState<BookRanking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoria') ?? '');

  // Busca do cabecalho e links do rodape chegam pela URL (?q= e ?categoria=).
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setCategoryId(searchParams.get('categoria') ?? '');
  }, [searchParams]);

  const load = useCallback(async () => {
    setError(null);
    try {
      setBooks(await loadAllBooks());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o catálogo.');
    }
  }, []);

  // Recarrega no primeiro acesso e depois de cada compra, para refletir o estoque.
  useEffect(() => {
    void load();
  }, [load, purchaseVersion]);

  useEffect(() => {
    categoriesService
      .listAll()
      .then(setCategories)
      .catch(() => setCategories([]));
    // O ranking e opcional: sem ele, "Mais procurados" segue a ordem do acervo.
    reportsService
      .topBooks(POPULAR_LIMIT)
      .then(setRanking)
      .catch(() => setRanking([]));
  }, []);

  const all = useMemo(() => books ?? [], [books]);
  const popular = useMemo(() => orderByPopularity(all, ranking), [all, ranking]);
  const popularIds = useMemo(
    () => new Set(ranking.filter((entry) => entry.loanCount > 0).map((entry) => entry.bookId)),
    [ranking],
  );
  const launches = useMemo(() => launchIds(all), [all]);
  const badgeOf = useCallback(
    (book: Book) => badgeFor(book, popularIds, launches),
    [popularIds, launches],
  );

  const showInCabinet = useCallback((book: Book) => {
    setSelectedId(book.id);
    document.getElementById('visualizador')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const pickCategory = useCallback((id: string) => {
    setCategoryId(id);
    document.getElementById('biblioteca')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <>
      <HeroSection />

      {error ? (
        <div className="mx-auto my-20 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-current px-3 py-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      ) : books === null ? (
        <p className="py-32 text-center text-ink-soft">Carregando catálogo...</p>
      ) : (
        <>
          <CabinetSection
            books={all}
            selectedId={selectedId}
            onSelect={(book) => setSelectedId(book.id)}
            badgeOf={badgeOf}
            onCompleted={() => void load()}
          />
          <CategoriesSection categories={categories} books={all} onPick={pickCategory} />
          <FeaturedSection
            popular={popular}
            books={all}
            badgeOf={badgeOf}
            onAdd={addToBag}
            onView3D={showInCabinet}
          />
          <LibrarySection
            books={all}
            categories={categories}
            query={query}
            categoryId={categoryId}
            onQueryChange={setQuery}
            onCategoryChange={setCategoryId}
            badgeOf={badgeOf}
            onAdd={addToBag}
            onView3D={showInCabinet}
          />
          <ForYouSection books={all} badgeOf={badgeOf} onAdd={addToBag} onView3D={showInCabinet} />
        </>
      )}

      <PlansSection />
      <ReadingRoomSection />
    </>
  );
}
