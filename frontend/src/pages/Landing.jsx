import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useReveal } from '../hooks/useReveal';
import { useCountUp } from '../hooks/useCountUp';
import Icon from '../components/Icon';
import { AppWindowMock, DraftPageMock, PhoneMock } from '../components/LandingArt';
import '../styles/Landing.css';

/* ------------------------------------------------------------------
   Content
   Every number quoted below is a fact about this codebase (13 built-in
   templates in templates.js, 8 workspace modules in Header.jsx), not a
   marketing claim — keep them in sync if the app grows.
   ------------------------------------------------------------------ */

const NAV_SECTIONS = [
  { id: 'why', label: 'Why' },
  { id: 'how', label: 'How it works' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'modules', label: 'Workspace' },
  { id: 'faq', label: 'FAQ' },
];

const ROTATING = ['a hearing', 'a deadline', 'a filing', 'a limitation'];

const PERSONAS = [
  {
    icon: 'user',
    title: 'Solo advocates',
    body: 'Run the whole practice from one screen — today’s board, tomorrow’s drafts, this month’s fees.',
    points: ['Cause-list diary', 'Automatic reminders', 'One-tap drafts'],
  },
  {
    icon: 'clients',
    title: 'Chambers & juniors',
    body: 'Briefs, checklists and hearing dates stay in one shared place instead of five WhatsApp groups.',
    points: ['Shared case diary', 'Pre-hearing checklists', 'Client rolodex'],
  },
  {
    icon: 'billing',
    title: 'Litigation teams',
    body: 'Track every matter across courts and benches, and see what is billed, pending and closed.',
    points: ['Fee ledger', 'Case archive', 'Audit trail'],
  },
];

const STEPS = [
  { n: '01', title: 'Add the matter', body: 'Client, case number, court, stage and next date. Thirty seconds, once.' },
  { n: '02', title: 'Get the board', body: 'Every morning your cause-list diary is grouped by court and ready to print.' },
  { n: '03', title: 'Draft in minutes', body: 'Pick a template, fill the particulars, print with the backing sheet attached.' },
  { n: '04', title: 'Never miss a date', body: 'Reminders go out before the hearing. Adjournments update the history automatically.' },
];

const MODULES = [
  { icon: 'ai', title: 'AI assistant', body: 'Ask questions about a matter or have a document summarised before you walk in.' },
  { icon: 'calendar', title: 'Court diary', body: 'A printable daily board grouped by court, hall and item number.' },
  { icon: 'case', title: 'DraftMitra', body: 'Bail, vakalat, memo, process and petition templates with correct court alignment.' },
  { icon: 'clients', title: 'Client rolodex', body: 'Every client with their active matters and contact details, one search away.' },
  { icon: 'tasks', title: 'Pre-hearing tasks', body: 'Checklists per matter so nothing is discovered on the way to court.' },
  { icon: 'billing', title: 'Fee ledger', body: 'What is billed, what is received, what is still outstanding per client.' },
];

const OUTCOMES = [
  { before: 'Dates copied into three diaries', after: 'One diary, reminders sent automatically' },
  { before: 'Drafts retyped from an old file', after: 'Templates filled and printed in minutes' },
  { before: 'Backing sheets aligned by hand', after: 'Page two generated, folded and filing-ready' },
  { before: 'Fees tracked on a notepad', after: 'A ledger that totals itself' },
];

const FAQS = [
  {
    q: 'Do I need to change how I already work?',
    a: 'No. Add matters as they come in and use whichever modules help. The diary, drafts and billing sections work independently of each other.',
  },
  {
    q: 'Are the drafts formatted for actual filing?',
    a: 'Yes. Each template renders the petition on page one and its backing sheet as a genuine second page, folded so the docket faces outward — print it or download it as a Word file.',
  },
  {
    q: 'Can I add my own draft formats?',
    a: 'Yes. Paste an existing petition into the AI importer and it becomes a reusable fillable template alongside the built-in ones.',
  },
  {
    q: 'Where is my case data stored?',
    a: 'Against your own advocate account. Every case, client and draft is scoped to the logged-in advocate and is not shared with anyone else.',
  },
  {
    q: 'Does it work on my phone?',
    a: 'Yes — the whole workspace is responsive, so the diary and your checklists are readable from the corridor outside the courtroom.',
  },
];

/* ------------------------------------------------------------------
   Small building blocks
   ------------------------------------------------------------------ */

function Section({ id, className = '', band = false, flash = false, children }) {
  const [ref, inView] = useReveal();
  const classes = [
    'lp-section', 'reveal-up',
    inView && 'in-view',
    band && 'lp-band',
    flash && 'is-flash',
    className,
  ].filter(Boolean).join(' ');
  return <section id={id} ref={ref} className={classes}>{children}</section>;
}

function BrandMark() {
  return (
    <span className="lp-logo-mark">
      <img src="/logo.jpeg" alt="" width="50" height="50" decoding="async" />
    </span>
  );
}

function Eyebrow({ children }) {
  return <div className="lp-eyebrow"><span />{children}</div>;
}

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = setInterval(() => setI((v) => (v + 1) % ROTATING.length), 2200);
    return () => clearInterval(t);
  }, []);
  // No aria-live: the swap is decorative and announcing a new word every
  // 2.2s would talk over the rest of the page.
  return (
    <span className="lp-rotate">
      <span key={i} className="lp-rotate-word">{ROTATING[i]}</span>
    </span>
  );
}

function Stat({ value, prefix = '', suffix = '', label }) {
  const [ref, inView] = useReveal();
  const n = useCountUp(value, inView);
  return (
    <div ref={ref} className="lp-stat">
      <div className="lp-stat-num">{prefix}{n}{suffix}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

function Faq({ q, a, open, onToggle }) {
  return (
    <div className={`lp-faq${open ? ' is-open' : ''}`}>
      <button type="button" className="lp-faq-q" onClick={onToggle} aria-expanded={open}>
        <span>{q}</span>
        <span className="lp-faq-sign" aria-hidden="true" />
      </button>
      <div className="lp-faq-a"><p>{a}</p></div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Page
   ------------------------------------------------------------------ */

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const heroRef = useRef(null);
  const flashTimer = useRef(null);

  useEffect(() => {
    document.body.classList.add('landing-page');
    return () => document.body.classList.remove('landing-page');
  }, []);

  // Scroll spy: a section becomes current once it crosses the middle of
  // the viewport, which keeps the nav in step without flicking between
  // two sections at every boundary.
  useEffect(() => {
    const targets = NAV_SECTIONS
      .map((s) => document.getElementById(s.id))
      .filter(Boolean);
    if (!targets.length || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id); }),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    targets.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  // Jump to a section and flag it so the container plays its highlight.
  const jumpTo = (e, id) => {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    setMenuOpen(false);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    setActiveId(id);
    setFlashId(null);
    // Next frame, so re-clicking the same link restarts the animation.
    requestAnimationFrame(() => setFlashId(id));
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 1500);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Parallax drift on the hero art. Written straight to a custom property
  // so React never re-renders on scroll.
  useEffect(() => {
    const el = heroRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = null;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--drift', `${Math.min(window.scrollY, 600) * 0.06}px`);
        frame = null;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  return (
    <div className="lp">
      <div className="lp-mesh" aria-hidden="true">
        <span /><span /><span />
      </div>

      <header className={`lp-nav${scrolled ? ' is-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <Link to="/" className="lp-logo">
            <BrandMark />
            Advo<em>Buddy</em>
          </Link>

          <nav className={`lp-nav-links${menuOpen ? ' is-open' : ''}`}>
            {NAV_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => jumpTo(e, s.id)}
                className={activeId === s.id ? 'is-active' : undefined}
                aria-current={activeId === s.id ? 'location' : undefined}
              >
                {s.label}
              </a>
            ))}
          </nav>

          <div className="lp-nav-actions">
            <button
              type="button"
              className="lp-icon-btn lp-theme-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path className="sun-icon" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
                <path className="moon-icon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
            <Link to="/login" className="lp-btn lp-btn-ghost">Log in</Link>
            <Link to="/signup" className="lp-btn lp-btn-primary">Get started</Link>
            <button
              type="button"
              className={`lp-burger${menuOpen ? ' is-open' : ''}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="lp-hero lp-band">
        <div className="lp-hero-copy">
          <div className="lp-pill">
            <span className="lp-pill-dot" />
            Built with practising advocates
          </div>

          {/* Three stacked block lines rather than <br>-separated inline
              content, so all three share one line-height. The rotating
              word needs overflow:hidden to mask its reveal, and as an
              inline-block that made its box the odd one out. */}
          <h1>
            <span className="lp-title-line">Never miss</span>
            <RotatingWord />
            <span className="lp-title-line">again.</span>
          </h1>

          <p className="lp-hero-sub">
            Advo Buddy keeps your case diary, cause list, court-ready drafts and fees in
            one place — so the only thing you carry into court is your argument.
          </p>

          <div className="lp-hero-cta">
            <Link to="/signup" className="lp-btn lp-btn-primary lp-btn-lg">
              Start free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <a href="#how" className="lp-btn lp-btn-outline lp-btn-lg">See how it works</a>
          </div>

          <div className="lp-hero-meta">
            <span><Icon name="check" /> No card required</span>
            <span><Icon name="check" /> Works on any device</span>
          </div>
        </div>

        <div className="lp-hero-art" ref={heroRef}>
          <div className="lp-hero-glow" />
          <AppWindowMock />
          <div className="lp-float lp-float-a">
            <span className="lp-float-icon lp-float-icon-warn"><Icon name="bell" /></span>
            <div>
              <strong>Hearing tomorrow</strong>
              <small>O.S. 214/2024 · Item 6</small>
            </div>
          </div>
          <div className="lp-float lp-float-b">
            <span className="lp-float-icon lp-float-icon-ok"><Icon name="check" /></span>
            <div>
              <strong>Vakalat ready</strong>
              <small>Backing sheet attached</small>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Marquee ---------------- */}
      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track">
          {[0, 1].map((dup) => (
            <div className="lp-marquee-group" key={dup}>
              {['Bail applications', 'Vakalathnama', 'Memo of appearance', 'Cause-list diary', 'Process memo',
                'Surrender petition', 'Copy application', 'Fee ledger', 'Solvency memo', 'Case archive'].map((t) => (
                  <span key={t}>{t}<i /></span>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Why ---------------- */}
      <Section id="why" className="lp-why" flash={flashId === 'why'}>
        <div className="lp-why-copy">
          <Eyebrow>The problem</Eyebrow>
          <h2>A practice does not fail on argument. It fails on a missed date.</h2>
          <p>
            Dates live in one diary, briefs in another, drafts in an old folder on a laptop
            and fees in a notebook. Nothing talks to anything else, and the one adjournment
            you forget to copy across is the one that costs you.
          </p>
          <ul className="lp-check">
            <li><Icon name="check" /> Every matter in a single searchable place</li>
            <li><Icon name="check" /> The next date is never more than one screen away</li>
            <li><Icon name="check" /> Drafts that come out formatted for the registry</li>
          </ul>
        </div>
        <div className="lp-why-art">
          <PhoneMock />
        </div>
      </Section>

      {/* ---------------- Personas ---------------- */}
      <Section className="lp-personas" band>
        <div className="lp-head">
          <Eyebrow>Who it is for</Eyebrow>
          <h2>Built for the way advocates actually work</h2>
          <p>From a single-room chamber to a litigation team spread across benches.</p>
        </div>
        <div className="lp-persona-grid">
          {PERSONAS.map((p, i) => (
            <article key={p.title} className="lp-persona" style={{ '--i': i }}>
              <span className="lp-persona-icon"><Icon name={p.icon} /></span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
              <ul>{p.points.map((pt) => <li key={pt}><Icon name="check" />{pt}</li>)}</ul>
            </article>
          ))}
        </div>
      </Section>

      {/* ---------------- How it works ---------------- */}
      <Section id="how" className="lp-how" flash={flashId === 'how'}>
        <div className="lp-head">
          <Eyebrow>How it works</Eyebrow>
          <h2>Four steps, then it runs itself</h2>
        </div>
        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <div key={s.n} className="lp-step" style={{ '--i': i }}>
              <span className="lp-step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- Drafts ---------------- */}
      <Section id="drafts" className="lp-drafts" band flash={flashId === 'drafts'}>
        <div className="lp-drafts-art">
          <DraftPageMock />
          <div className="lp-badge-float">
            <strong>Page 2</strong>
            <small>Backing sheet, folded</small>
          </div>
        </div>
        <div className="lp-drafts-copy">
          <Eyebrow>DraftMitra</Eyebrow>
          <h2>Court-ready drafts, down to the fold</h2>
          <p>
            Pick a template, fill in the particulars and the draft comes out with the cause
            title aligned, the petition on page one and the docket on page two — folded so it
            faces outward exactly as it is filed.
          </p>
          <div className="lp-chips">
            {['Bail application', 'Vakalathnama', 'Memo of appearance', 'Surrender petition',
              'Advance petition', 'Process memo', 'Copy application', 'Solvency memo'].map((c) => (
                <span key={c}>{c}</span>
              ))}
            <span className="lp-chip-more">+ your own, imported by AI</span>
          </div>
          <Link to="/signup" className="lp-btn lp-btn-primary">Try the drafting suite</Link>
        </div>
      </Section>

      {/* ---------------- Stats ---------------- */}
      <Section className="lp-stats">
        <Stat value={13} label="Court-ready templates built in" />
        <Stat value={8} label="Workspace modules, one login" />
        <Stat value={2} suffix="-page" label="Drafts with the backing sheet attached" />
        <Stat value={0} prefix="₹" label="To start — no card required" />
      </Section>

      {/* ---------------- Modules ---------------- */}
      <Section id="modules" className="lp-modules" band flash={flashId === 'modules'}>
        <div className="lp-head">
          <Eyebrow>The workspace</Eyebrow>
          <h2>Everything the practice needs, nothing it does not</h2>
        </div>
        <div className="lp-module-grid">
          {MODULES.map((m, i) => (
            <article key={m.title} className="lp-module" style={{ '--i': i }}>
              <span className="lp-module-icon"><Icon name={m.icon} /></span>
              <h3>{m.title}</h3>
              <p>{m.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ---------------- Outcomes ---------------- */}
      <Section className="lp-outcomes">
        <div className="lp-head">
          <Eyebrow>Before & after</Eyebrow>
          <h2>What changes in the first week</h2>
        </div>
        <div className="lp-outcome-list">
          {OUTCOMES.map((o, i) => (
            <div key={o.after} className="lp-outcome" style={{ '--i': i }}>
              <div className="lp-outcome-before"><span>Before</span>{o.before}</div>
              <svg className="lp-outcome-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              <div className="lp-outcome-after"><span>After</span>{o.after}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- FAQ ---------------- */}
      <Section id="faq" className="lp-faqs" band flash={flashId === 'faq'}>
        <div className="lp-head">
          <Eyebrow>Questions</Eyebrow>
          <h2>Before you sign up</h2>
        </div>
        <div className="lp-faq-list">
          {FAQS.map((f, i) => (
            <Faq key={f.q} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
          ))}
        </div>
      </Section>

      {/* ---------------- Final CTA ---------------- */}
      <Section className="lp-cta">
        <div className="lp-cta-inner">
          <h2>Your next hearing is already on someone’s list.<br />Make sure it is yours.</h2>
          <p>Set up your first matter in under a minute.</p>
          <div className="lp-hero-cta">
            <Link to="/signup" className="lp-btn lp-btn-primary lp-btn-lg">
              Create your account
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <Link to="/login" className="lp-btn lp-btn-outline lp-btn-lg">I already have one</Link>
          </div>
        </div>
      </Section>

      {/* ---------------- Footer ---------------- */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <Link to="/" className="lp-logo">
              <BrandMark />
              Advo<em>Buddy</em>
            </Link>
            <p>The case diary, drafting desk and fee book for the working advocate.</p>
          </div>

          <div className="lp-footer-col">
            <h4>Workspace</h4>
            <a href="#modules">Court diary</a>
            <a href="#drafts">DraftMitra</a>
            <a href="#modules">Fee ledger</a>
            <a href="#modules">AI assistant</a>
          </div>

          <div className="lp-footer-col">
            <h4>Product</h4>
            <a href="#why">Why Advo Buddy</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="lp-footer-col">
            <h4>Account</h4>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Create account</Link>
            <Link to="/forgot-password">Reset password</Link>
          </div>
        </div>

        <div className="lp-footer-base">
          <span>© {new Date().getFullYear()} Advo Buddy. All rights reserved.</span>
          <span className="lp-footer-note">A drafting and diary aid — not a substitute for an advocate’s own review.</span>
        </div>
      </footer>
    </div>
  );
}
