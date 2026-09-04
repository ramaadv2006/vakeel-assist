import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import LegalNavTabs from '../components/LegalNavTabs';
import '../styles/Legal.css';

export default function AboutUs() {
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
            <Icon name="court" style={{ width: 13, height: 13 }} />
            About Advo Buddy
          </span>
          <span className="legal-version-pill">Founded by &amp; for Advocates in India</span>
        </div>

        <h1 className="legal-hero-title">Built for the Way Advocates Actually Work</h1>
        <p className="legal-hero-subtitle">
          Advo Buddy was built with a single, clear goal: to help advocates spend less time managing diaries,
          spreadsheets, and scattered notes, and more time where it counts — on their cases and arguments.
        </p>

        {/* 5-pillar Navigation */}
        <LegalNavTabs activePath="/about" />
      </section>

      {/* Main Content */}
      <main className="legal-main-layout" style={{ gridTemplateColumns: '1fr' }}>
        <article className="legal-content-pane" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          
          {/* Mission & Problem */}
          <section className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">01</span>
              <h2 className="legal-clause-title">The Challenge We Solve</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                Many practicing advocates juggle dozens of active cases across trial courts, district courts, High Courts,
                and tribunals — each with its own hearing schedule, stage of proceedings, and procedural requirements.
              </p>
              <p>
                Keeping track of every hearing date, client detail, vakalat status, and case update by hand is exhausting,
                time-consuming, and dangerously easy to get wrong. In litigation, a practice rarely fails on argument — it fails on a missed date.
              </p>
              <p>
                <strong>Advo Buddy brings all of this into one simple, unified dashboard</strong>, with timely WhatsApp and SMS
                reminders dispatched ahead of time so no court appearance or deadline is ever missed.
              </p>
            </div>
          </section>

          {/* What We Offer */}
          <section className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">02</span>
              <h2 className="legal-clause-title">What We Offer</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                Advo Buddy delivers a tightly-crafted suite of litigation management modules:
              </p>
              
              <div className="about-story-grid">
                <div className="about-feature-box">
                  <h4><Icon name="court" style={{ color: 'var(--accent)' }} /> Priority Hearing Board</h4>
                  <p>A clean, auto-sorting dashboard categorizing cases into Overdue, Today&rsquo;s, This Week&rsquo;s, and Upcoming hearings at a single glance.</p>
                </div>

                <div className="about-feature-box">
                  <h4><Icon name="calendar" style={{ color: 'var(--accent)' }} /> Case &amp; Diary History</h4>
                  <p>Easy case creation and editing with complete, timestamped hearing-date histories and audit trails so nothing is disputed.</p>
                </div>

                <div className="about-feature-box">
                  <h4><Icon name="phone" style={{ color: 'var(--accent)' }} /> Automatic Reminders</h4>
                  <p>Scheduled WhatsApp and SMS notifications sent straight to your phone 1, 2, 3, 5, or 7 days before each court date.</p>
                </div>

                <div className="about-feature-box">
                  <h4><Icon name="clients" style={{ color: 'var(--accent)' }} /> Client Directory</h4>
                  <p>A simple, searchable directory built automatically from your case records with quick one-click WhatsApp client updates.</p>
                </div>

                <div className="about-feature-box">
                  <h4><Icon name="billing" style={{ color: 'var(--accent)' }} /> Chamber Billing &amp; Fees</h4>
                  <p>Direct fee tracking, expense logging, and payment status records per case without bloated accounting software.</p>
                </div>

                <div className="about-feature-box">
                  <h4><Icon name="case" style={{ color: 'var(--accent)' }} /> DraftMitra Suite</h4>
                  <p>Court-ready draft templates (bail, warrant recall, exemption, vakalatnama) structured down to the cause title and backing sheet.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Our Approach */}
          <section className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">03</span>
              <h2 className="legal-clause-title">Our Approach</h2>
            </div>
            <div className="legal-clause-body">
              <div className="legal-alert-box">
                <span className="legal-alert-icon"><Icon name="check" /></span>
                <p>
                  <strong>Simplicity Over Bloat:</strong> We built Advo Buddy to be simple, fast, and focused on what advocates
                  actually need day-to-day — not an over-engineered tool cluttered with features you will never use.
                </p>
              </div>
              <p>
                Every screen in Advo Buddy was shaped with practicing advocates who tested it in active chamber environments.
                If a button slowed them down or a table layout was hard to read in a crowded court corridor, we refined it until it felt effortless.
              </p>
              <p>
                Have feedback or a feature request? We would love to hear from you — our support desk is directly accessible to every chamber.
              </p>

              <div style={{ marginTop: 24, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Link to="/contact" className="legal-btn-primary">
                  <Icon name="phone" style={{ width: 15, height: 15 }} />
                  <span>Get In Touch with Us</span>
                </Link>
                <Link to="/signup" className="legal-btn-ghost">
                  <span>Create Free Account</span>
                </Link>
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
            <span>&copy; {new Date().getFullYear()} Advo Buddy. Built with practicing advocates in India.</span>
            <span>Simple, fast, and focused on your litigation practice.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
