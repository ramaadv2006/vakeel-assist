import { useRef } from 'react';

/**
 * Tracks the mouse position over an element and exposes it as CSS custom
 * properties (--mouse-x / --mouse-y), driving the radial cursor-glow border
 * used on the auth card forms.
 */
export function useCursorGlow() {
  const ref = useRef(null);

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return { ref, onMouseMove };
}
