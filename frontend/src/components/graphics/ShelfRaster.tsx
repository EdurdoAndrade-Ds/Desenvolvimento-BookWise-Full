import { useEffect, useRef } from 'react';
import type { ShelfBook, ShelfLayout } from '../../graphics/shelfLayout';

/** Dimensao da visualizacao: 1D (sinal de varredura) ou 2D (elevacao rasterizada). */
export type RasterDimension = '1d' | '2d';

interface ShelfRasterProps {
  layout: ShelfLayout;
  dimension: RasterDimension;
  selectedBookId: number | null;
  onSelect: (entry: ShelfBook) => void;
}

const PADDING = 24;
const BOARD_COLOR = '#8b5a2b';
const BACKGROUND = '#0f172a';
const GRID_COLOR = 'rgba(148,163,184,0.18)';
const AXIS_COLOR = 'rgba(148,163,184,0.55)';
const LABEL_COLOR = '#cbd5e1';
const SELECTION_COLOR = '#f8fafc';
const SIGNAL_COLOR = 'rgba(248,250,252,0.85)';
const STRIP_HEIGHT = 44;
const STRIP_GAP = 18;
const SIGNAL_LABEL = 'altura h(x)';
const STRIP_LABEL = 'cor c(x)';
const MIN_LABEL_WIDTH = 14;

/** Transformacao janela -> viewport: mapeia o mundo da cena para pixels do canvas. */
interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface HitRegion {
  entry: ShelfBook;
  x: number;
  y: number;
  width: number;
  height: number;
}

function elevationViewport(layout: ShelfLayout, width: number, height: number): Viewport {
  const worldWidth = layout.width;
  const worldHeight = layout.topY - layout.bottomY;
  const scale = Math.min((width - PADDING * 2) / worldWidth, (height - PADDING * 2) / worldHeight);
  return {
    scale,
    offsetX: width / 2,
    offsetY: (height - worldHeight * scale) / 2 + layout.topY * scale,
  };
}

function toPixels(viewport: Viewport, x: number, y: number): [number, number] {
  return [viewport.offsetX + x * viewport.scale, viewport.offsetY - y * viewport.scale];
}

function drawSpineLabel(
  context: CanvasRenderingContext2D,
  entry: ShelfBook,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (width < MIN_LABEL_WIDTH) return;
  context.save();
  context.translate(x + width / 2, y + height - 6);
  context.rotate(-Math.PI / 2);
  context.fillStyle = 'rgba(15,23,42,0.85)';
  context.font = '600 9px system-ui, sans-serif';
  context.textAlign = 'left';
  context.fillText(entry.book.title, 0, 3, height - 12);
  context.restore();
}

/** Elevacao frontal: projecao ortografica da estante desenhada pixel a pixel em 2D. */
function drawElevation(
  context: CanvasRenderingContext2D,
  layout: ShelfLayout,
  width: number,
  height: number,
  selectedBookId: number | null,
): HitRegion[] {
  const viewport = elevationViewport(layout, width, height);
  const regions: HitRegion[] = [];

  context.strokeStyle = GRID_COLOR;
  context.lineWidth = 1;
  for (const board of layout.boards) {
    const [, gridY] = toPixels(viewport, 0, board.y);
    context.beginPath();
    context.moveTo(PADDING / 2, gridY);
    context.lineTo(width - PADDING / 2, gridY);
    context.stroke();
  }

  for (const board of layout.boards) {
    const [left, top] = toPixels(viewport, -board.width / 2, board.y + board.thickness / 2);
    context.fillStyle = BOARD_COLOR;
    context.fillRect(left, top, board.width * viewport.scale, board.thickness * viewport.scale);
  }

  for (const entry of layout.books) {
    const [cx, cy] = entry.position;
    const [spineWidth, bookHeight] = entry.size;
    const [left, top] = toPixels(viewport, cx - spineWidth / 2, cy + bookHeight / 2);
    const pixelWidth = spineWidth * viewport.scale;
    const pixelHeight = bookHeight * viewport.scale;

    context.fillStyle = entry.color;
    context.fillRect(left, top, pixelWidth, pixelHeight);
    context.strokeStyle = 'rgba(15,23,42,0.45)';
    context.lineWidth = 1;
    context.strokeRect(left + 0.5, top + 0.5, pixelWidth - 1, pixelHeight - 1);
    drawSpineLabel(context, entry, left, top, pixelWidth, pixelHeight);

    if (entry.book.id === selectedBookId) {
      context.strokeStyle = SELECTION_COLOR;
      context.lineWidth = 2;
      context.strokeRect(left - 1, top - 1, pixelWidth + 2, pixelHeight + 2);
    }

    regions.push({ entry, x: left, y: top, width: pixelWidth, height: pixelHeight });
  }

  return regions;
}

/**
 * Sinal 1D: o acervo percorrido em uma unica linha de varredura. A faixa inferior
 * e a cor amostrada c(x) e a curva superior e a altura h(x) de cada lombada.
 */
function drawSignal(
  context: CanvasRenderingContext2D,
  layout: ShelfLayout,
  width: number,
  height: number,
  selectedBookId: number | null,
): HitRegion[] {
  const regions: HitRegion[] = [];
  const totalWidth = layout.books.reduce((sum, entry) => sum + entry.size[0], 0);
  if (totalWidth === 0) return regions;

  const plotLeft = PADDING;
  const plotWidth = width - PADDING * 2;
  const stripTop = height - PADDING - STRIP_HEIGHT;
  const plotTop = PADDING + 12;
  const plotHeight = stripTop - STRIP_GAP - plotTop;
  const maxHeight = Math.max(...layout.books.map((entry) => entry.size[1]));

  context.strokeStyle = AXIS_COLOR;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(plotLeft, plotTop);
  context.lineTo(plotLeft, plotTop + plotHeight);
  context.lineTo(plotLeft + plotWidth, plotTop + plotHeight);
  context.stroke();

  context.fillStyle = LABEL_COLOR;
  context.font = '10px system-ui, sans-serif';
  context.textAlign = 'left';
  context.fillText(SIGNAL_LABEL, plotLeft + 4, plotTop - 2);
  context.fillText(STRIP_LABEL, plotLeft + 4, stripTop - 4);

  let cursor = 0;
  for (const entry of layout.books) {
    const spine = entry.size[0];
    const left = plotLeft + (cursor / totalWidth) * plotWidth;
    const segmentWidth = (spine / totalWidth) * plotWidth;
    const barHeight = (entry.size[1] / maxHeight) * plotHeight;
    const barTop = plotTop + plotHeight - barHeight;

    context.fillStyle = entry.color;
    context.globalAlpha = 0.35;
    context.fillRect(left, barTop, segmentWidth, barHeight);
    context.globalAlpha = 1;

    context.strokeStyle = SIGNAL_COLOR;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(left, barTop);
    context.lineTo(left + segmentWidth, barTop);
    context.stroke();

    context.fillStyle = entry.color;
    context.fillRect(left, stripTop, segmentWidth, STRIP_HEIGHT);

    if (entry.book.id === selectedBookId) {
      context.strokeStyle = SELECTION_COLOR;
      context.lineWidth = 2;
      context.strokeRect(left + 1, plotTop, segmentWidth - 2, plotHeight);
      context.strokeRect(left + 1, stripTop + 1, segmentWidth - 2, STRIP_HEIGHT - 2);
    }

    regions.push({
      entry,
      x: left,
      y: plotTop,
      width: segmentWidth,
      height: stripTop + STRIP_HEIGHT - plotTop,
    });
    cursor += spine;
  }

  return regions;
}

export default function ShelfRaster({
  layout,
  dimension,
  selectedBookId,
  onSelect,
}: ShelfRasterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const regionsRef = useRef<HitRegion[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const render = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = BACKGROUND;
      context.fillRect(0, 0, width, height);
      regionsRef.current =
        layout.books.length === 0
          ? []
          : dimension === '2d'
            ? drawElevation(context, layout, width, height, selectedBookId)
            : drawSignal(context, layout, width, height, selectedBookId);
    };

    render();
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, [layout, dimension, selectedBookId]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const hit = regionsRef.current.find(
      (region) =>
        x >= region.x &&
        x <= region.x + region.width &&
        y >= region.y &&
        y <= region.y + region.height,
    );
    if (hit) onSelect(hit.entry);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="h-full w-full cursor-pointer"
      role="img"
      aria-label={
        dimension === '2d' ? 'Elevacao 2D da estante em canvas' : 'Sinal 1D do acervo em canvas'
      }
    />
  );
}
