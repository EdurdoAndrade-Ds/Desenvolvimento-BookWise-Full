import type { ImageHistogram } from './imageFilters';
import { clipPolygon, type Point } from './polygonClip';

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j],
      b = polygon[i];
    const cross = (point.x - a.x) * (b.y - a.y) - (point.y - a.y) * (b.x - a.x);
    if (
      Math.abs(cross) < 1e-9 &&
      point.x >= Math.min(a.x, b.x) &&
      point.x <= Math.max(a.x, b.x) &&
      point.y >= Math.min(a.y, b.y) &&
      point.y <= Math.max(a.y, b.y)
    )
      return true;
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

export function cropPolygon(source: ImageData, points: Point[]): ImageData {
  const polygon = clipPolygon(points, source.width, source.height);
  if (polygon.length < 3) throw new Error('O polígono não contém uma área dentro da imagem.');
  const x = Math.floor(Math.min(...polygon.map((p) => p.x)));
  const y = Math.floor(Math.min(...polygon.map((p) => p.y)));
  const right = Math.ceil(Math.max(...polygon.map((p) => p.x)));
  const bottom = Math.ceil(Math.max(...polygon.map((p) => p.y)));
  if (right <= x || bottom <= y) throw new Error('Polígono sem área.');
  const output = new ImageData(right - x, bottom - y);
  let visible = false;
  for (let row = 0; row < output.height; row++)
    for (let col = 0; col < output.width; col++) {
      if (!pointInPolygon({ x: x + col + 0.5, y: y + row + 0.5 }, polygon)) continue;
      const index = ((y + row) * source.width + x + col) * 4;
      output.data.set(source.data.subarray(index, index + 4), (row * output.width + col) * 4);
      visible = true;
    }
  if (!visible) throw new Error('O polígono não contém centros de pixels.');
  return output;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function cropImage(source: ImageData, rect: Rect): ImageData {
  if (
    ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) ||
    rect.width <= 0 ||
    rect.height <= 0
  )
    throw new Error('Selecione uma área válida.');
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const width = Math.min(source.width, Math.ceil(rect.x + rect.width)) - x;
  const height = Math.min(source.height, Math.ceil(rect.y + rect.height)) - y;
  if (width <= 0 || height <= 0) throw new Error('Seleção fora da imagem.');
  const output = new ImageData(width, height);
  for (let row = 0; row < height; row++) {
    const start = ((y + row) * source.width + x) * 4;
    output.data.set(source.data.subarray(start, start + width * 4), row * width * 4);
  }
  return output;
}

export function analyzeImage(image: ImageData) {
  const hist: ImageHistogram = {
    r: new Uint32Array(256),
    g: new Uint32Array(256),
    b: new Uint32Array(256),
    luma: new Uint32Array(256),
  };
  const keys = ['r', 'g', 'b', 'luma'] as const;
  const channels = keys.map(() => ({ mean: 0, min: Infinity, max: -Infinity, std: 0 }));
  let count = 0;
  for (let i = 0; i < image.data.length; i += 4) {
    if (image.data[i + 3] === 0) continue;
    count++;
    const [r, g, b] = image.data.subarray(i, i + 3);
    const values = [r, g, b, 0.299 * r + 0.587 * g + 0.114 * b];
    values.forEach((v, c) => {
      hist[keys[c]][Math.round(v)]++;
      const ch = channels[c];
      const delta = v - ch.mean;
      ch.mean += delta / count;
      ch.std += delta * (v - ch.mean);
      ch.min = Math.min(ch.min, v);
      ch.max = Math.max(ch.max, v);
    });
  }
  channels.forEach((ch) => {
    ch.std = count ? Math.sqrt(ch.std / count) : 0;
    if (!count) {
      ch.min = 0;
      ch.max = 0;
    }
  });
  return { count, histogram: hist, channels };
}
