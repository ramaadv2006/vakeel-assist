import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function Diary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get('date') || '';
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/diary${date ? `?date=${date}` : ''}`).then(setData);
  }, [date]);

  if (!data) return null;

  const goDate = (d) => setSearchParams(d ? { date: d } : {});

  let lastCourt = null;

  return (
    <>
      <div className="form-container no-print" style={{ maxWidth: 900, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }} className="staggered-entry">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn-export" title="Previous day" onClick={() => goDate(data.prev_date)} type="button">&larr; Prev Day</button>
            <span style={{ fontWeight: 700, color: 'var(--text-dark)', padding: '0 4px' }}>
              {data.selected_date}{data.is_today ? ' (Today)' : ''}
            </span>
            <button className="btn-export" title="Next day" onClick={() => goDate(data.next_date)} type="button">Next Day &rarr;</button>
          </div>
          <button type="button" className="btn-submit" onClick={() => window.print()} style={{ margin: 0 }}>Print Diary</button>
        </div>
      </div>

      <div className="form-container" style={{ maxWidth: 900 }}>
        <div className="diary-sheet staggered-entry">
          <div className="diary-letterhead">
            <h2>{data.advocate?.name}</h2>
            <p>
              {data.advocate?.bar_council_number && `Bar Council No: ${data.advocate.bar_council_number}`}
              {data.advocate?.office_address && (data.advocate?.bar_council_number ? ` • ${data.advocate.office_address}` : data.advocate.office_address)}
            </p>
          </div>

          <div className="diary-subheading">Court Board — {data.selected_date}</div>

          {data.hearings.length > 0 ? (
            <div className="table-scroll">
              <table className="diary-table">
                <thead>
                  <tr>
                    <th>Court</th>
                    <th>Hall</th>
                    <th>Item No</th>
                    <th>Case Number</th>
                    <th>Client</th>
                    <th>Judge</th>
                    <th>Opposing Counsel</th>
                    <th>Stage</th>
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
                            <td colSpan={8}>{c.court_name}</td>
                          </tr>
                        )}
                        <tr>
                          <td>{c.court_name}</td>
                          <td>{c.court_hall || '—'}</td>
                          <td>{c.item_number || '—'}</td>
                          <td>{c.case_number}</td>
                          <td>{c.client_name}</td>
                          <td>{c.judge_name || '—'}</td>
                          <td>{c.opposing_counsel || '—'}</td>
                          <td>{c.case_stage || '—'}</td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-main)', fontSize: 14 }}>No hearings scheduled for this date.</p>
          )}
        </div>
      </div>
    </>
  );
}
