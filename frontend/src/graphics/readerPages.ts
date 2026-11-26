import { CanvasTexture, SRGBColorSpace } from 'three';
import type { BookPreview } from '../lib/bookPreview';

// Páginas do livro aberto no Gabinete 3D, desenhadas em canvas e usadas como textura.
// Uma página "left" fica à esquerda da lombada (gutter à direita); "right", o contrário.

export type PageSide = 'left' | 'right';

export const PAGE_CANVAS_WIDTH = 1024;

const BODY_FONT = '"EB Garamond", "Iowan Old Style", Georgia, "Times New Roman", serif';
const DISPLAY_FONT = '"Playfair Display", Georgia, serif';
const BODY_SIZE = 35;
const LINE_HEIGHT = 53;
const MARGIN_TOP = 160;
const MARGIN_BOTTOM = 150;
const MARGIN_OUTER = 100;
const MARGIN_INNER = 124;
const INDENT = 50;
const CHAPTER_SINK = 150;

const PAPER = '#f6efe1';
const INK = '#1f1812';
const INK_SOFT = '#8a7a66';
const ACCENT = '#8c6a3e';

/** Fontes usadas no canvas; espere por elas antes de desenhar as páginas. */
export const READER_FONTS = [
  `500 ${BODY_SIZE}px ${BODY_FONT}`,
  `italic 22px ${BODY_FONT}`,
  `italic 46px ${DISPLAY_FONT}`,
  `600 46px ${DISPLAY_FONT}`,
];

export function pageCanvasHeight(aspect: number): number {
  return Math.round(PAGE_CANVAS_WIDTH * aspect);
}

// ------------------------------------------------------------------ layout

type Line =
  | { kind: 'text'; words: string[]; indent: boolean; justify: boolean }
  | { kind: 'chapterNumber'; text: string }
  | { kind: 'chapterTitle'; text: string }
  | { kind: 'gap'; height: number };

export interface PageContent {
  lines: Line[];
  opensChapter: boolean;
}

function lineHeight(line: Line): number {
  switch (line.kind) {
    case 'text':
      return LINE_HEIGHT;
    case 'chapterNumber':
      return 44;
    case 'chapterTitle':
      return 70;
    case 'gap':
      return line.height;
  }
}

let measureContext: CanvasRenderingContext2D | null = null;

function measurer(): CanvasRenderingContext2D {
  if (!measureContext) {
    measureContext = document.createElement('canvas').getContext('2d');
    if (!measureContext) throw new Error('Canvas 2D indisponível');
  }
  measureContext.font = `500 ${BODY_SIZE}px ${BODY_FONT}`;
  return measureContext;
}

function wrapParagraph(text: string, width: number, indent: boolean): Line[] {
  const ctx = measurer();
  const space = ctx.measureText(' ').width;
  const words = text.split(/\s+/).filter(Boolean);
  const lines: Line[] = [];
  let current: string[] = [];
  let used = 0;
  let available = indent ? width - INDENT : width;

  for (const word of words) {
    const size = ctx.measureText(word).width;
    const next = current.length === 0 ? size : used + space + size;
    if (current.length > 0 && next > available) {
      lines.push({ kind: 'text', words: current, indent: lines.length === 0 && indent, justify: true });
      current = [word];
      used = size;
      available = width;
    } else {
      current.push(word);
      used = next;
    }
  }
  if (current.length > 0) {
    lines.push({ kind: 'text', words: current, indent: lines.length === 0 && indent, justify: false });
  }
  return lines;
}

/** Quebra o texto da prévia em páginas do tamanho do livro. */
export function paginate(preview: BookPreview, aspect: number): PageContent[] {
  const height = pageCanvasHeight(aspect) - MARGIN_TOP - MARGIN_BOTTOM;
  const width = PAGE_CANVAS_WIDTH - MARGIN_INNER - MARGIN_OUTER;
  const pages: PageContent[] = [];
  let page: PageContent = { lines: [], opensChapter: false };
  let used = 0;
  let afterHeading = false;

  const flush = () => {
    pages.push(page);
    page = { lines: [], opensChapter: false };
    used = 0;
  };

  for (const block of preview.blocks) {
    if (block.type === 'chapter') {
      const heading: Line[] = [
        { kind: 'chapterNumber', text: block.number },
        { kind: 'chapterTitle', text: block.title },
        { kind: 'gap', height: 36 },
      ];
      const headingHeight = heading.reduce((sum, line) => sum + lineHeight(line), 0);
      // Título de capítulo nunca fica sozinho no pé da página.
      if (used > 0 && used + 64 + headingHeight + LINE_HEIGHT * 3 > height) flush();
      if (used === 0) {
        page.opensChapter = true;
        page.lines.push({ kind: 'gap', height: CHAPTER_SINK });
        used += CHAPTER_SINK;
      } else {
        page.lines.push({ kind: 'gap', height: 64 });
        used += 64;
      }
      page.lines.push(...heading);
      used += headingHeight;
      afterHeading = true;
      continue;
    }

    for (const line of wrapParagraph(block.text, width, !afterHeading)) {
      if (used + LINE_HEIGHT > height) flush();
      page.lines.push(line);
      used += LINE_HEIGHT;
    }
    afterHeading = false;
  }
  if (page.lines.length > 0) pages.push(page);
  return pages;
}

// ------------------------------------------------------------------ desenho

function seededNoise(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

function makeCanvas(aspect: number) {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_CANVAS_WIDTH;
  canvas.height = pageCanvasHeight(aspect);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível');
  return { canvas, ctx };
}

function paintPaper(ctx: CanvasRenderingContext2D, side: PageSide, seed: number) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);

  // Fibras do papel: pontinhos quase invisíveis, sempre iguais para a mesma página.
  const random = seededNoise(seed + 7);
  for (let i = 0; i < 2600; i += 1) {
    ctx.fillStyle = random() > 0.5 ? 'rgba(120, 90, 50, 0.05)' : 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(random() * width, random() * height, 1 + random() * 2, 1 + random() * 2);
  }

  // Sombra da dobra junto à lombada e leve escurecimento na borda externa.
  const gutterX = side === 'right' ? 0 : width;
  const gutter = ctx.createLinearGradient(gutterX, 0, side === 'right' ? 150 : width - 150, 0);
  gutter.addColorStop(0, 'rgba(70, 45, 20, 0.30)');
  gutter.addColorStop(0.35, 'rgba(70, 45, 20, 0.08)');
  gutter.addColorStop(1, 'rgba(70, 45, 20, 0)');
  ctx.fillStyle = gutter;
  ctx.fillRect(0, 0, width, height);

  const outerX = side === 'right' ? width : 0;
  const outer = ctx.createLinearGradient(outerX, 0, side === 'right' ? width - 60 : 60, 0);
  outer.addColorStop(0, 'rgba(70, 45, 20, 0.10)');
  outer.addColorStop(1, 'rgba(70, 45, 20, 0)');
  ctx.fillStyle = outer;
  ctx.fillRect(0, 0, width, height);
}

function drawSpaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  const chars = [...text];
  const total =
    chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0) + spacing * (chars.length - 1);
  let cursor = x - total / 2;
  ctx.textAlign = 'left';
  for (const char of chars) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + spacing;
  }
}

interface TextPageOptions {
  content: PageContent | undefined;
  pageNumber: number;
  side: PageSide;
  runningHead: string;
  aspect: number;
}

function drawTextPageInto(ctx: CanvasRenderingContext2D, options: TextPageOptions) {
  const { content, pageNumber, side, runningHead } = options;
  const { width, height } = ctx.canvas;
  paintPaper(ctx, side, pageNumber * 31);

  const left = side === 'right' ? MARGIN_INNER : MARGIN_OUTER;
  const textWidth = width - MARGIN_INNER - MARGIN_OUTER;
  ctx.textBaseline = 'alphabetic';

  if (runningHead && !content?.opensChapter) {
    ctx.fillStyle = INK_SOFT;
    ctx.font = `italic 22px ${BODY_FONT}`;
    drawSpaced(ctx, runningHead.toUpperCase(), left + textWidth / 2, 96, 3);
  }

  if (pageNumber > 0) {
    ctx.fillStyle = INK_SOFT;
    ctx.font = `22px ${BODY_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(pageNumber), left + textWidth / 2, height - 84);
  }

  if (!content) return;
  let y = MARGIN_TOP;
  for (const line of content.lines) {
    const step = lineHeight(line);
    if (line.kind === 'gap') {
      y += step;
      continue;
    }
    if (line.kind === 'chapterNumber') {
      ctx.fillStyle = ACCENT;
      ctx.font = `600 20px ${DISPLAY_FONT}`;
      drawSpaced(ctx, line.text.toUpperCase(), left + textWidth / 2, y + 26, 5);
    } else if (line.kind === 'chapterTitle') {
      ctx.fillStyle = INK;
      ctx.font = `italic 46px ${DISPLAY_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(line.text, left + textWidth / 2, y + 50, textWidth);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(left + textWidth / 2 - 28, y + 74, 56, 2);
    } else {
      ctx.fillStyle = INK;
      ctx.font = `500 ${BODY_SIZE}px ${BODY_FONT}`;
      ctx.textAlign = 'left';
      const start = left + (line.indent ? INDENT : 0);
      const available = textWidth - (line.indent ? INDENT : 0);
      const sizes = line.words.map((word) => ctx.measureText(word).width);
      const natural = sizes.reduce((sum, size) => sum + size, 0);
      const baseSpace = ctx.measureText(' ').width;
      const gaps = line.words.length - 1;
      const space =
        line.justify && gaps > 0 ? Math.max(baseSpace, (available - natural) / gaps) : baseSpace;
      let x = start;
      line.words.forEach((word, index) => {
        ctx.fillText(word, x, y + 38);
        x += sizes[index] + space;
      });
    }
    y += step;
  }
}

function toTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Página de texto legível. */
export function createTextPage(options: TextPageOptions): CanvasTexture {
  const { canvas, ctx } = makeCanvas(options.aspect);
  drawTextPageInto(ctx, options);
  return toTexture(canvas);
}

/**
 * Página bloqueada: o texto existe, mas chega borrado (reduzido e ampliado, que funciona
 * em qualquer navegador, inclusive Safari). O convite para assinar fica no HTML por cima.
 */
export function createLockedPage(options: TextPageOptions): CanvasTexture {
  const source = makeCanvas(options.aspect);
  drawTextPageInto(source.ctx, options);

  const { canvas, ctx } = makeCanvas(options.aspect);
  const small = document.createElement('canvas');
  small.width = Math.round(canvas.width / 16);
  small.height = Math.round(canvas.height / 16);
  const smallCtx = small.getContext('2d');
  if (!smallCtx) throw new Error('Canvas 2D indisponível');
  smallCtx.imageSmoothingQuality = 'high';
  smallCtx.drawImage(source.canvas, 0, 0, small.width, small.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(246, 239, 225, 0.35)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return toTexture(canvas);
}

/** Verso da capa: guarda com a dobra do tecido da capa e um ex-libris. */
export function createEndpaper(options: {
  title: string;
  author: string;
  color: string;
  aspect: number;
}): CanvasTexture {
  const { canvas, ctx } = makeCanvas(options.aspect);
  const { width, height } = canvas;
  ctx.fillStyle = options.color;
  ctx.fillRect(0, 0, width, height);

  // A guarda cobre quase toda a placa; o tecido da capa aparece só nas três bordas externas.
  const band = 30;
  const x0 = band;
  const y0 = band;
  const w = width - band;
  const h = height - band * 2;
  ctx.fillStyle = '#efe5d2';
  ctx.fillRect(x0, y0, w, h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.clip();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = options.color;
  ctx.lineWidth = 2;
  for (let y = y0 - 40; y < y0 + h + 40; y += 40) {
    for (let x = x0 - 40; x < x0 + w + 40; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x + 12, y);
      ctx.lineTo(x, y + 12);
      ctx.lineTo(x - 12, y);
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();

  const gutter = ctx.createLinearGradient(width, 0, width - 160, 0);
  gutter.addColorStop(0, 'rgba(60, 40, 20, 0.35)');
  gutter.addColorStop(1, 'rgba(60, 40, 20, 0)');
  ctx.fillStyle = gutter;
  ctx.fillRect(0, 0, width, height);

  const plateW = 520;
  const plateH = 340;
  const px = (width - plateW) / 2 + 10;
  const py = (height - plateH) / 2;
  ctx.fillStyle = '#fbf6ea';
  ctx.strokeStyle = options.color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(px, py, plateW, plateH, 18);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(px + 14, py + 14, plateW - 28, plateH - 28, 10);
  ctx.stroke();

  const cx = px + plateW / 2;
  ctx.fillStyle = ACCENT;
  ctx.font = `600 22px ${DISPLAY_FONT}`;
  drawSpaced(ctx, 'EX LIBRIS', cx, py + 78, 8);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = `italic 44px ${DISPLAY_FONT}`;
  ctx.fillText(options.title, cx, py + 166, plateW - 80);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `28px ${BODY_FONT}`;
  ctx.fillText(options.author, cx, py + 214, plateW - 80);
  ctx.fillStyle = ACCENT;
  ctx.font = `italic 24px ${BODY_FONT}`;
  ctx.fillText('Acervo BookWise', cx, py + 282);
  return toTexture(canvas);
}

/** Última página disponível, quando não há mais folhas para virar. */
export function createClosingPage(options: {
  text: string;
  side: PageSide;
  aspect: number;
}): CanvasTexture {
  const { canvas, ctx } = makeCanvas(options.aspect);
  paintPaper(ctx, options.side, 999);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'center';
  ctx.font = `46px ${DISPLAY_FONT}`;
  ctx.fillText('❦', cx, cy - 30);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 30px ${BODY_FONT}`;
  ctx.fillText(options.text, cx, cy + 40, canvas.width - 220);
  return toTexture(canvas);
}

/** Textura do corte das folhas: linhas finas na direção `u` ou `v`. */
export function createPageEdgeTexture(direction: 'u' | 'v'): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível');
  ctx.fillStyle = '#efe6d4';
  ctx.fillRect(0, 0, 256, 256);
  const random = seededNoise(direction === 'u' ? 3 : 5);
  for (let i = 0; i < 256; i += 2) {
    const shade = 0.06 + random() * 0.12;
    ctx.fillStyle = `rgba(110, 85, 55, ${shade})`;
    if (direction === 'u') ctx.fillRect(i, 0, 1, 256);
    else ctx.fillRect(0, i, 256, 1);
  }
  return toTexture(canvas);
}
