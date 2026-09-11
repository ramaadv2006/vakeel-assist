import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, CheckCircle2, PauseCircle } from 'lucide-react';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import CaseCard from '../components/CaseCard';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';
import { useReveal } from '../hooks/useReveal';

export default function Archive() {
  const addFlash = useFlash();
  const [data, setData] = useState(null);
  const [onHoldTitleRef, onHoldTitleInView] = useReveal();
  const [onHoldListRef, onHoldListInView] = useReveal();

  const load = () => api.get('/archive').then(setData);
  useEffect(() => { load(); }, []);

  const handleDelete = async (caseId) => {
    const res = await api.del(`/cases/${caseId}`);
    addFlash(res.message, 'success');
    load();
  };

  const handleReopen = async (caseId) => {
    const res = await api.post(`/cases/${caseId}/reopen`);
    addFlash(res.message, 'success');
    load();
  };

  if (!data) {
    return (
      <div className="form-container" style={{ maxWidth: 1000 }}>
        <Skeleton count={3} rows={2} widths={['45%', '75%']} />
      </div>
    );
  }

  return (
    <div className="form-container" style={{ maxWidth: 1000 }}>
      {/* Top Hero Navigation */}
      <div className="page-hero-nav">
        <Link to="/" className="btn-back-dashboard">
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Archive</span>
        </div>
      </div>

      <div className="form-header staggered-entry">
        <h2>Case Archive</h2>
        <p>Deleted, closed, and on-hold cases are kept here so you can review them and restore them later.</p>
      </div>

      {/* Summary KPI Grid */}
      <div
        className="stats-row staggered-entry"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Deleted Cases"
          value={data.deleted_cases?.length || 0}
          color="var(--danger)"
          icon={<Trash2 size={18} />}
          hint="Cases in trash"
        />
        <StatCard
          label="Closed Briefs"
          value={data.closed_cases?.length || 0}
          color="var(--gray-500)"
          icon={<CheckCircle2 size={18} />}
          hint="Disposed matters"
        />
        <StatCard
          label="On Hold Cases"
          value={data.onhold_cases?.length || 0}
          color="var(--accent)"
          icon={<PauseCircle size={18} />}
          hint="Paused proceedings"
        />
      </div>

      {data.deleted_cases.length > 0 && (
        <>
          <div className="section-title staggered-entry" style={{ color: 'var(--danger)', borderColor: 'rgba(248, 113, 113, 0.24)' }}>
            <Icon name="archive" style={{ stroke: 'var(--danger)' }} />
            Deleted Cases
          </div>
          <div className="case-list">
            {data.deleted_cases.map((c) => (
              <CaseCard key={c.id} caseData={c} cssClass="archived" badgeText="Deleted" onDelete={handleDelete} onReopen={handleReopen} />
            ))}
          </div>
        </>
      )}

      {data.closed_cases.length > 0 && (
        <>
          <div className="section-title staggered-entry" style={{ color: 'var(--gray-500)', borderColor: 'rgba(100, 116, 139, 0.2)' }}>
            <Icon name="archive" style={{ stroke: 'var(--gray-500)' }} />
            Closed Cases
          </div>
          <div className="case-list">
            {data.closed_cases.map((c) => (
              <CaseCard key={c.id} caseData={c} cssClass="archived" badgeText={c.status} onDelete={handleDelete} onReopen={handleReopen} />
            ))}
          </div>
        </>
      )}

      {data.onhold_cases.length > 0 && (
        <>
          <div ref={onHoldTitleRef} className={`section-title reveal-up${onHoldTitleInView ? ' in-view' : ''}`} style={{ color: 'var(--accent)', borderColor: 'rgba(184, 147, 94, 0.25)', marginTop: 32 }}>
            <Icon name="info" style={{ stroke: 'var(--accent)' }} />
            On Hold Cases
          </div>
          <div ref={onHoldListRef} className={`case-list reveal-up${onHoldListInView ? ' in-view' : ''}`}>
            {data.onhold_cases.map((c) => (
              <CaseCard key={c.id} caseData={c} cssClass="archived" badgeText={c.status} onDelete={handleDelete} onReopen={handleReopen} />
            ))}
          </div>
        </>
      )}

      {data.total_archived === 0 && (
        <div className="empty-state staggered-entry">
          <Icon name="archive" style={{ width: 48, height: 48, stroke: '#cbd5e1' }} />
          <span>No archived cases. Cases marked Closed or On Hold from the Edit form will appear here.</span>
        </div>
      )}
    </div>
  );
}
