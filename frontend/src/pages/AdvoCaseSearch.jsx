import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';

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

export default function AdvoCaseSearch() {
  const { advocate } = useAuth();
  const addFlash = useFlash();
  const navigate = useNavigate();

  const [barNumber, setBarNumber] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [sessionId, setSessionId] = useState(null);
  const [captchaImage, setCaptchaImage] = useState(null);
  const [captchaText, setCaptchaText] = useState('');
  const [cases, setCases] = useState([]);
  const [existingCaseNumbers, setExistingCaseNumbers] = useState(new Set());
  const [selectedCaseNumbers, setSelectedCaseNumbers] = useState(new Set());
  const [expandedCase, setExpandedCase] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [importedStatus, setImportedStatus] = useState(null);

  // Initialize bar number from advocate profile if available
  useEffect(() => {
    if (advocate?.bar_council_number && !barNumber) {
      setBarNumber(advocate.bar_council_number);
    }
  }, [advocate]);

  // Load existing cases to mark duplicates
  useEffect(() => {
    api.get('/dashboard')
      .then((data) => {
        const existing = new Set();
        const list = [...(data.overdue || []), ...(data.today || []), ...(data.this_week || []), ...(data.upcoming || [])];
        list.forEach((c) => {
          if (c.case_number) existing.add(c.case_number.trim().toUpperCase());
        });
        setExistingCaseNumbers(existing);
      })
      .catch(() => {});
  }, []);

  // Step 1: Start Search
  const handleStartSearch = async (e) => {
    if (e) e.preventDefault();
    const cleanBar = barNumber.trim();
    if (!cleanBar) {
      addFlash('Please enter your Advocate Bar Council Registration Number.', 'warning');
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
      addFlash('eCourts session initiated. Please solve the security captcha below.', 'info');
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
      addFlash('Captcha reloaded with a new code.', 'info');
    } catch (err) {
      addFlash(err.message || 'Failed to refresh captcha.', 'error');
    } finally {
      setLoadingRefresh(false);
    }
  };

  // Text-to-speech for captcha accessibility
  const handleSpeakCaptcha = () => {
    if (!('speechSynthesis' in window)) {
      addFlash('Speech synthesis not supported in this browser.', 'warning');
      return;
    }
    const msg = new SpeechSynthesisUtterance('Please enter the verification letters displayed on screen.');
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
  };

  // Step 2: Submit Captcha & Fetch Cases
  const handleSubmitCaptcha = async (e) => {
    if (e) e.preventDefault();
    if (!captchaText.trim()) {
      addFlash('Please enter the captcha characters before submitting.', 'warning');
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
        addFlash(res.message || 'Captcha did not match. Please try the new captcha code.', 'warning');
        return;
      }

      if (res.status === 'success') {
        const fetchedCases = res.cases || [];
        setCases(fetchedCases);

        // Select non-existing cases by default
        const toSelect = new Set();
        fetchedCases.forEach((c) => {
          if (!existingCaseNumbers.has(c.case_number.trim().toUpperCase())) {
            toSelect.add(c.case_number);
          }
        });
        setSelectedCaseNumbers(toSelect);

        addFlash(`Found ${fetchedCases.length} case(s) for Bar No: ${res.barNumber}`, 'success');
      }
    } catch (err) {
      addFlash(err.message || 'Verification failed. Please retry.', 'error');
    } finally {
      setLoadingCaptcha(false);
    }
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

  // Toggle Select All
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
      addFlash('Please select at least one case to import.', 'warning');
      return;
    }

    setLoadingImport(true);
    try {
      const res = await api.post('/ecourts/import', { cases: casesToImport });
      setImportedStatus(res);

      // Update existing case numbers
      const updatedExisting = new Set(existingCaseNumbers);
      casesToImport.forEach((c) => updatedExisting.add(c.case_number.trim().toUpperCase()));
      setExistingCaseNumbers(updatedExisting);

      if (res.conflicts && res.conflicts.length > 0) {
        addFlash(`Warning: ${res.conflicts.length} hearing date conflict(s) detected with your active schedule!`, 'warning');
      }
      addFlash(res.message, 'success');
    } catch (err) {
      addFlash(err.message || 'Failed to import cases.', 'error');
    } finally {
      setLoadingImport(false);
    }
  };

  // Filtered cases
  const filteredCases = useMemo(() => {
    if (!filterQuery) return cases;
    const q = filterQuery.toLowerCase();
    return cases.filter((c) => {
      const haystack = [
        c.case_number,
        c.client_name,
        c.parties,
        c.court_name,
        c.case_type,
        c.case_stage,
        c.cnr_number,
        c.opposing_counsel,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [cases, filterQuery]);

  return (
    <div className="form-container" style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Breadcrumb / Back Link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Link to="/" className="back-link" style={{ marginBottom: 0 }}>
          <Icon name="back" />
          Back to Dashboard
        </Link>
        <span className="badge-pill" style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontWeight: 600, padding: '4px 12px' }}>
          🏛️ eCourts Services Live Portal
        </span>
      </div>

      {/* Header */}
      <div className="form-header staggered-entry">
        <h2>eCourts Advocate Case Search</h2>
        <p>Look up all active court matters registered under your Bar Council Number and seamlessly import them into your Advo Buddy diary.</p>
      </div>

      {/* Step 1: Bar Number Search Panel */}
      <div className="card-form staggered-entry" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 18, background: 'var(--accent)', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</span>
          <h3 style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)' }}>Enter Advocate Bar Registration Number</h3>
        </div>

        <form onSubmit={handleStartSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="bar-number-input">
                Bar Council Number <span style={{ color: 'var(--danger)' }}>*</span>
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
              />
              <span className="field-hint">Standard format: State/Roll Number/Year</span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="state-select">Court Jurisdiction (Optional)</label>
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
              <span className="field-hint">Select a specific state court complex or search all</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="submit"
              className="btn-submit"
              style={{ width: 'auto', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8 }}
              disabled={loadingSearch || loadingCaptcha}
            >
              {loadingSearch ? (
                <>Searching eCourts…</>
              ) : (
                <>
                  <Icon name="search" /> Fetch eCourts Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Step 2: Captcha Verification Modal/Card */}
      {captchaImage && cases.length === 0 && (
        <div className="card-form staggered-entry" style={{ padding: '24px 28px', marginBottom: 24, border: '2px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, background: 'var(--warning)', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</span>
              <h3 style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)' }}>Security Verification (CAPTCHA)</h3>
            </div>
            <span className="badge-pill" style={{ background: 'rgba(234, 179, 8, 0.15)', color: 'var(--warning)', fontWeight: 600 }}>
              Official eCourts Protocol
            </span>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 16 }}>
            Government court servers require manual verification to confirm a human advocate is querying court records.
          </p>

          <form onSubmit={handleSubmitCaptcha}>
            <div style={{ background: 'var(--bg-main)', padding: 18, borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
                <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
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
                    title="Get a new captcha code"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px' }}
                  >
                    <Icon name="refresh" className={loadingRefresh ? 'spinning' : ''} />
                    {loadingRefresh ? 'Refreshing…' : 'Reload Code'}
                  </button>

                  <button
                    type="button"
                    className="btn-edit"
                    onClick={handleSpeakCaptcha}
                    title="Audio accessibility help"
                    style={{ padding: '8px 12px' }}
                  >
                    🔊 Help
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0, maxWidth: 320 }}>
                <label htmlFor="captcha-input">
                  Enter the characters shown above <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="captcha-input"
                  type="text"
                  className="form-control"
                  placeholder="Type 5-letter code"
                  value={captchaText}
                  onChange={(e) => setCaptchaText(e.target.value)}
                  disabled={loadingCaptcha}
                  autoFocus
                  required
                  style={{ letterSpacing: 2, fontSize: 16, fontWeight: 600 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="submit"
                className="btn-submit"
                style={{ width: 'auto', padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 8 }}
                disabled={loadingCaptcha}
              >
                {loadingCaptcha ? (
                  <>Verifying with eCourts…</>
                ) : (
                  <>
                    <Icon name="check" /> Verify & View Cases
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Retrieved Cases Table & Import Panel */}
      {cases.length > 0 && (
        <div className="card-form staggered-entry" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18, borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, background: 'var(--success)', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)' }}>
                  Court Cases Retrieved ({cases.length})
                </h3>
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Advocate Bar No: <strong>{barNumber}</strong> • {selectedCaseNumbers.size} of {filteredCases.length} selected for import
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                className="btn-edit"
                onClick={handleToggleSelectAll}
                style={{ padding: '7px 14px', fontSize: 13 }}
              >
                {selectedCaseNumbers.size === filteredCases.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={handleImportCases}
                disabled={loadingImport || selectedCaseNumbers.size === 0}
                style={{ width: 'auto', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}
              >
                {loadingImport ? (
                  <>Saving to Diary…</>
                ) : (
                  <>
                    <Icon name="download" /> Import Selected ({selectedCaseNumbers.size})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Filter Box */}
          <div className="search-box" style={{ marginBottom: 16, width: '100%', maxWidth: 420 }}>
            <Icon name="search" />
            <input
              type="text"
              placeholder="Filter by case no, client name, stage, or court..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>

          {/* Table of Cases */}
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 20 }}>
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
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-dark)' }}>Case Details</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-dark)' }}>Parties / Litigants</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-dark)' }}>Court & Stage</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-dark)' }}>Next Hearing</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-dark)', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => {
                  const isExisting = existingCaseNumbers.has(c.case_number.trim().toUpperCase());
                  const isSelected = selectedCaseNumbers.has(c.case_number);
                  const isExpanded = expandedCase === c.case_number;

                  return (
                    <tr
                      key={c.case_number}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '14px', textAlign: 'center', verticalAlign: 'top' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCaseSelect(c.case_number)}
                          style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                        />
                      </td>

                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: 14 }}>
                          {c.case_number}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          CNR: <span style={{ fontFamily: 'monospace' }}>{c.cnr_number}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedCase(isExpanded ? null : c.case_number)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent)',
                            fontSize: 12,
                            padding: 0,
                            marginTop: 4,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          {isExpanded ? 'Hide Details ▲' : 'View Court Details ▼'}
                        </button>

                        {isExpanded && (
                          <div style={{ marginTop: 8, padding: 8, background: 'var(--bg-main)', borderRadius: 6, fontSize: 12, lineHeight: 1.6 }}>
                            <div><strong>Judge:</strong> {c.judge_name}</div>
                            <div><strong>Court Room:</strong> {c.court_hall}</div>
                            <div><strong>Opposing Counsel:</strong> {c.opposing_counsel} ({c.opposing_counsel_phone})</div>
                            <div><strong>Type:</strong> {c.case_type}</div>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                          {c.client_name || c.parties}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          Opp: {c.opposing_counsel}
                        </div>
                      </td>

                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ color: 'var(--text-dark)' }}>{c.court_name}</div>
                        <div style={{ marginTop: 4 }}>
                          <span className="badge-pill" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', fontSize: 11.5, color: 'var(--text-muted)' }}>
                            {c.case_stage}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '14px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontWeight: 600 }}>
                          <Icon name="calendar" style={{ width: 14, height: 14 }} />
                          {c.next_hearing_date}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                          Item #{c.item_number}
                        </div>
                      </td>

                      <td style={{ padding: '14px', verticalAlign: 'top', textAlign: 'right' }}>
                        {isExisting ? (
                          <span className="badge-pill" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', fontWeight: 600 }}>
                            ✓ In Diary
                          </span>
                        ) : (
                          <span className="badge-pill" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--info)', fontWeight: 600 }}>
                            Ready to Import
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredCases.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No cases match your search filter "{filterQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Import Actions Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, background: 'var(--bg-main)', padding: '16px 20px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                Ready to sync with your Advo Buddy account
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Imported cases will be added to your daily hearing schedule, client directory, and conflict detector.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn-submit"
                onClick={handleImportCases}
                disabled={loadingImport || selectedCaseNumbers.size === 0}
                style={{ width: 'auto', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {loadingImport ? (
                  <>Saving Cases…</>
                ) : (
                  <>
                    <Icon name="download" /> Save {selectedCaseNumbers.size} Cases to Advo Buddy
                  </>
                )}
              </button>

              {importedStatus && (
                <button
                  type="button"
                  className="btn-edit"
                  onClick={() => navigate('/')}
                  style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon name="checklist" /> Open Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Information Box */}
      <div style={{ marginTop: 28, padding: 18, background: 'var(--bg-main)', borderRadius: 8, border: '1px dashed var(--border-color)', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <strong>ℹ️ How eCourts Search Works:</strong>
        <p style={{ margin: '6px 0 0 0' }}>
          This tool interfaces with the National Judicial Data Grid (NJDG) & eCourts Services infrastructure. The visual CAPTCHA verification confirms security compliance before querying case status by Bar Council Registration Number. All imported records remain private to your advocate account.
        </p>
      </div>
    </div>
  );
}
