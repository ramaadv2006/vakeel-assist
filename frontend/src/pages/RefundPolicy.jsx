import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import LegalNavTabs from '../components/LegalNavTabs';
import '../styles/Legal.css';

export default function RefundPolicy() {
  const { theme, toggleTheme } = useTheme();
  const { advocate } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="legal-page-root">
      {/* Ambient background */}
      <div className="legal-page-mesh" aria-hidden="true">
        <span />
        <span />
      </div>

      {/* Header */}
      <header className="legal-nav-header">
        <div className="legal-nav-inner">
          <Link to="/" className="legal-brand-link" aria-label="Advo Buddy Home">
            <img src="/logo.jpeg" alt="Advo Buddy Logo" className="legal-brand-logo" />
            <span>Advo<em>Buddy</em></span>
          </Link>

          <div className="legal-nav-actions">
            <button
              type="button"
              className="legal-theme-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title="Toggle theme"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path className="sun-icon" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
                <path className="moon-icon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>

            {advocate ? (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="legal-btn-ghost"
              >
                <Icon name="back" style={{ width: 14, height: 14 }} />
                <span>Back to Dashboard</span>
              </button>
            ) : (
              <>
                <Link to="/login" className="legal-btn-ghost">Log In</Link>
                <Link to="/signup" className="legal-btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="legal-hero">
        <div className="legal-hero-badge-wrap">
          <span className="legal-badge-pill">
            <Icon name="billing" style={{ width: 13, height: 13 }} />
            Billing &amp; Refunds Policy
          </span>
          <span className="legal-version-pill">Last Updated: July 2026</span>
        </div>

        <h1 className="legal-hero-title">Transparent Billing &amp; Refund Policy</h1>
        <p className="legal-hero-subtitle">
          Our commitment to clear, transparent pricing and fee terms for practicing advocates and law chambers across India.
        </p>

        {/* 5-pillar Navigation */}
        <LegalNavTabs activePath="/refund-policy" />
      </section>

      {/* Main Content */}
      <main className="legal-main-layout" style={{ gridTemplateColumns: '1fr' }}>
        <article className="legal-content-pane" style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
          
          {/* 1. Free Usage */}
          <section className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">1.0</span>
              <h2 className="legal-clause-title">Free Usage Tier</h2>
            </div>
            <div className="legal-clause-body">
              <div className="legal-alert-box">
                <span className="legal-alert-icon"><Icon name="check" /></span>
                <p>
                  <strong>Zero-Cost Core Platform:</strong> Advo Buddy is currently offered as a free service. As there is no
                  payment required to use the core features of the application (including hearing tracking, case diary, and basic reminders),
                  <strong>no refunds are applicable at this time</strong>.
                </p>
              </div>
              <p>
                Advocates and law students can register, create cases, record hearings, track tasks, and use the portal without entering
                any credit card or payment credentials.
              </p>
            </div>
          </section>

          {/* 2. Future Paid Plans */}
          <section className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">2.0</span>
              <h2 className="legal-clause-title">Future Paid Plans &amp; Premium Upgrades</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                If we introduce optional paid subscription tiers or premium add-ons in the future (such as high-volume WhatsApp notification bundles,
                advanced multi-advocate team chamber seats, or extended cloud document storage), this policy will be formally updated to clearly detail:
              </p>
              <ul>
                <li><strong>Refund Eligibility Window:</strong> Transparent timeframes within which a refund may be requested (e.g. 7 or 14-day evaluation periods).</li>
                <li><strong>How to Request a Refund:</strong> A simple, one-click or direct email refund request workflow without arbitrary delays.</li>
                <li><strong>Processing Timelines:</strong> Explicit turnaround times for reviewing and crediting approved refunds back to the original payment source.</li>
              </ul>
              <p>
                <strong>Prior Advance Notice:</strong> We will notify all existing users in advance via email and portal notifications before any paid plans or billing changes take effect.
              </p>
            </div>
          </section>

          {/* 3. Questions & Billing Support */}
          <section className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">3.0</span>
              <h2 className="legal-clause-title">Billing Questions &amp; Support</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                If you have any billing-related inquiries, questions regarding future commercial tiers, or feedback regarding our fee tracker module,
                please reach out directly through our contact desk:
              </p>

              <div className="legal-contact-card">
                <div className="legal-contact-item">
                  <span className="legal-contact-label">Billing Support Email</span>
                  <span className="legal-contact-val"><a href="mailto:support@advobuddy.com">support@advobuddy.com</a></span>
                </div>
                <div className="legal-contact-item">
                  <span className="legal-contact-label">WhatsApp Support</span>
                  <span className="legal-contact-val"><a href="https://wa.me/919385390115" target="_blank" rel="noopener noreferrer">+91 93853 90115</a></span>
                </div>
                <div className="legal-contact-item">
                  <span className="legal-contact-label">Support Hours</span>
                  <span className="legal-contact-val">Mon to Sat, 10:00 AM – 6:00 PM IST</span>
                </div>
              </div>
            </div>
          </section>

        </article>
      </main>

      {/* Global Legal Footer */}
      <footer className="legal-footer">
        <div className="legal-footer-inner">
          <div className="legal-footer-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/logo.jpeg" alt="Logo" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              <strong style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem' }}>Advo Buddy</strong>
            </div>
            <div className="legal-footer-links">
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact Us</Link>
              <Link to="/refund-policy">Refund Policy</Link>
            </div>
          </div>
          <div className="legal-footer-bottom">
            <span>&copy; {new Date().getFullYear()} Advo Buddy. Free usage guarantee for active advocates.</span>
            <span>No hidden fees, no credit card required to start.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
