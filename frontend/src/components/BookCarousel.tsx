import { useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Book } from '../types/api';
import BookCard from './BookCard';

interface BookCarouselProps {
  title: string;
  books: Book[];
  expanded: boolean;
  onToggleExpanded: () => void;
}

const SCROLL_STEP = 320;

export default function BookCarousel({
  title,
  books,
  expanded,
  onToggleExpanded,
}: BookCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: 'smooth' });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleExpanded}
            className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {expanded ? 'view less' : 'view all'}
          </button>
          {!expanded && (
            <>
              <CarouselArrow label={`Voltar em ${title}`} onClick={() => scrollBy(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </CarouselArrow>
              <CarouselArrow label={`Avançar em ${title}`} onClick={() => scrollBy(1)}>
                <ChevronRight className="h-4 w-4" />
              </CarouselArrow>
            </>
          )}
        </div>
      </div>

      {expanded ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div
          ref={trackRef}
          className="flex snap-x gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {books.map((book) => (
            <div key={book.id} className="w-36 shrink-0 snap-start sm:w-40">
              <BookCard book={book} variant="shelf" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CarouselArrow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300"
    >
      {children}
    </button>
  );
}
