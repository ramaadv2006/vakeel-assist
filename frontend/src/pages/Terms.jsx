import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import LegalNavTabs from '../components/LegalNavTabs';
import '../styles/Legal.css';

const SECTIONS = [
  { id: 'acceptance', num: '1.0', title: 'Acceptance of Terms & Eligibility' },
  { id: 'nature-of-platform', num: '2.0', title: 'Nature of Platform & No Attorney-Client Relationship' },
  { id: 'professional-duty', num: '3.0', title: 'Advocate Independence & Bar Council Compliance' },
  { id: 'ai-draftmitra', num: '4.0', title: 'AI Assistant, DraftMitra & Template Disclaimers' },
  { id: 'diary-reminders', num: '5.0', title: 'Hearing Diary, Reminders & eCourts Data' },
  { id: 'accounts-security', num: '6.0', title: 'User Accounts, Student Portals & Security' },
  { id: 'data-ownership-ip', num: '7.0', title: 'User Data Ownership & Intellectual Property' },
  { id: 'acceptable-use', num: '8.0', title: 'Acceptable Use Policy & Prohibitions' },
  { id: 'fees-billing', num: '9.0', title: 'Fees, Subscriptions & Billing Module' },
  { id: 'liability-indemnity', num: '10.0', title: 'Limitation of Liability & Indemnification' },
  { id: 'termination-export', num: '11.0', title: 'Termination, Data Export & Account Closure' },
  { id: 'governing-law', num: '12.0', title: 'Governing Law, Jurisdiction & Dispute Resolution' },
];

export default function Terms() {
  const { theme, toggleTheme } = useTheme();
  const { advocate } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('acceptance');
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

    SECTIONS.forEach((s) => {
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
    if (!searchQuery.trim()) return SECTIONS;
    const q = searchQuery.toLowerCase();
    return SECTIONS.filter(
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
            <Icon name="court" style={{ width: 13, height: 13 }} />
            Legal Agreement
          </span>
          <span className="legal-version-pill">Last Updated: July 2026</span>
        </div>

        <h1 className="legal-hero-title">Terms &amp; Conditions of Service</h1>
        <p className="legal-hero-subtitle">
          Welcome to Advo Buddy. By creating an account or using this application, you agree to the following Terms &amp; Conditions. Please read them carefully.
        </p>

        {/* 5-pillar Navigation */}
        <LegalNavTabs activePath="/terms" />

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
              placeholder="Search terms, clauses, or keywords (e.g. AI, Reminders, BCI, Refund)..."
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

        {/* Key Highlights At A Glance */}
        <div className="legal-highlights-grid">
          <div className="legal-highlight-card">
            <div className="legal-highlight-icon">
              <Icon name="court" />
            </div>
            <div className="legal-highlight-content">
              <h4>Administrative SaaS Only</h4>
              <p>Advo Buddy is a software platform, not a law firm. We do not provide legal advice or legal representation.</p>
            </div>
          </div>

          <div className="legal-highlight-card">
            <div className="legal-highlight-icon">
              <Icon name="check" />
            </div>
            <div className="legal-highlight-content">
              <h4>100% Advocate Ownership</h4>
              <p>You retain full proprietary ownership and client privilege over your case diary, client records, and briefs.</p>
            </div>
          </div>

          <div className="legal-highlight-card">
            <div className="legal-highlight-icon">
              <Icon name="warning" />
            </div>
            <div className="legal-highlight-content">
              <h4>Advocate Verification Required</h4>
              <p>AI suggestions and DraftMitra templates are assistive aids. The advocate must review all filings before court submission.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <main className="legal-main-layout">
        {/* Sticky Table of Contents Sidebar */}
        <aside className="legal-sidebar" aria-label="Table of Contents">
          <div className="legal-toc-title">
            <Icon name="case" style={{ width: 14, height: 14 }} />
            <span>Clauses Index</span>
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
          <section id="acceptance" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">1.0</span>
              <h2 className="legal-clause-title">Acceptance of Terms & Eligibility</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                These Terms and Conditions (&ldquo;<strong>Terms</strong>&rdquo; or &ldquo;<strong>Agreement</strong>&rdquo;) constitute a legally
                binding agreement between you (&ldquo;<strong>User</strong>&rdquo;, &ldquo;<strong>Advocate</strong>&rdquo;, &ldquo;<strong>Student</strong>&rdquo;,
                or &ldquo;<strong>You</strong>&rdquo;) and <strong>Advo Buddy</strong> (&ldquo;<strong>Company</strong>&rdquo;, &ldquo;<strong>we</strong>&rdquo;,
                &ldquo;<strong>us</strong>&rdquo;, or &ldquo;<strong>our</strong>&rdquo;), governing your access to and use of the Advo Buddy web application,
                APIs, documentation, and associated services (collectively, the &ldquo;<strong>Platform</strong>&rdquo; or &ldquo;<strong>Service</strong>&rdquo;).
              </p>
              <p>
                By creating an account, logging in, or using any feature of the Platform, you acknowledge that you have read, understood, and agree to be bound
                by these Terms and our <Link to="/privacy">Privacy Policy</Link>. If you do not agree to these Terms, you must discontinue use immediately.
              </p>
              <p><strong>Eligibility Criteria:</strong></p>
              <ul>
                <li>
                  <strong>Practicing Advocates:</strong> You represent and warrant that you are enrolled with a State Bar Council in India pursuant to the
                  <em>Advocates Act, 1961</em>, or are an authorized representative of an advocate or law chamber acting under valid supervision.
                </li>
                <li>
                  <strong>Law Students / Academics:</strong> You represent that you are a bona fide student enrolled in a recognized law degree program (e.g. LL.B, B.A. LL.B, LL.M)
                  or an academic legal scholar utilizing the Student Hub for educational, moot court, and research purposes.
                </li>
                <li>
                  <strong>Age:</strong> You must be at least 18 years of age and legally competent to enter into binding contracts under the <em>Indian Contract Act, 1872</em>.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section id="nature-of-platform" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">2.0</span>
              <h2 className="legal-clause-title">Nature of Platform & No Attorney-Client Relationship</h2>
            </div>
            <div className="legal-clause-body">
              <div className="legal-alert-box">
                <span className="legal-alert-icon"><Icon name="court" /></span>
                <p>
                  <strong>CRITICAL LEGAL DISCLAIMER:</strong> Advo Buddy is a software-as-a-service (SaaS) administrative and productivity tool.
                  Advo Buddy is <strong>NOT</strong> a law firm, does <strong>NOT</strong> practice law, and does <strong>NOT</strong> provide legal advice,
                  advocacy, solicitor services, or formal legal opinions to anyone.
                </p>
              </div>
              <p>
                Your use of the Platform, including the generation of drafts via DraftMitra, querying the AI Assistant, or tracking case hearings, does
                <strong>NOT</strong> create an attorney-client relationship between you and Advo Buddy, nor between Advo Buddy and any of your clients.
              </p>
              <p>
                All communications transmitted through the Platform are technical data transmissions processed by automated systems. Advo Buddy does not
                solicit clients on behalf of any advocate and is operated in strict compliance with the prohibitions against legal advertising under
                Rule 36 of the <em>Bar Council of India Rules</em>.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section id="professional-duty" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">3.0</span>
              <h2 className="legal-clause-title">Advocate Independence & Bar Council Compliance</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                Practicing advocates using Advo Buddy acknowledge and agree that:
              </p>
              <ol>
                <li>
                  <strong>Exclusive Professional Responsibility:</strong> You retain complete, sole, and unshared fiduciary, professional, and ethical
                  responsibility for all legal work, client counseling, pleadings, representations, court appearances, and documents prepared, managed,
                  or filed in connection with your practice.
                </li>
                <li>
                  <strong>Bar Council Rules:</strong> You agree to maintain full compliance with the <em>Standards of Professional Conduct and Etiquette</em> framed
                  by the Bar Council of India under Section 49(1)(c) of the <em>Advocates Act, 1961</em>.
                </li>
                <li>
                  <strong>Independent Discretion:</strong> No feature of Advo Buddy (including automated hearing reminders, case audit logs, or AI-generated
                  legal drafts) shall substitute for an advocate&rsquo;s independent professional judgment, fact-finding, and legal research.
                </li>
              </ol>
            </div>
          </section>

          {/* Section 4 */}
          <section id="ai-draftmitra" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">4.0</span>
              <h2 className="legal-clause-title">AI Assistant, DraftMitra & Template Disclaimers</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                Advo Buddy provides specialized drafting assistance (&ldquo;DraftMitra&rdquo;) and an AI-powered legal assistant to facilitate case brief synthesis,
                statutory research, and document drafting.
              </p>
              <div className="legal-warning-box">
                <span className="legal-warning-icon"><Icon name="warning" /></span>
                <p>
                  <strong>MANDATORY REVIEW NOTICE:</strong> All templates, petitions (including bail applications under Section 480 B.N.S.S., warrant recalls
                  under Section 70/72(2), exemption petitions under Section 355), legal notices, and AI-generated outputs are algorithmic drafting aids.
                  You <strong>MUST</strong> independently verify all facts, party names, jurisdictional averments, limitation periods, court fees, and
                  statutory citations (including transitions between IPC/CrPC and BNS/BNSS/BSA) before signing, notarizing, or filing.
                </p>
              </div>
              <p>
                Advo Buddy makes no warranty regarding the completeness, accuracy, judicial acceptability, or timeliness of any AI output or automated draft.
                You assume full liability for any document generated and utilized in any judicial, quasi-judicial, or administrative forum.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="diary-reminders" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">5.0</span>
              <h2 className="legal-clause-title">Hearing Diary, Reminders & eCourts Data</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                Advo Buddy offers smart court diary tracking and automated notification dispatches (via WhatsApp, SMS, or Email powered by third-party telecom
                carriers such as Twilio).
              </p>
              <ul>
                <li>
                  <strong>Cause List Tracking:</strong> While Advo Buddy provides daily hearing alerts and optional eCourts case search integrations, the
                  advocate remains exclusively responsible for verifying cause-lists, item numbers, bench constitutions, and sitting hours on official
                  court websites (e.g., ecourts.gov.in, High Court cause-lists, Supreme Court of India registry).
                </li>
                <li>
                  <strong>Carrier & Sandbox Limitations:</strong> Delivery of WhatsApp/SMS messages is dependent on third-party telecommunication networks,
                  carrier filters, DND preferences, and user WhatsApp sandbox pairing. Advo Buddy shall not be liable for missed hearings or delayed
                  appearances resulting from undelivered, delayed, or filtered automated notifications.
                </li>
                <li>
                  <strong>Audit Trail:</strong> The Case Audit and History logging feature records timestamped modifications made within your chamber account.
                  It serves as an internal chamber record and does not constitute official court certified records.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section id="accounts-security" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">6.0</span>
              <h2 className="legal-clause-title">User Accounts, Student Portals & Security</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                When registering for an account, you agree to:
              </p>
              <ul>
                <li>Provide accurate, current, and complete profile information (including your name, email, phone number, and Bar Council enrollment number or Law School credentials).</li>
                <li>Maintain the confidentiality and security of your login credentials, password, and session tokens.</li>
                <li>Notify us immediately at <a href="mailto:support@advobuddy.in">support@advobuddy.in</a> if you suspect unauthorized access to your account.</li>
                <li>Accept full responsibility for all activities occurring under your authenticated credentials.</li>
              </ul>
              <p>
                <strong>Student Portals:</strong> Law student accounts are granted access to academic tools (Moot Court Tracker, FIRAC Case Briefs, Study Deck,
                and AI Legal Tutor). Students must not misrepresent their status as licensed practitioners to clients or the public.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section id="data-ownership-ip" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">7.0</span>
              <h2 className="legal-clause-title">User Data Ownership & Intellectual Property</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                <strong>Your Data Remains Yours:</strong> You retain complete, unencumbered ownership of all case records, client personal information,
                uploaded briefs, fee entries, and notes (&ldquo;<strong>User Content</strong>&rdquo;) uploaded to or stored on the Platform. We claim no
                ownership rights over your legal briefs or client confidences.
              </p>
              <p>
                <strong>Limited License to Operate:</strong> You grant Advo Buddy a strictly limited, non-exclusive, revocable license to host, store,
                and process your User Content solely to the extent necessary to provide the services requested (e.g., rendering your case board, executing
                drafting macros, or delivering automated reminders).
              </p>
              <p>
                <strong>Platform IP:</strong> The design system, user interfaces, &ldquo;Chambers&rdquo; UI, code, algorithms, brand logos, and original
                drafting frameworks of Advo Buddy are the exclusive intellectual property of Advo Buddy and are protected under Indian and international
                copyright and trademark laws.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section id="acceptable-use" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">8.0</span>
              <h2 className="legal-clause-title">Acceptable Use Policy & Prohibitions</h2>
            </div>
            <div className="legal-clause-body">
              <p>You agree not to engage in any of the following prohibited actions:</p>
              <ul>
                <li>Attempting to probe, scan, or test the vulnerability of the Platform, or breach security or authentication barriers.</li>
                <li>Reverse engineering, decompiling, or disassembling any portion of the source code or proprietary algorithms.</li>
                <li>Using any automated scraper, spider, or script to bulk harvest eCourts data or abuse backend APIs.</li>
                <li>Uploading malicious payloads, viruses, Trojan horses, or corrupted files.</li>
                <li>Attempting to access cases, client files, or data belonging to another advocate or tenant without authorization.</li>
                <li>Using the Platform for any purpose that violates Indian law, advocate professional conduct, or judicial gag orders.</li>
              </ul>
            </div>
          </section>

          {/* Section 9 */}
          <section id="fees-billing" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">9.0</span>
              <h2 className="legal-clause-title">Fees, Subscriptions & Billing Module</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                <strong>Platform Pricing:</strong> Core MVP features are currently provided free or under designated subscription tiers.
                Any future paid plans, premium AI quotas, or advanced storage tiers will be clearly posted prior to enrollment.
              </p>
              <p>
                <strong>Fee Ledger Module:</strong> The billing and fee tracking module in Advo Buddy is an accounting tool for the advocate&rsquo;s
                internal chamber record-keeping. The advocate is responsible for calculating applicable Goods and Services Tax (GST) or reverse charge
                mechanisms where applicable under Indian tax laws.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="liability-indemnity" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">10.0</span>
              <h2 className="legal-clause-title">Limitation of Liability & Indemnification</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                <strong>Disclaimer of Warranties:</strong> The Platform is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis.
                Advo Buddy expressly disclaims all warranties of any kind, whether express or implied, including merchantability, fitness for a particular
                legal purpose, non-infringement, or uninterrupted availability.
              </p>
              <p>
                <strong>Limitation of Liability:</strong> In no event shall Advo Buddy, its directors, employees, or technical partners be liable for any
                indirect, incidental, special, consequential, or punitive damages, including loss of profits, loss of data, missed court dates, default judgments,
                adverse court orders, or professional disciplinary proceedings arising out of or related to your use of the Platform.
              </p>
              <p>
                <strong>Indemnification:</strong> You agree to defend, indemnify, and hold harmless Advo Buddy and its officers from and against any claims,
                liabilities, damages, losses, and expenses (including legal fees) arising from: (a) your violation of these Terms; (b) any professional
                negligence, malpractice, or breach of advocate ethics; or (c) any dispute between you and your clients.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section id="termination-export" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">11.0</span>
              <h2 className="legal-clause-title">Termination, Data Export & Account Closure</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                <strong>Termination by You:</strong> You may close your account at any time via your Account Settings. Prior to closure, you are
                encouraged to export all your case records and fee ledgers.
              </p>
              <p>
                <strong>Data Export Guarantee:</strong> You maintain the right to export your case records, client registries, and diary entries in
                standard readable formats (e.g. CSV, JSON, or printable summaries) at any point during your active subscription.
              </p>
              <p>
                <strong>Termination by Company:</strong> We reserve the right to suspend or terminate accounts that violate these Terms, engage in
                system abuse, or fail to adhere to ethical/security standards, with reasonable prior notice where practicable.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section id="governing-law" className="legal-clause-section">
            <div className="legal-clause-header">
              <span className="legal-clause-number">12.0</span>
              <h2 className="legal-clause-title">Governing Law, Jurisdiction & Dispute Resolution</h2>
            </div>
            <div className="legal-clause-body">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the <strong>Republic of India</strong>, without regard to
                conflict of law principles.
              </p>
              <p>
                Any dispute, controversy, or claim arising out of or relating to these Terms or the breach, termination, or invalidity thereof shall be
                resolved through amicable negotiations. If unresolved within 30 days, the dispute shall be subject to the exclusive jurisdiction of the
                competent civil courts located in <strong>Chennai, Tamil Nadu, India</strong>.
              </p>

              <div className="legal-contact-card">
                <div className="legal-contact-item">
                  <span className="legal-contact-label">Help Desk &amp; Inquiries</span>
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
            <span>&copy; {new Date().getFullYear()} Advo Buddy. All rights reserved. Built for practicing advocates &amp; law scholars in India.</span>
            <span>Support: support@advobuddy.com • +91 93853 90115</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
