import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  Clock,
  CheckCircle2,
  BookOpen,
  Search,
  LayoutGrid,
  List,
  Upload,
  FileText,
  Check,
  Calendar,
  AlertTriangle,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import Icon from '../components/Icon';
import StatCard from '../components/StatCard';
import { parseEcourtsExport, SAMPLE_ECOURTS_EXPORT_TXT } from '../utils/ecourtsParser';
import '../styles/AdvoCaseSearch.css';

const STAGE_MILESTONES = ['Filing', 'Notice', 'Evidence', 'Arguments', 'Orders'];

function getStageStepIndex(stageName) {
  if (!stageName) return 1;
  const s = stageName.toLowerCase();
  if (s.includes('filing') || s.includes('admission') || s.includes('registration')) return 0;
  if (s.includes('notice') || s.includes('summons') || s.includes('appearance') || s.includes('written statement')) return 1;
  if (s.includes('evidence') || s.includes('issues') || s.includes('examination') || s.includes('pw-') || s.includes('dw-')) return 2;
  if (s.includes('argument') || s.includes('hearing') || s.includes('injunction') || s.includes('heard')) return 3;
  if (s.includes('order') || s.includes('judgment') || s.includes('pronouncement') || s.includes('disposed') || s.includes('acquitted')) return 4;
  return 2;
}

function formatCourtName(name, district) {
  if (!name) return 'District Court';
  const parts = name.split(',').map((s) => s.trim()).filter(Boolean);
  const uniqueParts = [];
  parts.forEach((p) => {
    if (!uniqueParts.some((u) => u.toLowerCase() === p.toLowerCase())) {
      uniqueParts.push(p);
    }
  });
  let clean = uniqueParts.join(', ');
  if (district && !clean.toLowerCase().includes(district.toLowerCase())) {
    clean += ` (${district})`;
  }
  return clean;
}

export default function AdvoCaseSearch() {
  const { advocate } = useAuth();
  const addFlash = useFlash();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cases State
  const [cases, setCases] = useState([]);
  const [fileMeta, setFileMeta] = useState(null); // { filename, size, total }
  const [existingCasesMap, setExistingCasesMap] = useState(new Map());
  const [selectedCaseNumbers, setSelectedCaseNumbers] = useState(new Set());
  const [expandedCase, setExpandedCase] = useState(null);
  const [copiedCnr, setCopiedCnr] = useState(null);

  // UI / View State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'pending' | 'disposed' | 'new'
  const [searchQuery, setSearchQuery] = useState('');

  // Dropzone & Paste State
  const [fileDragActive, setFileDragActive] = useState(false);
  const [pasteDrawerOpen, setPasteDrawerOpen] = useState(false);
  const [rawPasteInput, setRawPasteInput] = useState('');
  const [loadingFileParse, setLoadingFileParse] = useState(false);

  // Import Action State
  const [loadingImport, setLoadingImport] = useState(false);
  const [importedStatus, setImportedStatus] = useState(null);

  // Load existing cases to identify duplicates & conflicts
  const refreshExistingCases = () => {
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
  };

  useEffect(() => {
    refreshExistingCases();
  }, []);

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

  // Process and ingest parsed case objects
  const handleParsedResults = (parsedList, sourceMeta) => {
    if (!parsedList || parsedList.length === 0) {
      addFlash('No case records could be extracted from this content.', 'error');
      return;
    }

    setCases(parsedList);
    setFileMeta(sourceMeta);

    // Auto-select pending / new cases for easy import
    const newSelectSet = new Set();
    parsedList.forEach((c) => {
      const key = (c.case_number || '').trim().toUpperCase();
      if (!existingCasesMap.has(key)) {
        newSelectSet.add(c.case_number);
      }
    });

    if (newSelectSet.size === 0) {
      parsedList.forEach((c) => newSelectSet.add(c.case_number));
    }

    setSelectedCaseNumbers(newSelectSet);
    addFlash(`Successfully parsed ${parsedList.length} case(s) from eCourts export!`, 'success');
  };

  // Parse text directly using fast client parser, with backend API fallback
  const processRawText = async (text, filename = 'exported_cases.txt') => {
    setLoadingFileParse(true);
    try {
      // 1. Try local client-side parser
      const clientParsed = parseEcourtsExport(text);
      if (clientParsed && clientParsed.length > 0) {
        handleParsedResults(clientParsed, {
          filename,
          size: `${(text.length / 1024).toFixed(1)} KB`,
          total: clientParsed.length,
        });
        setPasteDrawerOpen(false);
        setRawPasteInput('');
        return;
      }
    } catch (clientErr) {
      console.warn('Client parse fallback triggered:', clientErr);
    }

    // 2. Fallback to Flask backend parser endpoint
    try {
      const res = await api.post('/ecourts/parse-file', { content: text });
      if (res && res.cases && res.cases.length > 0) {
        handleParsedResults(res.cases, {
          filename: res.filename || filename,
          size: `${(text.length / 1024).toFixed(1)} KB`,
          total: res.totalCases || res.cases.length,
        });
        setPasteDrawerOpen(false);
        setRawPasteInput('');
      } else {
        addFlash('No valid eCourts case structures recognized in this content.', 'error');
      }
    } catch (apiErr) {
      addFlash(apiErr.message || 'Failed to parse file. Please check file format.', 'error');
    } finally {
      setLoadingFileParse(false);
    }
  };

  // Handle uploaded file
  const handleFileUpload = async (file) => {
    if (!file) return;
    setLoadingFileParse(true);

    try {
      const text = await file.text();
      await processRawText(text, file.name);
    } catch (err) {
      // Fallback to FormData multipart upload
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/ecourts/parse-file', formData, { isForm: true });
        if (res?.cases?.length) {
          handleParsedResults(res.cases, {
            filename: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            total: res.cases.length,
          });
        } else {
          addFlash('Could not extract cases from uploaded file.', 'error');
        }
      } catch (uploadErr) {
        addFlash(uploadErr.message || 'File upload parsing failed.', 'error');
      }
    } finally {
      setLoadingFileParse(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFileDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFileDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFileDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Clear all parsed cases
  const handleClearCases = () => {
    setCases([]);
    setFileMeta(null);
    setSelectedCaseNumbers(new Set());
    setImportedStatus(null);
  };

  // Copy CNR Number to clipboard
  const handleCopyCnr = (cnr, e) => {
    e?.stopPropagation();
    if (!cnr) return;
    navigator.clipboard.writeText(cnr).then(() => {
      setCopiedCnr(cnr);
      setTimeout(() => setCopiedCnr(null), 2200);
    });
  };

  // Toggle individual case selection
  const toggleCaseSelection = (caseNum) => {
    setSelectedCaseNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(caseNum)) {
        next.delete(caseNum);
      } else {
        next.add(caseNum);
      }
      return next;
    });
  };

  // Select all / select pending / deselect all
  const handleSelectAll = () => {
    if (selectedCaseNumbers.size === filteredCases.length) {
      setSelectedCaseNumbers(new Set());
    } else {
      setSelectedCaseNumbers(new Set(filteredCases.map((c) => c.case_number)));
    }
  };

  const handleSelectPendingOnly = () => {
    const pendingNums = cases.filter((c) => !c.is_disposed).map((c) => c.case_number);
    setSelectedCaseNumbers(new Set(pendingNums));
  };

  const handleSelectNewOnly = () => {
    const newNums = cases
      .filter((c) => !existingCasesMap.has((c.case_number || '').trim().toUpperCase()))
      .map((c) => c.case_number);
    setSelectedCaseNumbers(new Set(newNums));
  };

  // Filter and search logic
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const caseNumUpper = (c.case_number || '').trim().toUpperCase();
      const isAlreadyInDiary = existingCasesMap.has(caseNumUpper);

      // Filter Tab Matching
      if (filterType === 'pending' && c.is_disposed) return false;
      if (filterType === 'disposed' && !c.is_disposed) return false;
      if (filterType === 'new' && isAlreadyInDiary) return false;

      // Text Search Matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const searchableText = [
          c.case_number,
          c.cnr_number,
          c.client_name,
          c.petitioner,
          c.respondent,
          c.lpetparty_name,
          c.lresparty_name,
          c.court_name,
          c.district,
          c.judge_name,
          c.case_stage,
          c.case_type,
          c.disposition,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(q)) return false;
      }

      return true;
    });
  }, [cases, filterType, searchQuery, existingCasesMap]);

  // Statistics
  const stats = useMemo(() => {
    const total = cases.length;
    const pending = cases.filter((c) => !c.is_disposed).length;
    const disposed = cases.filter((c) => c.is_disposed).length;
    const alreadyInDiary = cases.filter((c) =>
      existingCasesMap.has((c.case_number || '').trim().toUpperCase())
    ).length;
    const readyToImport = total - alreadyInDiary;
    return { total, pending, disposed, alreadyInDiary, readyToImport };
  }, [cases, existingCasesMap]);

  // Import Selected Cases to Advocate's Diary
  const handleImportSelected = async () => {
    const casesToImport = cases.filter((c) => selectedCaseNumbers.has(c.case_number));
    if (casesToImport.length === 0) {
      addFlash('Please select at least one case to import into your diary.', 'error');
      return;
    }

    setLoadingImport(true);
    setImportedStatus(null);

    try {
      const payload = {
        cases: casesToImport.map((c) => ({
          case_number: c.case_number,
          cnr_number: c.cnr_number,
          client_name: c.client_name || c.parties || 'Client',
          petitioner: c.petitioner || '',
          respondent: c.respondent || '',
          client_phone: c.client_phone || '',
          client_email: c.client_email || '',
          court_name: c.court_name || 'District Court',
          court_hall: c.court_hall || '',
          item_number: c.item_number || '',
          case_type: c.case_type || 'Civil',
          case_stage: c.case_stage || 'Filing / Registration',
          judge_name: c.judge_name || '',
          next_hearing_date: c.next_hearing_date || '',
          opposing_counsel: c.opposing_counsel || '',
          opposing_counsel_phone: c.opposing_counsel_phone || '',
          notes: c.notes || `eCourts Export (CNR: ${c.cnr_number || 'N/A'})`,
          total_fee: c.total_fee || 0,
          fee_paid: c.fee_paid || 0,
          expenses: c.expenses || 0,
        })),
      };

      const res = await api.post('/ecourts/import', payload);
      setImportedStatus(res);
      addFlash(res.message || 'Cases successfully imported and synchronized with your dashboard!', 'success');
      triggerConfetti();
      refreshExistingCases();
    } catch (err) {
      addFlash(err.message || 'Failed to import cases. Please try again.', 'error');
    } finally {
      setLoadingImport(false);
    }
  };

  return (
    <div className="ecourts-page-wrap">
      {/* Celebration Confetti Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />

      {/* Ambient Backdrop Glow */}
      <div className="ecourts-ambient-glow" />

      {/* HERO MASTHEAD */}
      <section className="ecourts-hero-card staggered-entry">
        {/* Top Breadcrumb / Return to Dashboard Navigation */}
        <div className="ecourts-hero-nav-bar">
          <Link to="/" className="btn-hero-back" title="Return to Main Dashboard">
            <span style={{ fontSize: 16 }}>←</span>
            <span>Back to Dashboard</span>
          </Link>
          <div className="ecourts-hero-breadcrumb">
            <Link to="/" className="breadcrumb-link">Dashboard</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">eCourts File Import</span>
          </div>
        </div>

        <div className="ecourts-hero-header">
          <div className="ecourts-hero-title-group">
            <div className="ecourts-hero-icon-badge">
              <span>🏛️</span>
            </div>
            <div>
              <h1 className="ecourts-hero-title">eCourts File Import & Sync</h1>
              <p className="ecourts-hero-subtitle">
                Import official Indian eCourts case export files, extract bilingual English & Tamil party details, and sync cases directly into your advocate diary.
              </p>
            </div>
          </div>

          <div className="ecourts-hero-actions">
            <Link to="/" className="btn-hero-action-dashboard" title="Return to Dashboard">
              <span>🏠</span>
              <span>Dashboard</span>
            </Link>
            <span className="ecourts-live-status-badge">
              <span className="ecourts-ping-dot" />
              eCourts CIS 3.2 Compatible
            </span>
          </div>
        </div>

        <div className="ecourts-hero-chips">
          <span className="ecourts-chip">
            <Icon name="court" style={{ width: 14, height: 14 }} />
            High Courts & District Courts
          </span>
          <span className="ecourts-chip">
            <Icon name="check" style={{ width: 14, height: 14 }} />
            Tamil & Indic Script Extraction
          </span>
          <span className="ecourts-chip">
            <Icon name="calendar" style={{ width: 14, height: 14 }} />
            Hearing Conflict Detection
          </span>
          <span className="ecourts-chip">
            <Icon name="lock" style={{ width: 14, height: 14 }} />
            Advocate Privacy Guaranteed
          </span>
        </div>
      </section>

      {/* FILE UPLOAD / IMPORT STATION */}
      <section className="ecourts-upload-section staggered-entry">
        <div className="ecourts-upload-header">
          <div>
            <h2 className="ecourts-section-title">
              <Icon name="upload" style={{ color: 'var(--accent)', width: 20, height: 20 }} />
              Upload eCourts Export File
            </h2>
            <p className="ecourts-section-subtitle">
              Select or drop the exported file received from the eCourts services portal.
            </p>
          </div>

          <div className="ecourts-upload-actions">
            <button
              type="button"
              onClick={() => processRawText(SAMPLE_ECOURTS_EXPORT_TXT, 'sample_ecourts_cases.json')}
              className="btn-ecourts-secondary"
              title="Load sample eCourts CIS records to preview layout"
            >
              <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              <span>Try Demo Sample</span>
            </button>

            <button
              type="button"
              onClick={() => setPasteDrawerOpen((v) => !v)}
              className="btn-ecourts-secondary btn-paste-toggle"
            >
              📋 {pasteDrawerOpen ? 'Close Paste Drawer' : 'Paste Raw Text / JSON'}
            </button>

            {cases.length > 0 && (
              <button
                type="button"
                onClick={handleClearCases}
                className="btn-ecourts-danger"
              >
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          className={`ecourts-file-dropzone${fileDragActive ? ' is-dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json,.csv,text/plain,application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="ecourts-dropzone-icon-circle">
            <Upload size={32} style={{ color: 'var(--accent)' }} />
          </div>

          <div className="ecourts-dropzone-text">
            <strong>Drag and drop the exported file from the eCourts portal here</strong>
            <span>or click to browse files from your computer</span>
          </div>

          {loadingFileParse && (
            <div className="ecourts-dropzone-loading">
              <span className="ecourts-loading-spinner" />
              <span>Parsing file & extracting bilingual case records...</span>
            </div>
          )}
        </div>

        {/* Expandable Paste Drawer */}
        {pasteDrawerOpen && (
          <div className="ecourts-paste-drawer">
            <div className="ecourts-paste-header">
              <label htmlFor="raw-paste-box" className="ecourts-paste-label">
                Paste Raw eCourts Export Text / JSON:
              </label>
              <span className="ecourts-paste-hint">Supports CIS export tables & raw text dumps</span>
            </div>

            <textarea
              id="raw-paste-box"
              rows={6}
              value={rawPasteInput}
              onChange={(e) => setRawPasteInput(e.target.value)}
              placeholder="Paste exported eCourts file contents here..."
              className="ecourts-paste-textarea"
            />

            <div className="ecourts-paste-actions">
              <button
                type="button"
                onClick={() => { setPasteDrawerOpen(false); setRawPasteInput(''); }}
                className="btn-ecourts-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rawPasteInput.trim() || loadingFileParse}
                onClick={() => processRawText(rawPasteInput, 'pasted_cases.txt')}
                className="btn-ecourts-primary"
              >
                {loadingFileParse ? 'Parsing...' : 'Parse Pasted Content'}
              </button>
            </div>
          </div>
        )}

        {/* File Meta Pill when loaded */}
        {fileMeta && (
          <div className="ecourts-file-meta-bar">
            <div className="ecourts-file-meta-details">
              <span className="meta-filename">📄 <strong>{fileMeta.filename}</strong></span>
              <span className="meta-separator">•</span>
              <span className="meta-size">{fileMeta.size}</span>
              <span className="meta-separator">•</span>
              <span className="meta-count">{fileMeta.total} Cases Extracted</span>
            </div>

            <button
              type="button"
              onClick={handleClearCases}
              className="btn-ecourts-meta-reset"
            >
              Reset
            </button>
          </div>
        )}
      </section>

      {/* IMPORT SUCCESS NOTIFICATION */}
      {importedStatus && (
        <div className="ecourts-import-success-alert staggered-entry">
          <div>
            <div className="alert-title">
              <span>🎉</span>
              <span>{importedStatus.message}</span>
            </div>
            <div className="alert-subtitle">
              Processed <strong>{importedStatus.total_processed}</strong> case(s) ({importedStatus.imported_count} new, {importedStatus.updated_count} updated).
            </div>
            {importedStatus.conflicts && importedStatus.conflicts.length > 0 && (
              <div className="alert-conflict">
                ⚠️ Hearing clash alert: {importedStatus.conflicts.join(', ')}
              </div>
            )}
          </div>

          <div className="alert-actions">
            <Link to="/" className="btn-ecourts-primary">
              🏠 Go to Dashboard
            </Link>
            <button
              type="button"
              onClick={() => setImportedStatus(null)}
              className="btn-ecourts-secondary"
            >
              Stay on this page
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {cases.length > 0 && (
        <div className="staggered-entry">
          {/* STATS OVERVIEW CARDS */}
          <div
            className="stats-row staggered-entry"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 20,
            }}
          >
            <StatCard
              value={stats.total}
              label="Total Extracted"
              color="var(--accent)"
              icon={<Scale size={18} />}
              hint="All parsed records"
            />
            <StatCard
              value={stats.pending}
              label="Active / Pending"
              color="var(--warning)"
              icon={<Clock size={18} />}
              hint="Awaiting next listing"
            />
            <StatCard
              value={stats.disposed}
              label="Disposed / Closed"
              color="var(--gray-500)"
              icon={<CheckCircle2 size={18} />}
              hint="Concluded proceedings"
            />
            <StatCard
              value={stats.alreadyInDiary}
              label="In Diary Status"
              color="var(--success)"
              icon={<BookOpen size={18} />}
              hint={`${stats.readyToImport} new ready to sync`}
            />
          </div>

          {/* CONTROLS & FILTER TOOLBAR */}
          <div className="ecourts-toolbar-card">
            <div className="ecourts-filter-tabs" style={{ position: 'relative' }}>
              {[
                { id: 'all', label: 'All Cases', count: cases.length },
                { id: 'pending', label: 'Pending', count: stats.pending },
                { id: 'disposed', label: 'Disposed', count: stats.disposed },
                { id: 'new', label: 'New to Import', count: stats.readyToImport },
              ].map((tab) => {
                const isActive = filterType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id)}
                    className={`ecourts-filter-tab${isActive ? ' is-active' : ''}`}
                    style={{ position: 'relative' }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeEcourtsTabIndicator"
                        className="ecourts-tab-active-pill"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'var(--bg-card)',
                          borderRadius: 9,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                          zIndex: 0,
                        }}
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span>{tab.label}</span>
                      <span className="ecourts-tab-pill">{tab.count}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Query Box & View Switcher */}
            <div className="ecourts-search-and-view">
              <div className="ecourts-search-wrapper">
                <Search size={15} className="search-icon" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by CNR, party, Tamil name, court..."
                  className="ecourts-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="search-clear-btn"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* View Mode Switcher */}
              <div className="ecourts-view-modes">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`ecourts-view-btn${viewMode === 'grid' ? ' is-active' : ''}`}
                  title="Grid Cards View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`ecourts-view-btn${viewMode === 'table' ? ' is-active' : ''}`}
                  title="Compact Table View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* BATCH ACTION STRIP */}
          <div className="ecourts-batch-strip">
            <div className="ecourts-batch-left">
              <label className="ecourts-batch-select-all">
                <input
                  type="checkbox"
                  checked={selectedCaseNumbers.size > 0 && selectedCaseNumbers.size === filteredCases.length}
                  onChange={handleSelectAll}
                  className="ecourts-checkbox"
                />
                <span>Select All ({filteredCases.length})</span>
              </label>

              <button
                type="button"
                onClick={handleSelectPendingOnly}
                className="btn-ecourts-quick-filter"
              >
                Select Pending Only
              </button>

              <button
                type="button"
                onClick={handleSelectNewOnly}
                className="btn-ecourts-quick-filter"
              >
                Select New to Import
              </button>

              <span className="ecourts-batch-selected-count">
                <strong>{selectedCaseNumbers.size}</strong> case(s) selected
              </span>
            </div>

            <motion.button
              type="button"
              disabled={selectedCaseNumbers.size === 0 || loadingImport}
              onClick={handleImportSelected}
              className="btn-ecourts-primary btn-import-cta"
              whileHover={{ scale: selectedCaseNumbers.size > 0 && !loadingImport ? 1.02 : 1 }}
              whileTap={{ scale: selectedCaseNumbers.size > 0 && !loadingImport ? 0.98 : 1 }}
            >
              {loadingImport ? (
                <>
                  <span className="ecourts-loading-spinner" />
                  <span>Importing into Dashboard...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Import {selectedCaseNumbers.size} Selected Case{selectedCaseNumbers.size === 1 ? '' : 's'} to Dashboard</span>
                </>
              )}
            </motion.button>
          </div>

          {/* CASES LIST: GRID OR TABLE */}
          {filteredCases.length === 0 ? (
            <div className="ecourts-empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">No cases match your filters</div>
              <p className="empty-desc">
                Try clearing the search query or selecting another filter tab.
              </p>
              <button
                type="button"
                onClick={() => { setFilterType('all'); setSearchQuery(''); }}
                className="btn-ecourts-secondary"
                style={{ marginTop: 12 }}
              >
                Reset Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className={`ecourts-cases-grid${filteredCases.length === 1 ? ' single-case' : ''}`}>
              {filteredCases.map((c) => {
                const isSelected = selectedCaseNumbers.has(c.case_number);
                const isAlreadyInDiary = existingCasesMap.has((c.case_number || '').trim().toUpperCase());
                const stageIndex = getStageStepIndex(c.case_stage);

                return (
                  <motion.div
                    key={c.case_number || c.cnr_number}
                    whileHover={{ y: -4, scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    className={`ecourts-case-card${isSelected ? ' is-selected' : ''}`}
                    onClick={() => toggleCaseSelection(c.case_number)}
                  >
                    {/* Card Header */}
                    <div className="ecourts-card-top">
                      <div className="ecourts-card-top-left">
                        <div className="ecourts-badge-group">
                          <span className="ecourts-case-type-badge">
                            {c.case_type || 'Case'}
                          </span>
                          <span className="ecourts-case-number">
                            {c.case_number}
                          </span>
                        </div>

                        {c.cnr_number && (
                          <div
                            className="ecourts-cnr-pill"
                            onClick={(e) => handleCopyCnr(c.cnr_number, e)}
                            title="Click to copy CNR Number"
                          >
                            <span>CNR: {c.cnr_number}</span>
                            <span className="cnr-copy-indicator">
                              {copiedCnr === c.cnr_number ? (
                                <Check size={11} />
                              ) : (
                                <Copy size={11} />
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="ecourts-card-top-right">
                        <span className={`ecourts-disposition-badge${c.is_disposed ? ' is-disposed' : ' is-pending'}`}>
                          <span className="disposition-dot" />
                          {c.disposition || (c.is_disposed ? 'Disposed' : 'Pending')}
                        </span>
                        {isAlreadyInDiary ? (
                          <span className="ecourts-diary-tag in-diary">
                            <Check size={12} style={{ display: 'inline', marginRight: 2 }} />
                            In Diary
                          </span>
                        ) : (
                          <span className="ecourts-diary-tag ready-sync">
                            <Sparkles size={12} style={{ display: 'inline', marginRight: 2 }} />
                            Ready to Sync
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Parties Section (with sleek VS divider & Tamil Indic tags) */}
                    <div className="ecourts-parties-box">
                      <div className="ecourts-party-row">
                        <span className="ecourts-party-role petitioner">Petitioner</span>
                        <div className="ecourts-party-name">
                          <strong>{c.petitioner || c.client_name || 'Petitioner'}</strong>
                          {c.lpetparty_name && (
                            <span className="ecourts-tamil-tag">{c.lpetparty_name}</span>
                          )}
                        </div>
                      </div>

                      <div className="ecourts-parties-vs-divider">
                        <span className="vs-line" />
                        <span className="vs-pill">VS</span>
                        <span className="vs-line" />
                      </div>

                      <div className="ecourts-party-row">
                        <span className="ecourts-party-role respondent">Respondent</span>
                        <div className="ecourts-party-name">
                          <strong>{c.respondent || 'State / Respondent'}</strong>
                          {c.lresparty_name && (
                            <span className="ecourts-tamil-tag">{c.lresparty_name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Court and Judge Details with Deduplicated Clean Court Name */}
                    <div className="ecourts-meta-details">
                      <div className="ecourts-meta-item court-item">
                        <div className="meta-label-group">
                          <Scale size={13} className="meta-icon" />
                          <span className="meta-label">Court</span>
                        </div>
                        <span className="meta-value court-value" title={c.court_name}>
                          {formatCourtName(c.court_name, c.district)}
                        </span>
                      </div>
                      {c.judge_name && (
                        <div className="ecourts-meta-item">
                          <span className="meta-label">Judge</span>
                          <span className="meta-value">{c.judge_name}</span>
                        </div>
                      )}
                      <div className="ecourts-meta-item hearing-item">
                        <div className="meta-label-group">
                          <Calendar size={13} className="meta-icon" />
                          <span className="meta-label">Next Hearing</span>
                        </div>
                        <span className="meta-value hearing-badge">
                          {c.next_hearing_date ? c.next_hearing_date : 'Not Scheduled'}
                        </span>
                      </div>
                    </div>

                    {/* Stage Milestones Tracker with High-End Visual Beacon */}
                    <div className="ecourts-stage-timeline">
                      <div className="ecourts-stage-label">
                        <span className="stage-title-text">Current Stage:</span>
                        <strong className="stage-active-badge">{c.case_stage || 'Filing / Registration'}</strong>
                      </div>
                      <div className="ecourts-milestone-bar">
                        {STAGE_MILESTONES.map((step, idx) => {
                          const isCompleted = idx < stageIndex;
                          const isCurrent = idx === stageIndex;
                          return (
                            <div
                              key={step}
                              className={`ecourts-milestone-node${isCompleted ? ' is-completed' : ''}${isCurrent ? ' is-current' : ''}`}
                              title={step}
                            >
                              <div className="node-track">
                                <span className="node-dot" />
                                {isCurrent && <span className="node-beacon" />}
                              </div>
                              <span className="node-text">{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="ecourts-card-footer" onClick={(e) => e.stopPropagation()}>
                      <label className="ecourts-card-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCaseSelection(c.case_number)}
                          className="ecourts-checkbox"
                        />
                        <span>{isSelected ? 'Selected' : 'Select Case'}</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setExpandedCase(c)}
                        className="btn-ecourts-secondary btn-inspect"
                      >
                        <span>Inspect Details</span>
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="ecourts-table-container">
              <div style={{ overflowX: 'auto' }}>
                <table className="ecourts-cases-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>
                        <input
                          type="checkbox"
                          checked={selectedCaseNumbers.size > 0 && selectedCaseNumbers.size === filteredCases.length}
                          onChange={handleSelectAll}
                          className="ecourts-checkbox"
                        />
                      </th>
                      <th>Case & CNR</th>
                      <th>Parties (Bilingual)</th>
                      <th>Court & District</th>
                      <th>Stage</th>
                      <th>Next Hearing</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((c) => {
                      const isSelected = selectedCaseNumbers.has(c.case_number);
                      const isAlreadyInDiary = existingCasesMap.has((c.case_number || '').trim().toUpperCase());

                      return (
                        <tr
                          key={c.case_number || c.cnr_number}
                          className={isSelected ? 'is-selected' : ''}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCaseSelection(c.case_number)}
                              className="ecourts-checkbox"
                            />
                          </td>
                          <td>
                            <div className="table-case-number">{c.case_number}</div>
                            {c.cnr_number && (
                              <div className="table-cnr-number">
                                {c.cnr_number}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="table-party-petitioner">
                              <strong>{c.petitioner || c.client_name}</strong>
                              {c.lpetparty_name && <span className="ecourts-tamil-tag" style={{ marginLeft: 6 }}>{c.lpetparty_name}</span>}
                            </div>
                            <div className="table-party-respondent">
                              vs {c.respondent || 'State'}
                              {c.lresparty_name && <span className="ecourts-tamil-tag" style={{ marginLeft: 6 }}>{c.lresparty_name}</span>}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{formatCourtName(c.court_name, c.district)}</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {c.case_stage || '-'}
                          </td>
                          <td>
                            <span className={c.next_hearing_date ? 'hearing-badge' : 'table-hearing-empty'}>
                              {c.next_hearing_date ? `📅 ${c.next_hearing_date}` : 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={`ecourts-disposition-badge${c.is_disposed ? ' is-disposed' : ' is-pending'}`}>
                              {c.disposition || (c.is_disposed ? 'Disposed' : 'Pending')}
                            </span>
                            {isAlreadyInDiary && (
                              <div className="table-in-diary-tag">
                                ✓ In Diary
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedCase(c)}
                              className="btn-ecourts-secondary"
                              style={{ padding: '5px 12px', fontSize: 14 }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CASE INSPECT MODAL */}
      {expandedCase && (
        <div className="ecourts-modal-overlay" onClick={() => setExpandedCase(null)}>
          <div className="ecourts-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ecourts-modal-header">
              <div>
                <span className="ecourts-case-type-badge">{expandedCase.case_type || 'Case'}</span>
                <h2 className="ecourts-modal-title">
                  {expandedCase.case_number}
                </h2>
                {expandedCase.cnr_number && (
                  <div className="ecourts-modal-cnr">
                    CNR: {expandedCase.cnr_number}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setExpandedCase(null)}
                className="ecourts-modal-close-btn"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="ecourts-modal-parties-grid">
              <div className="modal-party-card">
                <div className="party-role-title">Petitioner</div>
                <div className="party-name">
                  {expandedCase.petitioner || expandedCase.client_name}
                </div>
                {expandedCase.lpetparty_name && (
                  <div className="ecourts-tamil-tag" style={{ marginTop: 6 }}>
                    {expandedCase.lpetparty_name}
                  </div>
                )}
              </div>

              <div className="modal-party-card">
                <div className="party-role-title">Respondent</div>
                <div className="party-name">
                  {expandedCase.respondent || 'State'}
                </div>
                {expandedCase.lresparty_name && (
                  <div className="ecourts-tamil-tag" style={{ marginTop: 6 }}>
                    {expandedCase.lresparty_name}
                  </div>
                )}
              </div>
            </div>

            <div className="ecourts-modal-details-grid">
              <div className="modal-detail-item">
                <span className="detail-label">Court:</span>
                <strong>{formatCourtName(expandedCase.court_name, expandedCase.district)}</strong>
              </div>
              <div className="modal-detail-item">
                <span className="detail-label">District:</span>
                <strong>{expandedCase.district || 'N/A'}</strong>
              </div>
              <div className="modal-detail-item">
                <span className="detail-label">Stage:</span>
                <strong>{expandedCase.case_stage || 'Filing / Notice'}</strong>
              </div>
              <div className="modal-detail-item">
                <span className="detail-label">Next Hearing:</span>
                <strong style={{ color: 'var(--accent)' }}>{expandedCase.next_hearing_date || 'N/A'}</strong>
              </div>
              <div className="modal-detail-item">
                <span className="detail-label">Filing Date:</span>
                <strong>{expandedCase.filing_date || 'N/A'}</strong>
              </div>
              <div className="modal-detail-item">
                <span className="detail-label">Reg Date:</span>
                <strong>{expandedCase.reg_date || 'N/A'}</strong>
              </div>
              <div className="modal-detail-item">
                <span className="detail-label">Disposition:</span>
                <strong>{expandedCase.disposition || (expandedCase.is_disposed ? 'Disposed' : 'Pending')}</strong>
              </div>
              <div className="modal-detail-item">
                <span className="detail-label">Judge:</span>
                <strong>{expandedCase.judge_name || "Hon'ble Judge"}</strong>
              </div>
            </div>

            {expandedCase.police_station && (
              <div className="ecourts-modal-box">
                <strong>Police & FIR: </strong> {expandedCase.police_station} • FIR No: {expandedCase.fir_no || 'N/A'}
              </div>
            )}

            {expandedCase.act_section && (
              <div className="ecourts-modal-box">
                <strong>Acts & Sections: </strong> {expandedCase.act_section}
              </div>
            )}

            {expandedCase.notes && (
              <div className="ecourts-modal-box notes-box">
                <strong>eCourts CIS Notes: </strong> {expandedCase.notes}
              </div>
            )}

            <div className="ecourts-modal-actions">
              <button
                type="button"
                onClick={() => setExpandedCase(null)}
                className="btn-ecourts-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleCaseSelection(expandedCase.case_number);
                  setExpandedCase(null);
                }}
                className="btn-ecourts-primary"
              >
                {selectedCaseNumbers.has(expandedCase.case_number) ? 'Deselect Case' : 'Select for Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
