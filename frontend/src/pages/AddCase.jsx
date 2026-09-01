import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import CaseForm from '../components/CaseForm';
import Icon from '../components/Icon';

export default function AddCase() {
  const addFlash = useFlash();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      const res = await api.post('/cases', values);
      if (res.conflicts && res.conflicts.length > 0) {
        addFlash(`Warning: Hearing date conflict detected! You already have active case(s) (${res.conflicts.join(', ')}) at '${values.court_name}' on ${values.next_hearing_date}.`, 'warning');
      }
      addFlash(res.message, 'success');
      navigate('/');
    } catch (err) {
      addFlash(err.message, 'error');
    }
  };

  return (
    <div className="form-container">
      <Link to="/" className="back-link staggered-entry">
        <Icon name="back" />
        Back to Dashboard
      </Link>

      <div className="form-header staggered-entry">
        <h2>Add New Case</h2>
        <p>Record a new case file and set the hearing date schedule</p>
      </div>

      <div className="staggered-entry" style={{ marginBottom: 24, padding: '14px 18px', background: 'var(--card-bg)', borderRadius: 8, border: '1px dashed var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: 14 }}>
            🏛️ Already have cases listed on eCourts?
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Search by your Bar Registration Number to import all active court matters with 1-click.
          </div>
        </div>
        <Link to="/case-search" className="btn-edit" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, background: 'var(--bg-main)' }}>
          <Icon name="court" /> Import from eCourts &rarr;
        </Link>
      </div>

      <CaseForm onSubmit={handleSubmit} submitLabel="Save Case File" />
    </div>
  );
}
