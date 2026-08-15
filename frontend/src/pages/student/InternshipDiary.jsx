import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useFlash } from '../../context/FlashContext';
import Icon from '../../components/Icon';
import Skeleton from '../../components/Skeleton';

export default function InternshipDiary() {
  const addFlash = useFlash();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDiaryId, setActiveDiaryId] = useState(null);
  const [diaryDetail, setDiaryDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingDiaryId, setEditingDiaryId] = useState(null);

  const [diaryForm, setDiaryForm] = useState({
    organization: '',
    mentor_name: '',
    internship_type: 'Advocate Chamber',
    start_date: '',
    end_date: '',
    stipend: '',
    summary: '',
    status: 'Active',
  });

  const [logForm, setLogForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    court_hall: '',
    case_observed: '',
    advocate_arguing: '',
    proceedings_summary: '',
    key_learnings: '',
  });

  const loadInternships = async () => {
    try {
      const res = await api.get('/student/internships');
      const list = res.internships || [];
      setInternships(list);
      if (list.length > 0 && !activeDiaryId) {
        setActiveDiaryId(list[0].id);
      }
    } catch (err) {
      addFlash(err.message || 'Failed to load internship diaries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDiaryDetail = async (id) => {
    if (!id) return;
    setDetailLoading(true);
    try {
      const res = await api.get(`/student/internships/${id}`);
      setDiaryDetail(res);
    } catch (err) {
      addFlash(err.message || 'Failed to load diary details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadInternships();
  }, []);

  useEffect(() => {
    if (activeDiaryId) {
      loadDiaryDetail(activeDiaryId);
    }
  }, [activeDiaryId]);

  const openNewDiaryModal = () => {
    setEditingDiaryId(null);
    setDiaryForm({
      organization: '',
      mentor_name: '',
      internship_type: 'Advocate Chamber',
      start_date: '',
      end_date: '',
      stipend: '',
      summary: '',
      status: 'Active',
    });
    setShowDiaryModal(true);
  };

  const handleDiarySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDiaryId) {
        const res = await api.put(`/student/internships/${editingDiaryId}`, diaryForm);
        addFlash(res.message || 'Internship updated!', 'success');
      } else {
        const res = await api.post('/student/internships', diaryForm);
        addFlash(res.message || 'Internship diary created!', 'success');
        if (res.internship?.id) setActiveDiaryId(res.internship.id);
      }
      setShowDiaryModal(false);
      loadInternships();
    } catch (err) {
      addFlash(err.message || 'Failed to save internship', 'error');
    }
  };

  const handleDeleteDiary = async (id) => {
    if (!window.confirm('Delete this entire internship diary and all logged observation entries?')) return;
    try {
      const res = await api.del(`/student/internships/${id}`);
      addFlash(res.message || 'Internship deleted', 'success');
      setActiveDiaryId(null);
      setDiaryDetail(null);
      loadInternships();
    } catch (err) {
      addFlash(err.message || 'Failed to delete internship', 'error');
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!activeDiaryId) return;
    try {
      const res = await api.post(`/student/internships/${activeDiaryId}/logs`, logForm);
      addFlash(res.message || 'Observation entry added!', 'success');
      setShowLogModal(false);
      setLogForm({
        log_date: new Date().toISOString().split('T')[0],
        court_hall: '',
        case_observed: '',
        advocate_arguing: '',
        proceedings_summary: '',
        key_learnings: '',
      });
      loadDiaryDetail(activeDiaryId);
      loadInternships();
    } catch (err) {
      addFlash(err.message || 'Failed to log observation', 'error');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Delete this observation log entry?')) return;
    try {
      const res = await api.del(`/student/internship-logs/${logId}`);
      addFlash(res.message || 'Log removed', 'success');
      loadDiaryDetail(activeDiaryId);
      loadInternships();
    } catch (err) {
      addFlash(err.message || 'Failed to delete log', 'error');
    }
  };

  if (loading) return <Skeleton count={4} rows={3} />;

  const activeDiary = diaryDetail?.internship;
  const logs = diaryDetail?.logs || [];

  return (
    <div className="internship-diary-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Bar */}
      <div className="student-page-header staggered-entry">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'grid', placeItems: 'center', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <Icon name="internship" style={{ width: 20, height: 20 }} />
            </div>
            <h2 style={{ fontFamily: "'Lora', serif", margin: 0, fontSize: '1.45rem', color: 'var(--text-dark)', fontWeight: 700 }}>
              Internship & Court Observation Diary
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Bar Council of India (BCI) compliant daily court observation logger for chamber, court, and firm internships.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={openNewDiaryModal} className="btn-student-emerald">
            <Icon name="plus" style={{ width: 16, height: 16 }} />
            <span>+ New Internship Diary</span>
          </button>
        </div>
      </div>

      {/* Internships Tabs & Container */}
      {internships.length === 0 ? (
        <div className="card-form" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <Icon name="internship" style={{ width: 44, height: 44, opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ margin: 0, color: 'var(--text-dark)', fontSize: 18 }}>No Internship Diaries Created</h3>
          <p style={{ fontSize: 14, maxWidth: 450, margin: '8px auto 16px auto' }}>
            Create an internship diary to log your daily chamber proceedings, court hall visits, and BCI clinical legal education hours.
          </p>
          <button onClick={openNewDiaryModal} className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            + Create First Internship Diary
          </button>
        </div>
      ) : (
        <div className="diary-split-layout">
          {/* Sidebar Tabs */}
          <div className="card-form" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '4px 8px' }}>
              Your Internships
            </div>
            {internships.map((item) => {
              const isSelected = item.id === activeDiaryId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveDiaryId(item.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 3,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: isSelected ? '1.5px solid var(--accent)' : '1px solid transparent',
                    background: isSelected ? 'var(--accent-bg)' : 'var(--bg-app)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 13, color: isSelected ? 'var(--accent-hover)' : 'var(--text-dark)' }}>
                    {item.organization}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{item.internship_type}</span>
                    <span>{item.log_count || 0} days logged</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Diary Main Pane */}
          {detailLoading ? (
            <Skeleton count={3} rows={3} />
          ) : activeDiary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Diary Header Overview */}
              <div className="card-form staggered-entry" style={{ padding: 20, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                        }}
                      >
                        {activeDiary.status}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeDiary.internship_type}</span>
                    </div>
                    <h3 style={{ fontFamily: "'Lora', serif", fontSize: 22, margin: '6px 0 2px 0', color: 'var(--text-dark)' }}>
                      {activeDiary.organization}
                    </h3>
                    <div style={{ fontSize: 13, color: 'var(--text-main)' }}>
                      Mentor: <strong>{activeDiary.mentor_name || 'Senior Counsel / Partner'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="btn-secondary"
                      style={{ padding: '7px 12px', fontSize: 12 }}
                    >
                      Print BCI Diary
                    </button>
                    <button
                      onClick={() => setShowLogModal(true)}
                      className="btn-primary"
                      style={{ padding: '7px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Icon name="plus" />
                      <span>+ Log Today's Court Visit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDiary(activeDiary.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 6 }}
                      title="Delete Diary"
                    >
                      <Icon name="trash" style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 12,
                    marginTop: 16,
                    padding: '12px 16px',
                    background: 'var(--bg-app)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Duration:</span>
                    <strong>{activeDiary.start_date || '—'} to {activeDiary.end_date || 'Present'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Total Court Days:</span>
                    <strong>{logs.length} observation entries</strong>
                  </div>
                  {activeDiary.stipend && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Stipend:</span>
                      <strong>{activeDiary.stipend}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Logs Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 700, color: 'var(--text-dark)' }}>
                    Daily Court Observation Records ({logs.length})
                  </div>
                </div>

                {logs.length === 0 ? (
                  <div className="card-form" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                    <Icon name="calendar" style={{ width: 32, height: 32, opacity: 0.4, marginBottom: 8 }} />
                    <p style={{ margin: 0, fontSize: 14 }}>No daily court observation entries logged yet.</p>
                    <button
                      onClick={() => setShowLogModal(true)}
                      style={{
                        marginTop: 10,
                        background: 'none',
                        border: '1px solid var(--accent)',
                        color: 'var(--accent-hover)',
                        padding: '6px 14px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      + Record Your First Court Day
                    </button>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="card-form staggered-entry"
                      style={{
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: 'var(--accent-bg)',
                              color: 'var(--accent-hover)',
                            }}
                          >
                            📅 {log.log_date}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>
                            {log.court_hall || 'Court Proceeding'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
                          title="Delete entry"
                        >
                          <Icon name="trash" style={{ width: 14, height: 14 }} />
                        </button>
                      </div>

                      {log.case_observed && (
                        <div style={{ fontSize: 13, color: 'var(--text-dark)', fontWeight: 600 }}>
                          Case Observed: <span style={{ fontWeight: 400 }}>{log.case_observed}</span>
                          {log.advocate_arguing && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                              (Arguing Counsel: {log.advocate_arguing})
                            </span>
                          )}
                        </div>
                      )}

                      {log.proceedings_summary && (
                        <div style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          <strong>Proceedings Observed:</strong> {log.proceedings_summary}
                        </div>
                      )}

                      {log.key_learnings && (
                        <div
                          style={{
                            fontSize: 12,
                            padding: '8px 12px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            borderRadius: 6,
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            color: 'var(--text-dark)',
                          }}
                        >
                          <strong style={{ color: '#10b981' }}>Key Legal Learnings & Provisions:</strong> {log.key_learnings}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Modal: Add Internship */}
      {showDiaryModal && (
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
          <div className="card-form" style={{ maxWidth: 580, width: '100%', padding: 24, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Lora', serif", margin: 0, fontSize: 20, color: 'var(--text-dark)' }}>
                {editingDiaryId ? 'Edit Internship' : 'New Internship / Chamber Diary'}
              </h3>
              <button
                type="button"
                onClick={() => setShowDiaryModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDiarySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Organization / Chamber / Law Firm *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chambers of Senior Advocate A. Narayanan, High Court"
                  value={diaryForm.organization}
                  onChange={(e) => setDiaryForm({ ...diaryForm, organization: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mentor / Supervising Advocate</label>
                  <input
                    type="text"
                    placeholder="e.g. Adv. K. Venkatesh"
                    value={diaryForm.mentor_name}
                    onChange={(e) => setDiaryForm({ ...diaryForm, mentor_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Internship Type</label>
                  <select
                    value={diaryForm.internship_type}
                    onChange={(e) => setDiaryForm({ ...diaryForm, internship_type: e.target.value })}
                  >
                    <option value="Advocate Chamber">Advocate Chamber</option>
                    <option value="High Court / Supreme Court">High Court / Supreme Court</option>
                    <option value="District & Sessions Court">District & Sessions Court</option>
                    <option value="Corporate Law Firm">Corporate Law Firm</option>
                    <option value="Legal Aid / NGO">Legal Aid / NGO</option>
                    <option value="Judicial Clerkship">Judicial Clerkship</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={diaryForm.start_date}
                    onChange={(e) => setDiaryForm({ ...diaryForm, start_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={diaryForm.end_date}
                    onChange={(e) => setDiaryForm({ ...diaryForm, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowDiaryModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: 13 }}
                >
                  Save Internship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Observation Log */}
      {showLogModal && (
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
          <div className="card-form" style={{ maxWidth: 640, width: '100%', padding: 24, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Lora', serif", margin: 0, fontSize: 20, color: 'var(--text-dark)' }}>
                Log Daily Court Proceeding & Observations
              </h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Observation *</label>
                  <input
                    type="date"
                    required
                    value={logForm.log_date}
                    onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Court Hall / Bench</label>
                  <input
                    type="text"
                    placeholder="e.g. Court Hall 12, Division Bench - High Court"
                    value={logForm.court_hall}
                    onChange={(e) => setLogForm({ ...logForm, court_hall: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Case Name & Number Observed</label>
                  <input
                    type="text"
                    placeholder="e.g. W.P. No. 18294/2026 - Sharma v. State"
                    value={logForm.case_observed}
                    onChange={(e) => setLogForm({ ...logForm, case_observed: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Advocate Arguing</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Counsel S. Mani"
                    value={logForm.advocate_arguing}
                    onChange={(e) => setLogForm({ ...logForm, advocate_arguing: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Proceedings & Arguments Witnessed</label>
                <textarea
                  rows={3}
                  placeholder="Summarize the core arguments, cross-examination, or interim relief sought..."
                  value={logForm.proceedings_summary}
                  onChange={(e) => setLogForm({ ...logForm, proceedings_summary: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Key Learnings, Statutory Provisions & Practice Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Learned how Section 482 CrPC petitions are argued; observed marking of Ex. P1..."
                  value={logForm.key_learnings}
                  onChange={(e) => setLogForm({ ...logForm, key_learnings: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
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
                  Log Court Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
