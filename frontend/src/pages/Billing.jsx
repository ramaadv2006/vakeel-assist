import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Icon from '../components/Icon';

const STATUS_BADGE = { Active: 'success', Closed: 'danger' };

function LedgerCard({ caseData, index }) {
  const pending = (caseData.total_fee || 0) - (caseData.fee_paid || 0);
  const staggerCls = index < 4 ? 'staggered-entry' : 'reveal-up';

  return (
    <div className={`case-card ledger-card ${staggerCls}`} style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 700, color: 'var(--text-dark)' }}>
            {caseData.client_name}
          </div>
          <div className="meta" style={{ marginTop: 4 }}>
            <span className="meta-item"><Icon name="case" />{caseData.case_number}</span>
            <span className="meta-divider">|</span>
            <span className="meta-item"><Icon name="court" />{caseData.court_name}</span>
            <span className="meta-divider">|</span>
            <span className="meta-item">
              <span className={`badge ${STATUS_BADGE[caseData.status] || 'warning'}`} style={{ fontSize: 11, padding: '2px 8px' }}>{caseData.status}</span>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-main)', fontWeight: 600 }}>Agreed Fee</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)' }}>₹{(caseData.total_fee || 0).toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-main)', fontWeight: 600 }}>Paid</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>₹{(caseData.fee_paid || 0).toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-main)', fontWeight: 600 }}>Pending</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: pending > 0 ? 'var(--danger)' : 'var(--text-main)' }}>₹{pending.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-main)', fontWeight: 600 }}>Expenses</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--info)' }}>₹{(caseData.expenses || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, borderTop: '1px dashed var(--border-card)', paddingTop: 8, gap: 12 }}>
        <Link to={`/edit/${caseData.id}#billing-section`} className="btn-icon-text btn-edit" style={{ fontSize: 12, padding: '6px 12px' }}>
          <Icon name="edit" />
          Update Ledger
        </Link>
      </div>
    </div>
  );
}

export default function Billing() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/billing').then(setData);
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.toLowerCase().trim();
    if (!q) return data.cases;
    return data.cases.filter((c) =>
      c.client_name.toLowerCase().includes(q) ||
      c.case_number.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  }, [data, query]);

  if (!data) return null;

  return (
    <div className="form-container" style={{ maxWidth: 1000 }}>
      <div className="form-header staggered-entry">
        <h2>Professional Fees & Ledger</h2>
        <p>Track receivables, collections, and litigation expenses across your cases</p>
      </div>

      <div className="stats-row staggered-entry" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeftColor: 'var(--accent)' }}>
          <div className="num">₹{data.total_agreed.toLocaleString('en-IN')}</div>
          <div className="label">Total Agreed Fees</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--success)' }}>
          <div className="num" style={{ color: 'var(--success)' }}>₹{data.total_collected.toLocaleString('en-IN')}</div>
          <div className="label">Total Collected</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--danger)' }}>
          <div className="num" style={{ color: 'var(--danger)' }}>₹{data.total_pending.toLocaleString('en-IN')}</div>
          <div className="label">Outstanding Balance</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--info)' }}>
          <div className="num" style={{ color: 'var(--info)' }}>₹{data.total_expenses.toLocaleString('en-IN')}</div>
          <div className="label">Litigation Expenses</div>
        </div>
      </div>

      <div className="dashboard-actions staggered-entry" style={{ marginBottom: 20 }}>
        <div className="search-box" style={{ flex: 1, maxWidth: '100%' }}>
          <Icon name="search" />
          <input type="text" placeholder="Search by client, case number, or status..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((c, i) => <LedgerCard key={c.id} caseData={c} index={i} />)}
        </div>
      ) : (
        <div className="empty-state staggered-entry">
          <Icon name="billing" style={{ width: 48, height: 48, stroke: '#cbd5e1' }} />
          <span>No ledger records found. Fill in billing details when adding or editing cases.</span>
        </div>
      )}
    </div>
  );
}
