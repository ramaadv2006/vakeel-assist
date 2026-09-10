import { motion } from 'framer-motion';
import { useReveal } from '../hooks/useReveal';
import { useCountUp } from '../hooks/useCountUp';

export default function StatCard({
  value,
  number,
  label,
  color = 'var(--accent)',
  icon: IconComponent,
  prefix = '',
  hint,
  onClick,
  isActive = false,
}) {
  const actualValue = typeof value === 'number' ? value : (typeof number === 'number' ? number : 0);
  const [ref, inView] = useReveal();
  const animated = useCountUp(actualValue, inView);
  const displayVal = typeof animated === 'number' ? animated.toLocaleString('en-IN') : (animated || 0);

  return (
    <motion.div
      className={`stat-card${isActive ? ' active-stat' : ''}${onClick ? ' clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        borderLeftColor: color,
        cursor: onClick ? 'pointer' : 'default',
      }}
      whileHover={{ y: -3.5, scale: 1.015, boxShadow: 'var(--shadow-md)' }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <div className="stat-card-top">
        <span className="label">{label}</span>
        {IconComponent && (
          <div
            className="stat-card-icon-badge"
            style={{
              backgroundColor: `color-mix(in srgb, ${color} 14%, var(--bg-card))`,
              color: color,
            }}
          >
            {IconComponent}
          </div>
        )}
      </div>

      <div className="num" ref={ref}>
        {prefix}{displayVal}
      </div>

      {hint && <div className="stat-card-hint">{hint}</div>}

      {isActive && (
        <motion.div
          layoutId="statActiveIndicator"
          className="stat-active-indicator"
          style={{ background: color }}
        />
      )}
    </motion.div>
  );
}

