import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useCountUp } from '../hooks/useCountUp';
import Icon from '../components/Icon';
import {
  AiPanelMock, AppWindowMock, DraftPageMock, ModuleMock, PhoneMock, ReminderPhoneMock,
} from '../components/LandingArt';
import {
  prefersReducedMotion, useCycle, useInView, useParallax, useScrollProgress, useSpotlight, useTilt,
} from './landing/motion';
import {
  AI_CAPABILITIES, DRAFT_FEATURES, DRAFT_GROUPS, FAQS, HERO_PROOF, MARQUEE_TERMS,
  MODULES, NAV_SECTIONS, PERSONAS, PRIVACY_POINTS, REMINDER_CHANNELS,
  REMINDER_WINDOWS, ROTATING, STEPS,
} from './landing/content';
import '../styles/Landing.css';

/* ------------------------------------------------------------------
   Every claim on this page lives in ./landing/content.js, where each
   one is annotated with the code that makes it true. Keep it that way:
   copy written inline here is copy nobody re-checks when a feature
   changes.
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   Small building blocks
   ------------------------------------------------------------------ */

function Section({ id, className = '', band = false, flash = false, children }) {
  const [ref, inView] = useInView();
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
  const [i] = useCycle(ROTATING.length, 2400);
  // No aria-live: the swap is decorative, and announcing a new word every
  // 2.4s would talk over the rest of the page.
  return (
    <span className="lp-rotate">
      <span key={i} className="lp-rotate-word">{ROTATING[i]}</span>
    </span>
  );
}

function Stat({ value, prefix = '', suffix = '', label, note }) {
  const [ref, inView] = useInView(0.4);
  const n = useCountUp(value, inView);
  return (
    <div ref={ref} className="lp-stat">
      <div className="lp-stat-num">{prefix}{n}{suffix}</div>
      <div className="lp-stat-label">{label}</div>
      {note && <div className="lp-stat-note">{note}</div>}
    </div>
  );
}

function Faq({ q, a, open, onToggle, id }) {
  return (
    <div className={`lp-faq${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="lp-faq-q"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`faq-a-${id}`}
        id={`faq-q-${id}`}
      >
        <span>{q}</span>
        <span className="lp-faq-sign" aria-hidden="true" />
      </button>
      <div className="lp-faq-a" id={`faq-a-${id}`} role="region" aria-labelledby={`faq-q-${id}`}>
        <p>{a}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Workspace explorer

   Eight modules, one preview pane. It advances on its own so a visitor
   who never touches it still sees more than one module — and stops for
   good the moment they pick a tab themselves, because a panel that
   keeps moving under a reader is worse than one that never moved.
   ------------------------------------------------------------------ */

function WorkspaceExplorer() {
  const [ref, inView] = useInView(0.25);
  const [locked, setLocked] = useState(false);
  const [active, setActive] = useCycle(MODULES.length, 5600, inView && !locked);
  const tabsRef = useRef(null);

  const pick = (i) => {
    setLocked(true);
    setActive(i);
  };

  // Roving focus, as the tablist pattern expects: arrows move between
  // tabs, Home/End jump to the ends.
  const onKeyDown = (e) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 };
    let next = null;
    if (keys[e.key]) next = (active + keys[e.key] + MODULES.length) % MODULES.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = MODULES.length - 1;
    if (next === null) return;
    e.preventDefault();
    pick(next);
    tabsRef.current?.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  const current = MODULES[active];

  return (
    <div ref={ref} className={`lp-explorer${inView ? ' in-view' : ''}`}>
      <div
        className="lp-tabs"
        role="tablist"
        aria-label="Workspace modules"
        ref={tabsRef}
        onKeyDown={onKeyDown}
      >
        {MODULES.map((m, i) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            id={`tab-${m.id}`}
            aria-selected={active === i}
            aria-controls={`panel-${m.id}`}
            tabIndex={active === i ? 0 : -1}
            className={`lp-tab${active === i ? ' is-active' : ''}`}
            style={{ '--i': i }}
            onClick={() => pick(i)}
          >
            <span className="lp-tab-icon"><Icon name={m.icon} /></span>
            <span className="lp-tab-label">{m.tab}</span>
            {/* Progress hairline: only the live tab, and only while it
                is still advancing on its own. */}
            {active === i && !locked && inView && <span className="lp-tab-timer" aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div
        className="lp-explorer-panel"
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
        tabIndex={-1}
      >
        {/* key on the module id so React swaps the subtree and the
            entry animation replays for each module. */}
        <div className="lp-explorer-copy" key={`c-${current.id}`}>
          <h3>{current.title}</h3>
          <p>{current.body}</p>
          <ul>
            {current.points.map((pt) => (
              <li key={pt}><Icon name="check" />{pt}</li>
            ))}
          </ul>
        </div>
        <div className="lp-explorer-art" key={`a-${current.id}`}>
          <ModuleMock name={current.mock} label={`${current.tab} — ${current.title}`} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Reminders — the channel picker mirrors the real Settings screen, so
   what a visitor plays with here is what they will configure later.
   ------------------------------------------------------------------ */

function ReminderPicker() {
  const [channel, setChannel] = useState('whatsapp');
  const [days, setDays] = useState(3);
  const active = REMINDER_CHANNELS.find((c) => c.id === channel);

  return (
    <div className="lp-reminder-panel">
      <div className="lp-field">
        <span className="lp-field-label">Reminder channel</span>
        <div className="lp-segment" role="group" aria-label="Reminder channel">
          {REMINDER_CHANNELS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`lp-segment-btn${channel === c.id ? ' is-active' : ''}`}
              onClick={() => setChannel(c.id)}
              aria-pressed={channel === c.id}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="lp-field-help" key={channel}>{active.body}</p>
      </div>

      <div className="lp-field">
        <span className="lp-field-label">How far ahead</span>
        <div className="lp-days" role="group" aria-label="Days before the hearing">
          {REMINDER_WINDOWS.map((d) => (
            <button
              key={d}
              type="button"
              className={`lp-day${days === d ? ' is-active' : ''}`}
              onClick={() => setDays(d)}
              aria-pressed={days === d}
            >
              {d}
            </button>
          ))}
          <span className="lp-days-unit">day{days > 1 ? 's' : ''} before</span>
        </div>
      </div>

      <div className="lp-reminder-preview" aria-live="polite">
        <span className="lp-reminder-icon"><Icon name="bell" /></span>
        <p>
          {active.label} alert, <strong>{days} day{days > 1 ? 's' : ''}</strong> before every hearing —
          set once in your profile, sent by the daily dispatch.
        </p>
      </div>
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
  const flashTimer = useRef(null);

  const [progressRef, scrolledFar] = useScrollProgress();
  const heroRef = useParallax(0.06);
  const tiltRef = useTilt(5);
  const personaGrid = useSpotlight('.lp-persona');
  const moduleGrid = useSpotlight('.lp-privacy-card');
  const draftGrid = useSpotlight('.lp-draft-item');

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on Escape, the way every other dismissible
  // surface in the app behaves.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Jump to a section and flag it so the container plays its highlight.
  const jumpTo = (e, id) => {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    setMenuOpen(false);
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    setActiveId(id);
    setFlashId(null);
    // Next frame, so re-clicking the same link restarts the animation.
    requestAnimationFrame(() => setFlashId(id));
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 1500);
  };

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <div className="lp" ref={progressRef}>
      <div className="lp-mesh" aria-hidden="true">
        <span /><span /><span />
      </div>
      <div className="lp-grain" aria-hidden="true" />

      <header className={`lp-nav${scrolled ? ' is-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <Link to="/" className="lp-logo">
            <BrandMark />
            Advo<em>Buddy</em>
          </Link>

          <nav className={`lp-nav-links${menuOpen ? ' is-open' : ''}`}>
            {NAV_SECTIONS.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => jumpTo(e, s.id)}
                className={activeId === s.id ? 'is-active' : undefined}
                aria-current={activeId === s.id ? 'location' : undefined}
                style={{ '--i': i }}
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
        {/* Reading progress, driven off --progress on .lp */}
        <div className="lp-progress" aria-hidden="true"><i /></div>
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
            Advo Buddy keeps your case board, cause-list diary, court-ready drafts and fees in
            one place — so the only thing you carry into court is your argument.
          </p>

          <div className="lp-hero-cta">
            <Link to="/signup" className="lp-btn lp-btn-primary lp-btn-lg">
              Start free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <a href="#workspace" className="lp-btn lp-btn-outline lp-btn-lg" onClick={(e) => jumpTo(e, 'workspace')}>
              See the workspace
            </a>
          </div>

          <div className="lp-hero-meta">
            <span><Icon name="check" /> No card required</span>
            <span><Icon name="check" /> Works on any device</span>
            <span><Icon name="check" /> Export your data any time</span>
          </div>

          <dl className="lp-proof">
            {HERO_PROOF.map((p, i) => (
              <div key={p.v} style={{ '--i': i }}>
                <dt>{p.k}</dt>
                <dd>{p.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lp-hero-art" ref={heroRef}>
          <div className="lp-hero-glow" />
          <div className="lp-hero-tilt" ref={tiltRef}>
            <AppWindowMock />
          </div>
          <div className="lp-float lp-float-a">
            <span className="lp-float-icon lp-float-icon-warn"><Icon name="bell" /></span>
            <div>
              <strong>Hearing tomorrow</strong>
              <small>S.T.C. 214/2025 · Item 6</small>
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
              {MARQUEE_TERMS.map((t) => <span key={t}>{t}<i /></span>)}
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
            <li><Icon name="check" /> A record of every change, in case the date is disputed</li>
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
        <div className="lp-persona-grid" ref={personaGrid}>
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
      <Section className="lp-how">
        <div className="lp-head">
          <Eyebrow>How it works</Eyebrow>
          <h2>Four steps, then it runs itself</h2>
        </div>
        <div className="lp-steps">
          <span className="lp-steps-rail" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <div key={s.n} className="lp-step" style={{ '--i': i }}>
              <span className="lp-step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- Workspace explorer ---------------- */}
      <Section id="workspace" className="lp-workspace" band flash={flashId === 'workspace'}>
        <div className="lp-head">
          <Eyebrow>The workspace</Eyebrow>
          <h2>Eight modules, one login</h2>
          <p>Everything the practice needs, and nothing it does not. Pick one to look inside.</p>
        </div>
        <WorkspaceExplorer />
      </Section>

      {/* ---------------- Drafts ---------------- */}
      <Section id="drafts" className="lp-drafts" flash={flashId === 'drafts'}>
        <div className="lp-drafts-top">
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
              Pick a template, fill in the particulars, and the draft comes out with the cause
              title aligned, the petition on page one and the docket on page two — folded so it
              faces outward exactly as it is filed.
            </p>
            <div className="lp-draft-features">
              {DRAFT_FEATURES.map((f, i) => (
                <div key={f.t} className="lp-draft-feature" style={{ '--i': i }}>
                  <span><Icon name={f.icon} /></span>
                  <div>
                    <strong>{f.t}</strong>
                    <p>{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/signup" className="lp-btn lp-btn-primary">Try the drafting suite</Link>
          </div>
        </div>

        <div className="lp-draft-library" ref={draftGrid}>
          <div className="lp-library-head">
            <h3>The thirteen built in</h3>
            <p>
              Modelled on Tamil Nadu district-court and Madras High Court practice. Section
              references follow the codes in force — Section 480 B.N.S.S. for bail, 72(2) for a
              recall of warrant, 355 for exemption from appearance.
            </p>
          </div>
          {DRAFT_GROUPS.map((g, gi) => (
            <div key={g.group} className="lp-draft-group" style={{ '--i': gi }}>
              <h4>{g.group}<span>{g.items.length}</span></h4>
              <div className="lp-draft-items">
                {g.items.map((it, i) => (
                  <article key={it.name} className="lp-draft-item" style={{ '--i': i }}>
                    <strong>{it.name}</strong>
                    <small>{it.sub}</small>
                  </article>
                ))}
              </div>
            </div>
          ))}
          <p className="lp-draft-foot">
            <Icon name="info" />
            Anything not in the set, you can add: paste a petition you already file and the AI
            importer turns it into a fillable template of your own.
          </p>
        </div>
      </Section>

      {/* ---------------- Reminders ---------------- */}
      <Section id="reminders" className="lp-reminders" band flash={flashId === 'reminders'}>
        <div className="lp-reminders-copy">
          <Eyebrow>Reminders</Eyebrow>
          <h2>The date reaches you before the court does</h2>
          <p>
            Choose how you want to be told and how much warning you want. A daily dispatch job
            reads the board and sends the alerts, so a hearing cannot creep up while you are
            three courts away.
          </p>
          <ReminderPicker />
          <p className="lp-reminders-note">
            <Icon name="phone" />
            There is also a WhatsApp button on every case card, for telling a client the next
            date the moment it changes.
          </p>
        </div>
        <div className="lp-reminders-art">
          <ReminderPhoneMock />
        </div>
      </Section>

      {/* ---------------- AI ---------------- */}
      <Section id="ai" className="lp-ai" flash={flashId === 'ai'}>
        <div className="lp-head">
          <Eyebrow>Assisted, not automated</Eyebrow>
          <h2>An assistant that reads the file first</h2>
          <p>Optional throughout — the diary, drafts, tasks and ledger all work with it left alone.</p>
        </div>
        <div className="lp-ai-grid">
          <div className="lp-ai-list">
            {AI_CAPABILITIES.map((c, i) => (
              <article key={c.title} className="lp-ai-card" style={{ '--i': i }}>
                <span className="lp-ai-icon"><Icon name={c.icon} /></span>
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                  {c.chips && (
                    <div className="lp-ai-chips">
                      {c.chips.map((ch) => <span key={ch}>{ch}</span>)}
                    </div>
                  )}
                </div>
              </article>
            ))}
            <p className="lp-ai-caveat">
              <Icon name="warning" />
              Every draft and summary is an aid to your own review. Check the section references
              and the facts before anything is signed or filed.
            </p>
          </div>
          <div className="lp-ai-art">
            <AiPanelMock />
            <div className="lp-ai-formats">
              {['PDF', 'DOCX', 'TXT'].map((f) => <span key={f}>{f}</span>)}
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------- Stats ---------------- */}
      <Section className="lp-stats" band>
        <Stat value={13} label="Court-ready templates built in" note="Across petitions, bail and vakalat" />
        <Stat value={8} label="Workspace modules, one login" note="Diary, board, clients, tasks, fees, archive, audit, profile" />
        <Stat value={5} label="Reminder windows to choose from" note="1, 2, 3, 5 or 7 days before" />
        <Stat value={0} prefix="₹" label="To start — no card required" note="Export your data whenever you want" />
      </Section>

      {/* ---------------- Privacy ---------------- */}
      <Section className="lp-privacy" band>
        <div className="lp-head">
          <Eyebrow>Private by design</Eyebrow>
          <h2>Your file stays your file</h2>
          <p>
            A client’s papers are not marketing material, and an advocate’s practice is not a
            listing. Advo Buddy is back-office software and stays on that side of the line.
          </p>
        </div>
        <div className="lp-privacy-grid" ref={moduleGrid}>
          {PRIVACY_POINTS.map((p, i) => (
            <article key={p.t} className="lp-privacy-card" style={{ '--i': i }}>
              <span className="lp-privacy-icon"><Icon name={p.icon} /></span>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ---------------- FAQ ---------------- */}
      <Section id="faq" className="lp-faqs" flash={flashId === 'faq'}>
        <div className="lp-head">
          <Eyebrow>Questions</Eyebrow>
          <h2>Before you sign up</h2>
        </div>
        <div className="lp-faq-list">
          {FAQS.map((f, i) => (
            <Faq
              key={f.q}
              id={i}
              q={f.q}
              a={f.a}
              open={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
            />
          ))}
        </div>
      </Section>

      {/* ---------------- Team ---------------- */}
      <Section className="lp-team" band>
        <div className="lp-team-art">
          <picture>
            <source srcSet="/hero-team.webp" type="image/webp" />
            <img
              src="/hero-team.png"
              alt="A group of advocates in court dress"
              width="1200"
              height="772"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
        <div className="lp-team-copy">
          <Eyebrow>The people behind it</Eyebrow>
          <h2>Shaped by advocates, not guessed at from outside</h2>
          <p>
            Every screen in Advo Buddy went past the practising advocates who agreed to test it
            first — the cause-list format, the drafting templates, the reminder windows. If a
            workflow felt wrong to them, it changed before anyone else saw it.
          </p>
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
            <p>The case board, drafting desk and fee book for the working advocate.</p>
          </div>

          <div className="lp-footer-col">
            <h4>Workspace</h4>
            <a href="#workspace" onClick={(e) => jumpTo(e, 'workspace')}>Court diary</a>
            <a href="#workspace" onClick={(e) => jumpTo(e, 'workspace')}>Case board</a>
            <a href="#workspace" onClick={(e) => jumpTo(e, 'workspace')}>Fee ledger</a>
            <a href="#workspace" onClick={(e) => jumpTo(e, 'workspace')}>Audit trail</a>
          </div>

          <div className="lp-footer-col">
            <h4>Product</h4>
            <a href="#why" onClick={(e) => jumpTo(e, 'why')}>Why Advo Buddy</a>
            <a href="#drafts" onClick={(e) => jumpTo(e, 'drafts')}>DraftMitra</a>
            <a href="#reminders" onClick={(e) => jumpTo(e, 'reminders')}>Reminders</a>
            <a href="#ai" onClick={(e) => jumpTo(e, 'ai')}>AI assistant</a>
            <a href="#faq" onClick={(e) => jumpTo(e, 'faq')}>FAQ</a>
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
          <span className="lp-footer-note">
            A drafting and diary aid — not legal advice, and not a substitute for an advocate’s
            own review.
          </span>
        </div>
      </footer>

      <button
        type="button"
        className={`lp-totop${scrolledFar ? ' is-shown' : ''}`}
        onClick={toTop}
        aria-label="Back to top"
        tabIndex={scrolledFar ? 0 : -1}
      >
        <svg className="lp-totop-ring" viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="20" />
          <circle cx="22" cy="22" r="20" className="lp-totop-arc" />
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
      </button>
    </div>
  );
}
