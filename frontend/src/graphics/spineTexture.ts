import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';

const TEXTURE_WIDTH = 128;
const TEXTURE_HEIGHT = 512;
const TITLE_FONT_SIZE = 34;
const AUTHOR_FONT_SIZE = 24;
const PADDING = 28;

/** Texto que a textura desenha na lombada do livro. */
export interface SpineTextureInput {
  title: string;
  author: string;
  background: string;
}

function truncate(context: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (context.measureText(text).width <= maxWidth) return text;
  let output = text;
  while (output.length > 1 && context.measureText(`${output}...`).width > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output}...`;
}

/**
 * Gera uma textura de lombada desenhando titulo e autor rotacionados em um
 * canvas offscreen; e o mapa aplicado na face frontal do livro.
 */
export function createSpineTexture(input: SpineTextureInput): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D indisponivel para gerar a textura da lombada');
  }

  context.fillStyle = input.background;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  context.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  context.lineWidth = 3;
  context.strokeRect(6, 6, TEXTURE_WIDTH - 12, TEXTURE_HEIGHT - 12);

  context.translate(TEXTURE_WIDTH / 2, TEXTURE_HEIGHT / 2);
  context.rotate(-Math.PI / 2);
  context.textAlign = 'left';
  context.textBaseline = 'middle';

  const maxTextWidth = TEXTURE_HEIGHT - PADDING * 2;
  context.fillStyle = 'rgba(255, 255, 255, 0.95)';
  context.font = `bold ${TITLE_FONT_SIZE}px sans-serif`;
  context.fillText(
    truncate(context, input.title, maxTextWidth),
    -maxTextWidth / 2,
    -TITLE_FONT_SIZE * 0.4,
  );

  context.fillStyle = 'rgba(255, 255, 255, 0.7)';
  context.font = `${AUTHOR_FONT_SIZE}px sans-serif`;
  context.fillText(
    truncate(context, input.author, maxTextWidth),
    -maxTextWidth / 2,
    AUTHOR_FONT_SIZE * 1.1,
  );

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
