import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';

const TEXTURE_WIDTH = 512;
const TEXTURE_HEIGHT = 768;
const MARGIN = 44;
const LABEL_FONT_SIZE = 24;
const INITIAL_FONT_SIZE = 190;
const TITLE_FONT_SIZE = 40;
const AUTHOR_FONT_SIZE = 28;
const TITLE_LINE_HEIGHT = 50;
const MAX_TITLE_LINES = 3;

/** Textos usados para desenhar a capa procedural de um livro. */
export interface CoverTextureInput {
  title: string;
  author: string;
  background: string;
}

function wrap(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= MAX_TITLE_LINES) return lines;
  return [...lines.slice(0, MAX_TITLE_LINES - 1), `${lines[MAX_TITLE_LINES - 1]}...`];
}

/**
 * Gera a capa do livro em um canvas offscreen: selo da livraria, inicial do
 * titulo em marca d'agua, titulo e autor sobre a cor deterministica do livro.
 */
export function createCoverTexture(input: CoverTextureInput): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D indisponivel para gerar a textura da capa');
  }

  context.fillStyle = input.background;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  const shade = context.createLinearGradient(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  shade.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  context.fillStyle = shade;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  context.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  context.lineWidth = 2;
  context.strokeRect(MARGIN / 2, MARGIN / 2, TEXTURE_WIDTH - MARGIN, TEXTURE_HEIGHT - MARGIN);

  context.textAlign = 'center';
  context.fillStyle = 'rgba(255, 255, 255, 0.75)';
  context.font = `${LABEL_FONT_SIZE}px sans-serif`;
  context.fillText('BOOKWISE', TEXTURE_WIDTH / 2, MARGIN + LABEL_FONT_SIZE);

  context.fillStyle = 'rgba(255, 255, 255, 0.2)';
  context.font = `bold ${INITIAL_FONT_SIZE}px serif`;
  context.fillText(input.title.charAt(0).toUpperCase(), TEXTURE_WIDTH / 2, TEXTURE_HEIGHT / 2);

  const maxTextWidth = TEXTURE_WIDTH - MARGIN * 2;
  context.fillStyle = 'rgba(255, 255, 255, 0.95)';
  context.font = `bold ${TITLE_FONT_SIZE}px serif`;
  const lines = wrap(context, input.title, maxTextWidth);
  const titleTop = TEXTURE_HEIGHT * 0.66;
  lines.forEach((line, index) => {
    context.fillText(line, TEXTURE_WIDTH / 2, titleTop + index * TITLE_LINE_HEIGHT);
  });

  context.fillStyle = 'rgba(255, 255, 255, 0.72)';
  context.font = `${AUTHOR_FONT_SIZE}px sans-serif`;
  context.fillText(input.author, TEXTURE_WIDTH / 2, TEXTURE_HEIGHT - MARGIN * 1.5);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Contracapa: mesma cor da capa, com selo da livraria e o autor no rodape. */
export function createBackCoverTexture(input: CoverTextureInput): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D indisponivel para gerar a textura da contracapa');
  }

  context.fillStyle = input.background;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  const shade = context.createLinearGradient(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0.22)');
  shade.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
  context.fillStyle = shade;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  context.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  context.lineWidth = 2;
  context.strokeRect(MARGIN / 2, MARGIN / 2, TEXTURE_WIDTH - MARGIN, TEXTURE_HEIGHT - MARGIN);

  context.textAlign = 'center';
  context.fillStyle = 'rgba(255, 255, 255, 0.65)';
  context.font = `${LABEL_FONT_SIZE}px sans-serif`;
  context.fillText('BOOKWISE', TEXTURE_WIDTH / 2, TEXTURE_HEIGHT / 2);

  context.fillStyle = 'rgba(255, 255, 255, 0.55)';
  context.font = `${AUTHOR_FONT_SIZE}px sans-serif`;
  context.fillText(input.author, TEXTURE_WIDTH / 2, TEXTURE_HEIGHT - MARGIN * 1.5);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

const LABEL_WIDTH = 512;
const LABEL_HEIGHT = 64;

/** Etiqueta gravada na madeira acima de cada fileira ("PRATELEIRA 01"). */
export function createShelfLabelTexture(text: string): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_WIDTH;
  canvas.height = LABEL_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D indisponivel para gerar a etiqueta da prateleira');
  }

  const tracking = 10;
  context.clearRect(0, 0, LABEL_WIDTH, LABEL_HEIGHT);
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillStyle = 'rgba(233, 216, 196, 0.75)';
  context.font = '600 26px sans-serif';

  const letters = [...text];
  const width = letters.reduce(
    (total, letter) => total + context.measureText(letter).width + tracking,
    -tracking,
  );
  let cursor = LABEL_WIDTH - 8 - width;
  for (const letter of letters) {
    context.fillText(letter, cursor, LABEL_HEIGHT / 2);
    cursor += context.measureText(letter).width + tracking;
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Textura das paginas internas, exibida quando a capa e aberta. */
export function createPageTexture(input: CoverTextureInput): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D indisponivel para gerar a textura das paginas');
  }

  context.fillStyle = '#f6f1e8';
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  context.textAlign = 'center';
  context.fillStyle = '#8a7a63';
  context.font = `${LABEL_FONT_SIZE}px sans-serif`;
  context.fillText('BOOKWISE', TEXTURE_WIDTH / 2, MARGIN + LABEL_FONT_SIZE);

  context.fillStyle = '#3f342a';
  context.font = `bold ${TITLE_FONT_SIZE}px serif`;
  const lines = wrap(context, input.title, TEXTURE_WIDTH - MARGIN * 2);
  lines.forEach((line, index) => {
    context.fillText(line, TEXTURE_WIDTH / 2, TEXTURE_HEIGHT / 2 + index * TITLE_LINE_HEIGHT);
  });

  context.fillStyle = '#7b6a55';
  context.font = `${AUTHOR_FONT_SIZE}px sans-serif`;
  context.fillText(
    input.author,
    TEXTURE_WIDTH / 2,
    TEXTURE_HEIGHT / 2 + lines.length * TITLE_LINE_HEIGHT + AUTHOR_FONT_SIZE,
  );

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
