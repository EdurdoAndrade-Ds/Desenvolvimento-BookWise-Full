import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Image as ImageIcon, Upload } from 'lucide-react';
import type { Book } from '../../types/api';
import { booksService } from '../../services/booksService';
import { ApiError } from '../../services/http';
import { parseBookId, studioBook } from '../../lib/bookNavigation';
import CropWorkbench from '../../components/graphics/CropWorkbench';
import {
  BOX_BLUR_KERNEL,
  EMBOSS_KERNEL,
  GAUSSIAN_BLUR_KERNEL,
  LAPLACIAN_KERNEL,
  SHARPEN_KERNEL,
  brightnessContrast,
  convolve3x3,
  equalizeHistogram,
  grayscale,
  invert,
  sobel,
} from '../../graphics/imageFilters';
import { createBookCoverImageData } from '../../graphics/coverTexture';

const COVER_WIDTH = 320;
const COVER_HEIGHT = 460;
const MAX_BOOKS = 40;
const EMBOSS_OFFSET = 128;
const BOX_BLUR_DIVISOR = 9;
const GAUSSIAN_DIVISOR = 16;

type FilterId =
  | 'none'
  | 'grayscale'
  | 'invert'
  | 'brightnessContrast'
  | 'boxBlur'
  | 'gaussianBlur'
  | 'sharpen'
  | 'emboss'
  | 'laplacian'
  | 'sobel'
  | 'equalize';

interface FilterOption {
  id: FilterId;
  label: string;
  hint: string;
}

const FILTERS: FilterOption[] = [
  { id: 'none', label: 'Original', hint: 'Imagem de entrada, sem processamento.' },
  {
    id: 'grayscale',
    label: 'Escala de cinza',
    hint: 'Luminância Rec.601: 0.299R + 0.587G + 0.114B.',
  },
  { id: 'invert', label: 'Negativo', hint: 'Cada canal vira 255 - valor.' },
  {
    id: 'brightnessContrast',
    label: 'Brilho e contraste',
    hint: 'Ajuste ponto a ponto: (valor - 128) × contraste + 128 + brilho.',
  },
  {
    id: 'boxBlur',
    label: 'Desfoque médio (3×3)',
    hint: 'Convolução com kernel uniforme, divisor 9.',
  },
  {
    id: 'gaussianBlur',
    label: 'Desfoque gaussiano (3×3)',
    hint: 'Convolução com pesos 1-2-1, divisor 16.',
  },
  { id: 'sharpen', label: 'Nitidez', hint: 'Convolução que reforça o centro contra a vizinhança.' },
  { id: 'emboss', label: 'Relevo', hint: 'Convolução direcional com offset 128.' },
  { id: 'laplacian', label: 'Laplaciano', hint: 'Realce isotrópico de bordas.' },
  { id: 'sobel', label: 'Sobel', hint: 'Gradiente Gx/Gy e magnitude √(Gx² + Gy²).' },
  {
    id: 'equalize',
    label: 'Equalização de histograma',
    hint: 'Redistribui a luminância pela CDF.',
  },
];

function applyFilter(
  source: ImageData,
  filter: FilterId,
  brightness: number,
  contrast: number,
): ImageData {
  switch (filter) {
    case 'grayscale':
      return grayscale(source);
    case 'invert':
      return invert(source);
    case 'brightnessContrast':
      return brightnessContrast(source, { brightness, contrast });
    case 'boxBlur':
      return convolve3x3(source, BOX_BLUR_KERNEL, { divisor: BOX_BLUR_DIVISOR });
    case 'gaussianBlur':
      return convolve3x3(source, GAUSSIAN_BLUR_KERNEL, { divisor: GAUSSIAN_DIVISOR });
    case 'sharpen':
      return convolve3x3(source, SHARPEN_KERNEL);
    case 'emboss':
      return convolve3x3(source, EMBOSS_KERNEL, { offset: EMBOSS_OFFSET });
    case 'laplacian':
      return convolve3x3(source, LAPLACIAN_KERNEL);
    case 'sobel':
      return sobel(source);
    case 'equalize':
      return equalizeHistogram(source);
    default:
      return source;
  }
}

export default function CoverStudioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [books, setBooks] = useState<Book[]>([]);
  const bookId = studioBook(books, searchParams.get('book'))?.id ?? null;
  const requestedId = parseBookId(searchParams.get('book'));
  const [source, setSource] = useState<ImageData | null>(null);
  const [sourceLabel, setSourceLabel] = useState('Capa procedural');
  const [filter, setFilter] = useState<FilterId>('none');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    booksService
      .list({ page: 0, size: MAX_BOOKS })
      .then((result) => {
        setBooks(result.content);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os livros.'),
      );
  }, []);

  useEffect(() => {
    if (!requestedId || !books.length || books.some((book) => book.id === requestedId)) return;
    let active = true;
    booksService
      .getById(requestedId)
      .then((book) => {
        if (active) setBooks((current) => [...current, book]);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [requestedId, books]);

  const generateFromBook = useCallback((book: Book) => {
    setSource(createBookCoverImageData(book, COVER_WIDTH, COVER_HEIGHT));
    setSourceLabel(`Capa procedural — ${book.title}`);
  }, []);

  useEffect(() => {
    const book = books.find((item) => item.id === bookId);
    if (book) generateFromBook(book);
  }, [books, bookId, generateFromBook]);

  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = COVER_WIDTH;
      canvas.height = COVER_HEIGHT;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(image, 0, 0, COVER_WIDTH, COVER_HEIGHT);
        setSource(context.getImageData(0, 0, COVER_WIDTH, COVER_HEIGHT));
        setSourceLabel(`Imagem carregada — ${file.name}`);
      }
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      setError('Não foi possível ler a imagem selecionada.');
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const process = useCallback(
    (image: ImageData) => applyFilter(image, filter, brightness, contrast),
    [filter, brightness, contrast],
  );

  const activeFilter = FILTERS.find((item) => item.id === filter);

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      <section>
        {location.state?.fromModal && bookId !== null && (
          <Link
            to={`/?book=${bookId}`}
            state={{ reopenBook: books.find((book) => book.id === bookId) }}
            className="mb-3 inline-flex rounded-lg text-sm font-medium text-brand-600 hover:underline dark:text-brand-300"
          >
            ← Voltar ao livro
          </Link>
        )}
        <h1 className="text-2xl font-semibold">Estúdio de capas</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Escolha uma capa, selecione uma área e recorte. Depois gire, aplique filtros e analise
          somente o recorte — pixel a pixel, com prévia 3D.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          {source ? (
            <CropWorkbench
              key={sourceLabel}
              source={source}
              process={process}
              onReset={() => {
                setFilter('none');
                setBrightness(0);
                setContrast(1);
              }}
            />
          ) : (
            <p className="p-6 text-sm text-slate-500">
              Escolha um livro ou carregue uma imagem para começar.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Entrada
            </h2>
            <label className="block">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <ImageIcon className="h-4 w-4" />
                Livro do acervo
              </span>
              <select
                value={bookId ?? ''}
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams);
                  next.set('book', event.target.value);
                  setSearchParams(next, { replace: true, state: location.state });
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <Upload className="h-4 w-4" />
              Carregar imagem
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </label>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Filtro
            </h2>
            <select
              aria-label="Filtro do recorte"
              value={filter}
              onChange={(event) => setFilter(event.target.value as FilterId)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {FILTERS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400">{activeFilter?.hint}</p>
            {filter === 'brightnessContrast' ? (
              <div className="space-y-2">
                <label className="block">
                  <span className="flex justify-between text-slate-600 dark:text-slate-300">
                    Brilho
                    <span className="text-slate-400">{brightness}</span>
                  </span>
                  <input
                    type="range"
                    min={-128}
                    max={128}
                    step={1}
                    value={brightness}
                    onChange={(event) => setBrightness(Number(event.target.value))}
                    className="mt-1 w-full accent-brand-600"
                  />
                </label>
                <label className="block">
                  <span className="flex justify-between text-slate-600 dark:text-slate-300">
                    Contraste
                    <span className="text-slate-400">{contrast.toFixed(2)}</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={0.05}
                    value={contrast}
                    onChange={(event) => setContrast(Number(event.target.value))}
                    className="mt-1 w-full accent-brand-600"
                  />
                </label>
              </div>
            ) : null}
          </section>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sourceLabel}. Filtros aplicados apenas ao recorte, após a transformação. A imagem de
            origem permanece intacta.
          </p>
        </div>
      </div>
    </div>
  );
}
