import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, RefreshCw } from 'lucide-react';
import type { Book } from '../../types/api';
import { booksService } from '../../services/booksService';
import { ApiError } from '../../services/http';
import Bookshelf3D, { isWebGLAvailable, type SceneSettings } from '../../components/graphics/Bookshelf3D';
import ShelfRaster from '../../components/graphics/ShelfRaster';
import { buildShelfLayout, type ShelfBook } from '../../graphics/shelfLayout';
import { formatBookFormat, formatCurrency } from '../../lib/format';

const MAX_BOOKS = 60;

type Dimension = '1d' | '2d' | '3d';

const DIMENSIONS: { id: Dimension; label: string; hint: string }[] = [
  {
    id: '1d',
    label: '1D',
    hint: 'O acervo como sinal de varredura: a cor amostrada c(x) e a altura h(x) de cada lombada em uma única linha.',
  },
  {
    id: '2d',
    label: '2D',
    hint: 'Elevação frontal rasterizada em Canvas 2D: transformação janela → viewport, sem WebGL.',
  },
  {
    id: '3d',
    label: '3D',
    hint: 'Cena WebGL: malhas, iluminação, materiais e seleção por raycasting.',
  },
];

const DEFAULT_SETTINGS: SceneSettings = {
  lightIntensity: 1.6,
  shadows: true,
  orthographic: false,
  roughness: 0.45,
  metalness: 0.15,
  wireframe: false,
};

export default function Shelf3DPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SceneSettings>(DEFAULT_SETTINGS);
  const [selected, setSelected] = useState<ShelfBook | null>(null);
  const [dimension, setDimension] = useState<Dimension>('3d');
  const webglAvailable = useMemo(isWebGLAvailable, []);

  const load = () => {
    setLoading(true);
    setError(null);
    booksService
      .list({ page: 0, size: MAX_BOOKS })
      .then((result) => setBooks(result.content))
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : 'Não foi possível carregar o acervo.',
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const layout = useMemo(() => buildShelfLayout(books), [books]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-brand-800 px-6 py-8 text-white shadow-lg sm:px-10">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-brand-100">
          <Boxes className="h-4 w-4" />
          Estante 3D
        </p>
        <h1 className="text-3xl font-bold">O acervo em 1D, 2D e 3D</h1>
        <p className="mt-3 max-w-3xl text-brand-100">
          O mesmo layout derivado do catálogo é desenhado em três dimensões de
          representação: sinal de varredura, elevação rasterizada em Canvas 2D e cena
          WebGL com malhas, iluminação e seleção por <em>raycasting</em>. Clique em um
          livro em qualquer uma delas.
        </p>
      </section>

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
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          <DimensionPicker dimension={dimension} onChange={setDimension} />
          <div className="h-[32rem] overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 dark:border-slate-800">
            {dimension !== '3d' ? (
              loading ? (
                <p className="flex h-full items-center justify-center text-slate-400">
                  Rasterizando...
                </p>
              ) : books.length === 0 ? (
                <p className="flex h-full items-center justify-center text-slate-400">
                  Nenhum livro no acervo para desenhar.
                </p>
              ) : (
                <ShelfRaster
                  layout={layout}
                  dimension={dimension}
                  selectedBookId={selected?.book.id ?? null}
                  onSelect={setSelected}
                />
              )
            ) : !webglAvailable ? (
              <p className="flex h-full items-center justify-center px-6 text-center text-slate-300">
                Este navegador não expõe um contexto WebGL, então a estante 3D não pode ser
                renderizada.
              </p>
            ) : loading ? (
              <p className="flex h-full items-center justify-center text-slate-400">
                Montando a cena...
              </p>
            ) : books.length === 0 ? (
              <p className="flex h-full items-center justify-center text-slate-400">
                Nenhum livro no acervo para montar a estante.
              </p>
            ) : (
              <Bookshelf3D
                layout={layout}
                settings={settings}
                selectedBookId={selected?.book.id ?? null}
                onSelect={setSelected}
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          {dimension === '3d' ? (
            <SettingsPanel settings={settings} onChange={setSettings} />
          ) : null}
          <SelectedBookPanel entry={selected} />
        </div>
      </div>
    </div>
  );
}

function DimensionPicker({
  dimension,
  onChange,
}: {
  dimension: Dimension;
  onChange: (dimension: Dimension) => void;
}) {
  const active = DIMENSIONS.find((item) => item.id === dimension) ?? DIMENSIONS[2];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Dimensão
        </span>
        {DIMENSIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={item.id === dimension}
            className={
              item.id === dimension
                ? 'rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white'
                : 'rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{active.hint}</p>
    </section>
  );
}

function SettingsPanel({
  settings,
  onChange,
}: {
  settings: SceneSettings;
  onChange: (settings: SceneSettings) => void;
}) {
  const update = (patch: Partial<SceneSettings>) => onChange({ ...settings, ...patch });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Pipeline de renderização
      </h2>
      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
        <SliderField
          label="Intensidade da luz"
          value={settings.lightIntensity}
          min={0}
          max={4}
          step={0.1}
          onChange={(lightIntensity) => update({ lightIntensity })}
        />
        <SliderField
          label="Rugosidade do material"
          value={settings.roughness}
          min={0}
          max={1}
          step={0.05}
          onChange={(roughness) => update({ roughness })}
        />
        <SliderField
          label="Metalicidade do material"
          value={settings.metalness}
          min={0}
          max={1}
          step={0.05}
          onChange={(metalness) => update({ metalness })}
        />
        <ToggleField
          label="Mapa de sombras"
          checked={settings.shadows}
          onChange={(shadows) => update({ shadows })}
        />
        <ToggleField
          label="Projeção ortográfica"
          checked={settings.orthographic}
          onChange={(orthographic) => update({ orthographic })}
        />
        <ToggleField
          label="Malha (wireframe)"
          checked={settings.wireframe}
          onChange={(wireframe) => update({ wireframe })}
        />
        <button
          onClick={() => onChange(DEFAULT_SETTINGS)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Restaurar padrões
        </button>
      </div>
    </section>
  );
}

function SelectedBookPanel({ entry }: { entry: ShelfBook | null }) {
  if (!entry) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Clique em um livro da estante para ver os dados vindos da API.
      </section>
    );
  }

  const { book, size } = entry;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{book.title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">{book.author}</p>
      <dl className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
        <Row label="ISBN" value={book.isbn} />
        <Row label="Formato" value={formatBookFormat(book.format)} />
        <Row label="Estoque" value={book.stock === undefined ? '—' : String(book.stock)} />
        <Row label="Preço" value={book.price === undefined ? '—' : formatCurrency(book.price)} />
        <Row label="Prateleira" value={String(entry.shelfIndex + 1)} />
        <Row
          label="Malha (l × a × p)"
          value={size.map((value) => value.toFixed(2)).join(' × ')}
        />
      </dl>
      <Link
        to={`/books/${book.id}`}
        className="mt-4 inline-block rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Abrir detalhe do livro
      </Link>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between">
        {label}
        <span className="text-slate-400">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full accent-brand-600"
      />
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-brand-600"
      />
    </label>
  );
}
