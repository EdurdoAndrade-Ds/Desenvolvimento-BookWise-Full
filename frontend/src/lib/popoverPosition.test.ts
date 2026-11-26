import { describe, expect, it } from 'vitest';
import { popoverPosition } from './popoverPosition';

describe('popoverPosition', () => {
  const popup = { width: 256, height: 180 };
  const viewport = { width: 390, height: 844 };

  it('aligns below the trigger when there is room', () => {
    expect(popoverPosition({ right: 300, top: 20, bottom: 64 }, popup, viewport)).toEqual({
      left: 44,
      top: 72,
    });
  });

  it.each([52, 8, -40])('keeps left-edge triggers onscreen (%s)', (right) => {
    expect(popoverPosition({ right, top: 20, bottom: 64 }, popup, viewport).left).toBe(16);
  });

  it('keeps right-edge triggers onscreen', () => {
    expect(popoverPosition({ right: 390, top: 20, bottom: 64 }, popup, viewport).left).toBe(118);
  });

  it('opens above a low trigger', () => {
    expect(popoverPosition({ right: 300, top: 740, bottom: 784 }, popup, viewport).top).toBe(552);
  });

  it('clamps tall content when neither side fits', () => {
    expect(
      popoverPosition({ right: 300, top: 400, bottom: 444 }, { width: 256, height: 780 }, viewport)
        .top,
    ).toBe(48);
  });

  it('accepts empty popup dimensions', () => {
    expect(
      popoverPosition({ right: 300, top: 20, bottom: 64 }, { width: 0, height: 0 }, viewport),
    ).toEqual({ left: 300, top: 72 });
  });
});
