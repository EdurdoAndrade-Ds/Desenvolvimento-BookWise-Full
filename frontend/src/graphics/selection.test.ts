import { describe, expect, it } from 'vitest';
import { rubberBandRect, simplifyContour } from './selection';

describe('rubber-band rectangles', () => {
  it.each([
    [10, 20, 80, 90],
    [80, 20, 10, 90],
    [10, 90, 80, 20],
    [80, 90, 10, 20],
  ])('normalizes a drag from (%s,%s) to (%s,%s)', (x, y, ex, ey) => {
    expect(rubberBandRect({ x, y }, { x: ex, y: ey }, 100, 100)).toEqual({
      x: 10,
      y: 20,
      width: 70,
      height: 70,
    });
  });
  it('clamps both ends and supports zero-size selections without mutation', () => {
    const start = { x: -20, y: 120 };
    expect(rubberBandRect(start, { x: 140, y: -10 }, 100, 100)).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    expect(start).toEqual({ x: -20, y: 120 });
    expect(rubberBandRect({ x: 4, y: 4 }, { x: 4, y: 4 }, 100, 100)).toEqual({
      x: 4,
      y: 4,
      width: 0,
      height: 0,
    });
  });
  it('rejects invalid coordinates and bounds', () => {
    expect(() => rubberBandRect({ x: NaN, y: 0 }, { x: 0, y: 0 }, 100, 100)).toThrow();
    expect(() => rubberBandRect({ x: 0, y: 0 }, { x: 0, y: 0 }, 0, 100)).toThrow();
  });
});

describe('Ramer–Douglas–Peucker contour simplification', () => {
  it('removes sampled noise but preserves endpoints and corners', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 5, y: 0.2 },
      { x: 10, y: 0 },
      { x: 10.2, y: 5 },
      { x: 10, y: 10 },
    ];
    expect(simplifyContour(points, 0.5)).toEqual([points[0], points[2], points[4]]);
    expect(points).toHaveLength(5);
  });
  it('preserves a closed contour and handles identical points', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 0, y: 0 },
    ];
    expect(simplifyContour(points, 1)).toEqual(points);
    expect(simplifyContour(Array(5).fill({ x: 2, y: 2 }), 1)).toEqual([
      { x: 2, y: 2 },
      { x: 2, y: 2 },
    ]);
  });
  it('handles empty, single and two-point contours', () => {
    expect(simplifyContour([], 1)).toEqual([]);
    expect(simplifyContour([{ x: 1, y: 2 }], 1)).toEqual([{ x: 1, y: 2 }]);
    expect(
      simplifyContour(
        [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ],
        1,
      ),
    ).toHaveLength(2);
  });
  it('rejects invalid input', () => {
    expect(() => simplifyContour([], -1)).toThrow();
    expect(() => simplifyContour([{ x: Infinity, y: 0 }], 1)).toThrow();
  });
});
