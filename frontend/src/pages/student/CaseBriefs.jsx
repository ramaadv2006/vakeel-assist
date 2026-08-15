import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useFlash } from '../../context/FlashContext';
import Icon from '../../components/Icon';
import Skeleton from '../../components/Skeleton';

const SUBJECT_OPTIONS = [
  'All Subjects',
  'Constitutional Law',
  'Criminal Law (BNS / IPC)',
  'Law of Contracts',
  'Law of Torts',
  'Civil Procedure Code (CPC)',
  'Criminal Procedure (BNSS / CrPC)',
  'Law of Evidence (BSA / IEA)',
  'Family Law',
  'Corporate & Commercial Law',
  'Intellectual Property (IPR)',
  'Environmental Law',
  'Human Rights & Jurisprudence',
];

const PRELOADED_SAMPLES = [
  {
    case_title: 'Kesavananda Bharati v. State of Kerala',
    citation: '(1973) 4 SCC 225',
    court: 'Supreme Court of India (13-Judge Constitutional Bench)',
    subject: 'Constitutional Law',
    facts: 'His Holiness Sri Kesavananda Bharati challenged the Kerala Land Reforms Act 1963 and subsequent 24th, 25th, and 29th Constitutional Amendments curtailing property rights.',
    issues: 'Whether the power of Parliament to amend the Constitution under Article 368 is absolute and unlimited, or subject to inherent implied limitations.',
    rule_of_law: 'Article 368, Article 13, Article 19, Article 31, Fundamental Rights Part III of the Constitution.',
    analysis_arguments: 'The 13-Judge bench held by a 7:6 majority that while Parliament has wide constituent amending powers under Article 368, it does not possess the power to alter, destroy, or emasculate the Basic Structure or essential framework of the Constitution.',
    conclusion_judgment: '24th Amendment upheld; Section 3 of 25th Amendment invalid in part. Basic Structure Doctrine firmly established in Indian constitutional jurisprudence.',
    ratio_decidendi: 'Parliament cannot exercise its amending power under Article 368 to damage, alter, or destroy the basic structure or essential features of the Indian Constitution.',
    obiter_dicta: 'Supremacy of Constitution, Rule of Law, Separation of Powers, Judicial Review, and Secularism constitute the bedrock of the republic.',
    tags: 'Basic Structure, Article 368, Judicial Review, 13 Judges',
  },
  {
    case_title: 'Maneka Gandhi v. Union of India',
    citation: '(1978) 1 SCC 248',
    court: 'Supreme Court of India (7-Judge Bench)',
    subject: 'Constitutional Law',
    facts: 'Petitioner’s passport was impounded by the Government under Section 10(3)(c) of the Passports Act, 1967 in public interest without assigning reasons or opportunity of hearing.',
    issues: 'Whether right to travel abroad is part of personal liberty under Article 21, and whether procedure established by law must be just, fair, and reasonable.',
    rule_of_law: 'Articles 14, 19, 21 (The Golden Triangle of Fundamental Rights).',
    analysis_arguments: 'Overruled A.K. Gopalan. The Court established that procedure under Article 21 cannot be arbitrary or whimsical; it must comply with Natural Justice (Audi Alteram Partem) and reasonableness under Article 14 & 19.',
    conclusion_judgment: 'Impounding procedure was held arbitrary; passport returned. Article 21 given an expansive, substantive human rights interpretation.',
    ratio_decidendi: 'Procedure established by law under Article 21 must satisfy the tests of reasonableness, justice, and fairness under Article 14 and Article 19.',
    obiter_dicta: 'Articles 14, 19, and 21 are not mutually exclusive water-tight compartments but form an interconnected Golden Triangle.',
    tags: 'Article 21, Natural Justice, Audi Alteram Partem, Golden Triangle',
  }
];

export default function CaseBriefs() {
  const addFlash = useFlash();
  const [searchParams] = useSearchParams();
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBrief, setActiveBrief] = useState(null);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const [form, setForm] = useState({
    case_title: '',
    citation: '',
    court: '',
    subject: 'Constitutional Law',
    facts: '',
    issues: '',
    rule_of_law: '',
    analysis_arguments: '',
    conclusion_judgment: '',
    ratio_decidendi: '',
    obiter_dicta: '',
    tags: '',
  });

  const loadBriefs = async () => {
    try {
      const subject = selectedSubject === 'All Subjects' ? '' : selectedSubject;
      const res = await api.get(`/student/case-briefs?subject=${encodeURIComponent(subject)}&search=${encodeURIComponent(searchQuery)}`);
      if (res.case_briefs && res.case_briefs.length > 0) {
        setBriefs(res.case_briefs);
      } else if (!searchQuery && selectedSubject === 'All Subjects') {
        // Offer preloaded samples in local display if user has none
        setBriefs(PRELOADED_SAMPLES.map((s, idx) => ({ ...s, id: `sample-${idx}`, isSample: true })));
      } else {
        setBriefs([]);
      }
    } catch (err) {
      addFlash(err.message || 'Failed to load case briefs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBriefs();
  }, [selectedSubject, searchQuery]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openNewBriefModal();
    }
  }, [searchParams]);

  const openNewBriefModal = () => {
    setForm({
      case_title: '',
      citation: '',
      court: '',
      subject: 'Constitutional Law',
      facts: '',
      issues: '',
      rule_of_law: '',
      analysis_arguments: '',
      conclusion_judgment: '',
      ratio_decidendi: '',
      obiter_dicta: '',
      tags: '',
    });
    setAiPrompt('');
    setShowEditorModal(true);
  };

  const openEditBrief = (brief) => {
    setForm({ ...brief });
    setShowEditorModal(true);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      addFlash('Please enter a case name, citation, or paste excerpt for AI to brief.', 'error');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post('/student/case-briefs/ai-generate', { case_input: aiPrompt });
      if (res.case_brief) {
        setForm((prev) => ({
          ...prev,
          ...res.case_brief,
        }));
        addFlash('AI generated FIRAC Case Brief! Review and click Save.', 'success');
      }
    } catch (err) {
      addFlash(err.message || 'AI Case Brief generation failed.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id && typeof form.id === 'number') {
        const res = await api.put(`/student/case-briefs/${form.id}`, form);
        addFlash(res.message || 'Case brief updated!', 'success');
      } else {
        const res = await api.post('/student/case-briefs', form);
        addFlash(res.message || 'Case brief saved to your repository!', 'success');
      }
      setShowEditorModal(false);
      loadBriefs();
    } catch (err) {
      addFlash(err.message || 'Failed to save case brief', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this case brief?')) return;
    if (typeof id === 'string' && id.startsWith('sample')) {
      setBriefs((prev) => prev.filter((b) => b.id !== id));
      setActiveBrief(null);
      return;
    }
    try {
      const res = await api.del(`/student/case-briefs/${id}`);
      addFlash(res.message || 'Case brief deleted', 'success');
      if (activeBrief?.id === id) setActiveBrief(null);
      loadBriefs();
    } catch (err) {
      addFlash(err.message || 'Failed to delete case brief', 'error');
    }
  };

  if (loading) return <Skeleton count={4} rows={3} />;

  return (
    <div className="case-briefs-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="student-page-header staggered-entry">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'grid', placeItems: 'center', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <Icon name="briefs" style={{ width: 20, height: 20 }} />
            </div>
            <h2 style={{ fontFamily: "'Lora', serif", margin: 0, fontSize: '1.45rem', color: 'var(--text-dark)', fontWeight: 700 }}>
              FIRAC Case Briefs Repository
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Facts, Issues, Rules, Analysis & Conclusion — structured legal study notes with instant AI auto-briefing.
          </p>
        </div>

        <button onClick={openNewBriefModal} className="btn-student-gold">
          <Icon name="sparkles" style={{ width: 16, height: 16 }} />
          <span>+ Brief New Case (AI Powered)</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260 }}>
          <input
            type="text"
            placeholder="Search by case title, citation, doctrine, ratio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.86rem',
            }}
          />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.86rem',
              maxWidth: 220,
            }}
          >
            {SUBJECT_OPTIONS.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Briefs Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {briefs.map((brief) => (
          <div
            key={brief.id}
            className="card-form staggered-entry"
            style={{
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              border: '1px solid var(--border-color)',
              position: 'relative',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(212, 160, 23, 0.12)',
                    color: 'var(--accent-hover)',
                  }}
                >
                  {brief.subject || 'Law'}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => openEditBrief(brief)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 3 }}
                    title="Edit Brief"
                  >
                    <Icon name="edit" style={{ width: 14, height: 14 }} />
                  </button>
                  <button
                    onClick={() => handleDelete(brief.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 3 }}
                    title="Delete Brief"
                  >
                    <Icon name="trash" style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>

              <h3 style={{ fontFamily: "'Lora', serif", fontSize: 17, margin: '4px 0 2px 0', color: 'var(--text-dark)' }}>
                {brief.case_title}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {brief.citation || brief.court || 'Landmark Precedent'}
              </div>

              {brief.ratio_decidendi && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: 'var(--text-main)',
                    background: 'var(--bg-app)',
                    padding: 8,
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <strong style={{ color: 'var(--accent)', fontSize: 11 }}>Ratio: </strong>
                  <span style={{ fontStyle: 'italic' }}>
                    {brief.ratio_decidendi.length > 140
                      ? `${brief.ratio_decidendi.substring(0, 140)}...`
                      : brief.ratio_decidendi}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveBrief(brief)}
              className="btn-secondary"
              style={{
                width: '100%',
                fontSize: 12,
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon name="briefs" style={{ width: 14, height: 14 }} />
              <span>Read Full FIRAC Brief</span>
            </button>
          </div>
        ))}
      </div>

      {/* Detailed Full Brief View Modal */}
      {activeBrief && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="card-form"
            style={{
              maxWidth: 760,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
              borderRadius: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase' }}>
                  {activeBrief.subject}
                </span>
                <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, margin: '4px 0 2px 0', color: 'var(--text-dark)' }}>
                  {activeBrief.case_title}
                </h2>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {activeBrief.citation} {activeBrief.court ? `• ${activeBrief.court}` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                  }}
                >
                  Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBrief(null)}
                  style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* FIRAC Structured Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
              {activeBrief.facts && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--accent)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    1. Facts (F)
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {activeBrief.facts}
                  </p>
                </div>
              )}

              {activeBrief.issues && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--accent)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    2. Issues Framed (I)
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {activeBrief.issues}
                  </p>
                </div>
              )}

              {activeBrief.rule_of_law && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--accent)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    3. Rule of Law & Statutory Provisions (R)
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {activeBrief.rule_of_law}
                  </p>
                </div>
              )}

              {activeBrief.analysis_arguments && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--accent)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    4. Application & Judicial Analysis (A)
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {activeBrief.analysis_arguments}
                  </p>
                </div>
              )}

              {activeBrief.conclusion_judgment && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--accent)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    5. Conclusion & Final Order (C)
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {activeBrief.conclusion_judgment}
                  </p>
                </div>
              )}

              {activeBrief.ratio_decidendi && (
                <div style={{ background: 'rgba(212, 160, 23, 0.08)', padding: 14, borderRadius: 8, border: '1px solid rgba(212, 160, 23, 0.25)' }}>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--accent-hover)', fontSize: 14 }}>
                    ⚖️ Ratio Decidendi (Binding Principle)
                  </h4>
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-dark)', lineHeight: 1.6 }}>
                    {activeBrief.ratio_decidendi}
                  </p>
                </div>
              )}

              {activeBrief.obiter_dicta && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase' }}>
                    Obiter Dicta (Passing Observations)
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5, fontSize: 13 }}>
                    {activeBrief.obiter_dicta}
                  </p>
                </div>
              )}

              {activeBrief.tags && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  <strong>Tags: </strong> {activeBrief.tags}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal with AI Case Generator */}
      {showEditorModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="card-form"
            style={{
              maxWidth: 760,
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Lora', serif", margin: 0, fontSize: 20, color: 'var(--text-dark)' }}>
                {form.id ? 'Edit Case Brief' : 'Draft FIRAC Case Brief'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* AI Generation Box */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(212, 160, 23, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: 14,
                borderRadius: 10,
                marginBottom: 18,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="sparkles" style={{ color: 'var(--accent)' }} />
                <span>AI Auto-Brief from Case Name or Judgment Excerpt</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. D.K. Basu v. State of West Bengal / S.R. Bommai v. UOI / Or paste text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={handleAiGenerate}
                  className="btn-primary"
                  style={{ fontSize: 12, padding: '8px 14px', whiteSpace: 'nowrap' }}
                >
                  {aiLoading ? 'Analyzing...' : 'Generate with AI'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Case Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vishaka v. State of Rajasthan"
                    value={form.case_title}
                    onChange={(e) => setForm({ ...form, case_title: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Official Citation</label>
                  <input
                    type="text"
                    placeholder="e.g. (1997) 6 SCC 241"
                    value={form.citation}
                    onChange={(e) => setForm({ ...form, citation: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Court / Bench</label>
                  <input
                    type="text"
                    placeholder="e.g. Supreme Court of India - 3 Judge Bench"
                    value={form.court}
                    onChange={(e) => setForm({ ...form, court: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Subject Area</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  >
                    {SUBJECT_OPTIONS.filter((s) => s !== 'All Subjects').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>1. Facts (F)</label>
                <textarea
                  rows={3}
                  placeholder="Material facts leading to dispute..."
                  value={form.facts}
                  onChange={(e) => setForm({ ...form, facts: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>2. Issues Framed (I)</label>
                <textarea
                  rows={2}
                  placeholder="Specific legal questions the court had to answer..."
                  value={form.issues}
                  onChange={(e) => setForm({ ...form, issues: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>3. Rule of Law & Statutory Provisions (R)</label>
                <input
                  type="text"
                  placeholder="e.g. Articles 14, 19(1)(g), 21, CEDAW Convention"
                  value={form.rule_of_law}
                  onChange={(e) => setForm({ ...form, rule_of_law: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>4. Judicial Analysis & Reasoning (A)</label>
                <textarea
                  rows={3}
                  placeholder="Court's interpretation and reasoning..."
                  value={form.analysis_arguments}
                  onChange={(e) => setForm({ ...form, analysis_arguments: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>5. Conclusion & Final Order (C)</label>
                <textarea
                  rows={2}
                  placeholder="Final judgment and directions..."
                  value={form.conclusion_judgment}
                  onChange={(e) => setForm({ ...form, conclusion_judgment: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>⚖️ Ratio Decidendi (Core Binding Rule)</label>
                <textarea
                  rows={2}
                  placeholder="The rule of law for which the case stands as authority..."
                  value={form.ratio_decidendi}
                  onChange={(e) => setForm({ ...form, ratio_decidendi: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Gender Justice, Workplace Harassment, Article 21"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 22px', fontSize: 13 }}
                >
                  Save Brief
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
