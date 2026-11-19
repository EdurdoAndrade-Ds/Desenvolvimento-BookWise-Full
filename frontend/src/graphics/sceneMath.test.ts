import { describe, expect, it } from 'vitest';
import {
  BOOK_LOD_DISTANCE,
  cutHeight,
  isGraphicsDebug,
  lodDistance,
  revealProgress,
} from './sceneMath';

describe('graphics controls', () => {
  it('enables debug only for the explicit query parameter', () => {
    expect(isGraphicsDebug('?debug=1')).toBe(true);
    expect(isGraphicsDebug('?q=books&debug=1')).toBe(true);
    for (const query of ['', '?debug=0', '?debug=true', '?nodebug=1', '?debug=']) {
      expect(isGraphicsDebug(query)).toBe(false);
    }
  });

  it('reveals from bottom to top in 0.8 seconds and clamps elapsed time', () => {
    expect(revealProgress(-1)).toBe(0);
    expect(revealProgress(0)).toBe(0);
    expect(revealProgress(0.4)).toBeCloseTo(0.5);
    expect(revealProgress(0.8)).toBe(1);
    expect(revealProgress(20)).toBe(1);
  });

  it('skips the reveal for reduced motion', () => {
    expect(revealProgress(0, true)).toBe(1);
  });

  it('cuts from whole book to empty with a centered half cut', () => {
    expect(cutHeight(0, 2)).toBe(2);
    expect(cutHeight(0.5, 2)).toBe(0);
    expect(cutHeight(1, 2)).toBe(-2);
    expect(cutHeight(-5, 2)).toBe(2);
    expect(cutHeight(5, 2)).toBe(-2);
  });

  it('keeps detailed books near, hovered or with LOD disabled', () => {
    expect(lodDistance(true, false)).toBe(BOOK_LOD_DISTANCE);
    expect(lodDistance(true, true)).toBe(Infinity);
    expect(lodDistance(false, false)).toBe(Infinity);
  });
});
