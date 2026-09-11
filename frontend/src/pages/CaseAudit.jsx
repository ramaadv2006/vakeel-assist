import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ShieldCheck, Clock, ArrowRight, FileEdit } from 'lucide-react';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';

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
  }, [caseId, addFlash, navigate]);

  if (!data) {
    return (
      <div className="form-container" style={{ maxWidth: 880 }}>
        <Skeleton count={3} rows={2} widths={['30%', '70%']} />
      </div>
    );
  }
  const { case: caseData, audit_logs: auditLogs } = data;

  return (
    <div className="form-container" style={{ maxWidth: 880 }}>
      {/* Top Hero Navigation */}
      <div className="page-hero-nav">
        <Link to="/" className="btn-back-dashboard">
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
        <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Case Audit Trail</span>
        </div>
      </div>

      <div className="form-header staggered-entry">
        <h2>Procedural Audit Trail</h2>
        <p>
          <strong>{caseData.client_name}</strong> • {caseData.case_number} ({caseData.court_name})
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }} className="staggered-entry">
        <Link
          to={`/history/${caseId}`}
          className="btn-export"
          style={{
            padding: '9px 18px',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600,
          }}
        >
          <Calendar size={15} />
          <span>Hearing Timeline</span>
        </Link>
        <Link
          to={`/case/${caseId}/audit`}
          className="btn-export"
          style={{
            padding: '9px 18px',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 700,
            background: 'var(--accent)',
            color: '#0b1526',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <ShieldCheck size={15} />
          <span>Audit Trail</span>
        </Link>
      </div>

      {auditLogs.length > 0 ? (
        <div className="timeline-container" style={{ position: 'relative', paddingLeft: 24 }}>
          {auditLogs.map((entry, idx) => (
            <motion.div
              className="timeline-item"
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              style={{ marginBottom: 18, position: 'relative' }}
            >
              <div
                className="timeline-dot active"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: 'var(--info)',
                  border: '3px solid var(--bg-card)',
                  boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)',
                  position: 'absolute',
                  left: -24,
                  top: 18,
                }}
              />

              <div
                className="card-form"
                style={{
                  margin: 0,
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)',
                  background: 'var(--bg-card)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileEdit size={16} color="var(--accent)" />
                      <span>Modified Field: <strong style={{ color: 'var(--accent-hover)' }}>{titleCase(entry.field_changed)}</strong></span>
                    </div>

                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 15 }}>
                      <div style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
                        <span style={{ fontSize: 13, textTransform: 'uppercase', fontWeight: 700, opacity: 0.7, marginRight: 6 }}>Old:</span>
                        <span style={{ textDecoration: 'line-through' }}>{entry.old_value !== '' ? entry.old_value : '(empty)'}</span>
                      </div>

                      <ArrowRight size={14} color="var(--text-muted)" />

                      <div style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
                        <span style={{ fontSize: 13, textTransform: 'uppercase', fontWeight: 700, opacity: 0.7, marginRight: 6 }}>New:</span>
                        <strong>{entry.new_value !== '' ? entry.new_value : '(empty)'}</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)' }}>
                      <Clock size={12} />
                      <span>Timestamp: {entry.changed_at}</span>
                    </div>
                  </div>

                  <span className="badge week" style={{ fontSize: 12.5, padding: '3px 8px' }}>
                    Audit Log #{entry.id}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="empty-state staggered-entry">
          <ShieldCheck size={48} color="var(--gray-300)" style={{ marginBottom: 8 }} />
          <span>No field updates recorded in audit trail yet.</span>
        </div>
      )}
    </div>
  );
}
