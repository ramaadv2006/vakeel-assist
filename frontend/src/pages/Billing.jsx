import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle2, AlertCircle, Receipt, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';
import { useReveal } from '../hooks/useReveal';

const STATUS_BADGE = { Active: 'success', Closed: 'danger', 'On Hold': 'warning' };

function LedgerCard({ caseData, index }) {
  const agreed = caseData.total_fee || 0;
  const paid = caseData.fee_paid || 0;
  const pending = agreed - paid;
  const expenses = caseData.expenses || 0;
  const [revealRef, inView] = useReveal();
  const staggerCls = index < 4 ? 'staggered-entry' : `reveal-up${inView ? ' in-view' : ''}`;
  const paidPercent = agreed > 0 ? Math.min(100, Math.round((paid / agreed) * 100)) : 0;

  return (
    <motion.div
      ref={revealRef}
      className={`case-card ledger-card ${staggerCls}`}
      style={{
        padding: '20px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-card)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-sm)',
      }}
      whileHover={{ y: -3, boxShadow: '0 12px 28px -6px rgba(11, 21, 38, 0.10)' }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
              {caseData.client_name}
            </h3>
            <span className={`badge ${STATUS_BADGE[caseData.status] || 'warning'}`} style={{ fontSize: 13, padding: '2px 9px' }}>
              {caseData.status}
            </span>
          </div>

          <div className="meta" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="meta-item" style={{ fontWeight: 600 }}>
              <Icon name="case" style={{ width: 13, height: 13 }} />
              {caseData.case_number}
            </span>
            <span style={{ color: 'var(--gray-300)' }}>•</span>
            <span className="meta-item">
              <Icon name="court" style={{ width: 13, height: 13 }} />
              {caseData.court_name}
            </span>
          </div>

          {/* Payment Recovery Mini-Progress Bar */}
          {agreed > 0 && (
            <div style={{ marginTop: 12, maxWidth: 320 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Recovery: {paidPercent}%</span>
                <span>₹{paid.toLocaleString('en-IN')} / ₹{agreed.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ height: 6, width: '100%', background: 'var(--bg-app)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${paidPercent}%`,
                    background: paidPercent === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--accent) 0%, var(--success) 100%)',
                    borderRadius: 3,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Ledger Balance Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(70px, 1fr))', gap: 16, textAlign: 'right', minWidth: 300 }}>
          <div style={{ padding: '8px 10px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: 12.5, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.4 }}>Agreed</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-dark)', marginTop: 2 }}>₹{agreed.toLocaleString('en-IN')}</div>
          </div>

          <div style={{ padding: '8px 10px', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: 12.5, textTransform: 'uppercase', color: 'var(--success)', fontWeight: 700, letterSpacing: 0.4 }}>Collected</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--success)', marginTop: 2 }}>₹{paid.toLocaleString('en-IN')}</div>
          </div>

          <div style={{ padding: '8px 10px', background: pending > 0 ? 'var(--danger-bg)' : 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: pending > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border-card)' }}>
            <div style={{ fontSize: 12.5, textTransform: 'uppercase', color: pending > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.4 }}>Balance</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: pending > 0 ? 'var(--danger)' : 'var(--text-dark)', marginTop: 2 }}>₹{pending.toLocaleString('en-IN')}</div>
          </div>

          <div style={{ padding: '8px 10px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: 12.5, textTransform: 'uppercase', color: 'var(--info)', fontWeight: 700, letterSpacing: 0.4 }}>Court Costs</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--info)', marginTop: 2 }}>₹{expenses.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, borderTop: '1px solid var(--border-card)', paddingTop: 10 }}>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            to={`/edit/${caseData.id}#billing-section`}
            className="btn-icon-text btn-edit"
            style={{ fontSize: 14.5, padding: '6px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="edit" style={{ width: 13, height: 13 }} />
            <span>Update Ledger</span>
            <ArrowRight size={12} />
          </Link>
        </motion.div>
      </div>
    </motion.div>
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

  if (!data) {
    return (
      <div className="form-container" style={{ maxWidth: 1040 }}>
        <Skeleton count={4} rows={2} widths={['35%', '80%']} />
      </div>
    );
  }

  const collectionRate = data.total_agreed > 0 ? Math.round((data.total_collected / data.total_agreed) * 100) : 0;

  return (
    <div className="form-container" style={{ maxWidth: 1040 }}>
      {/* Top Hero Navigation */}
      <div className="page-hero-nav">
        <Link to="/" className="btn-back-dashboard">
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
        <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Billing & Fees</span>
        </div>
      </div>

      <div className="form-header staggered-entry">
        <h2>Chambers Financial Ledger</h2>
        <p>Monitor professional receivables, collections, and litigation expenses across your caseload</p>
      </div>

      {/* Interactive KPI Stats Grid */}
      <div className="stats-row staggered-entry" style={{ marginBottom: 20 }}>
        <StatCard
          value={data.total_agreed}
          prefix="₹"
          label="Total Agreed Fees"
          color="var(--accent)"
          icon={<Briefcase size={18} />}
          hint="Contracted legal retainer"
        />

        <StatCard
          value={data.total_collected}
          prefix="₹"
          label="Total Collected"
          color="var(--success)"
          icon={<CheckCircle2 size={18} />}
          hint={`${collectionRate}% collection rate`}
        />

        <StatCard
          value={data.total_pending}
          prefix="₹"
          label="Outstanding Balance"
          color="var(--danger)"
          icon={<AlertCircle size={18} />}
          hint="Pending client dues"
        />

        <StatCard
          value={data.total_expenses}
          prefix="₹"
          label="Litigation Expenses"
          color="var(--info)"
          icon={<Receipt size={18} />}
          hint="Court stamps & process fees"
        />
      </div>

      {/* Overall Recovery Health Bar */}
      <div
        className="card-form staggered-entry"
        style={{
          padding: '16px 20px',
          marginBottom: 24,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dark)' }}>
            Chambers Fee Realization Rate: <strong style={{ color: 'var(--success)' }}>{collectionRate}%</strong>
          </span>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            ₹{data.total_collected.toLocaleString('en-IN')} received of ₹{data.total_agreed.toLocaleString('en-IN')} total
          </span>
        </div>
        <div style={{ height: 8, width: '100%', background: 'var(--bg-app)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-card)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${collectionRate}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent) 0%, var(--success) 100%)',
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      {/* Search Filter */}
      <div className="dashboard-actions staggered-entry" style={{ marginBottom: 20 }}>
        <div className="search-box" style={{ flex: 1, maxWidth: '100%' }}>
          <Icon name="search" />
          <input
            type="text"
            placeholder="Search by client, case number, or status..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((c, i) => (
            <LedgerCard key={c.id} caseData={c} index={i} />
          ))}
        </div>
      ) : (
        <div className="empty-state staggered-entry">
          <Icon name="billing" style={{ width: 48, height: 48, stroke: '#cbd5e1' }} />
          <span>No ledger records found matching your filter.</span>
        </div>
      )}
    </div>
  );
}
