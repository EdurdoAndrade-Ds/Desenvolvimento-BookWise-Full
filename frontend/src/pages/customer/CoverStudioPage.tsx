import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Wand2 } from 'lucide-react';
import type { Book } from '../../types/api';
import { booksService } from '../../services/booksService';
import { ApiError } from '../../services/http';
import HistogramChart from '../../components/graphics/HistogramChart';
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
  histogram,
  invert,
  sobel,
  type ImageHistogram,
} from '../../graphics/imageFilters';
import { generateCoverImageData } from '../../graphics/procedural';

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

/** Desenha titulo e autor sobre a capa procedural, no proprio canvas. */
function drawCoverText(
  context: CanvasRenderingContext2D,
  title: string,
  author: string,
  width: number,
  height: number,
): void {
  context.fillStyle = 'rgba(15, 23, 42, 0.35)';
  context.fillRect(0, height * 0.62, width, height * 0.24);
  context.fillStyle = '#f8fafc';
  context.textAlign = 'center';
  context.font = 'bold 26px sans-serif';
  const words = title.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width > width - 40 && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  lines.slice(0, 3).forEach((line, index) => {
    context.fillText(line, width / 2, height * 0.68 + index * 30);
  });
  context.font = '18px sans-serif';
  context.fillStyle = 'rgba(248, 250, 252, 0.85)';
  context.fillText(author, width / 2, height * 0.83);
}

export default function CoverStudioPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState<number | null>(null);
  const [source, setSource] = useState<ImageData | null>(null);
  const [sourceLabel, setSourceLabel] = useState('Capa procedural');
  const [filter, setFilter] = useState<FilterId>('none');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [showChannels, setShowChannels] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    booksService
      .list({ page: 0, size: MAX_BOOKS })
      .then((result) => {
        setBooks(result.content);
        if (result.content.length > 0) setBookId(result.content[0].id);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os livros.'),
      );
  }, []);

  const generateFromBook = useCallback((book: Book) => {
    const canvas = document.createElement('canvas');
    canvas.width = COVER_WIDTH;
    canvas.height = COVER_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.putImageData(
      generateCoverImageData(COVER_WIDTH, COVER_HEIGHT, {
        title: book.title,
        author: book.author,
      }),
      0,
      0,
    );
    drawCoverText(context, book.title, book.author, COVER_WIDTH, COVER_HEIGHT);
    setSource(context.getImageData(0, 0, COVER_WIDTH, COVER_HEIGHT));
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

  const result = useMemo(
    () => (source ? applyFilter(source, filter, brightness, contrast) : null),
    [source, filter, brightness, contrast],
  );

  const resultHistogram = useMemo<ImageHistogram | null>(
    () => (result ? histogram(result) : null),
    [result],
  );

  useEffect(() => {
    const context = sourceCanvasRef.current?.getContext('2d');
    if (context && source) context.putImageData(source, 0, 0);
  }, [source]);

  useEffect(() => {
    const context = resultCanvasRef.current?.getContext('2d');
    if (context && result) context.putImageData(result, 0, 0);
  }, [result]);

  const activeFilter = FILTERS.find((item) => item.id === filter);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-brand-700 to-slate-900 px-6 py-8 text-white shadow-lg sm:px-10">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-brand-100">
          <Wand2 className="h-4 w-4" />
          Cover Studio
        </p>
        <h1 className="text-3xl font-bold">Processamento de imagem da capa</h1>
        <p className="mt-3 max-w-3xl text-brand-100">
          A capa é gerada proceduralmente a partir do título e do autor (hash + ruído fractal) ou
          carregada de um arquivo. Todos os filtros percorrem o <code>ImageData</code> pixel a pixel
          — convolução 3×3, Sobel e equalização de histograma implementados à mão, sem{' '}
          <code>ctx.filter</code>.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          <figure className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <canvas
              ref={sourceCanvasRef}
              width={COVER_WIDTH}
              height={COVER_HEIGHT}
              className="w-full rounded-lg"
            />
            <figcaption className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">
              {sourceLabel}
            </figcaption>
          </figure>
          <figure className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <canvas
              ref={resultCanvasRef}
              width={COVER_WIDTH}
              height={COVER_HEIGHT}
              className="w-full rounded-lg"
            />
            <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Resultado: {activeFilter?.label}
            </figcaption>
          </figure>
        </div>

        <div className="space-y-4">
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
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
                onChange={(event) => setBookId(Number(event.target.value))}
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

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Filtro
            </h2>
            <select
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

          <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Histograma do resultado
              </h2>
              <button
                onClick={() => setShowChannels((value) => !value)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                {showChannels ? 'RGB' : 'Luma'}
              </button>
            </div>
            <HistogramChart histogram={resultHistogram} showChannels={showChannels} />
          </section>
        </div>
      </div>
    </div>
  );
}
