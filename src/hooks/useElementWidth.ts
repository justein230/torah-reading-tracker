import { useLayoutEffect, useRef, useState } from 'react';

/**
 * The element's current width in px, kept up to date as it resizes. Unlike Mantine's useElementSize
 * (which measures in an effect, after the first paint), the initial measurement happens in a layout
 * effect, so a layout driven by this width is already correct on the first painted frame instead of
 * flashing a wrong one. Width is 0 only until the element mounts.
 */
export function useElementWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
