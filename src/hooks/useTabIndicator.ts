import { useLayoutEffect, useRef } from 'react';

/**
 * Animates a sliding underline beneath whichever element with
 * `data-value={activeTab}` sits inside the returned tabListRef. Attach
 * indicatorRef to an absolutely-positioned child of that container.
 */
export function useTabIndicator(activeTab: string) {
  const tabListRef      = useRef<HTMLDivElement>(null);
  const indicatorRef    = useRef<HTMLDivElement>(null);
  const firstPosition   = useRef(true);
  const indicatorHidden = useRef(true);

  useLayoutEffect(() => {
    // Uses left/width (not transform) so the indicator pixel-snaps identically
    // to the tab it's aligned to. `measure` owns ind.style.transition
    // exclusively so animate-vs-snap decisions can't race with each other.
    const flush = (ind: HTMLElement) => { ind.getBoundingClientRect(); };

    const measure = (animate: boolean) => {
      const container = tabListRef.current;
      const ind       = indicatorRef.current;
      if (!container || !ind) return;
      const el = container.querySelector<HTMLElement>(`[data-value="${activeTab}"]`);
      if (!el) {
        // No tab matches (e.g. the Manage page, reached via the sidebar) — slide
        // shut toward the current left edge instead of just disappearing.
        ind.style.width = '0px';
        indicatorHidden.current = true;
        return;
      }

      const elRect = el.getBoundingClientRect();
      const offset = elRect.left - container.getBoundingClientRect().left;
      ind.style.transform = ''; // clear any leftover transform from a stale build
      const snap = !animate || indicatorHidden.current;
      indicatorHidden.current = false;

      if (snap) {
        // No meaningful position to slide from once hidden: jump to the
        // destination at zero width, then grow it so it reads as sliding open.
        // Each reflow commits the previous style before the next one changes,
        // otherwise the browser batches them and the transition never applies.
        ind.style.transition = 'none';
        ind.style.left = `${offset}px`;
        ind.style.width = '0px';
        flush(ind);
        ind.style.transition = 'left 0.2s ease, width 0.2s ease';
        flush(ind);
      }
      ind.style.left  = `${offset}px`;
      ind.style.width = `${elRect.width}px`;
    };

    if (firstPosition.current) {
      firstPosition.current = false;
      void document.fonts.ready.then(() => measure(false));
    } else {
      measure(true);
      tabListRef.current?.querySelector(`[data-value="${activeTab}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    // Re-sync without animating if the active tab's own size changes later
    // (late web-font swap, window resize, zoom). ResizeObserver always fires
    // once immediately on observe(), so that first call is ignored.
    const activeEl = tabListRef.current?.querySelector<HTMLElement>(`[data-value="${activeTab}"]`);
    if (!activeEl) return;
    let skippedInitial = false;
    const observer = new ResizeObserver(() => {
      if (!skippedInitial) { skippedInitial = true; return; }
      measure(false);
    });
    observer.observe(activeEl);
    return () => observer.disconnect();
  }, [activeTab]);

  return { tabListRef, indicatorRef };
}
