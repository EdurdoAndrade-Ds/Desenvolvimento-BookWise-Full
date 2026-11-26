import { describe, expect, it } from 'vitest';
import { cropSideColor, cropSlabGeometry } from './cropSlab';

describe('crop slab geometry', () => {
  it('makes an aspect-correct rectangular solid with 7.5% depth and image UVs on both caps', () => {
    const geometry = cropSlabGeometry(100, 200, [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 200 },
      { x: 0, y: 200 },
    ]);
    const bounds = geometry.boundingBox!;
    expect(bounds.max.x - bounds.min.x).toBeCloseTo(1.2);
    expect(bounds.max.y - bounds.min.y).toBeCloseTo(2.4);
    expect(bounds.max.z - bounds.min.z).toBeCloseTo(0.18);
    const position = geometry.getAttribute('position'),
      uv = geometry.getAttribute('uv');
    for (let i = 0; i < position.count; i++) {
      expect(uv.getX(i)).toBeCloseTo(position.getX(i) / 1.2 + 0.5);
      expect(uv.getY(i)).toBeCloseTo(position.getY(i) / 2.4 + 0.5);
    }
    expect(geometry.groups.map((g) => g.materialIndex)).toEqual([0, 1]);
    geometry.dispose();
  });
  it('extrudes the polygon instead of filling its bounding rectangle', () => {
    const geometry = cropSlabGeometry(100, 100, [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ]);
    const position = geometry.getAttribute('position');
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i) / 2.4 + 0.5,
        y = 0.5 - position.getY(i) / 2.4;
      expect(x + y).toBeLessThanOrEqual(1.00001);
    }
    geometry.dispose();
  });
  it('rejects missing and invalid outlines', () => {
    expect(() => cropSlabGeometry(100, 100, [])).toThrow('Contorno inválido');
    expect(() =>
      cropSlabGeometry(0, 100, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: NaN, y: 1 },
      ]),
    ).toThrow();
  });
  it('uses a darker visible-pixel average and handles transparent images', () => {
    const image = {
      data: new Uint8ClampedArray([200, 100, 60, 255, 255, 255, 255, 0]),
    } as ImageData;
    expect(cropSideColor(image).getStyle()).toBe('rgb(130,65,39)');
    expect(cropSideColor({ data: new Uint8ClampedArray(4) } as ImageData).getStyle()).toBe(
      'rgb(64,64,64)',
    );
  });
});
