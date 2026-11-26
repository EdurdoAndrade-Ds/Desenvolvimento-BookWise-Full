import type { Rect } from './crop';
import type { Point } from './polygonClip';

export function rubberBandRect(start: Point, end: Point, width: number, height: number): Rect {
  if (
    ![start.x, start.y, end.x, end.y, width, height].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0
  )
    throw new Error('Limites de seleção inválidos.');
  const clampX = (x: number) => Math.max(0, Math.min(width, x));
  const clampY = (y: number) => Math.max(0, Math.min(height, y));
  const x = clampX(start.x),
    y = clampY(start.y);
  const right = clampX(end.x),
    bottom = clampY(end.y);
  return {
    x: Math.min(x, right),
    y: Math.min(y, bottom),
    width: Math.abs(right - x),
    height: Math.abs(bottom - y),
  };
}

function segmentDistanceSquared(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
  return (p.x - a.x - t * dx) ** 2 + (p.y - a.y - t * dy) ** 2;
}

export function simplifyContour(points: Point[], tolerance: number): Point[] {
  if (
    !Number.isFinite(tolerance) ||
    tolerance < 0 ||
    points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))
  )
    throw new Error('Contorno inválido.');
  if (points.length < 3) return points.map((p) => ({ ...p }));
  const keep = new Set([0, points.length - 1]);
  const pending = [[0, points.length - 1]];
  while (pending.length) {
    const [first, last] = pending.pop()!;
    let maximum = tolerance * tolerance,
      index = -1;
    for (let i = first + 1; i < last; i++) {
      const distance = segmentDistanceSquared(points[i], points[first], points[last]);
      if (distance > maximum) {
        maximum = distance;
        index = i;
      }
    }
    if (index >= 0) {
      keep.add(index);
      pending.push([first, index], [index, last]);
    }
  }
  return [...keep].sort((a, b) => a - b).map((i) => ({ ...points[i] }));
}
