export const BOOK_LOD_DISTANCE = 18;
export const REVEAL_SECONDS = 0.8;

export function isGraphicsDebug(search: string): boolean {
  return new URLSearchParams(search).get('debug') === '1';
}

export function revealProgress(seconds: number, reducedMotion = false): number {
  if (reducedMotion) return 1;
  const t = Math.min(1, Math.max(0, seconds / REVEAL_SECONDS));
  return t * t * (3 - 2 * t);
}

export function cutHeight(fraction: number, halfHeight: number): number {
  return halfHeight * (1 - 2 * Math.min(1, Math.max(0, fraction)));
}

export function lodDistance(enabled: boolean, emphasized: boolean): number {
  return enabled && !emphasized ? BOOK_LOD_DISTANCE : Infinity;
}
