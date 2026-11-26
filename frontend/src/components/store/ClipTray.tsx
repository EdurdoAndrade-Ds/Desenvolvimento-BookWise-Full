import { useEffect, useState } from 'react';
import { Download, Scissors, Trash2, X } from 'lucide-react';

export interface Clip {
  id: number;
  image: string;
  bookTitle: string;
  pages: string;
}

interface ClipTrayProps {
  clips: Clip[];
  onRemove: (id: number) => void;
  onClear: () => void;
}

function fileName(clip: Clip): string {
  const slug = clip.bookTitle
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `trecho-${slug}-${clip.id}.jpg`;
}

/** Trechos recortados do livro, em quadradinhos; clique para ampliar. */
export default function ClipTray({ clips, onRemove, onClear }: ClipTrayProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = clips.find((clip) => clip.id === openId) ?? null;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setOpenId(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  if (clips.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          <Scissors className="h-3.5 w-3.5" /> Seus trechos ({clips.length})
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline"
        >
          Limpar todos
        </button>
      </div>

      <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
        {clips.map((clip) => (
          <li
            key={clip.id}
            className="group relative animate-[clipIn_0.45s_cubic-bezier(.2,.9,.3,1.3)_both]"
          >
            <button
              type="button"
              onClick={() => setOpenId(clip.id)}
              aria-label={`Ampliar trecho de ${clip.bookTitle}, ${clip.pages}`}
              className="block aspect-square w-full overflow-hidden rounded-xl border border-rule bg-paper-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <img src={clip.image} alt="" className="h-full w-full bg-[#efe5d2] object-contain" />
            </button>
            <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[0.65rem] text-[#f6f3ec]">
              {clip.pages}
            </span>
            <button
              type="button"
              onClick={() => onRemove(clip.id)}
              aria-label="Remover trecho"
              className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-[#f6f3ec] opacity-100 transition hover:bg-black/75 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setOpenId(null)}
        >
          <figure
            role="dialog"
            aria-modal="true"
            aria-label={`Trecho de ${open.bookTitle}`}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-full w-full max-w-3xl overflow-hidden rounded-3xl bg-paper-card shadow-2xl"
          >
            <div className="flex justify-center bg-[#1a120c] p-4">
              <img
                src={open.image}
                alt={`Trecho de ${open.bookTitle}, ${open.pages}`}
                className="max-h-[70vh] w-auto max-w-full rounded-md shadow-lg"
              />
            </div>
            <figcaption className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-ink">
              <span>
                <span className="font-serif italic">{open.bookTitle}</span>
                <span className="text-ink-soft"> · {open.pages}</span>
              </span>
              <span className="flex gap-2">
                <a
                  href={open.image}
                  download={fileName(open)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 hover:bg-paper-deep"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onRemove(open.id);
                    setOpenId(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 hover:bg-paper-deep"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remover
                </button>
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cabinet px-3 py-1.5 text-[#f6f3ec] hover:bg-[#3b2f26]"
                >
                  Fechar
                </button>
              </span>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </div>
  );
}
