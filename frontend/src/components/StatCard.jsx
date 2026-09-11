import { motion } from 'framer-motion';
import { useReveal } from '../hooks/useReveal';
import { useCountUp } from '../hooks/useCountUp';
import Icon from './Icon';

export default function StatCard({
  value,
  number,
  count,
  label,
  color,
  category,
  icon,
  prefix = '',
  hint,
  onClick,
  isActive = false,
}) {
  const rawVal = value ?? number ?? count ?? 0;
  const actualValue = typeof rawVal === 'number' ? rawVal : (Number(rawVal) || 0);
  const [ref, inView] = useReveal();
  const animated = useCountUp(actualValue, inView);
  const displayVal = typeof animated === 'number' ? animated.toLocaleString('en-IN') : (animated || 0);

  let resolvedColor = color;
  if (!resolvedColor || resolvedColor === 'var(--accent)') {
    if (category === 'danger' || category === 'overdue') resolvedColor = 'var(--danger)';
    else if (category === 'warning' || category === 'today') resolvedColor = 'var(--warning)';
    else if (category === 'success' || category === 'active') resolvedColor = 'var(--success)';
    else if (category === 'closed' || category === 'disposed') resolvedColor = 'var(--gray-500)';
    else if (category === 'info' || category === 'this_week') resolvedColor = 'var(--info)';
    else if (category === 'upcoming') resolvedColor = 'var(--accent)';
  }
  if (!resolvedColor) resolvedColor = 'var(--accent)';

  let renderedIcon = null;
  if (typeof icon === 'string') {
    renderedIcon = <Icon name={icon} style={{ width: 18, height: 18 }} />;
  } else if (icon) {
    renderedIcon = icon;
  }

  return (
    <motion.div
      className={`stat-card${isActive ? ' active-stat' : ''}${onClick ? ' clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        borderLeftColor: resolvedColor,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: isActive
          ? `0 12px 28px -6px color-mix(in srgb, ${resolvedColor} 25%, transparent), 0 0 0 1px ${resolvedColor}`
          : undefined,
      }}
      whileHover={{
        y: -4,
        scale: 1.018,
        boxShadow: `0 16px 32px -8px color-mix(in srgb, ${resolvedColor} 22%, rgba(0,0,0,0.12)), 0 2px 6px -1px rgba(0,0,0,0.06)`,
      }}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 440, damping: 26 }}
    >
      <div className="stat-card-top">
        <span className="label">{label}</span>
        {renderedIcon && (
          <motion.div
            className="stat-card-icon-badge"
            whileHover={{ rotate: 8, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            style={{
              backgroundColor: `color-mix(in srgb, ${resolvedColor} 14%, var(--bg-card))`,
              color: resolvedColor,
              border: `1px solid color-mix(in srgb, ${resolvedColor} 28%, transparent)`,
            }}
          >
            {renderedIcon}
          </motion.div>
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
          style={{ background: resolvedColor, boxShadow: `0 0 12px ${resolvedColor}` }}
        />
      )}
    </motion.div>
  );
}

