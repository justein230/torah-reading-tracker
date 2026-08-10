export function positionTooltip(rect: DOMRect, tipW: number, tipH: number, gap: number): { x: number; y: number } {
  let x = rect.left + rect.width / 2 - tipW / 2;
  const y = (globalThis.innerHeight - rect.bottom) >= tipH + gap
    ? rect.bottom + gap
    : rect.top - tipH - gap;
  return { x: Math.max(8, Math.min(x, globalThis.innerWidth - tipW - 8)), y };
}
