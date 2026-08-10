import { describe, it, expect, beforeEach } from 'vitest';
import { positionTooltip } from '../../../src/utils/tooltip.js';

function makeRect(left: number, top: number, right: number, bottom: number): DOMRect {
  return { left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

const TIP_W = 100, TIP_H = 80, GAP = 8;

beforeEach(() => {
  globalThis.innerWidth  = 800;
  globalThis.innerHeight = 600;
});

describe('positionTooltip', () => {
  it('places tooltip below rect when there is enough space', () => {
    const rect = makeRect(300, 100, 500, 200); // 400px below bottom
    const { y } = positionTooltip(rect, TIP_W, TIP_H, GAP);
    expect(y).toBe(200 + GAP);
  });

  it('flips above rect when space below is insufficient', () => {
    const rect = makeRect(300, 500, 500, 570); // only 30px below bottom, need 88
    const { y } = positionTooltip(rect, TIP_W, TIP_H, GAP);
    expect(y).toBe(500 - TIP_H - GAP);
  });

  it('centers tooltip horizontally on rect', () => {
    const rect = makeRect(300, 100, 500, 200); // center=400, tip half=50 → x=350
    const { x } = positionTooltip(rect, TIP_W, TIP_H, GAP);
    expect(x).toBe(350);
  });

  it('clamps x to left edge (min 8)', () => {
    const rect = makeRect(0, 100, 10, 200); // would place x at -45, clamp to 8
    const { x } = positionTooltip(rect, TIP_W, TIP_H, GAP);
    expect(x).toBe(8);
  });

  it('clamps x to right edge (max innerWidth - tipW - 8)', () => {
    const rect = makeRect(790, 100, 800, 200); // would place x at 745, clamp to 692
    const { x } = positionTooltip(rect, TIP_W, TIP_H, GAP);
    expect(x).toBe(800 - TIP_W - 8);
  });
});
