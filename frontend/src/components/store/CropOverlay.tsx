import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Scissors } from 'lucide-react';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropOverlayProps {
  /** Elemento que contém o <canvas> do livro 3D. */
  stage: HTMLElement | null;
  onCapture: (image: string) => void;
  onCancel: () => void;
}

const MIN_SIZE = 24;
const MAX_OUTPUT = 900;

function normalize(startX: number, startY: number, x: number, y: number): Rect {
  return {
    x: Math.min(startX, x),
    y: Math.min(startY, y),
    width: Math.abs(x - startX),
    height: Math.abs(y - startY),
  };
}

/**
 * Copia a área selecionada do canvas WebGL (que precisa de preserveDrawingBuffer)
 * para uma imagem JPEG. Coordenadas em pixels CSS, relativas ao palco.
 */
function captureRegion(stage: HTMLElement, rect: Rect): string | null {
  const canvas = stage.querySelector('canvas');
  if (!canvas) return null;
  const box = canvas.getBoundingClientRect();
  const stageBox = stage.getBoundingClientRect();
  const scaleX = canvas.width / box.width;
  const scaleY = canvas.height / box.height;
  const sx = (rect.x + stageBox.left - box.left) * scaleX;
  const sy = (rect.y + stageBox.top - box.top) * scaleY;
  const sw = rect.width * scaleX;
  const sh = rect.height * scaleY;
  const fit = Math.min(1, MAX_OUTPUT / Math.max(sw, sh));

  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(sw * fit));
  out.height = Math.max(1, Math.round(sh * fit));
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, out.width, out.height);
  return out.toDataURL('image/jpeg', 0.9);
}

/** Camada de seleção: arraste sobre o livro para recortar um trecho. */
export default function CropOverlay({ stage, onCapture, onCancel }: CropOverlayProps) {
  const layer = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  const point = (event: PointerEvent) => {
    const box = layer.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return {
      x: Math.min(box.width, Math.max(0, event.clientX - box.left)),
      y: Math.min(box.height, Math.max(0, event.clientY - box.top)),
    };
  };

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = point(event);
    setRect({ ...start.current, width: 0, height: 0 });
  };

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const current = point(event);
    setRect(normalize(start.current.x, start.current.y, current.x, current.y));
  };

  const onUp = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!start.current) return;
    const current = point(event);
    const selection = normalize(start.current.x, start.current.y, current.x, current.y);
    start.current = null;
    if (selection.width < MIN_SIZE || selection.height < MIN_SIZE || !stage) {
      setRect(null);
      return;
    }
    const image = captureRegion(stage, selection);
    setFlash(true);
    window.setTimeout(() => {
      setRect(null);
      setFlash(false);
      if (image) onCapture(image);
    }, 260);
  };

  return (
    <div
      ref={layer}
      role="application"
      aria-label="Selecione o trecho para recortar"
      className="absolute inset-0 z-20 cursor-crosshair touch-none select-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => {
        start.current = null;
        setRect(null);
      }}
    >
      {rect ? (
        <div
          className={`pointer-events-none absolute rounded-sm border-2 border-dashed border-[#f6f3ec] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-colors ${
            flash ? 'bg-white/60' : 'bg-transparent'
          }`}
          style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-black/25" />
      )}
      {!rect ? (
        <p className="pointer-events-none absolute left-1/2 top-4 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-cabinet shadow">
          <Scissors className="h-3.5 w-3.5" /> Arraste sobre o trecho · Esc cancela
        </p>
      ) : null}
    </div>
  );
}
