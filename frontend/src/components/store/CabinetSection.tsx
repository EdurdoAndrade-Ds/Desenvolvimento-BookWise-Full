import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lock,
  Minus,
  MousePointerClick,
  Plus,
  RotateCcw,
  Scissors,
  ShoppingBag,
  X,
} from 'lucide-react';
import type { Book } from '../../types/api';
import BookCover from '../BookCover';
import BookViewer3D, {
  LEAF_COUNT,
  type CameraCommand,
  type ViewFace,
} from '../graphics/BookViewer3D';
import SectionHeader from './SectionHeader';
import { useAddToBag, useLendingActions } from './useStoreActions';
import { formatBookFormat, formatCurrency } from '../../lib/format';
import { isWebGLAvailable } from '../../lib/webgl';
import { categoryNames, installmentsOf, isPurchasable, type Badge } from '../../lib/storefront';
import { FREE_PAGES } from '../../lib/bookPreview';
import { useSubscription } from '../../subscription/useSubscription';
import CropOverlay from './CropOverlay';
import ClipTray, { type Clip } from './ClipTray';

const FACES: { id: ViewFace; label: string }[] = [
  { id: 'cover', label: 'Capa' },
  { id: 'spine', label: 'Lombada' },
  { id: 'back', label: 'Contracapa' },
  { id: 'pages', label: 'Páginas' },
];

// Dupla 0 = verso da capa + pagina 1; dupla n = paginas 2n e 2n+1.
const LAST_FREE_SPREAD = Math.floor((FREE_PAGES - 1) / 2);
const PAYWALL_SPREAD = LAST_FREE_SPREAD + 1;
const SWIPE_DISTANCE = 50;
const MAX_CLIPS = 24;
// Indicador "vire a pagina": pisca ao abrir (depois da capa assentar) e a cada 2 minutos.
const HINT_AFTER_OPEN = 1300;
const HINT_INTERVAL = 2 * 60 * 1000;
const HINT_DURATION = 2600;
// Fechar: intervalo entre as folhas que voltam e espera antes de a capa fechar.
const LEAF_RETURN_GAP = 160;
const COVER_AFTER_LEAVES = 780;
const COVER_CLOSE_TIME = 1150;

function spreadLabel(spread: number, lastPage: number): string {
  if (spread === 0) return 'Página 1';
  const left = spread * 2;
  const right = Math.min(left + 1, lastPage);
  return right > left ? `Páginas ${left}–${right}` : `Página ${left}`;
}

const pill =
  'rounded-full border border-rule px-4 py-2 text-sm text-ink transition hover:bg-paper-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-40';

interface CabinetSectionProps {
  books: Book[];
  selectedId: number | null;
  onSelect: (book: Book) => void;
  badgeOf: (book: Book) => Badge | null;
  onCompleted: () => void;
}

/** Gabinete 3D: gira, aproxima, abre e folheia as primeiras paginas antes de levar. */
export default function CabinetSection({
  books,
  selectedId,
  onSelect,
  badgeOf,
  onCompleted,
}: CabinetSectionProps) {
  const book = books.find((item) => item.id === selectedId) ?? books[0];
  const [coverOpen, setCoverOpen] = useState(false);
  const [spread, setSpread] = useState(0);
  const [closing, setClosing] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);
  const [hintNonce, setHintNonce] = useState(0);
  const [command, setCommand] = useState<CameraCommand | null>(null);
  const webgl = useMemo(isWebGLAvailable, []);
  const addToBag = useAddToBag();
  const lending = useLendingActions(book, onCompleted);
  const { reset: resetMessages } = lending;
  const { subscribed } = useSubscription();
  const swipeStart = useRef<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const clipId = useRef(0);
  const spreadRef = useRef(spread);
  spreadRef.current = spread;
  // Pagina de encerramento da previa; a dupla em que ela aparece e a ultima.
  const [lastPage, setLastPage] = useState(LEAF_COUNT * 2 + 1);

  const lastSpread = Math.min(LEAF_COUNT, Math.floor(lastPage / 2));
  const maxSpread = subscribed ? lastSpread : Math.min(PAYWALL_SPREAD, lastSpread);
  const locked = coverOpen && !subscribed && spread >= PAYWALL_SPREAD;
  const reading = coverOpen && !closing;
  const wide = coverOpen || closing;
  const atFirstPage = reading && spread === 0;

  // Temporizadores das animacoes encadeadas (fechar folha a folha, piscar o indicador).
  const timers = useRef<number[]>([]);
  const later = useCallback((run: () => void, ms: number) => {
    timers.current.push(window.setTimeout(run, ms));
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const send = useCallback(
    (build: (nonce: number) => CameraCommand) =>
      setCommand((current) => build((current?.nonce ?? 0) + 1)),
    [],
  );

  /** Pisca o indicador "vire a pagina" duas vezes e o esconde em seguida. */
  const blinkHint = useCallback(() => {
    setHintNonce((current) => current + 1);
    later(() => setHintNonce(0), HINT_DURATION);
  }, [later]);

  const openBook = useCallback(() => {
    clearTimers();
    setClosing(false);
    setCoverOpen(true);
    setSpread(0);
    send((nonce) => ({ type: 'read', nonce }));
    later(blinkHint, HINT_AFTER_OPEN);
  }, [send, later, clearTimers, blinkHint]);

  const finishClose = useCallback(() => {
    setCoverOpen(false);
    setSpread(0);
    setHintNonce(0);
    send((nonce) => ({ type: 'reset', nonce }));
    // O palco so volta ao layout normal depois que a capa terminou de fechar.
    later(() => setClosing(false), COVER_CLOSE_TIME);
  }, [send, later]);

  /** Fecha como um livro de verdade: as folhas voltam uma a uma e so entao a capa fecha. */
  const closeBook = useCallback(() => {
    if (!coverOpen || closing) return;
    clearTimers();
    setCropping(false);
    setHintNonce(0);
    setClosing(true);
    let current = spreadRef.current;
    const step = () => {
      current -= 1;
      setSpread(current);
      if (current > 0) later(step, LEAF_RETURN_GAP);
      else later(finishClose, COVER_AFTER_LEAVES);
    };
    if (current > 0) step();
    else finishClose();
  }, [coverOpen, closing, clearTimers, later, finishClose]);

  const turn = useCallback(
    (direction: 1 | -1) => {
      if (!coverOpen || closing) return;
      // Voltar na primeira pagina e o mesmo que fechar a capa.
      if (direction === -1 && spreadRef.current === 0) {
        closeBook();
        return;
      }
      setSpread((current) => clampSpread(current + direction, maxSpread));
    },
    [coverOpen, closing, maxSpread, closeBook],
  );

  // Na primeira pagina, o indicador volta a piscar a cada 2 minutos.
  useEffect(() => {
    if (!atFirstPage) return;
    const id = window.setInterval(blinkHint, HINT_INTERVAL);
    return () => window.clearInterval(id);
  }, [atFirstPage, blinkHint]);

  // Setas do teclado viram a pagina; Esc fecha o livro.
  useEffect(() => {
    if (!coverOpen || cropping) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === 'ArrowRight') turn(1);
      else if (event.key === 'ArrowLeft') turn(-1);
      else if (event.key === 'Escape') closeBook();
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [coverOpen, cropping, turn, closeBook]);

  const onPointerDown = (event: PointerEvent) => {
    swipeStart.current =
      coverOpen && !cropping && event.pointerType !== 'mouse' ? event.clientX : null;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (swipeStart.current === null) return;
    const distance = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(distance) > SWIPE_DISTANCE) turn(distance < 0 ? 1 : -1);
  };

  const addClip = useCallback(
    (image: string) => {
      clipId.current += 1;
      const pages = spreadLabel(spreadRef.current, lastPage).replace('Páginas', 'Pág.').replace('Página', 'Pág.');
      setClips((current) => [{ id: clipId.current, image, bookTitle: book.title, pages }, ...current].slice(0, MAX_CLIPS));
      setCropping(false);
    },
    [book, lastPage],
  );
  const cancelCrop = useCallback(() => setCropping(false), []);

  const choose = (next: Book) => {
    clearTimers();
    setCoverOpen(false);
    setClosing(false);
    setCropping(false);
    setSpread(0);
    setHintNonce(0);
    setCommand(null);
    resetMessages();
    onSelect(next);
  };

  const goToPlans = () => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section
      id="visualizador"
      aria-labelledby="visualizador-title"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6"
    >
      <SectionHeader index="01" label="Gabinete 3D">
        <span id="visualizador-title">
          Folheie com os olhos <em>antes</em> de levar para casa.
        </span>
      </SectionHeader>
      <p className="mt-4 max-w-xl text-ink-soft">
        Gire, aproxime, confira a lombada e o corte das páginas. Depois abra o livro e leia as{' '}
        {FREE_PAGES} primeiras páginas, de graça.
      </p>

      {!book ? (
        <p className="mt-10 rounded-2xl border border-dashed border-rule p-12 text-center text-ink-soft">
          Nenhum livro no acervo para exibir no gabinete.
        </p>
      ) : (
        <div
          className={`mt-10 grid grid-cols-1 gap-8 ${
            wide ? '' : 'lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]'
          }`}
        >
          <div className="min-w-0">
            <div
              className={`relative overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_50%_35%,#4a2f1d_0%,#24170f_55%,#100c0a_100%)] shadow-xl transition-[height] duration-700 ${
                wide ? 'h-[22rem] sm:h-[40rem]' : 'h-[26rem] sm:h-[34rem]'
              }`}
              ref={stage}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
            >
              {webgl ? (
                <BookViewer3D
                  book={book}
                  coverOpen={coverOpen}
                  onCoverClick={openBook}
                  command={command}
                  spread={spread}
                  readablePages={subscribed ? Number.POSITIVE_INFINITY : FREE_PAGES}
                  onTurn={turn}
                  onLastPage={setLastPage}
                  hintNonce={hintNonce}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-[#f6f3ec]">
                  <BookCover book={book} className="h-56 w-40 rounded-xl" />
                  <p className="text-sm">
                    Este navegador não expõe WebGL, então mostramos a capa em 2D.
                  </p>
                </div>
              )}

              {cropping ? null : (
                <p
                  className={`pointer-events-none absolute top-4 items-center gap-2 whitespace-nowrap rounded-full bg-black/40 px-4 py-1.5 text-xs text-[#f6f3ec]/85 backdrop-blur-sm ${
                    wide
                      ? 'left-4 hidden md:inline-flex'
                      : 'left-1/2 inline-flex -translate-x-1/2'
                  }`}
                >
                  <MousePointerClick className="h-3.5 w-3.5" />
                  {wide
                    ? 'Clique, deslize ou use ← → · Esc fecha'
                    : 'Arraste para girar · clique para abrir'}
                </p>
              )}

              {wide && !cropping ? (
                <div className="absolute right-4 top-4 z-10 flex gap-2">
                  {!locked && !closing ? (
                    <button
                      type="button"
                      onClick={() => setCropping(true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3.5 py-1.5 text-xs font-medium text-[#f6f3ec] backdrop-blur-sm transition hover:bg-black/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      <Scissors className="h-3.5 w-3.5" /> Recortar
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={closeBook}
                    disabled={closing}
                    aria-label="Fechar o livro"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#f6f3ec] px-3.5 py-1.5 text-xs font-semibold text-cabinet shadow transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" /> {closing ? 'Fechando…' : 'Fechar'}
                  </button>
                </div>
              ) : null}

              {cropping ? (
                <CropOverlay stage={stage.current} onCapture={addClip} onCancel={cancelCrop} />
              ) : null}

              {webgl && !wide ? (
                <button
                  type="button"
                  onClick={openBook}
                  className="absolute bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#f6f3ec] px-5 py-2.5 text-sm font-semibold text-cabinet shadow-lg transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <BookOpen className="h-4 w-4" />
                  {subscribed ? 'Abrir e ler' : `Ler ${FREE_PAGES} páginas grátis`}
                </button>
              ) : null}

              {coverOpen && !locked ? (
                <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/40 px-4 py-1.5 text-xs text-[#f6f3ec]/85 backdrop-blur-sm">
                  {spreadLabel(spread, lastPage)}
                  {subscribed ? ' · assinante' : ` · prévia grátis de ${FREE_PAGES} páginas`}
                </p>
              ) : null}

              {locked ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/10 via-black/35 to-black/60 p-4 animate-[fadeIn_0.6s_ease-out_0.5s_both]">
                  <div
                    role="dialog"
                    aria-labelledby="paywall-title"
                    className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1d1611]/85 p-7 text-center text-[#f6f3ec] shadow-2xl backdrop-blur-md"
                  >
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-gold">
                      <Lock className="h-5 w-5" />
                    </span>
                    <h3 id="paywall-title" className="mt-4 font-serif text-2xl leading-snug">
                      Gostou do começo de <em className="text-gold">{book.title}</em>?
                    </h3>
                    <p className="mt-2 text-sm text-[#f6f3ec]/70">
                      Você leu as {FREE_PAGES} páginas da prévia gratuita. Assine para continuar
                      este e todos os livros do acervo.
                    </p>
                    <button
                      type="button"
                      onClick={goToPlans}
                      className="mt-6 w-full rounded-md bg-gold px-4 py-3 text-sm font-semibold text-cabinet transition hover:brightness-110"
                    >
                      Ver planos de assinatura
                    </button>
                    <button
                      type="button"
                      onClick={() => turn(-1)}
                      className="mt-2 w-full rounded-md px-4 py-2.5 text-sm text-[#f6f3ec]/80 hover:bg-white/10"
                    >
                      Voltar à página {FREE_PAGES}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {webgl ? (
              <div
                role="group"
                aria-label="Controles do visualizador"
                className="mt-4 flex flex-wrap items-center gap-2"
              >
                {wide ? (
                  <>
                    <button
                      type="button"
                      onClick={() => turn(-1)}
                      disabled={closing}
                      className={`${pill} inline-flex items-center gap-1.5`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {spread === 0 ? 'Fechar capa' : 'Anterior'}
                    </button>
                    <button
                      type="button"
                      onClick={() => turn(1)}
                      disabled={closing || spread >= maxSpread}
                      className={`${pill} inline-flex items-center gap-1.5`}
                    >
                      Próxima <ChevronRight className="h-4 w-4" />
                    </button>
                    <span className="mx-1 hidden h-6 w-px bg-rule sm:block" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => setCropping((current) => !current)}
                      disabled={locked || closing}
                      aria-pressed={cropping}
                      className={`${pill} inline-flex items-center gap-2 ${
                        cropping ? 'border-gold bg-gold/20' : ''
                      }`}
                    >
                      <Scissors className="h-4 w-4" /> {cropping ? 'Cancelar recorte' : 'Recortar trecho'}
                    </button>
                    {!subscribed ? (
                      <button
                        type="button"
                        onClick={goToPlans}
                        className="ml-auto inline-flex items-center gap-2 rounded-full bg-cabinet px-4 py-2 text-sm font-semibold text-[#f6f3ec] hover:bg-[#3b2f26]"
                      >
                        <Lock className="h-3.5 w-3.5" /> Ler o livro completo
                      </button>
                    ) : null}
                  </>
                ) : (
                  <>
                    {FACES.map((face) => (
                      <button
                        key={face.id}
                        type="button"
                        onClick={() => send((nonce) => ({ type: 'face', face: face.id, nonce }))}
                        className={pill}
                      >
                        {face.label}
                      </button>
                    ))}
                    <span className="mx-1 hidden h-6 w-px bg-rule sm:block" aria-hidden="true" />
                    <button
                      type="button"
                      aria-label="Aproximar"
                      onClick={() => send((nonce) => ({ type: 'zoom', factor: 0.8, nonce }))}
                      className="rounded-full border border-rule p-2.5 text-ink hover:bg-paper-deep"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Afastar"
                      onClick={() => send((nonce) => ({ type: 'zoom', factor: 1.25, nonce }))}
                      className="rounded-full border border-rule p-2.5 text-ink hover:bg-paper-deep"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => send((nonce) => ({ type: 'reset', nonce }))}
                      className={`${pill} inline-flex items-center gap-2`}
                    >
                      <RotateCcw className="h-4 w-4" /> Restaurar
                    </button>
                  </>
                )}
              </div>
            ) : null}

            <ClipTray
              clips={clips}
              onRemove={(id) => setClips((current) => current.filter((clip) => clip.id !== id))}
              onClear={() => setClips([])}
            />

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
                Escolha um exemplar
              </p>
              <ul className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
                {books.map((item) => {
                  const active = item.id === book.id;
                  return (
                    <li key={item.id} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => choose(item)}
                        aria-pressed={active}
                        aria-label={`${item.title}, ${item.author}`}
                        title={item.title}
                        className={`block rounded-lg p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                          active ? 'bg-gold/30 ring-2 ring-gold' : 'opacity-75 hover:opacity-100'
                        }`}
                      >
                        <BookCover
                          book={item}
                          className="h-24 w-16 rounded-md shadow"
                          iconClassName="h-6 w-6"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {wide ? null : (
            <CabinetDetails
              book={book}
              badge={badgeOf(book)}
              lending={lending}
              onAdd={() => addToBag(book)}
            />
          )}
        </div>
      )}
    </section>
  );
}

function clampSpread(value: number, max: number): number {
  return Math.min(max, Math.max(0, value));
}

function CabinetDetails({
  book,
  badge,
  lending,
  onAdd,
}: {
  book: Book;
  badge: Badge | null;
  lending: ReturnType<typeof useLendingActions>;
  onAdd: () => void;
}) {
  const installments = installmentsOf(book.price);
  const category = categoryNames(book)[0] ?? book.genre;
  const stock = book.stock ?? 0;
  const specs: [string, string][] = [
    ['Ano', book.publishedYear === undefined ? '—' : String(book.publishedYear)],
    ['Formato', formatBookFormat(book.format)],
    ['ISBN', book.isbn],
    ['Estoque', book.stock === undefined ? '—' : `${stock} no acervo`],
  ];

  return (
    <div className="rounded-3xl border border-rule bg-paper-card p-7 shadow-sm lg:self-start">
      <div className="flex flex-wrap items-center gap-2">
        {category ? (
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">
            {category}
          </span>
        ) : null}
        {badge ? (
          <span className="rounded-full bg-cabinet px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-[#f6f3ec]">
            {badge}
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 font-serif text-4xl leading-tight text-ink">{book.title}</h3>
      <p className="mt-1 text-ink-soft">{book.author}</p>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-6 text-sm">
        {specs.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-[0.15em] text-ink-soft">{label}</dt>
            <dd className="mt-1 break-all text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <details className="mt-6 text-sm text-ink-soft">
        <summary className="cursor-pointer font-semibold text-ink">Descrição das faces</summary>
        <p className="mt-2">
          Capa: título “{book.title}” e o nome de {book.author} sobre a cor do exemplar, com a marca
          BookWise. Lombada: na cor do exemplar. Contracapa: marca BookWise e o autor. Páginas:
          bloco em papel creme.
        </p>
      </details>

      <div className="mt-6 border-t border-rule pt-6">
        <p className="font-serif text-3xl text-ink">
          {book.price !== undefined ? formatCurrency(book.price) : 'Preço sob consulta'}
        </p>
        {installments ? (
          <p className="text-sm text-ink-soft">
            ou {installments.count}x de {formatCurrency(installments.value)} sem juros
          </p>
        ) : null}
        <button
          type="button"
          disabled={!isPurchasable(book)}
          onClick={onAdd}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-cabinet px-4 py-3 text-sm font-semibold text-[#f6f3ec] transition hover:bg-[#3b2f26] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShoppingBag className="h-4 w-4" />
          {stock <= 0 ? 'Indisponível' : 'Adicionar à sacola'}
        </button>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={stock <= 0 || lending.busy !== null}
            onClick={() => void lending.run('borrow')}
            className="rounded-md border border-rule px-3 py-2.5 text-sm font-semibold text-ink hover:bg-paper-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {lending.busy === 'borrow' ? 'Processando...' : 'Emprestar agora'}
          </button>
          <button
            type="button"
            disabled={lending.busy !== null}
            onClick={() => void lending.run('reserve')}
            className="rounded-md border border-rule px-3 py-2.5 text-sm font-semibold text-ink hover:bg-paper-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {lending.busy === 'reserve' ? 'Processando...' : 'Reservar'}
          </button>
        </div>

        {lending.error ? (
          <p
            role="alert"
            className="mt-4 rounded-md bg-[#f6e7e2] px-3 py-2 text-xs text-[#8a3a27] dark:bg-red-950/40 dark:text-red-300"
          >
            {lending.error}
          </p>
        ) : null}
        {lending.success ? (
          <p
            role="status"
            className="mt-4 rounded-md bg-[#e6efe4] px-3 py-2 text-xs text-[#2f5d3a] dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {lending.success}
          </p>
        ) : null}
      </div>
    </div>
  );
}
