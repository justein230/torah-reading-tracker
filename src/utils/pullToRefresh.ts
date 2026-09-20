/** Downward drag distance (px) needed to trigger a refresh on release. */
export const PULL_THRESHOLD = 70;
/** Cap on how far the indicator travels, however far the finger drags. */
export const MAX_PULL = 100;
/** Rubber-band factor applied to the raw drag distance below MAX_PULL. */
export const PULL_RESISTANCE = 0.5;
/** Indicator height (px) held while a refresh is in flight, or showing its result. */
export const SETTLE_HEIGHT = 48;
/** How long the success/error result stays visible before the indicator collapses. */
export const RESULT_DISPLAY_MS = 900;

export type PullPhase = 'idle' | 'pulling' | 'refreshing' | 'success' | 'error';

/**
 * Converts a raw downward touch-drag distance into a resisted, capped pull
 * distance for the refresh indicator. Upward drags (rawDelta <= 0) produce no
 * pull.
 */
export function computePullDistance(rawDelta: number): number {
  if (rawDelta <= 0) return 0;
  return Math.min(rawDelta * PULL_RESISTANCE, MAX_PULL);
}

export function shouldTriggerRefresh(pullDistance: number): boolean {
  return pullDistance >= PULL_THRESHOLD;
}
