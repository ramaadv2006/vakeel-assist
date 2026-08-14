import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import FlashMessages from './FlashMessages';

export function PasswordToggle({ shown, onToggle }) {
  return (
    <button
      type="button"
      className="auth-pwd-toggle"
      onClick={onToggle}
      title={shown ? 'Hide password' : 'Show password'}
      aria-label={shown ? 'Hide password' : 'Show password'}
    >
      {shown ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

const STRENGTH_LEVELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

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
    <div className="auth-strength-meter" data-score={score}>
      <div className="auth-strength-bars">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < score ? 'is-active' : ''} />
        ))}
      </div>
      <span className="auth-strength-label">{STRENGTH_LEVELS[score]}</span>
    </div>
  );
}

export function SubmitButton({ loading, children }) {
  return (
    <button type="submit" className={`auth-btn-primary${loading ? ' is-loading' : ''}`} disabled={loading}>
      <span className="auth-btn-text">{children}</span>
      <span className="auth-btn-arrow-wrap">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}

const FEATURES = [
  {
    id: 'case-mgmt',
    title: 'Case Management',
    desc: 'Organize & track all your cases',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="3" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <path d="M12 12v3" />
      </svg>
    ),
  },
  {
    id: 'hearing-reminders',
    title: 'Hearing Reminders',
    desc: 'Never miss an important date',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <circle cx="8" cy="15" r="1" fill="currentColor" />
        <circle cx="12" cy="15" r="1" fill="currentColor" />
        <circle cx="16" cy="15" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'smart-notifications',
    title: 'Smart Notifications',
    desc: 'Timely alerts for what matters',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    id: 'secure-private',
    title: 'Secure & Private',
    desc: 'Your data is always protected',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="12" cy="11" r="1.5" fill="currentColor" />
        <path d="M12 12.5v3" />
      </svg>
    ),
  },
];

export default function AuthShell({ children }) {
  useEffect(() => {
    document.body.classList.add('auth-fullscreen-active');
    return () => {
      document.body.classList.remove('auth-fullscreen-active');
    };
  }, []);

  return (
    <div className="auth-fullscreen-root">
      {/* Background artwork layer */}
      <div className="auth-bg-layer" aria-hidden="true">
        <img
          src="/lady_justice.png"
          alt=""
          className="auth-bg-img"
          decoding="async"
        />
        <div className="auth-bg-vignette" />
        <div className="auth-bg-glow" />
      </div>

      {/* Main Full-Screen Layout Wrapper */}
      <div className="auth-screen-layout">
        {/* Left Hero & Feature Presentation */}
        <section className="auth-left-hero">
          {/* Top Logo & Tagline */}
          <Link to="/" className="auth-brand-badge" aria-label="AdvoBuddy Home">
            <img src="/logo.jpeg" alt="AdvoBuddy Logo" className="auth-app-logo" />
            <div className="auth-brand-text-block">
              <span className="auth-brand-name">Advo<em>Buddy</em></span>
              <span className="auth-brand-tagline">Legal Practice Management</span>
            </div>
          </Link>

          {/* Central Statement */}
          <div className="auth-hero-statement">
            <h1 className="auth-hero-heading">
              <span className="auth-hero-white">Justice is</span>
              <span className="auth-hero-gold">in the details.</span>
            </h1>

            <div className="auth-hero-separator" aria-hidden="true">
              <span className="auth-sep-line" />
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 4v14M7 8h10M7 8l-2 4h4L7 8zm10 0l-2 4h4l-2-4z" />
              </svg>
              <span className="auth-sep-line" />
            </div>

            <p className="auth-hero-subtext">
              AdvoBuddy helps you manage cases, hearings, and reminders — all in one place.
            </p>
          </div>

          {/* 4 Feature Badges (Pills) */}
          <div className="auth-features-list">
            {FEATURES.map((item, idx) => (
              <div key={item.id} className="auth-feature-pill" style={{ '--pill-idx': idx }}>
                <div className="auth-feature-icon-box">
                  {item.icon}
                </div>
                <div className="auth-feature-text">
                  <strong className="auth-feature-title">{item.title}</strong>
                  <span className="auth-feature-desc">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Floating Glass Card Area */}
        <section className="auth-right-panel">
          <div className="auth-floating-card">
            <FlashMessages />
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
