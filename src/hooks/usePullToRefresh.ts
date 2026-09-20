import { useEffect, useRef, useState, type RefObject } from 'react';
import { Capacitor } from '@capacitor/core';
import { computePullDistance, shouldTriggerRefresh, SETTLE_HEIGHT, RESULT_DISPLAY_MS, type PullPhase } from '../utils/pullToRefresh.js';
import { logEvent } from '../utils/logger-client/index.js';

interface PullToRefreshState {
  pullDistance: number;
  phase: PullPhase;
}

/**
 * Wires a pull-to-refresh gesture onto a manually-scrolled container. Needed
 * because global.css pins html/body (position: fixed; overflow: hidden) so
 * iOS Safari's dynamic toolbar can't desync the fixed footer — see the
 * comment there — which as a side effect disables the browser's own
 * pull-to-refresh, since that's tied to document-level overscroll rather
 * than a nested scrolling element.
 *
 * Disabled on Capacitor's native platforms: the app's data is entirely local
 * (no server to sync against), so there's nothing a refresh would fetch.
 */
export function usePullToRefresh(
  containerRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<void>,
): PullToRefreshState {
  const [pullDistance, setPullDistance] = useState(0);
  const [phase, setPhase] = useState<PullPhase>('idle');
  const pullDistanceRef = useRef(0);
  const startY = useRef<number | null>(null);
  const phaseRef = useRef<PullPhase>('idle');
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || Capacitor.isNativePlatform()) return;

    const updatePullDistance = (d: number) => {
      pullDistanceRef.current = d;
      setPullDistance(d);
    };
    const updatePhase = (p: PullPhase) => {
      phaseRef.current = p;
      setPhase(p);
    };

    function onTouchStart(e: TouchEvent) {
      if (phaseRef.current !== 'idle' || el!.scrollTop > 0 || !e.touches[0]) { startY.current = null; return; }
      startY.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current === null || !e.touches[0]) return;
      const delta = e.touches[0].clientY - startY.current;
      const distance = computePullDistance(delta);
      if (distance === 0 && pullDistanceRef.current === 0) return;
      // Stop the container's own scroll/bounce from fighting the gesture once a pull is underway.
      e.preventDefault();
      if (phaseRef.current !== 'pulling') updatePhase('pulling');
      updatePullDistance(distance);
    }

    async function onTouchEnd() {
      if (startY.current === null) return;
      startY.current = null;
      if (!shouldTriggerRefresh(pullDistanceRef.current)) {
        updatePhase('idle');
        updatePullDistance(0);
        return;
      }
      updatePhase('refreshing');
      updatePullDistance(SETTLE_HEIGHT);
      try {
        await onRefresh();
        updatePhase('success');
      } catch (err) {
        logEvent('error', 'client', 'Pull-to-refresh failed', { reason: String(err) });
        updatePhase('error');
      }
      resultTimer.current = setTimeout(() => {
        updatePhase('idle');
        updatePullDistance(0);
      }, RESULT_DISPLAY_MS);
    }

    function onTouchCancel() {
      startY.current = null;
      if (phaseRef.current === 'pulling') {
        updatePhase('idle');
        updatePullDistance(0);
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchCancel);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
      if (resultTimer.current) clearTimeout(resultTimer.current);
    };
  }, [containerRef, onRefresh]);

  return { pullDistance, phase };
}
