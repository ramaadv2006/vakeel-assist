import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import CaseCard from '../components/CaseCard';
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
    await api.del(`/cases/${caseId}`);
    addFlash('Case removed.', 'success');
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
      <div className="form-header staggered-entry">
        <h2>Case Archive</h2>
        <p>Closed and on-hold cases — reopen any of them back to Active in one click</p>
      </div>

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
