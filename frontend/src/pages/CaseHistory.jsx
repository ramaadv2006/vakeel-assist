import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, History, ShieldCheck, ArrowLeft, Clock } from 'lucide-react';
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
  }, [caseId, addFlash, navigate]);

  if (!data) {
    return (
      <div className="form-container" style={{ maxWidth: 880 }}>
        <Skeleton count={3} rows={2} widths={['30%', '70%']} />
      </div>
    );
  }
  const { case: caseData, history } = data;

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
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Hearing History</span>
        </div>
      </div>

      <div className="form-header staggered-entry">
        <h2>Judicial Hearing Timeline</h2>
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
            fontWeight: 700,
            background: 'var(--accent)',
            color: '#0b1526',
            boxShadow: 'var(--shadow-sm)',
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
            fontWeight: 600,
          }}
        >
          <ShieldCheck size={15} />
          <span>Audit Trail</span>
        </Link>
      </div>

      {history.length > 0 ? (
        <div className="timeline-container" style={{ position: 'relative', paddingLeft: 24 }}>
          {history.map((entry, i) => {
            const isLast = i === history.length - 1;
            return (
              <motion.div
                className="timeline-item"
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                style={{ marginBottom: 20, position: 'relative' }}
              >
                <div
                  className={`timeline-dot${isLast ? ' active' : ''}`}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: isLast ? 'var(--accent)' : 'var(--gray-300)',
                    border: '3px solid var(--bg-card)',
                    boxShadow: isLast ? '0 0 12px var(--accent)' : 'none',
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
                    border: isLast ? '1px solid var(--accent)' : '1px solid var(--border-card)',
                    background: isLast ? 'var(--accent-bg)' : 'var(--bg-card)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: "'Lora', serif", fontSize: 19, fontWeight: 700, color: 'var(--text-dark)' }}>
                          {entry.hearing_date}
                        </span>
                        <span
                          className={`badge ${isLast ? 'today' : 'upcoming'}`}
                          style={{ fontSize: 12.5, padding: '2px 8px' }}
                        >
                          {isLast ? 'Current Schedule' : 'Past Listing'}
                        </span>
                      </div>

                      <div className="meta" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14.5, color: 'var(--text-muted)' }}>
                        <Clock size={12} />
                        <span>Recorded on {entry.added_at}</span>
                      </div>
                    </div>
                  </div>

                  {entry.note && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-app)',
                        borderLeft: '3px solid var(--accent)',
                        fontSize: 15,
                        color: 'var(--text-main)',
                      }}
                    >
                      <strong>Proceedings Note:</strong> {entry.note}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state staggered-entry">
          <History size={48} color="var(--gray-300)" style={{ marginBottom: 8 }} />
          <span>No previous hearing history recorded yet for this case.</span>
        </div>
      )}
    </div>
  );
}
