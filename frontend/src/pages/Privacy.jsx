import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import LegalNavTabs from '../components/LegalNavTabs';
import '../styles/Legal.css';

const PRIVACY_SECTIONS = [
  { id: 'dpdp-commitment', num: '1.0', title: 'Commitment to Legal Confidentiality & DPDP Act 2023' },
  { id: 'data-collected', num: '2.0', title: 'Categories of Personal & Case Data Collected' },
  { id: 'purposes-processing', num: '3.0', title: 'Grounds & Purposes of Data Processing' },
  { id: 'client-privilege', num: '4.0', title: 'Advocate-Client Privilege & Zero AI Model Training' },
  { id: 'subprocessors', num: '5.0', title: 'Sub-Processors & Third-Party Integrations' },
  { id: 'data-security', num: '6.0', title: 'Security Architecture, Encryption & Tenant Isolation' },
  { id: 'retention-erasure', num: '7.0', title: 'Data Retention, Export & Right to Erasure' },
  { id: 'principal-rights', num: '8.0', title: 'Data Principal Rights Under DPDP Act 2023' },
  { id: 'cookies-sessions', num: '9.0', title: 'Cookies, Local Storage & Stateless Tokens' },
  { id: 'grievance-officer', num: '10.0', title: 'Grievance Redressal Officer & Statutory Contacts' },
];

export default function Privacy() {
  const { theme, toggleTheme } = useTheme();
  const { advocate } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('dpdp-commitment');
  const [searchQuery, setSearchQuery] = useState('');
  const contentRef = useRef(null);

  // Scroll Spy for Table of Contents
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    PRIVACY_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return PRIVACY_SECTIONS;
    const q = searchQuery.toLowerCase();
    return PRIVACY_SECTIONS.filter(
      (s) => s.title.toLowerCase().includes(q) || s.num.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="legal-page-root">
      {/* Ambient decorative background */}
      <div className="legal-page-mesh" aria-hidden="true">
        <span />
        <span />
      </div>

      {/* Top Sticky Navigation Bar */}
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

      {/* Hero Header Section */}
      <section className="legal-hero">
        <div className="legal-hero-badge-wrap">
          <span className="legal-badge-pill">
            <Icon name="check" style={{ width: 13, height: 13 }} />
            DPDP Act 2023 Compliant
          </span>
          <span className="legal-version-pill">Last Updated: July 2026</span>
        </div>

        <h1 className="legal-hero-title">Privacy Policy &amp; Data Protection</h1>
        <p className="legal-hero-subtitle">
          Advo Buddy (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) respects your privacy. This Privacy Policy explains how we collect, use, and protect the information you provide when you use our case and hearing tracking application.
        </p>

        {/* 5-pillar Navigation */}
        <LegalNavTabs activePath="/privacy" />

        {/* Controls: Search & Print */}
        <div className="legal-controls-row">
          <div className="legal-search-box">
            <span className="legal-search-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="legal-search-input"
              placeholder="Search privacy topics (e.g. Encryption, Sub-processors, Deletion, Rights)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="legal-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="legal-action-buttons">
            <button
              type="button"
              onClick={handlePrint}
              className="legal-btn-ghost"
              title="Print or Save as PDF"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Privacy Highlights */}
        <div className="legal-highlights-grid">
          <div className="legal-highlight-card">
            <div className="legal-highlight-icon">
              <Icon name="check" />
            </div>
            <div className="legal-highlight-content">
              <h4>Zero Public AI Training</h4>
              <p>Your client papers, FIRs, and briefs are NEVER used to train public foundation AI models.</p>
            </div>
          </div>

          <div className="legal-highlight-card">
            <div className="legal-highlight-icon">
              <Icon name="court" />
            </div>
            <div className="legal-highlight-content">
              <h4>Strict Tenant Isolation</h4>
              <p>Each advocate and chamber operates in an isolated environment. Cross-tenant access is strictly blocked.</p>
            </div>
          </div>

          <div className="legal-highlight-card">
            <div className="legal-highlight-icon">
              <Icon name="tasks" />
            </div>
            <div className="legal-highlight-content">
              <h4>256-bit Encryption</h4>
              <p>All sensitive information is encrypted in transit (TLS 1.3) and at rest (PostgreSQL AES-256).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <main className="legal-main-layout">
        {/* Sticky Table of Contents Sidebar */}
        <aside className="legal-sidebar" aria-label="Table of Contents">
          <div className="legal-toc-title">
            <Icon name="settings" style={{ width: 14, height: 14 }} />
            <span>Privacy Clauses</span>
          </div>

          <nav>
            <ul className="legal-toc-list">
              {filteredSections.map((s) => (
                <li key={s.id} className="legal-toc-item">
                  <a
                    href={`#${s.id}`}
                    className={`legal-toc-link${activeSection === s.id ? ' is-active' : ''}`}
                    onClick={(e) => scrollToSection(e, s.id)}
                  >
                    {s.num} {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Article Prose Content */}
        <article className="legal-content-pane" ref={contentRef}>
          {/* Section 1 */}
          <section id="dpdp-commitment" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">1.0</span>
              <h2 className="legal-clause-title">Commitment to Legal Confidentiality & DPDP Act 2023</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                At <strong>Advo Buddy</strong> (&ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;, or &ldquo;<strong>Platform</strong>&rdquo;),
                we recognize that legal records, client identities, and chamber communications are among the most sensitive categories of information.
              </p>
              <p>
                We are committed to operating as a responsible <strong>Data Processor</strong> (and where applicable, Data Fiduciary) in full compliance with the:
              </p>
              <ul>
                <li><strong>Digital Personal Data Protection Act, 2023 (DPDP Act 2023)</strong>;</li>
                <li><strong>Information Technology Act, 2000</strong> (including the <em>IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</em>); and</li>
                <li>Ethical expectations of client confidentiality recognized under Section 126 of the <em>Indian Evidence Act, 1872</em> and Section 132 of the <em>Bharatiya Sakshya Adhiniyam, 2023 (BSA)</em>.</li>
              </ul>
              <p>
                This Policy governs our practices regarding data collection, processing, protection, retention, and deletion across all Advo Buddy services.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="data-collected" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">2.0</span>
              <h2 className="legal-clause-title">Categories of Personal & Case Data Collected</h2>
            </div>
            <div className="legal-clause-body">
              <p>We collect and process only the minimum necessary information required to deliver legal practice management services:</p>
              
              <p><strong>A. Account & Practitioner Profile Data:</strong></p>
              <ul>
                <li><strong>Practicing Advocates:</strong> Full name, email address, mobile phone number, State Bar Council enrollment number, chamber/office address, areas of specialization, and optional profile avatar.</li>
                <li><strong>Law Students:</strong> Full name, email address, phone number, Law School / University name, course and year of study, student ID / roll number, and research interests.</li>
                <li><strong>Authentication:</strong> Securely hashed passwords (via bcrypt) or OAuth authentication metadata via Supabase.</li>
              </ul>

              <p><strong>B. Case Management & Client Information:</strong></p>
              <ul>
                <li><strong>Case Particulars:</strong> Case number, CNR number, court/tribunal name, judge/bench, case type (e.g. Criminal, Civil, Writ), stage of proceedings, and hearing dates.</li>
                <li><strong>Client & Opposing Party Details:</strong> Client full name, phone number (for optional client WhatsApp hearing alerts), address, opposing party name, and opposing counsel details.</li>
                <li><strong>Chamber Records:</strong> Case notes, tasks, cause list items, fee ledger entries, invoice details, and audit history logs.</li>
              </ul>

              <p><strong>C. Uploaded Documents & AI Queries:</strong></p>
              <ul>
                <li>Documents uploaded for OCR, analysis, or drafting (such as FIR copies, plaints, written statements, affidavits, or judgment orders in PDF, DOCX, or TXT format).</li>
                <li>Draft templates customized in DraftMitra.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section id="purposes-processing" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">3.0</span>
              <h2 className="legal-clause-title">Grounds & Purposes of Data Processing</h2>
            </div>
            <div className="legal-clause-body">
              <p>We process personal and chamber data exclusively for specified, lawful purposes based on your contractual consent:</p>
              <ul>
                <li><strong>Core Case Diary & Management:</strong> Rendering your interactive case board, daily cause-list diary, stage tracking, and client registry.</li>
                <li><strong>Automated Hearing Reminders:</strong> Dispatching automated notifications (via WhatsApp, SMS, or Email) prior to scheduled hearings as configured in your alert preferences.</li>
                <li><strong>Drafting & Template Automation:</strong> Merging case facts with court-standard drafting forms (e.g., bail applications, vakalatnama, recall petitions).</li>
                <li><strong>AI Legal Assistance & Research:</strong> Processing legal research queries, synthesizing case briefs, and summarizing uploaded legal documents.</li>
                <li><strong>Security & Audit Trails:</strong> Maintaining timestamped audit trails of case updates to prevent internal chamber disputes and detect unauthorized access.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section id="client-privilege" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">4.0</span>
              <h2 className="legal-clause-title">Advocate-Client Privilege & Zero AI Model Training</h2>
            </div>
            <div className="legal-clause-body">
              <div className="legal-alert-box">
                <span className="legal-alert-icon"><Icon name="check" /></span>
                <p>
                  <strong>OUR PRIVACY PROMISE:</strong> We do <strong>NOT</strong> sell, rent, monetize, or broker your personal or client data to any
                  third-party advertisers, data aggregators, or marketing firms.
                </p>
              </div>
              <p>
                <strong>Zero AI Training on Privileged Papers:</strong> We strictly prohibit the use of your confidential case briefs, client documents,
                or chamber notes to train, fine-tune, or improve public foundation artificial intelligence models.
              </p>
              <p>
                All AI interactions (summaries, FIR analysis, translation, draft recommendations) are processed via enterprise AI endpoints with strict
                zero-data-retention agreements, ensuring that prompts and file contents are deleted immediately after the response is returned.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="subprocessors" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">5.0</span>
              <h2 className="legal-clause-title">Sub-Processors & Third-Party Integrations</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                To provide high-reliability infrastructure, Advo Buddy partners with vetted technology service providers who adhere to rigorous data
                protection standards:
              </p>
              <ul>
                <li>
                  <strong>Database & Auth Infrastructure (Supabase / AWS PostgreSQL):</strong> Encrypted database hosting, stateless authentication token
                  verification, and multi-tenant row-level access enforcement.
                </li>
                <li>
                  <strong>Telecommunication Services (Twilio):</strong> Secure carrier routing for WhatsApp and SMS hearing notification dispatches,
                  compliant with Indian DLT (Distributed Ledger Technology) and TRAI regulations.
                </li>
                <li>
                  <strong>eCourts Open Data Endpoints:</strong> Read-only retrieval of public court causelists and CNR status from public judicial portals.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section id="data-security" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">6.0</span>
              <h2 className="legal-clause-title">Security Architecture, Encryption & Tenant Isolation</h2>
            </div>
            <div className="legal-clause-body">
              <p>Advo Buddy implements multi-layered security controls designed for sensitive legal environments:</p>
              <ul>
                <li><strong>Encryption in Transit:</strong> All HTTP communications are strictly forced over HTTPS utilizing TLS 1.3 encryption protocols.</li>
                <li><strong>Encryption at Rest:</strong> Database tables, document stores, and backups are encrypted at rest using AES-256 standard encryption.</li>
                <li><strong>Multi-Tenant Isolation:</strong> Application database queries are strictly scoped to the authenticated user ID (`advocate_id`). No user can view, edit, or search cases belonging to another chamber.</li>
                <li><strong>Stateless Authentication:</strong> Cryptographically signed JWT bearer tokens with short expiry windows and secure revocation on logout.</li>
                <li><strong>Password Hashing:</strong> Passwords are salted and hashed using modern cryptographic algorithms before persistent storage; plain-text passwords are never stored or logged.</li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section id="retention-erasure" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">7.0</span>
              <h2 className="legal-clause-title">Data Retention, Export & Right to Erasure</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                <strong>Data Retention:</strong> We retain your case data, client profiles, and billing records for as long as your account remains active
                or as required to maintain your chamber diary history.
              </p>
              <p>
                <strong>Data Portability / Export:</strong> You can download or export your full case list, hearing records, and client register at any
                time in standard formats (CSV, JSON) directly from the application interface.
              </p>
              <p>
                <strong>Permanent Account Erasure:</strong> In accordance with Section 12 of the DPDP Act 2023, you have the right to request the complete
                erasure of your personal data. Upon an account deletion request via <a href="mailto:privacy@advobuddy.in">privacy@advobuddy.in</a> or
                your Settings panel, all case files, personal identifiers, and audit logs will be permanently purged from our active databases within 30 days.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section id="principal-rights" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">8.0</span>
              <h2 className="legal-clause-title">Data Principal Rights Under DPDP Act 2023</h2>
            </div>
            <div className="legal-clause-body">
              <p>As a Data Principal under Indian law, you are entitled to the following statutory rights:</p>
              <ol>
                <li><strong>Right to Access Information:</strong> Obtain a summary of personal data being processed and the identities of any data processors with whom it has been shared.</li>
                <li><strong>Right to Correction & Updating:</strong> Correct inaccurate or misleading personal data and update incomplete credentials in your profile.</li>
                <li><strong>Right to Erasure / Deletion:</strong> Request the deletion of personal data that is no longer necessary for the purpose for which it was processed.</li>
                <li><strong>Right to Nominate:</strong> Nominate another individual to exercise your rights under the DPDP Act in the event of death or incapacity.</li>
                <li><strong>Right to Grievance Redressal:</strong> Have your data privacy concerns addressed promptly by our designated Grievance Redressal Officer.</li>
              </ol>
            </div>
          </section>

          {/* Section 9 */}
          <section id="cookies-sessions" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">9.0</span>
              <h2 className="legal-clause-title">Cookies, Local Storage & Stateless Tokens</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                Advo Buddy uses essential browser local storage (`localStorage`) and session tokens strictly to maintain your authenticated login state,
                theme preferences (dark/light mode), and active portal view (Advocate vs Student).
              </p>
              <p>
                We do <strong>NOT</strong> utilize cross-site tracking cookies, third-party advertising pixels, or invasive behavioral fingerprinting tools.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="grievance-officer" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">10.0</span>
              <h2 className="legal-clause-title">Grievance Redressal Officer & Statutory Contacts</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                In accordance with the <em>Information Technology Act, 2000</em> and the <em>Digital Personal Data Protection Act, 2023</em>, the details
                of the designated <strong>Data Protection & Grievance Redressal Officer</strong> for Advo Buddy are set forth below:
              </p>

              <div className="legal-contact-card">
                <div className="legal-contact-item">
                  <span className="legal-contact-label">Grievance Officer</span>
                  <span className="legal-contact-val">Nodal Privacy Officer</span>
                </div>
                <div className="legal-contact-item">
                  <span className="legal-contact-label">Privacy &amp; Support Email</span>
                  <span className="legal-contact-val"><a href="mailto:support@advobuddy.com">support@advobuddy.com</a></span>
                </div>
                <div className="legal-contact-item">
                  <span className="legal-contact-label">WhatsApp &amp; Phone</span>
                  <span className="legal-contact-val"><a href="https://wa.me/919385390115" target="_blank" rel="noopener noreferrer">+91 93853 90115</a></span>
                </div>
                <div className="legal-contact-item">
                  <span className="legal-contact-label">Support Hours</span>
                  <span className="legal-contact-val">Mon to Sat, 10:00 AM – 6:00 PM IST</span>
                </div>
              </div>

              <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                If you have questions regarding this Privacy Policy, your client data, or wish to request deletion of your account and associated records, please reach out via our <Link to="/contact" style={{ color: 'var(--accent-hover)', textDecoration: 'underline' }}>Contact Us</Link> page.
              </p>
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
            <span>&copy; {new Date().getFullYear()} Advo Buddy. All rights reserved. Compliant with DPDP Act 2023.</span>
            <span>Support: support@advobuddy.com • +91 93853 90115</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
