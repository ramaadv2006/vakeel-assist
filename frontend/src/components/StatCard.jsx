import { useReveal } from '../hooks/useReveal';
import { useCountUp } from '../hooks/useCountUp';

export default function StatCard({ value, number, label, color, prefix = '', hint }) {
  const actualValue = typeof value === 'number' ? value : (typeof number === 'number' ? number : 0);
  const [ref, inView] = useReveal();
  const animated = useCountUp(actualValue, inView);
  const displayVal = typeof animated === 'number' ? animated.toLocaleString('en-IN') : (animated || 0);

  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="num" ref={ref}>{prefix}{displayVal}</div>
      <div className="label">{label}</div>
      {hint && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
