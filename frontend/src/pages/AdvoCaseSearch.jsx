import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';
import '../styles/AdvoCaseSearch.css';

const INDIAN_STATES = [
  { code: 'ALL', label: 'All High Courts & District Courts' },
  { code: 'KA', label: 'Karnataka (High Court & City Civil)' },
  { code: 'MH', label: 'Maharashtra (Bombay HC & District Courts)' },
  { code: 'DL', label: 'Delhi (Delhi HC & District Courts)' },
  { code: 'TN', label: 'Tamil Nadu (Madras HC & City Civil)' },
  { code: 'TS', label: 'Telangana (High Court & District Courts)' },
  { code: 'WB', label: 'West Bengal (Calcutta HC & City Civil)' },
  { code: 'UP', label: 'Uttar Pradesh (Allahabad HC & District)' },
  { code: 'GJ', label: 'Gujarat (Gujarat HC & District Courts)' },
  { code: 'KL', label: 'Kerala (Kerala HC & District Courts)' },
];

const POPULAR_PREFIXES = [
  { label: 'Karnataka', prefix: 'KAR/' },
  { label: 'Maharashtra', prefix: 'MS/' },
  { label: 'Delhi', prefix: 'D/' },
  { label: 'Tamil Nadu', prefix: 'TN/' },
  { label: 'Uttar Pradesh', prefix: 'UP/' },
  { label: 'West Bengal', prefix: 'WB/' },
  { label: 'Telangana', prefix: 'TS/' },
  { label: 'Gujarat', prefix: 'GJ/' },
];

const STAGE_MILESTONES = ['Filing', 'Notice', 'Evidence', 'Arguments', 'Orders'];

function getStageStepIndex(stageName) {
  if (!stageName) return 1;
  const s = stageName.toLowerCase();
  if (s.includes('filing') || s.includes('admission') || s.includes('registration')) return 0;
  if (s.includes('notice') || s.includes('summons') || s.includes('appearance') || s.includes('written statement')) return 1;
  if (s.includes('evidence') || s.includes('issues') || s.includes('examination') || s.includes('pw-') || s.includes('dw-')) return 2;
  if (s.includes('argument') || s.includes('hearing') || s.includes('injunction')) return 3;
  if (s.includes('order') || s.includes('judgment') || s.includes('pronouncement') || s.includes('disposed')) return 4;
  return 2;
}

export default function AdvoCaseSearch() {
  const { advocate } = useAuth();
  const addFlash = useFlash();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Search & Session State
  const [barNumber, setBarNumber] = useState('MS/4321/2018');
  const [selectedState, setSelectedState] = useState('ALL');
  const [sessionId, setSessionId] = useState(null);
  const [captchaImage, setCaptchaImage] = useState(null);
  const [captchaText, setCaptchaText] = useState('');
  const [cases, setCases] = useState([]);
  const [existingCasesMap, setExistingCasesMap] = useState(new Map());
  const [selectedCaseNumbers, setSelectedCaseNumbers] = useState(new Set());
  const [expandedCase, setExpandedCase] = useState(null);
  const [copiedCnr, setCopiedCnr] = useState(null);

  // Recent searches in localStorage
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('advo_recent_bar_searches') || '[]');
    } catch {
      return [];
    }
  });

  // Filters & Views
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'new' | 'civil' | 'criminal' | 'urgent'
  const [filterQuery, setFilterQuery] = useState('');

  // Loading & Progress States
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [importedStatus, setImportedStatus] = useState(null);

  // Auto-fill from advocate profile on mount
  useEffect(() => {
    if (advocate?.bar_council_number && barNumber === 'MS/4321/2018') {
      setBarNumber(advocate.bar_council_number);
    }
  }, [advocate]);

  // Load existing cases to identify duplicates & conflicts
  useEffect(() => {
    api.get('/dashboard')
      .then((data) => {
        const caseMap = new Map();
        const list = [
          ...(data.overdue || []),
          ...(data.today || []),
          ...(data.this_week || []),
          ...(data.upcoming || []),
        ];
        list.forEach((c) => {
          if (c.case_number) {
            caseMap.set(c.case_number.trim().toUpperCase(), c);
          }
        });
        setExistingCasesMap(caseMap);
      })
      .catch(() => {});
  }, []);

  // Save to recent searches
  const saveToRecent = (num) => {
    const clean = num.trim().toUpperCase();
    if (!clean) return;
    const updated = [clean, ...recentSearches.filter((item) => item !== clean)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('advo_recent_bar_searches', JSON.stringify(updated));
    } catch {}
  };

  // Trigger celebration particle confetti
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const emojis = ['⚖️', '🏛️', '✨', '📜', '🎉', '🌟', '💼'];
    const particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 300,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.9) * 18,
        gravity: 0.45,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: Math.random() * 16 + 18,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        alpha: 1,
      });
    }

    let animFrame;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.alpha -= 0.012;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.font = `${p.size}px serif`;
          ctx.textAlign = 'center';
          ctx.fillText(p.emoji, 0, 0);
          ctx.restore();
        }
      });

      if (alive) {
        animFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    render();
  };

  // Compute Active Step
  const currentStep = useMemo(() => {
    if (cases.length > 0) return 3;
    if (captchaImage) return 2;
    return 1;
  }, [captchaImage, cases]);

  // Step 1: Start Search
  const handleStartSearch = async (e) => {
    if (e) e.preventDefault();
    const cleanBar = barNumber.trim();
    if (!cleanBar) {
      addFlash('Please enter an Advocate Bar Council Registration Number.', 'warning');
      return;
    }

    setLoadingSearch(true);
    setCases([]);
    setImportedStatus(null);
    setCaptchaText('');

    try {
      const res = await api.post('/ecourts/start-search', {
        barNumber: cleanBar,
        state: selectedState,
      });

      setSessionId(res.sessionId);
      setCaptchaImage(res.captchaImage);
      saveToRecent(cleanBar);
      addFlash('eCourts query session active! Please solve the security verification challenge below.', 'info');
    } catch (err) {
      addFlash(err.message || 'Could not connect to eCourts service.', 'error');
    } finally {
      setLoadingSearch(false);
    }
  };

  // Refresh Captcha
  const handleRefreshCaptcha = async () => {
    if (!sessionId) return;
    setLoadingRefresh(true);
    try {
      const res = await api.post('/ecourts/refresh-captcha', { sessionId });
      setCaptchaImage(res.captchaImage);
      setCaptchaText('');
      addFlash('New verification captcha code loaded.', 'info');
    } catch (err) {
      addFlash(err.message || 'Failed to refresh captcha.', 'error');
    } finally {
      setLoadingRefresh(false);
    }
  };

  // Audio Help for Captcha
  const handleSpeakCaptcha = () => {
    if (!('speechSynthesis' in window)) {
      addFlash('Speech synthesis not supported in this browser.', 'warning');
      return;
    }
    const msg = new SpeechSynthesisUtterance('Please enter the security verification characters shown on your screen.');
    msg.rate = 0.95;
    window.speechSynthesis.speak(msg);
  };

  // Step 2: Submit Captcha & Fetch Cases
  const handleSubmitCaptcha = async (e) => {
    if (e) e.preventDefault();
    if (!captchaText.trim()) {
      addFlash('Please type the captcha characters before submitting.', 'warning');
      return;
    }

    setLoadingCaptcha(true);
    try {
      const res = await api.post('/ecourts/submit-captcha', {
        sessionId,
        captchaText: captchaText.trim(),
        advocateName: advocate?.name || '',
      });

      if (res.status === 'retry') {
        setCaptchaImage(res.captchaImage);
        setCaptchaText('');
        addFlash(res.message || 'Captcha code mismatch. A new challenge has been generated.', 'warning');
        return;
      }

      if (res.status === 'success') {
        const fetchedCases = res.cases || [];
        setCases(fetchedCases);

        // Pre-select all un-imported cases by default
        const toSelect = new Set();
        fetchedCases.forEach((c) => {
          if (!existingCasesMap.has(c.case_number.trim().toUpperCase())) {
            toSelect.add(c.case_number);
          }
        });
        setSelectedCaseNumbers(toSelect);

        addFlash(`Session verified! Retrieved ${fetchedCases.length} case(s) from eCourts registry.`, 'success');
      }
    } catch (err) {
      addFlash(err.message || 'Verification failed. Please retry.', 'error');
    } finally {
      setLoadingCaptcha(false);
    }
  };

  // Copy CNR Number to clipboard
  const handleCopyCnr = (cnr, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(cnr);
    setCopiedCnr(cnr);
    addFlash(`Copied CNR Number: ${cnr}`, 'info');
    setTimeout(() => setCopiedCnr(null), 2000);
  };

  // Toggle selection
  const toggleCaseSelect = (caseNumber) => {
    const next = new Set(selectedCaseNumbers);
    if (next.has(caseNumber)) {
      next.delete(caseNumber);
    } else {
      next.add(caseNumber);
    }
    setSelectedCaseNumbers(next);
  };

  // Toggle Select All / Unselect All
  const handleToggleSelectAll = () => {
    if (selectedCaseNumbers.size === filteredCases.length) {
      setSelectedCaseNumbers(new Set());
    } else {
      const all = new Set();
      filteredCases.forEach((c) => all.add(c.case_number));
      setSelectedCaseNumbers(all);
    }
  };

  // Step 3: Save / Import Cases
  const handleImportCases = async () => {
    const casesToImport = cases.filter((c) => selectedCaseNumbers.has(c.case_number));
    if (casesToImport.length === 0) {
      addFlash('Please select at least one case to import into your diary.', 'warning');
      return;
    }

    setLoadingImport(true);
    try {
      const res = await api.post('/ecourts/import', { cases: casesToImport });
      setImportedStatus(res);

      // Update existing case numbers map
      const updatedExisting = new Map(existingCasesMap);
      casesToImport.forEach((c) => {
        updatedExisting.set(c.case_number.trim().toUpperCase(), c);
      });
      setExistingCasesMap(updatedExisting);

      // Trigger Confetti Celebration!
      triggerConfetti();

      if (res.conflicts && res.conflicts.length > 0) {
        addFlash(`Notice: ${res.conflicts.length} hearing date conflict(s) detected with your active schedule!`, 'warning');
      }
      addFlash(res.message, 'success');
    } catch (err) {
      addFlash(err.message || 'Failed to import cases.', 'error');
    } finally {
      setLoadingImport(false);
    }
  };

  // Helper to calculate days until hearing
  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    const hearing = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((hearing - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Filtered cases based on search & category
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const isExisting = existingCasesMap.has(c.case_number.trim().toUpperCase());
      const daysUntil = getDaysUntil(c.next_hearing_date);

      // Category filter
      if (filterType === 'new' && isExisting) return false;
      if (filterType === 'civil' && !c.case_type?.toLowerCase().includes('civil') && !c.case_type?.toLowerCase().includes('suit')) return false;
      if (filterType === 'criminal' && !c.case_type?.toLowerCase().includes('criminal') && !c.case_type?.toLowerCase().includes('cc') && !c.case_type?.toLowerCase().includes('bail')) return false;
      if (filterType === 'urgent' && (daysUntil === null || daysUntil > 7)) return false;

      // Query Search
      if (!filterQuery) return true;
      const q = filterQuery.toLowerCase();
      const haystack = [
        c.case_number,
        c.client_name,
        c.parties,
        c.court_name,
        c.case_type,
        c.case_stage,
        c.cnr_number,
        c.judge_name,
        c.opposing_counsel,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [cases, filterType, filterQuery, existingCasesMap]);

  // Statistics
  const stats = useMemo(() => {
    const total = cases.length;
    const newCount = cases.filter((c) => !existingCasesMap.has(c.case_number.trim().toUpperCase())).length;
    const existingCount = total - newCount;
    const nextDates = cases.map((c) => c.next_hearing_date).filter(Boolean).sort();
    return {
      total,
      newCount,
      existingCount,
      earliestHearing: nextDates[0] || 'None',
    };
  }, [cases, existingCasesMap]);

  return (
    <div className="ecourts-page-wrap">
      <canvas ref={canvasRef} className="ecourts-confetti-canvas" />
      <div className="ecourts-ambient-glow" />

      {/* Top Breadcrumb & Live Security Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, position: 'relative', zIndex: 1 }}>
        <Link to="/" className="back-link" style={{ marginBottom: 0 }}>
          <Icon name="back" />
          Back to Dashboard
        </Link>
        <div className="ecourts-live-status-badge">
          <span className="ecourts-ping-dot" />
          NJDG & High Court Gateway Live
        </div>
      </div>

      {/* Hero Card */}
      <div className="ecourts-hero-card">
        <div className="ecourts-hero-header">
          <div className="ecourts-hero-title-group">
            <div className="ecourts-hero-icon-badge">⚖️</div>
            <div>
              <h1 className="ecourts-hero-title">eCourts Advocate Case Search & Import</h1>
              <p className="ecourts-hero-subtitle">
                Directly interface with the National Judicial Data Grid to query all registered causes, track CNR numbers, and sync live hearing schedules to your diary.
              </p>
            </div>
          </div>
        </div>

        <div className="ecourts-hero-chips">
          <span className="ecourts-chip">🏛️ 3,000+ Court Complexes</span>
          <span className="ecourts-chip">🔒 Encrypted Government Session</span>
          <span className="ecourts-chip">⚡ 1-Click Multi-Case Import</span>
          <span className="ecourts-chip">📅 Automatic Hearing Schedule Sync</span>
          <span className="ecourts-chip">🔍 Conflict Detection Guard</span>
        </div>
      </div>

      {/* Interactive Step Progress Stepper */}
      <div className="ecourts-stepper-wrap">
        <div className={`ecourts-step-tab ${currentStep === 1 ? 'is-active' : ''} ${currentStep > 1 ? 'is-completed' : ''}`}>
          <div className="ecourts-step-num">{currentStep > 1 ? '✓' : '1'}</div>
          <div>
            <div className="ecourts-step-title">Bar Council Number</div>
            <div className="ecourts-step-desc">Enter Advocate Credentials</div>
          </div>
        </div>

        <div className={`ecourts-step-tab ${currentStep === 2 ? 'is-active' : ''} ${currentStep > 2 ? 'is-completed' : ''}`}>
          <div className="ecourts-step-num">{currentStep > 2 ? '✓' : '2'}</div>
          <div>
            <div className="ecourts-step-title">Security Captcha</div>
            <div className="ecourts-step-desc">Verify Human Operator</div>
          </div>
        </div>

        <div className={`ecourts-step-tab ${currentStep === 3 ? 'is-active' : ''}`}>
          <div className="ecourts-step-num">3</div>
          <div>
            <div className="ecourts-step-title">Review & Import</div>
            <div className="ecourts-step-desc">Sync to Advo Buddy Diary</div>
          </div>
        </div>
      </div>

      {/* STEP 1: Search Form Panel */}
      <div className="ecourts-panel-card">
        <div className="ecourts-panel-header">
          <h3 className="ecourts-panel-title">
            <Icon name="court" style={{ color: 'var(--accent)' }} />
            Step 1: Advocate Bar Registration Details
          </h3>
          {advocate?.bar_council_number && (
            <button
              type="button"
              className="btn-edit"
              onClick={() => setBarNumber(advocate.bar_council_number)}
              style={{ fontSize: 12, padding: '5px 12px' }}
            >
              Autofill from Profile ({advocate.bar_council_number})
            </button>
          )}
        </div>

        <form onSubmit={handleStartSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="bar-number-input">
                Advocate Bar Council Number <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="bar-number-input"
                type="text"
                className="form-control"
                placeholder="e.g. MS/4321/2018 or KAR/1234/2021"
                value={barNumber}
                onChange={(e) => setBarNumber(e.target.value.toUpperCase())}
                disabled={loadingSearch || loadingCaptcha}
                required
                style={{ fontWeight: 600, letterSpacing: 0.5 }}
              />

              {/* Quick Format Chips */}
              <div className="ecourts-quick-prefixes">
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quick Format:</span>
                {POPULAR_PREFIXES.map((item) => (
                  <button
                    key={item.prefix}
                    type="button"
                    className="ecourts-prefix-btn"
                    onClick={() => setBarNumber(`${item.prefix}4321/${new Date().getFullYear() - 2}`)}
                  >
                    {item.label} ({item.prefix})
                  </button>
                ))}
              </div>

              {/* Recent Searches Chips */}
              {recentSearches.length > 0 && (
                <div className="ecourts-recent-history-row">
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>🕒 Recent:</span>
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="ecourts-history-pill"
                      onClick={() => setBarNumber(item)}
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem('advo_recent_bar_searches');
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="state-select">Court Jurisdiction Filter</label>
              <select
                id="state-select"
                className="form-control"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                disabled={loadingSearch || loadingCaptcha}
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.label}</option>
                ))}
              </select>
              <span className="field-hint" style={{ marginTop: 6, display: 'block' }}>
                Select a specific state court complex or leave as All Courts for full scan.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="submit"
              className="btn-submit"
              style={{ width: 'auto', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}
              disabled={loadingSearch || loadingCaptcha}
            >
              {loadingSearch ? (
                <>Connecting to eCourts…</>
              ) : (
                <>
                  <Icon name="search" /> Query eCourts Registry &rarr;
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* STEP 2: Captcha Verification Card */}
      {captchaImage && cases.length === 0 && (
        <div className="ecourts-panel-card" style={{ border: '2px solid var(--accent)', animation: 'fadeIn 0.3s ease' }}>
          <div className="ecourts-panel-header">
            <h3 className="ecourts-panel-title">
              <span style={{ color: 'var(--warning)', fontSize: 20 }}>🛡️</span>
              Step 2: Security Verification (CAPTCHA)
            </h3>
            <span className="badge-pill" style={{ background: 'rgba(234, 179, 8, 0.15)', color: 'var(--warning)', fontWeight: 700 }}>
              Security Protocol
            </span>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 18 }}>
            eCourts security protocol requires solving this CAPTCHA to verify that queries are initiated by authorized advocates.
          </p>

          <form onSubmit={handleSubmitCaptcha}>
            <div className="ecourts-captcha-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div className="ecourts-captcha-img-holder">
                  <img
                    src={captchaImage}
                    alt="eCourts Security Captcha"
                    style={{ height: 48, width: 170, objectFit: 'contain', display: 'block' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={handleRefreshCaptcha}
                    disabled={loadingRefresh || loadingCaptcha}
                    title="Generate a new captcha image"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px' }}
                  >
                    <Icon name="refresh" className={loadingRefresh ? 'spinning' : ''} />
                    {loadingRefresh ? 'Reloading…' : 'Reload'}
                  </button>

                  <button
                    type="button"
                    className="btn-edit"
                    onClick={handleSpeakCaptcha}
                    title="Listen to audio assistance"
                    style={{ padding: '9px 14px' }}
                  >
                    🔊 Help
                  </button>
                </div>
              </div>

              <div className="ecourts-captcha-input-group">
                <label htmlFor="captcha-input" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Enter the 5 characters shown
                </label>
                <input
                  id="captcha-input"
                  type="text"
                  className="form-control ecourts-captcha-input"
                  placeholder="CODE"
                  value={captchaText}
                  onChange={(e) => setCaptchaText(e.target.value)}
                  disabled={loadingCaptcha}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="submit"
                className="btn-submit"
                style={{ width: 'auto', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}
                disabled={loadingCaptcha}
              >
                {loadingCaptcha ? (
                  <>Validating Session…</>
                ) : (
                  <>
                    <Icon name="check" /> Confirm & Retrieve Cases
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Results, Filter Bar & Case Grid */}
      {cases.length > 0 && (
        <div className="ecourts-panel-card" style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Header & Stats Ribbon */}
          <div className="ecourts-panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16, marginBottom: 18 }}>
            <div>
              <h3 className="ecourts-panel-title">
                <span style={{ color: 'var(--success)' }}>📋</span>
                Step 3: Cases Found for Bar No. {barNumber}
              </h3>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {selectedCaseNumbers.size} of {filteredCases.length} case(s) selected for import
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-edit"
                onClick={() => window.print()}
                title="Print or Export Cause List"
                style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🖨️ Print Cause List
              </button>

              <button
                type="button"
                className="btn-edit"
                onClick={handleToggleSelectAll}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600 }}
              >
                {selectedCaseNumbers.size === filteredCases.length ? 'Deselect All' : 'Select All'}
              </button>

              <button
                type="button"
                className="btn-submit"
                onClick={handleImportCases}
                disabled={loadingImport || selectedCaseNumbers.size === 0}
                style={{ width: 'auto', padding: '8px 22px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}
              >
                {loadingImport ? (
                  <>Saving…</>
                ) : (
                  <>
                    <Icon name="download" /> Import Selected ({selectedCaseNumbers.size})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats Ribbon */}
          <div className="ecourts-stats-ribbon">
            <div className="ecourts-stat-cell">
              <div className="ecourts-stat-val" style={{ color: 'var(--accent)' }}>{stats.total}</div>
              <div className="ecourts-stat-lbl">Total Scraped Matters</div>
            </div>
            <div className="ecourts-stat-cell">
              <div className="ecourts-stat-val" style={{ color: 'var(--info)' }}>{stats.newCount}</div>
              <div className="ecourts-stat-lbl">New (Ready to Import)</div>
            </div>
            <div className="ecourts-stat-cell">
              <div className="ecourts-stat-val" style={{ color: 'var(--success)' }}>{stats.existingCount}</div>
              <div className="ecourts-stat-lbl">Already in Diary</div>
            </div>
            <div className="ecourts-stat-cell">
              <div className="ecourts-stat-val" style={{ color: '#8b5cf6', fontSize: 16 }}>{stats.earliestHearing}</div>
              <div className="ecourts-stat-lbl">Earliest Next Date</div>
            </div>
          </div>

          {/* Search, Filter Tabs & View Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
            {/* Search Input */}
            <div className="search-box" style={{ maxWidth: 360, width: '100%', margin: 0 }}>
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search case no, client, court, or stage..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn-export ${filterType === 'all' ? 'active-view' : ''}`}
                onClick={() => setFilterType('all')}
                style={{ padding: '6px 14px', fontSize: 12.5 }}
              >
                All ({cases.length})
              </button>
              <button
                type="button"
                className={`btn-export ${filterType === 'new' ? 'active-view' : ''}`}
                onClick={() => setFilterType('new')}
                style={{ padding: '6px 14px', fontSize: 12.5 }}
              >
                New Only ({stats.newCount})
              </button>
              <button
                type="button"
                className={`btn-export ${filterType === 'urgent' ? 'active-view' : ''}`}
                onClick={() => setFilterType('urgent')}
                style={{ padding: '6px 14px', fontSize: 12.5 }}
              >
                🔥 Urgent (&le;7d)
              </button>
              <button
                type="button"
                className={`btn-export ${filterType === 'civil' ? 'active-view' : ''}`}
                onClick={() => setFilterType('civil')}
                style={{ padding: '6px 14px', fontSize: 12.5 }}
              >
                Civil
              </button>
              <button
                type="button"
                className={`btn-export ${filterType === 'criminal' ? 'active-view' : ''}`}
                onClick={() => setFilterType('criminal')}
                style={{ padding: '6px 14px', fontSize: 12.5 }}
              >
                Criminal
              </button>
            </div>

            {/* View Switcher */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className={`btn-export ${viewMode === 'grid' ? 'active-view' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid Card View"
                style={{ padding: '6px 12px' }}
              >
                Grid View
              </button>
              <button
                type="button"
                className={`btn-export ${viewMode === 'table' ? 'active-view' : ''}`}
                onClick={() => setViewMode('table')}
                title="Tabular View"
                style={{ padding: '6px 12px' }}
              >
                Table View
              </button>
            </div>
          </div>

          {/* Success Result Banner after Import */}
          {importedStatus && (
            <div className="ecourts-success-card">
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#15803d', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🎉</span> {importedStatus.message}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {importedStatus.imported_count} new cases added • {importedStatus.updated_count} existing cases updated with latest court stages.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn-submit"
                  onClick={() => navigate('/')}
                  style={{ padding: '8px 20px', fontSize: 13 }}
                >
                  Open Dashboard &rarr;
                </button>
                <button
                  type="button"
                  className="btn-edit"
                  onClick={() => navigate('/diary')}
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  View Court Diary
                </button>
              </div>
            </div>
          )}

          {/* VIEW 1: GRID CARD VIEW */}
          {viewMode === 'grid' && (
            <div className="ecourts-case-grid">
              {filteredCases.map((c) => {
                const isExisting = existingCasesMap.has(c.case_number.trim().toUpperCase());
                const isSelected = selectedCaseNumbers.has(c.case_number);
                const isExpanded = expandedCase === c.case_number;
                const daysUntil = getDaysUntil(c.next_hearing_date);
                const stageIndex = getStageStepIndex(c.case_stage);

                return (
                  <div
                    key={c.case_number}
                    className={`ecourts-case-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => toggleCaseSelect(c.case_number)}
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="ecourts-card-top">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleCaseSelect(c.case_number);
                            }}
                            style={{ cursor: 'pointer', transform: 'scale(1.2)', marginTop: 3 }}
                          />
                          <div>
                            <div className="ecourts-case-num">{c.case_number}</div>
                            <div
                              className="ecourts-cnr-tag"
                              onClick={(e) => handleCopyCnr(c.cnr_number, e)}
                              title="Click to copy CNR number"
                            >
                              <span>CNR: {c.cnr_number}</span>
                              <span>{copiedCnr === c.cnr_number ? '✓' : '📋'}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {isExisting ? (
                            <span className="badge-pill" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', fontWeight: 700 }}>
                              ✓ In Diary
                            </span>
                          ) : (
                            <span className="badge-pill" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent)', fontWeight: 700 }}>
                              Ready
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Parties Box */}
                      <div className="ecourts-parties-box">
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>
                          PARTIES / LITIGANTS
                        </div>
                        <div style={{ fontWeight: 600 }}>{c.client_name || c.parties}</div>
                      </div>

                      {/* Court & Stage */}
                      <div style={{ fontSize: 12.5, color: 'var(--text-dark)', fontWeight: 500, marginBottom: 4 }}>
                        🏛️ {c.court_name}
                      </div>

                      {/* Stage Progress Tracker */}
                      <div className="ecourts-stage-progress-track" title={`Current Stage: ${c.case_stage}`}>
                        {STAGE_MILESTONES.map((step, idx) => (
                          <div
                            key={step}
                            className={`ecourts-stage-step ${idx < stageIndex ? 'is-done' : ''} ${idx === stageIndex ? 'is-current' : ''}`}
                          >
                            <div className="ecourts-stage-step-dot" />
                            <span className="ecourts-stage-step-label">{step}</span>
                          </div>
                        ))}
                      </div>

                      {/* Expandable Details Drawer */}
                      {isExpanded && (
                        <div className="ecourts-details-drawer" onClick={(e) => e.stopPropagation()}>
                          <div className="ecourts-detail-item">
                            <span className="ecourts-detail-key">Hon'ble Judge:</span>
                            <span className="ecourts-detail-val">{c.judge_name}</span>
                          </div>
                          <div className="ecourts-detail-item">
                            <span className="ecourts-detail-key">Court Room / Hall:</span>
                            <span className="ecourts-detail-val">{c.court_hall} (Item #{c.item_number})</span>
                          </div>
                          <div className="ecourts-detail-item">
                            <span className="ecourts-detail-key">Opposing Counsel:</span>
                            <span className="ecourts-detail-val">
                              {c.opposing_counsel}
                              {c.opposing_counsel_phone && (
                                <a
                                  href={`tel:${c.opposing_counsel_phone}`}
                                  style={{ marginLeft: 6, color: 'var(--accent)', textDecoration: 'none' }}
                                  title="Call opposing counsel"
                                >
                                  📞 {c.opposing_counsel_phone}
                                </a>
                              )}
                            </span>
                          </div>
                          <div className="ecourts-detail-item">
                            <span className="ecourts-detail-key">Matter Type:</span>
                            <span className="ecourts-detail-val">{c.case_type}</span>
                          </div>
                          <div className="ecourts-detail-item">
                            <span className="ecourts-detail-key">Current Stage:</span>
                            <span className="ecourts-detail-val" style={{ color: 'var(--accent)' }}>{c.case_stage}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata & Expand Toggle */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, marginTop: 14 }}>
                      <div className="ecourts-card-meta-row">
                        <div className={`ecourts-hearing-pill ${daysUntil !== null && daysUntil <= 3 ? 'ecourts-hearing-urgent' : ''}`}>
                          <Icon name="calendar" style={{ width: 14, height: 14 }} />
                          Next: {c.next_hearing_date}
                          {daysUntil !== null && (
                            <span style={{ fontSize: 10.5, opacity: 0.85 }}>
                              ({daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow!' : `in ${daysUntil}d`})
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCase(isExpanded ? null : c.case_number);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '2px 6px',
                          }}
                        >
                          {isExpanded ? 'Hide Details ▲' : 'Details ▼'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: COMPACT TABULAR VIEW */}
          {viewMode === 'table' && (
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 14px', width: 44, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={filteredCases.length > 0 && selectedCaseNumbers.size === filteredCases.length}
                        onChange={handleToggleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-dark)' }}>Case & CNR</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-dark)' }}>Parties</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-dark)' }}>Court & Stage</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-dark)' }}>Next Date</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-dark)', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((c) => {
                    const isExisting = existingCasesMap.has(c.case_number.trim().toUpperCase());
                    const isSelected = selectedCaseNumbers.has(c.case_number);
                    const daysUntil = getDaysUntil(c.next_hearing_date);

                    return (
                      <tr
                        key={c.case_number}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCaseSelect(c.case_number)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{c.case_number}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {c.cnr_number}
                          </div>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{c.client_name || c.parties}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Opp: {c.opposing_counsel}</div>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <div>{c.court_name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{c.case_stage}</div>
                        </td>
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: 'var(--accent)' }}>
                            {c.next_hearing_date}
                            {daysUntil !== null && daysUntil <= 3 && (
                              <span style={{ marginLeft: 6, color: '#e11d48', fontSize: 11, fontWeight: 700 }}>
                                (Urgent)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{c.court_hall}</div>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          {isExisting ? (
                            <span className="badge-pill" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', fontWeight: 700 }}>
                              In Diary
                            </span>
                          ) : (
                            <span className="badge-pill" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent)', fontWeight: 700 }}>
                              Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredCases.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: 12 }}>
              No court matters found matching your filter criteria.
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Action Bar when items are selected */}
      {selectedCaseNumbers.size > 0 && (
        <div className="ecourts-floating-action-bar">
          <div className="ecourts-floating-info">
            <span className="ecourts-selection-bubble">{selectedCaseNumbers.size}</span>
            <span>cases selected for diary sync</span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="btn-submit"
              onClick={handleImportCases}
              disabled={loadingImport}
              style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700 }}
            >
              {loadingImport ? <>Importing…</> : <>⚡ Sync {selectedCaseNumbers.size} Cases to Diary</>}
            </button>
          </div>
        </div>
      )}

      {/* Educational Judicial Infrastructure Notice */}
      <div style={{ marginTop: 34, padding: 22, background: 'var(--bg-main)', borderRadius: 14, border: '1px dashed var(--border-color)', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <strong>🏛️ National Judicial Data Grid (NJDG) Direct Interface:</strong>
        <p style={{ margin: '6px 0 0 0' }}>
          Advo Buddy synchronizes with the official eCourts Services protocol. All retrieved case filings, orders, and hearing dates are indexed under your advocate profile for real-time diary management, conflict warning alerts, and client billing records.
        </p>
      </div>
    </div>
  );
}
