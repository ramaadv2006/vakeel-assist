import { useEffect } from 'react';
import Icon from './Icon';

export function PasswordToggle({ shown, onToggle }) {
  return (
    <button
      type="button"
      className="pwd-toggle"
      onClick={onToggle}
      title={shown ? 'Hide password' : 'Show password'}
      aria-label={shown ? 'Hide password' : 'Show password'}
    >
      <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {shown ? (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        ) : (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  );
}

const STRENGTH_LEVELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

// Simple length + character-class score. This is presentational guidance
// only; the real minimum (6 chars) is still enforced by the input.
function scorePassword(pw) {
  if (!pw) return -1;
  if (pw.length < 6) return 0;
  let score = 1;
  if (pw.length >= 10) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 4);
}

export function StrengthMeter({ value }) {
  const score = scorePassword(value);
  if (score < 0) return null;
  return (
    <div className="pwd-strength" data-score={score}>
      <div className="pwd-strength-bars">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < score ? 'is-on' : ''} style={{ '--i': i }} />
        ))}
      </div>
      <span className="pwd-strength-label">{STRENGTH_LEVELS[score]}</span>
    </div>
  );
}

export function SubmitButton({ loading, children }) {
  return (
    <button type="submit" className={`btn-submit${loading ? ' btn-loading' : ''}`} disabled={loading}>
      <span className="btn-submit-label">{children}</span>
      <svg className="btn-submit-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}

const HIGHLIGHTS = [
  { icon: 'calendar', text: 'Never miss a hearing — automatic date reminders' },
  { icon: 'case', text: 'Cause-list diary, ready to print each morning' },
  { icon: 'checklist', text: 'Court-ready drafts with backing sheets' },
];

// Decorative drifting motes. Values are fixed rather than random so the
// composition is stable between renders.
const MOTES = [
  { left: '14%', top: '30%', size: 5, delay: '0s', dur: '13s' },
  { left: '72%', top: '18%', size: 3, delay: '2.4s', dur: '17s' },
  { left: '38%', top: '68%', size: 4, delay: '1.2s', dur: '15s' },
  { left: '86%', top: '58%', size: 2.5, delay: '3.6s', dur: '19s' },
  { left: '58%', top: '44%', size: 3.5, delay: '5s', dur: '21s' },
];

/**
 * Shared two-panel shell for every auth screen (login, signup, forgot,
 * reset). The brand panel is a fixed dark surface in both themes — it is
 * meant to read as the product's cover, so it does not invert; only the
 * form panel follows the theme.
 *
 * Every animation here is transform/opacity only so it stays on the
 * compositor, and the whole set is disabled under prefers-reduced-motion.
 * Kept deliberately free of 3D transforms: inputs nested inside an active
 * preserve-3d context can take focus but drop keystrokes on mobile WebKit.
 */
export default function AuthShell({ children }) {
  useEffect(() => {
    document.body.classList.add('auth-page-bg');
    return () => document.body.classList.remove('auth-page-bg');
  }, []);

  return (
    <div className="auth-split">
      <aside className="auth-brand" aria-hidden="true">
        <div className="auth-aurora">
          <span className="auth-aurora-a" />
          <span className="auth-aurora-b" />
          <span className="auth-aurora-c" />
        </div>
        <div className="auth-grain" />

        <div className="auth-motes">
          {MOTES.map((m, i) => (
            <span
              key={i}
              style={{
                left: m.left,
                top: m.top,
                width: m.size,
                height: m.size,
                animationDelay: m.delay,
                animationDuration: m.dur,
              }}
            />
          ))}
        </div>

        <div className="auth-brand-head">
          <span className="auth-brand-mark">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path className="mark-draw" d="M12 3v17M19 17H5M3 8h18" />
              <path className="mark-fill" d="m12 8-4 7h8l-4-7z" fill="currentColor" fillOpacity="0.12" />
              <path className="mark-draw mark-pans" d="M5 8l-2 6h4l-2-6zm14 0l-2 6h4l-2-6z" />
            </svg>
          </span>
          <span className="auth-brand-word">Advo<em>Buddy</em></span>
        </div>

        <div className="auth-brand-body">
          {/* Each line needs its own overflow-hidden wrapper, otherwise the
              rising text is just visible below its resting position. */}
          <h1 className="auth-brand-title">
            <span className="line"><span>Your case diary,</span></span>
            <span className="line"><span>always in order.</span></span>
          </h1>
          <p className="auth-brand-sub">
            Hearings, clients, drafts and billing for the working advocate — in one place.
          </p>

          <ul className="auth-brand-list">
            {HIGHLIGHTS.map((h, i) => (
              <li key={h.icon} style={{ '--i': i }}>
                <span className="auth-brand-tick"><Icon name={h.icon} /></span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>

        <svg className="auth-brand-motif" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v17M19 17H5M3 8h18" />
          <path d="M5 8l-2 6h4l-2-6zm14 0l-2 6h4l-2-6z" />
        </svg>
      </aside>

      <section className="auth-panel">
        <div className="auth-panel-inner">{children}</div>
      </section>
    </div>
  );
}
