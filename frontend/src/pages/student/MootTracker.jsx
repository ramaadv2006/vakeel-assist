import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useFlash } from '../../context/FlashContext';
import Icon from '../../components/Icon';
import Skeleton from '../../components/Skeleton';

export default function MootTracker() {
  const addFlash = useFlash();
  const [moots, setMoots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedMoot, setSelectedMoot] = useState(null);

  const [form, setForm] = useState({
    title: '',
    organizer: '',
    side: 'Petitioner / Appellant',
    team_members: '',
    memorial_deadline: '',
    competition_date: '',
    proposition_summary: '',
    memorial_notes: '',
    bench_questions: '',
    status: 'Active',
    result: '',
  });

  const loadMoots = async () => {
    try {
      const res = await api.get('/student/moots');
      setMoots(res.moots || []);
    } catch (err) {
      addFlash(err.message || 'Failed to load moots', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMoots();
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setForm({
      title: '',
      organizer: '',
      side: 'Petitioner / Appellant',
      team_members: '',
      memorial_deadline: '',
      competition_date: '',
      proposition_summary: '',
      memorial_notes: '',
      bench_questions: '',
      status: 'Active',
      result: '',
    });
    setShowModal(true);
  };

  const openEditModal = (moot) => {
    setEditingId(moot.id);
    setForm({
      title: moot.title || '',
      organizer: moot.organizer || '',
      side: moot.side || 'Petitioner / Appellant',
      team_members: moot.team_members || '',
      memorial_deadline: moot.memorial_deadline || '',
      competition_date: moot.competition_date || '',
      proposition_summary: moot.proposition_summary || '',
      memorial_notes: moot.memorial_notes || '',
      bench_questions: moot.bench_questions || '',
      status: moot.status || 'Active',
      result: moot.result || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await api.put(`/student/moots/${editingId}`, form);
        addFlash(res.message || 'Moot updated!', 'success');
      } else {
        const res = await api.post('/student/moots', form);
        addFlash(res.message || 'Moot competition tracked!', 'success');
      }
      setShowModal(false);
      loadMoots();
    } catch (err) {
      addFlash(err.message || 'Failed to save moot', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this moot competition record?')) return;
    try {
      const res = await api.del(`/student/moots/${id}`);
      addFlash(res.message || 'Moot deleted', 'success');
      if (selectedMoot?.id === id) setSelectedMoot(null);
      loadMoots();
    } catch (err) {
      addFlash(err.message || 'Failed to delete moot', 'error');
    }
  };

  const filteredMoots = moots.filter((m) => {
    if (filter === 'All') return true;
    return m.status === filter;
  });

  if (loading) return <Skeleton count={3} rows={3} />;

  return (
    <div className="moot-tracker" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      {/* Header Bar */}
      <div className="student-page-header staggered-entry">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59, 130, 246, 0.15)', display: 'grid', placeItems: 'center', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <Icon name="trophy" style={{ width: 20, height: 20 }} />
            </div>
            <h2 style={{ fontFamily: "'Lora', serif", margin: 0, fontSize: '1.45rem', color: 'var(--text-dark)', fontWeight: 700 }}>
              Moot Court Hub & Tracker
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Organize memorial deadlines, research propositions, argument formulation, and team roles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--bg-app)', padding: 4, borderRadius: 10, border: '1px solid var(--border-color)', gap: 4 }}>
            {['Active', 'Completed', 'All'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: filter === tab ? 'var(--accent)' : 'transparent',
                  color: filter === tab ? '#111827' : 'var(--text-muted)',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <button onClick={openNewModal} className="btn-student-blue">
            <Icon name="plus" style={{ width: 16, height: 16 }} />
            <span>Track New Moot</span>
          </button>
        </div>
      </div>

      {/* Main Content: Moots Grid or Empty State */}
      {filteredMoots.length === 0 ? (
        <div className="card-form" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <Icon name="trophy" style={{ width: 44, height: 44, opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ margin: 0, color: 'var(--text-dark)', fontSize: 18 }}>No moot court records found</h3>
          <p style={{ fontSize: 14, maxWidth: 450, margin: '8px auto 16px auto' }}>
            {filter === 'Active'
              ? "You don't have any ongoing moot court competitions. Click below to add your next competition."
              : 'No records matching the selected status.'}
          </p>
          <button onClick={openNewModal} className="btn-student-blue">
            + Track a Moot Competition
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredMoots.map((moot) => {
            const isSelected = selectedMoot?.id === moot.id;
            return (
              <div
                key={moot.id}
                className="card-form staggered-entry"
                style={{
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 5,
                        background: moot.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        color: moot.status === 'Active' ? '#34d399' : 'var(--text-muted)',
                      }}
                    >
                      {moot.status}
                    </span>
                    <h3 style={{ fontFamily: "'Lora', serif", fontSize: 17, margin: '6px 0 2px 0', color: 'var(--text-dark)' }}>
                      {moot.title}
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {moot.organizer || 'Organizing University'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => openEditModal(moot)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                      title="Edit Moot"
                    >
                      <Icon name="edit" style={{ width: 15, height: 15 }} />
                    </button>
                    <button
                      onClick={() => handleDelete(moot.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
                      title="Delete Moot"
                    >
                      <Icon name="trash" style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    background: 'var(--bg-app)',
                    padding: 10,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>Side Assigned:</span>
                    <strong>{moot.side || 'Not set'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>Memorial Due:</span>
                    <strong style={{ color: moot.memorial_deadline ? '#f87171' : 'inherit' }}>
                      {moot.memorial_deadline || '—'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>Oral Rounds:</span>
                    <strong>{moot.competition_date || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>Team Roster:</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {moot.team_members || '—'}
                    </span>
                  </div>
                </div>

                {moot.result && (
                  <div style={{ fontSize: 12, padding: '6px 10px', background: 'rgba(212, 160, 23, 0.1)', color: 'var(--accent-hover)', borderRadius: 6, fontWeight: 600 }}>
                    🏆 Result / Award: {moot.result}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedMoot(isSelected ? null : moot)}
                  style={{
                    background: 'none',
                    border: '1px dashed var(--border-color)',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{isSelected ? 'Hide Details' : 'View Proposition & Notes'}</span>
                  <Icon name="chevronDown" style={{ transform: isSelected ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {isSelected && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                    {moot.proposition_summary && (
                      <div>
                        <strong style={{ color: 'var(--accent)', fontSize: 12 }}>Proposition Overview:</strong>
                        <div style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.4, marginTop: 2, fontSize: 12 }}>
                          {moot.proposition_summary}
                        </div>
                      </div>
                    )}
                    {moot.memorial_notes && (
                      <div>
                        <strong style={{ color: 'var(--accent)', fontSize: 12 }}>Memorial Arguments & Citations:</strong>
                        <div style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.4, marginTop: 2, fontSize: 12 }}>
                          {moot.memorial_notes}
                        </div>
                      </div>
                    )}
                    {moot.bench_questions && (
                      <div>
                        <strong style={{ color: 'var(--accent)', fontSize: 12 }}>Anticipated Bench Questions:</strong>
                        <div style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.4, marginTop: 2, fontSize: 12 }}>
                          {moot.bench_questions}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Add / Edit Moot */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
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
              maxWidth: 680,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Lora', serif", margin: 0, fontSize: 20, color: 'var(--text-dark)' }}>
                {editingId ? 'Edit Moot Competition' : 'Track New Moot Court Competition'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Competition Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15th National Moot Court Competition / Jessup Indian Rounds"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Organizing Institution / University</label>
                  <input
                    type="text"
                    placeholder="e.g. NALSAR University of Law, Hyderabad"
                    value={form.organizer}
                    onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Assigned Side</label>
                  <select
                    value={form.side}
                    onChange={(e) => setForm({ ...form, side: e.target.value })}
                  >
                    <option value="Petitioner / Appellant">Petitioner / Appellant</option>
                    <option value="Respondent / Defendant">Respondent / Defendant</option>
                    <option value="Both Sides (Dual Memorial)">Both Sides (Dual Memorial)</option>
                    <option value="Prosecution">Prosecution</option>
                    <option value="Defense">Defense</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Memorial Submission Deadline</label>
                  <input
                    type="date"
                    value={form.memorial_deadline}
                    onChange={(e) => setForm({ ...form, memorial_deadline: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Oral Rounds Date</label>
                  <input
                    type="date"
                    value={form.competition_date}
                    onChange={(e) => setForm({ ...form, competition_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Team Members & Roles</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul (Speaker 1), Priya (Speaker 2), Amit (Researcher)"
                  value={form.team_members}
                  onChange={(e) => setForm({ ...form, team_members: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Moot Proposition Summary & Facts</label>
                <textarea
                  rows={3}
                  placeholder="Summarize the core factual dispute, parties, and jurisdictions..."
                  value={form.proposition_summary}
                  onChange={(e) => setForm({ ...form, proposition_summary: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Memorial Notes & Key Authorities</label>
                <textarea
                  rows={3}
                  placeholder="Draft memorial arguments, precedents, statutory provisions, and test points..."
                  value={form.memorial_notes}
                  onChange={(e) => setForm({ ...form, memorial_notes: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Bench Questions Prepared</label>
                <textarea
                  rows={2}
                  placeholder="List questions the judges might throw at your argument..."
                  value={form.bench_questions}
                  onChange={(e) => setForm({ ...form, bench_questions: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="Active">Active / In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Result / Accolades (if finished)</label>
                  <input
                    type="text"
                    placeholder="e.g. Winners / Best Memorial / Quarter-finalist"
                    value={form.result}
                    onChange={(e) => setForm({ ...form, result: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  {editingId ? 'Update Moot' : 'Save Moot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
