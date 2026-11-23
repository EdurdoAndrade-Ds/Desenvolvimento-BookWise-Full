import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { analyzeImage, cropImage, cropPolygon, pointInPolygon } from './crop';
import { bilinear, transformImage } from './affine';
import { clipPolygon } from './polygonClip';

class Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}
beforeAll(() => vi.stubGlobal('ImageData', Pixels));
afterAll(() => vi.unstubAllGlobals());
function image() {
  const src = new ImageData(2, 2);
  src.data.set([10, 20, 30, 255, 50, 60, 70, 255, 90, 100, 110, 255, 130, 140, 150, 255]);
  return src;
}
describe('rectangular crop', () => {
  it('copies the selected rows without changing the source', () => {
    const src = image();
    const crop = cropImage(src, { x: 1, y: 0, width: 1, height: 2 });
    expect([crop.width, crop.height]).toEqual([1, 2]);
    expect([...crop.data]).toEqual([50, 60, 70, 255, 130, 140, 150, 255]);
    crop.data[0] = 0;
    expect(src.data[4]).toBe(50);
  });
  it('clips to the source and rejects empty, outside and invalid selections', () => {
    expect(cropImage(image(), { x: -1, y: -1, width: 2, height: 2 }).width).toBe(1);
    for (const rect of [
      { x: 0, y: 0, width: 0, height: 1 },
      { x: 3, y: 0, width: 1, height: 1 },
      { x: NaN, y: 0, width: 1, height: 1 },
    ])
      expect(() => cropImage(image(), rect)).toThrow();
  });
});
describe('polygon masks', () => {
  const triangle = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
  ];
  it('includes interior and boundary points, excludes outside and handles concavity', () => {
    expect(pointInPolygon({ x: 0.5, y: 0.5 }, triangle)).toBe(true);
    expect(pointInPolygon({ x: 1, y: 1 }, triangle)).toBe(true);
    expect(pointInPolygon({ x: 1.5, y: 1.5 }, triangle)).toBe(false);
    expect(pointInPolygon({ x: 0, y: 0 }, [])).toBe(false);
    const concave = [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 3 },
      { x: 0, y: 3 },
    ];
    expect(pointInPolygon({ x: 0.5, y: 2 }, concave)).toBe(true);
    expect(pointInPolygon({ x: 2, y: 2 }, concave)).toBe(false);
  });
  it('copies inside pixels, masks outside to transparent and preserves source alpha', () => {
    const source = image();
    source.data[3] = 120;
    const output = cropPolygon(source, triangle);
    expect([output.width, output.height]).toEqual([2, 2]);
    expect([...output.data.slice(0, 4)]).toEqual([10, 20, 30, 120]);
    expect([...output.data.slice(12, 16)]).toEqual([0, 0, 0, 0]);
    expect(analyzeImage(output).count).toBe(3);
    expect(source.data[15]).toBe(255);
    expect([...cropPolygon(source, [...triangle].reverse()).data]).toEqual([...output.data]);
  });
  it('clips crossing edges before bounding-box crop', () => {
    const output = cropPolygon(image(), [
      { x: 1, y: -5 },
      { x: 5, y: -5 },
      { x: 5, y: 5 },
      { x: 1, y: 5 },
    ]);
    expect([output.width, output.height]).toEqual([1, 2]);
    expect([...output.data]).toEqual([50, 60, 70, 255, 130, 140, 150, 255]);
  });
  it('rejects empty, fully outside, degenerate and subpixel-empty polygons', () => {
    for (const points of [
      [],
      [
        { x: -3, y: -3 },
        { x: -1, y: -3 },
        { x: -1, y: -1 },
      ],
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: 0.1, y: 0 },
        { x: 0, y: 0.1 },
      ],
    ])
      expect(() => cropPolygon(image(), points)).toThrow();
  });
});
describe('Sutherland–Hodgman', () => {
  it('preserves an inside polygon', () => {
    const p = [
      { x: 1, y: 1 },
      { x: 8, y: 1 },
      { x: 4, y: 8 },
    ];
    expect(clipPolygon(p, 10, 10)).toEqual(p);
  });
  it('clips crossing edges against all four bounds', () => {
    const output = clipPolygon(
      [
        { x: -2, y: -2 },
        { x: 12, y: -2 },
        { x: 12, y: 12 },
        { x: -2, y: 12 },
      ],
      10,
      10,
    );
    expect(output).toHaveLength(4);
    expect(new Set(output.map((p) => `${p.x},${p.y}`))).toEqual(
      new Set(['0,0', '10,0', '10,10', '0,10']),
    );
  });
  it('returns empty for fully outside and empty polygons and rejects invalid points', () => {
    expect(
      clipPolygon(
        [
          { x: -3, y: 0 },
          { x: -1, y: 0 },
          { x: -1, y: 3 },
        ],
        10,
        10,
      ),
    ).toEqual([]);
    expect(clipPolygon([], 10, 10)).toEqual([]);
    expect(() => clipPolygon([{ x: NaN, y: 0 }], 10, 10)).toThrow();
  });
});
describe('inverse affine mapping', () => {
  it('preserves pixels at identity and rotates exactly 90 degrees clockwise', () => {
    expect([...transformImage(image(), 0).image.data]).toEqual([...image().data]);
    const rotated = transformImage(image(), 90);
    expect([0, 4, 8, 12].map((i) => rotated.image.data[i])).toEqual([90, 10, 130, 50]);
    expect(rotated.matrix.slice(0, 2)).toEqual([0, -1]);
  });
  it('swaps nonsquare dimensions, flips and computes a rotated bounding box', () => {
    const src = new ImageData(2, 3);
    expect([transformImage(src, 90).image.width, transformImage(src, 90).image.height]).toEqual([
      3, 2,
    ]);
    expect(transformImage(image(), 0, 1, true).image.data[0]).toBe(50);
    expect(transformImage(image(), 0, 1, false, true).image.data[0]).toBe(90);
    expect(transformImage(image(), 45).image.width).toBe(3);
    expect(transformImage(image(), 0, 2).image.width).toBe(4);
    expect(() => transformImage(image(), 0, 0)).toThrow();
    expect(() => transformImage(image(), NaN)).toThrow();
  });
  it('bilinearly interpolates channels with premultiplied alpha', () => {
    expect(bilinear(image(), 0.5, 0.5)).toEqual([70, 80, 90, 255]);
    expect(bilinear(image(), -2, 0)).toEqual([0, 0, 0, 0]);
    const src = image();
    src.data[3] = 0;
    expect(bilinear(src, 0.5, 0)).toEqual([50, 60, 70, 127.5]);
    const empty = new ImageData(1, 1);
    expect(bilinear(empty, 0, 0)).toEqual([0, 0, 0, 0]);
  });
});
describe('visible-pixel statistics', () => {
  it('computes RGB/luma histograms and population mean/min/max/std', () => {
    const stats = analyzeImage(image());
    expect(stats.count).toBe(4);
    expect(stats.channels[0]).toEqual({ mean: 70, min: 10, max: 130, std: Math.sqrt(2000) });
    expect(stats.histogram.r[10]).toBe(1);
    expect(stats.histogram.luma.reduce((a, b) => a + b, 0)).toBe(4);
    expect(stats.channels[3].mean).toBeCloseTo(78.15);
  });
  it('ignores fully transparent pixels and returns finite zero stats for empty images', () => {
    const src = image();
    src.data[3] = 0;
    expect(analyzeImage(src).count).toBe(3);
    expect(analyzeImage(src).channels[0].min).toBe(50);
    expect(analyzeImage(new ImageData(1, 1)).channels).toEqual(
      Array.from({ length: 4 }, () => ({ mean: 0, min: 0, max: 0, std: 0 })),
    );
  });
});
