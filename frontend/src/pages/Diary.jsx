import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Printer, Scale, MapPin, Award } from 'lucide-react';
import { api } from '../api/client';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';

export default function Diary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get('date') || '';
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(
    () =>
      api
        .get(`/diary${date ? `?date=${date}` : ''}`)
        .then((res) => {
          setData(res);
          setError(null);
        })
        .catch((err) => setError(err.message || 'Could not load the court diary.')),
    [date]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="form-container" style={{ maxWidth: 1000 }}>
        <div className="empty-state">
          <Icon name="warning" />
          <span>{error}</span>
          <button type="button" className="btn-export" onClick={load}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="form-container" style={{ maxWidth: 1000 }}>
        <Skeleton count={3} rows={2} widths={['40%', '80%']} />
      </div>
    );
  }

  const goDate = (d) => setSearchParams(d ? { date: d } : {});

  let lastCourt = null;

  return (
    <>
      <div className="form-container no-print" style={{ maxWidth: 1000, marginBottom: 20 }}>
        {/* Top Hero Navigation */}
        <div className="page-hero-nav">
          <Link to="/" className="btn-back-dashboard">
            <span>←</span>
            <span>Back to Dashboard</span>
          </Link>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
            <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Court Diary</span>
          </div>
        </div>

        {/* Date Selector & Print Bar */}
        <div
          className="card-form staggered-entry"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            padding: '14px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-card)',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-icon-text btn-export"
              title="Previous day"
              onClick={() => goDate(data.prev_date)}
              type="button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 14px' }}
            >
              <ChevronLeft size={15} />
              <span>Prev Day</span>
            </motion.button>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-card)',
              }}
            >
              <Calendar size={15} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-dark)' }}>
                {data.selected_date}
              </span>
              {data.is_today && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: 'var(--accent)',
                    color: '#ffffff',
                  }}
                >
                  Today
                </span>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-icon-text btn-export"
              title="Next day"
              onClick={() => goDate(data.next_date)}
              type="button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 14px' }}
            >
              <span>Next Day</span>
              <ChevronRight size={15} />
            </motion.button>

            {!data.is_today && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => goDate('')}
                className="btn-icon-text"
                style={{
                  padding: '7px 12px',
                  fontSize: 12,
                  background: 'var(--accent-bg)',
                  color: 'var(--accent-hover)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                Jump to Today
              </motion.button>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            className="btn-submit"
            onClick={() => window.print()}
            style={{
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              fontSize: 13,
            }}
          >
            <Printer size={15} />
            <span>Print Cause List</span>
          </motion.button>
        </div>
      </div>

      <div className="form-container" style={{ maxWidth: 1000 }}>
        <div
          className="diary-sheet staggered-entry"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            padding: '36px 40px',
          }}
        >
          {/* Authentic Chambers Letterhead */}
          <div className="diary-letterhead" style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '2px solid var(--accent)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent)', marginBottom: 10, border: '1px solid var(--accent-border)' }}>
              <Scale size={22} />
            </div>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 6px 0' }}>
              {data.advocate?.name || 'Advocate Chambers'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontSize: 13, color: 'var(--text-main)', flexWrap: 'wrap' }}>
              {data.advocate?.bar_council_number && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Award size={14} color="var(--accent)" />
                  <strong>Bar Council: {data.advocate.bar_council_number}</strong>
                </span>
              )}
              {data.advocate?.office_address && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={14} color="var(--accent)" />
                  <span>{data.advocate.office_address}</span>
                </span>
              )}
            </div>
          </div>

          <div
            className="diary-subheading"
            style={{
              fontSize: 14,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              color: 'var(--accent)',
              textAlign: 'center',
              marginTop: 20,
              marginBottom: 20,
            }}
          >
            Daily Cause List & Court Board — {data.selected_date}
          </div>

          {data.hearings.length > 0 ? (
            <div className="table-scroll">
              <table className="diary-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-app)', borderBottom: '2px solid var(--border-card)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-muted)' }}>Court</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-muted)' }}>Hall</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-muted)' }}>Item</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-muted)' }}>Case Number</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-muted)' }}>Client Name</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-muted)' }}>Judge / Bench</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-muted)' }}>Opposing Counsel</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-muted)' }}>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.hearings.map((c) => {
                    const showGroup = c.court_name !== lastCourt;
                    lastCourt = c.court_name;
                    return (
                      <Fragment key={c.id}>
                        {showGroup && (
                          <tr className="diary-court-group">
                            <td colSpan={8} style={{ padding: '12px 14px', background: 'var(--accent-bg)', color: 'var(--accent-hover)', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--accent-border)' }}>
                              🏛️ {c.court_name}
                            </td>
                          </tr>
                        )}
                        <tr style={{ borderBottom: '1px solid var(--border-card)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-dark)' }}>{c.court_name}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            {c.court_hall ? (
                              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-app)', border: '1px solid var(--border-card)' }}>
                                {c.court_hall}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            {c.item_number ? (
                              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--accent-bg)', color: 'var(--accent-hover)', border: '1px solid var(--accent-border)' }}>
                                #{c.item_number}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 13.5, color: 'var(--text-dark)' }}>
                            <Link to={`/edit/${c.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              {c.case_number}
                            </Link>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13, color: 'var(--text-dark)' }}>{c.client_name}</td>
                          <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--text-main)', fontStyle: 'italic' }}>{c.judge_name || '—'}</td>
                          <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--text-main)' }}>{c.opposing_counsel || '—'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            {c.case_stage ? (
                              <span className="badge week" style={{ fontSize: 11, padding: '3px 10px' }}>
                                {c.case_stage}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <Calendar size={40} color="var(--gray-300)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-dark)', margin: '0 0 6px 0' }}>
                No Hearings Scheduled for {data.selected_date}
              </p>
              <p style={{ fontSize: 13, margin: 0 }}>
                Use the day navigation buttons above or open the calendar view on your Dashboard to view other dates.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
