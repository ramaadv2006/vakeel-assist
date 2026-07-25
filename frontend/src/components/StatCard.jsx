import { useEffect, useRef, useState } from 'react';

function useCountUpInView(target, duration = 800) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const played = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setValue(target);
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || played.current) return;
          played.current = true;
          obs.unobserve(entry.target);
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
            else setValue(target);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return [ref, value];
}

export default function StatCard({ value, label, color, prefix = '' }) {
  const [ref, animated] = useCountUpInView(value);
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="num" ref={ref}>{prefix}{animated.toLocaleString('en-IN')}</div>
      <div className="label">{label}</div>
    </div>
  );
}
