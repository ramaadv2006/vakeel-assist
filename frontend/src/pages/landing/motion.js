/* ============================================================
   LANDING MOTION — the scroll/pointer effects the page uses.

   Every hook here writes to a CSS custom property rather than to
   React state. Scroll and pointermove fire far faster than React
   can usefully re-render, and a landing page that re-renders its
   whole tree on every pixel of scroll is exactly the page that
   drops frames on the mid-range Android an advocate is holding in
   a corridor. State is reserved for things that genuinely change
   the DOM: which tab is open, which FAQ is expanded.

   All of them no-op under prefers-reduced-motion.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';

export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Coalesces a high-frequency event into at most one write per frame.
 * Returns a handler that is safe to attach directly to scroll/pointermove.
 */
function rafThrottle(fn) {
  let frame = null;
  const wrapped = (...args) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      fn(...args);
    });
  };
  wrapped.cancel = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  };
  return wrapped;
}

/**
 * Document scroll progress, 0 → 1, written to `--progress` on the
 * returned ref. Feeds the hairline under the nav and the ring around
 * the back-to-top button, both of which are pure CSS off that value.
 */
export function useScrollProgress() {
  const ref = useRef(null);
  const [past, setPast] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = rafThrottle(() => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      el.style.setProperty('--progress', max > 0 ? String(y / max) : '0');
      // One boolean, flipped at a threshold — cheap enough to keep in state,
      // and React bails out of the re-render while it is unchanged.
      setPast(y > 600);
    });

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      onScroll.cancel();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return [ref, past];
}

/**
 * Pointer spotlight for a *grid of cards*: one listener on the container
 * writes `--mx` / `--my` onto whichever card is under the cursor, and the
 * card's CSS paints a radial highlight there.
 *
 * Attaching per card would mean one listener per card and a layout read on
 * every move; `closest()` from a single container listener costs one
 * getBoundingClientRect on the card actually being pointed at.
 */
export function useSpotlight(childSelector) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    // Coarse pointers have no hover, so the highlight would only ever
    // appear under a finger that is already covering it.
    if (!window.matchMedia('(hover: hover)').matches) return;

    let current = null;

    const onMove = rafThrottle((x, y) => {
      const target = document.elementFromPoint(x, y)?.closest(childSelector);
      if (target !== current) {
        current?.style.removeProperty('--spot');
        current = target;
      }
      if (!target) return;
      const r = target.getBoundingClientRect();
      target.style.setProperty('--mx', `${x - r.left}px`);
      target.style.setProperty('--my', `${y - r.top}px`);
      target.style.setProperty('--spot', '1');
    });

    const handleMove = (e) => onMove(e.clientX, e.clientY);
    const handleLeave = () => {
      onMove.cancel();
      current?.style.removeProperty('--spot');
      current = null;
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', handleLeave);
    return () => {
      onMove.cancel();
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
      handleLeave();
    };
  }, [childSelector]);

  return ref;
}

/**
 * Gentle 3D tilt towards the cursor, written as `--rx` / `--ry` degrees.
 * `max` is deliberately small: the hero art is a product mock, and a mock
 * that swings like a trading card stops reading as a screenshot.
 */
export function useTilt(max = 6) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    const onMove = rafThrottle((x, y) => {
      const r = el.getBoundingClientRect();
      const px = (x - r.left) / r.width - 0.5;
      const py = (y - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', `${px * max * 2}deg`);
      el.style.setProperty('--rx', `${-py * max * 2}deg`);
    });

    const handleMove = (e) => onMove(e.clientX, e.clientY);
    const reset = () => {
      onMove.cancel();
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', reset);
    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', reset);
      reset();
    };
  }, [max]);

  return ref;
}

/**
 * Parallax drift, in px, written to `--drift`. `speed` is the fraction of
 * scroll distance the element lags behind by; the travel is capped so the
 * art cannot drift out of its own column on a long page.
 */
export function useParallax(speed = 0.06, cap = 600) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const onScroll = rafThrottle(() => {
      el.style.setProperty('--drift', `${Math.min(window.scrollY, cap) * speed}px`);
    });

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      onScroll.cancel();
      window.removeEventListener('scroll', onScroll);
    };
  }, [speed, cap]);

  return ref;
}

/**
 * One-shot reveal on entry. Unlike the app-wide useReveal, this one takes
 * a threshold, because a full-width section and a small card want to trip
 * at different points, and it never leaves an element hidden: if the
 * observer is unavailable the element is shown immediately.
 */
export function useInView(threshold = 0.12, margin = '0px 0px -60px 0px') {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries, o) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        setInView(true);
        o.unobserve(e.target);
      }),
      { threshold, rootMargin: margin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, margin]);

  return [ref, inView];
}

/**
 * Steps an index on an interval, pausing while the tab is hidden so a
 * backgrounded page is not burning frames, and stopping entirely once the
 * visitor takes manual control of the thing being cycled.
 */
export function useCycle(length, ms, enabled = true) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled || length < 2 || prefersReducedMotion()) return;

    let timer = null;
    const start = () => {
      timer = setInterval(() => setIndex((i) => (i + 1) % length), ms);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [length, ms, enabled]);

  const set = useCallback((i) => setIndex(i), []);
  return [index, set];
}
