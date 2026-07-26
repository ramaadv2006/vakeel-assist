import { useReveal } from '../hooks/useReveal';
import { useCountUp } from '../hooks/useCountUp';

export default function StatCard({ value, label, color, prefix = '' }) {
  const [ref, inView] = useReveal();
  const animated = useCountUp(value, inView);
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="num" ref={ref}>{prefix}{animated.toLocaleString('en-IN')}</div>
      <div className="label">{label}</div>
    </div>
  );
}
