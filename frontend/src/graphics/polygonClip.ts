export interface Point {
  x: number;
  y: number;
}

export function clipPolygon(points: Point[], width: number, height: number): Point[] {
  if (
    width <= 0 ||
    height <= 0 ||
    points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))
  )
    throw new Error('Polígono inválido.');
  let result = [...points];
  for (const [axis, bound, sign] of [
    ['x', 0, 1],
    ['x', width, -1],
    ['y', 0, 1],
    ['y', height, -1],
  ] as const) {
    const input = result;
    result = [];
    if (!input.length) break;
    let previous = input[input.length - 1];
    for (const current of input) {
      const inside = (current[axis] - bound) * sign >= 0;
      const wasInside = (previous[axis] - bound) * sign >= 0;
      if (inside !== wasInside) {
        const t = (bound - previous[axis]) / (current[axis] - previous[axis]);
        result.push({
          x: previous.x + t * (current.x - previous.x),
          y: previous.y + t * (current.y - previous.y),
        });
      }
      if (inside) result.push(current);
      previous = current;
    }
  }
  return result;
}
