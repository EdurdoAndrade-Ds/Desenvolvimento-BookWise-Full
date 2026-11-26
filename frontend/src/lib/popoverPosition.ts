export function popoverPosition(
  anchor: { right: number; top: number; bottom: number },
  popup: { width: number; height: number },
  viewport: { width: number; height: number },
) {
  const inset = 16;
  const left = Math.max(
    inset,
    Math.min(anchor.right - popup.width, viewport.width - popup.width - inset),
  );
  const below = anchor.bottom + 8;
  const above = anchor.top - popup.height - 8;
  const preferred =
    below + popup.height > viewport.height - inset && above >= inset ? above : below;
  const top = Math.max(inset, Math.min(preferred, viewport.height - popup.height - inset));
  return { left, top };
}
