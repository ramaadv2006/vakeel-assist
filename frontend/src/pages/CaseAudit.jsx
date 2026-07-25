import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import Icon from '../components/Icon';

function titleCase(s) {
  return s.replace(/_/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));
}

export default function CaseAudit() {
  const { caseId } = useParams();
  const addFlash = useFlash();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/cases/${caseId}/audit`).then(setData).catch(() => {
      addFlash('Case not found.', 'error');
      navigate('/');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  if (!data) return null;
  const { case: caseData, audit_logs: auditLogs } = data;

  return (
    <div className="form-container">
      <Link to="/" className="back-link staggered-entry">
        <Icon name="back" />
        Back to Dashboard
      </Link>

      <div className="form-header staggered-entry">
        <h2>Case Audit Trail</h2>
        <p>{caseData.client_name} — {caseData.case_number} ({caseData.court_name})</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }} className="staggered-entry">
        <Link to={`/history/${caseId}`} className="btn-export" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
          <Icon name="calendar" />
          Hearing Timeline
        </Link>
        <Link to={`/case/${caseId}/audit`} className="btn-export active-view" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
          <Icon name="audit" />
          Audit Trail
        </Link>
      </div>

      {auditLogs.length > 0 ? (
        <div className="timeline-container staggered-entry">
          {auditLogs.map((entry) => (
            <div className="timeline-item" key={entry.id}>
              <div className="timeline-dot active"></div>
              <div className="case-card week" style={{ margin: 0 }}>
                <div className="case-info">
                  <div className="client" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dark)' }}>
                    Changed <span style={{ color: 'var(--accent-hover)', fontWeight: 700 }}>{titleCase(entry.field_changed)}</span>
                  </div>
                  <div className="meta" style={{ marginTop: 4, fontSize: 13.5 }}>
                    <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>
                      Old: {entry.old_value !== '' ? entry.old_value : '(empty)'}
                    </span>
                    <span className="meta-divider">&rarr;</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                      New: {entry.new_value !== '' ? entry.new_value : '(empty)'}
                    </span>
                  </div>
                  <div className="meta" style={{ marginTop: 4, opacity: 0.75, fontSize: 12 }}>
                    Timestamp: {entry.changed_at}
                  </div>
                </div>
                <span className="badge week">Field Modified</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state staggered-entry">
          <span>No field updates recorded in audit trail yet.</span>
        </div>
      )}
    </div>
  );
}
