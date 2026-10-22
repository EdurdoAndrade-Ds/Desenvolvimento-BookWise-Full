import { useMemo, useState } from 'react';
import { MousePointerClick } from 'lucide-react';
import type { Book } from '../types/api';
import BookstoreShelf3D from './graphics/BookstoreShelf3D';
import BookExperienceModal from './BookExperienceModal';
import { isWebGLAvailable } from '../lib/webgl';

const MAX_SHELF_BOOKS = 18;
const SHELF_ROWS = 2;
const BOOKS_PER_ROW = 11;

interface BookstoreHeroProps {
  books: Book[];
  /** Quando informado, a selecao do livro sobe para a pagina em vez de abrir o modal local. */
  onSelect?: (book: Book) => void;
}

/**
 * Vitrine da home: apresenta o acervo em uma estante 3D onde cada livro pode
 * ser aberto em uma experiencia em destaque. Consome apenas os livros que o
 * catalogo ja carregou.
 */
export default function BookstoreHero({ books, onSelect }: BookstoreHeroProps) {
  const [selected, setSelected] = useState<Book | null>(null);
  const webglAvailable = useMemo(isWebGLAvailable, []);
  const shelfBooks = useMemo(() => books.slice(0, MAX_SHELF_BOOKS), [books]);

  return (
    <section className="overflow-hidden rounded-3xl bg-cream-100 shadow-sm dark:bg-slate-900">
      <div className="px-6 pt-8 text-center sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">
          Bookstore
        </p>
        <h1 className="mt-3 font-serif text-3xl leading-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          Escolha uma história
          <span className="block text-brand-600 dark:text-brand-400">Entre nela</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-300">
          Passe o mouse pelas prateleiras, clique em um livro para trazê-lo ao centro, gire-o com o
          arraste e abra a capa para ver os dados do acervo.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <MousePointerClick className="h-3.5 w-3.5" />
          Arraste para girar · scroll para aproximar · clique na capa para abrir
        </p>
      </div>

      <div className="mt-6 h-[24rem] sm:h-[32rem]">
        {!webglAvailable ? (
          <p className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Este navegador não expõe um contexto WebGL, então a estante 3D não pode ser renderizada.
          </p>
        ) : shelfBooks.length === 0 ? (
          <p className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum livro no acervo para montar a estante.
          </p>
        ) : (
          <BookstoreShelf3D
            books={shelfBooks}
            booksPerRow={BOOKS_PER_ROW}
            rows={SHELF_ROWS}
            onSelect={onSelect ?? setSelected}
          />
        )}
      </div>

      {selected ? <BookExperienceModal book={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
