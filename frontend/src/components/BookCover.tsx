import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import type { Book } from '../types/api';

interface BookCoverProps {
  book: Pick<Book, 'title' | 'isbn' | 'coverUrl'>;
  /** Classes do container (tamanho, borda, cantos). */
  className?: string;
  /** Classes do icone usado quando nenhuma imagem carrega. */
  iconClassName?: string;
  /** Classes extras da imagem. */
  imageClassName?: string;
}

function candidates(book: BookCoverProps['book']): string[] {
  const urls: string[] = [];
  if (book.coverUrl) {
    urls.push(book.coverUrl);
  }
  if (book.isbn) {
    urls.push(`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`);
  }
  return urls;
}

/**
 * Exibe a capa do livro (URL cadastrada, capa publica por ISBN e, por fim,
 * o icone padrao quando nenhuma imagem carrega).
 */
export default function BookCover({
  book,
  className = '',
  iconClassName = 'h-16 w-16',
  imageClassName = '',
}: BookCoverProps) {
  const sources = candidates(book);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [book.coverUrl, book.isbn]);

  const src = sources[index];

  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-gradient-to-br from-brand-100 to-slate-100 text-brand-600 dark:from-brand-950 dark:to-slate-800 dark:text-brand-300 ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={`Capa de ${book.title}`}
          loading="lazy"
          onError={() => setIndex((current) => Math.min(current + 1, sources.length))}
          className={`h-full w-full object-contain ${imageClassName}`}
        />
      ) : (
        <BookOpen className={iconClassName} />
      )}
    </div>
  );
}
