import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import Icon from '../components/Icon';

export default function BulkUpdateDates() {
  const addFlash = useFlash();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      addFlash('Please enter or paste cause list lines to import.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/cases/bulk-update-dates', { cause_list_text: text });
      if (res.updated_count > 0) {
        addFlash(`Bulk update successful! Updated hearing dates for ${res.updated_count} case(s).`, 'success');
      }
      if (res.unmatched_list.length > 0) {
        addFlash(`The following ${res.unmatched_list.length} case number(s) did not match any active cases: ${res.unmatched_list.join(', ')}`, 'warning');
      }
      if (res.invalid_lines.length > 0) {
        addFlash(`Skipped ${res.invalid_lines.length} line(s) due to invalid format: ${res.invalid_lines.slice(0, 3).join('; ')}`, 'error');
      }
      res.conflict_warnings.forEach((cw) => addFlash(`Warning: ${cw}`, 'warning'));
      setText('');
    } catch (err) {
      addFlash(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container staggered-entry" style={{ maxWidth: 720 }}>
      <Link to="/" className="back-link">
        <Icon name="back" />
        Back to Dashboard
      </Link>

      <div className="form-header">
        <h2>Cause List Bulk Date Import</h2>
        <p>Paste lines from your daily court cause list to update hearing dates for multiple cases at once.</p>
      </div>

      <div className="card-form" style={{ marginBottom: 24, padding: '18px 22px', background: 'var(--bg-card)', borderLeft: '4px solid var(--accent)', borderRadius: 'var(--radius-md)' }}>
        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-dark)', fontSize: 14.5 }}>Formatting Instructions</h4>
        <p style={{ margin: '0 0 8px 0', fontSize: 13.5, color: 'var(--text-main)' }}>
          Paste each item on a new line in the exact format: <code>case_number, YYYY-MM-DD</code>
        </p>
        <div style={{ background: 'var(--bg-app)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: 13, color: 'var(--primary-light)' }}>
          OS/123/2023, 2026-08-15<br />
          CC/4567/2024, 2026-09-01<br />
          W.P. 8901/2022, 2026-08-20
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="cause_list_text">Paste Cause List Lines (case_number, new_hearing_date)</label>
          <textarea
            id="cause_list_text"
            rows={10}
            placeholder={'OS/123/2023, 2026-08-15\nCC/4567/2024, 2026-09-01'}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 13.5, padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-dark)' }}
          ></textarea>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button type="submit" className="btn-submit" disabled={loading} style={{ flex: 1 }}>
            Import & Update Dates
          </button>
          <Link to="/" className="btn-cancel" style={{ textDecoration: 'none', textAlign: 'center', display: 'inline-block' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
