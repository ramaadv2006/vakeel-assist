import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import Icon from '../components/Icon';
import LegalNavTabs from '../components/LegalNavTabs';
import '../styles/Legal.css';

export default function ContactUs() {
  const { theme, toggleTheme } = useTheme();
  const { advocate } = useAuth();
  const addFlash = useFlash();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: advocate?.name || '',
    email: advocate?.email || '',
    phone: advocate?.phone || '',
    subject: '',
    isUrgent: false,
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subjectPrefix = form.isUrgent ? '[URGENT] ' : '';
    const fullSubject = `${subjectPrefix}${form.subject || 'Advo Buddy Support Inquiry'}`;
    const body = `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nUrgent: ${form.isUrgent ? 'Yes' : 'No'}\n\nMessage:\n${form.message}`;

    // Generate mailto link as a direct fallback
    window.location.href = `mailto:support@advobuddy.com?subject=${encodeURIComponent(fullSubject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
    addFlash('Preparing email to support@advobuddy.com. Thank you for reaching out!', 'success');
  };

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
            <Icon name="phone" style={{ width: 13, height: 13 }} />
            Chamber Support &amp; Help Desk
          </span>
          <span className="legal-version-pill">Direct Advocate Assistance</span>
        </div>

        <h1 className="legal-hero-title">We&rsquo;re Here to Help Your Practice</h1>
        <p className="legal-hero-subtitle">
          Have a question, feedback, or need assistance with your case diary, reminders, or chamber account?
          Reach out to our support desk directly via WhatsApp, Phone, or Email.
        </p>

        {/* 5-pillar Navigation */}
        <LegalNavTabs activePath="/contact" />
      </section>

      {/* Main Content */}
      <main className="legal-main-layout" style={{ gridTemplateColumns: '1fr' }}>
        <div className="contact-grid-container" style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          
          {/* Left Column: Direct Channels & Hours */}
          <div className="contact-channels-column">
            
            {/* Email Channel */}
            <a href="mailto:support@advobuddy.com" className="contact-card-channel">
              <div className="contact-card-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="contact-channel-details">
                <h4>Official Email Support</h4>
                <p>For account assistance, feature queries, and feedback</p>
                <span className="contact-channel-val">support@advobuddy.com</span>
              </div>
            </a>

            {/* WhatsApp Channel */}
            <a
              href="https://wa.me/919385390115?text=Hi%20Advo%20Buddy%20Team%2C%20I%20need%20assistance%20with%20my%20account."
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card-channel"
            >
              <div className="contact-card-icon whatsapp">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <div className="contact-channel-details">
                <h4>WhatsApp &amp; Phone Support</h4>
                <p>Direct chat with our technical and chamber support desk</p>
                <span className="contact-channel-val">+91 93853 90115</span>
              </div>
            </a>

            {/* Operating Hours & SLA */}
            <div className="contact-hours-badge">
              <h4>Support Hours</h4>
              <p>Monday to Saturday, 10:00 AM – 6:00 PM IST</p>
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5 }}>
                We typically respond within <strong>24 to 48 hours</strong>. For urgent hearing reminders or login issues, please flag your message as <em>&ldquo;Urgent&rdquo;</em>.
              </div>
            </div>

            {/* Security Promise Note */}
            <div className="legal-alert-box" style={{ margin: 0 }}>
              <span className="legal-alert-icon"><Icon name="check" /></span>
              <p>
                <strong>Advocate Confidentiality:</strong> We will never ask you for your account password or your clients&rsquo; confidential case documents over email or chat.
              </p>
            </div>
          </div>

          {/* Right Column: Support & Feedback Form */}
          <div className="contact-form-pane">
            <h3>Send Us a Message</h3>
            <p>Fill out the particulars below to connect directly with the Advo Buddy team.</p>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <Icon name="check" style={{ width: 26, height: 26 }} />
                </div>
                <h4 style={{ fontFamily: 'Lora, serif', fontSize: '1.2rem', color: 'var(--text-dark)', margin: '0 0 8px 0' }}>Message Dispatched</h4>
                <p style={{ fontSize: 14, color: 'var(--text-main)' }}>Your email client has been prepared. You can also message us directly on WhatsApp at <strong>+91 93853 90115</strong>.</p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="legal-btn-ghost"
                  style={{ marginTop: 16 }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-dark)' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Advocate Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-dark)', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-dark)' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="counsel@chambers.in"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-dark)', fontSize: 14 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-dark)' }}>
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-dark)', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-dark)' }}>
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hearing Reminders Setup"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-dark)', fontSize: 14 }}
                    />
                  </div>
                </div>

                {/* Urgent Checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'var(--accent-bg)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-border)' }}>
                  <input
                    type="checkbox"
                    checked={form.isUrgent}
                    onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>
                    Mark as Urgent (Priority for upcoming hearing or account lockout)
                  </span>
                </label>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-dark)' }}>
                    Message Details *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your question, feature suggestion, or account issue..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-dark)', fontSize: 14, resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  className="legal-btn-primary"
                  style={{ justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}
                >
                  <Icon name="phone" style={{ width: 16, height: 16 }} />
                  <span>Send Support Request</span>
                </button>
              </form>
            )}
          </div>

        </div>
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
            <span>&copy; {new Date().getFullYear()} Advo Buddy. Support: support@advobuddy.com • +91 93853 90115</span>
            <span>Mon to Sat, 10:00 AM – 6:00 PM IST. Response in 24–48h.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
