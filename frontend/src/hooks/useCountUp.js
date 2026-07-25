import { useEffect, useRef, useState } from 'react';

/**
 * Tweens a number from 0 up to `target` once `active` first becomes true,
 * mirroring the stat-card count-up animation in the original base.html.
 */
export function useCountUp(target, active, duration = 800) {
  const [value, setValue] = useState(active ? target : 0);
  const played = useRef(false);

  useEffect(() => {
    if (!active || played.current) return;
    played.current = true;

    if (!Number.isFinite(target)) {
      setValue(target);
      return;
    }

    const start = performance.now();
    let frame;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);

  return value;
}
