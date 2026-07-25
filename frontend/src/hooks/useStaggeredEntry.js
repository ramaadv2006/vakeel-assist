import { useEffect } from 'react';

/**
 * Mirrors the auth-page waterfall load animation: every `.staggered-entry`
 * element on the page gets an incrementally later animation-delay.
 */
export function useStaggeredEntry(deps = []) {
  useEffect(() => {
    document.querySelectorAll('.staggered-entry').forEach((el, index) => {
      el.style.animationDelay = `${(index + 1) * 0.08}s`;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
