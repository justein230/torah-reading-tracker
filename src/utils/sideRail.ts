/* Side rail: on a phone whose screen has a wide left/right safe-area inset (the iPhone Duo's front
   screen keeps its camera, clock and signal in a column down the right edge), the primary nav moves out of
   the bottom bar and into that column, below the status cluster. Detected from the inset itself, so it
   stays off on every device without one. Sets <html data-side-rail> and --rail-w; layout lives in global.css. */
const MIN_RAIL_PX = 48;

function measureInset(side: 'left' | 'right'): number {
  const probe = document.createElement('div');
  probe.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;padding-${side}:env(safe-area-inset-${side},0px)`;
  document.body.appendChild(probe);
  const px = Number.parseFloat(getComputedStyle(probe).getPropertyValue(`padding-${side}`)) || 0;
  probe.remove();
  return px;
}

export function updateSideRail(): void {
  const root = document.documentElement;
  const right = measureInset('right');
  const on = right >= MIN_RAIL_PX && globalThis.innerWidth < 768;
  if (on) {
    root.dataset['sideRail'] = 'true';
    root.style.setProperty('--rail-w', `${right}px`);
  } else {
    delete root.dataset['sideRail'];
    root.style.removeProperty('--rail-w');
  }
}

export function initSideRail(): void {
  updateSideRail();
  // WKWebView can report the safe-area insets as 0 until after the first layout, so measure again
  // once the page has loaded and a few times shortly after.
  globalThis.addEventListener('load', updateSideRail);
  for (const ms of [50, 250, 750, 2000]) setTimeout(updateSideRail, ms);
  globalThis.addEventListener('resize', updateSideRail);
  globalThis.addEventListener('orientationchange', updateSideRail);
}
