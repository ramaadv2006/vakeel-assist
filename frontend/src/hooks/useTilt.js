import { useRef } from 'react';

/**
 * Modern 3D parallax tilt: the element leans toward the cursor as it moves
 * across it, then springs back to neutral on mouse leave. Actual easing is
 * handled by the `.tilt-card` CSS transition - this hook only ever writes
 * the `transform` value.
 */
export function useTilt({ max = 8, scale = 1.015 } = {}) {
  const ref = useRef(null);

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 2 * max;
    const rotateX = (0.5 - py) * 2 * max;
    el.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  return { ref, onMouseMove, onMouseLeave };
}
