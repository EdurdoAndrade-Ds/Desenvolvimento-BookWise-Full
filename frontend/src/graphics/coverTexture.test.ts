import { afterEach, describe, expect, it, vi } from 'vitest';
import { Color } from 'three';
import type { Book } from '../types/api';
import {
  createBackCoverTexture,
  createBookCoverImageData,
  createCoverTexture,
} from './coverTexture';
import { facedCoverColor } from './storefrontShelf';

function mockCanvas() {
  const text: { value: string; color: string; alpha: number }[] = [];
  const fills: unknown[] = [];
  const context = {
    fillStyle: '',
    globalAlpha: 1,
    fillRect: vi.fn(function (this: { fillStyle: unknown }) {
      fills.push(this.fillStyle);
    }),
    scale: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    })),
    strokeRect: vi.fn(),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    measureText: (value: string) => ({ width: value.length * 40 }),
    fillText(value: string) {
      text.push({ value, color: this.fillStyle, alpha: this.globalAlpha });
    },
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  vi.stubGlobal('document', { createElement: () => canvas });
  return { canvas, context, text, fills };
}

afterEach(() => vi.unstubAllGlobals());

describe('cover textures', () => {
  it.each(['O Senhor dos Anéis', ''])(
    'uses the shelf color and drawing for studio book %s',
    (title) => {
      const { canvas, context, text, fills } = mockCanvas();
      const book = { id: 7, title, author: 'J. R. R. Tolkien' } as Book;
      const image = createBookCoverImageData(book, 320, 460);
      expect(fills[0]).toBe(facedCoverColor(book));
      expect([canvas.width, canvas.height, image.width, image.height]).toEqual([
        320, 460, 320, 460,
      ]);
      expect(context.scale).toHaveBeenCalledWith(320 / 768, 460 / 1152);
      expect(context.getImageData).toHaveBeenCalledWith(0, 0, 320, 460);
      expect(text.find((entry) => entry.value === 'BOOKWISE')).toEqual({
        value: 'BOOKWISE',
        color: new Color(facedCoverColor(book)).multiplyScalar(0.045).getStyle(),
        alpha: 1,
      });
      expect(context.fillRect).toHaveBeenCalledTimes(3);
    },
  );

  it('preserves the cover color and uses opaque dark ink with a title band', () => {
    const { canvas, context, text } = mockCanvas();
    const background = '#9ba98b';
    const texture = createCoverTexture({
      title: 'Clean Code',
      author: 'Robert C. Martin',
      background,
      anisotropy: 16,
    });
    expect(canvas.width).toBe(768);
    expect(canvas.height).toBe(1152);
    expect(texture.anisotropy).toBe(16);
    expect(context.fillRect).toHaveBeenCalledTimes(3);
    const ink = new Color(background).multiplyScalar(0.045).getStyle();
    expect(text.find((entry) => entry.value === 'Clean Code')).toEqual({
      value: 'Clean Code',
      color: ink,
      alpha: 1,
    });
    expect(text.find((entry) => entry.value === 'Robert C. Martin')?.color).toBe(ink);
    texture.dispose();
  });

  it('handles empty cover text and uses safe sampling defaults', () => {
    mockCanvas();
    const texture = createCoverTexture({ title: '', author: '', background: '#9ba98b' });
    expect(texture.anisotropy).toBe(1);
    texture.dispose();
  });

  it('uses dark text and renderer sampling on the back cover too', () => {
    const { text } = mockCanvas();
    const texture = createBackCoverTexture({
      title: 'Livro',
      author: 'Autor',
      background: '#c6a49e',
      anisotropy: 8,
    });
    expect(texture.anisotropy).toBe(8);
    expect(
      text.every((entry) => entry.color === new Color('#c6a49e').multiplyScalar(0.045).getStyle()),
    ).toBe(true);
    texture.dispose();
  });

  it('reports unavailable canvas contexts', () => {
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    expect(() =>
      createCoverTexture({ title: 'Livro', author: 'Autor', background: '#9ba98b' }),
    ).toThrow('Canvas 2D indisponivel');
    expect(() => createBookCoverImageData({ title: 'Livro' } as Book, 320, 460)).toThrow(
      'Canvas 2D indisponivel',
    );
  });
});
