import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';

export default function CaseHistory() {
  const { caseId } = useParams();
  const addFlash = useFlash();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/cases/${caseId}/history`).then(setData).catch(() => {
      addFlash('Case not found.', 'error');
      navigate('/');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  if (!data) {
    return (
      <div className="form-container">
        <Skeleton count={3} rows={2} widths={['30%', '70%']} />
      </div>
    );
  }
  const { case: caseData, history } = data;

  return (
    <div className="form-container">
      <Link to="/" className="back-link staggered-entry">
        <Icon name="back" />
        Back to Dashboard
      </Link>

      <div className="form-header staggered-entry">
        <h2>Hearing History</h2>
        <p>{caseData.client_name} — {caseData.case_number} ({caseData.court_name})</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }} className="staggered-entry">
        <Link to={`/history/${caseId}`} className="btn-export active-view" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
          <Icon name="calendar" />
          Hearing Timeline
        </Link>
        <Link to={`/case/${caseId}/audit`} className="btn-export" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
          <Icon name="audit" />
          Audit Trail
        </Link>
      </div>

      {history.length > 0 ? (
        <div className="timeline-container">
          {history.map((entry, i) => {
            const isLast = i === history.length - 1;
            return (
              <div className="timeline-item" key={entry.id}>
                <div className={`timeline-dot${isLast ? ' active' : ''}`}></div>
                <div className={`case-card ${isLast ? 'today' : 'upcoming'}`} style={{ margin: 0 }}>
                  <div className="case-info">
                    <div className="client" style={!isLast ? { textDecoration: 'line-through', color: 'var(--gray-400)' } : undefined}>
                      {entry.hearing_date}
                    </div>
                    <div className="meta">
                      <span className="meta-item">Recorded on {entry.added_at}</span>
                      {entry.note && (
                        <>
                          <span className="meta-divider">|</span>
                          <span className="meta-item">{entry.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${isLast ? 'today' : 'upcoming'}`}>{isLast ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state staggered-entry">
          <span>No hearing history recorded yet for this case.</span>
        </div>
      )}
    </div>
  );
}
