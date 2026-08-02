import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import CaseCard from '../components/CaseCard';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';
import { useReveal } from '../hooks/useReveal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function matchesQuery(caseData, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    caseData.client_name, caseData.case_number, caseData.court_name,
    caseData.case_type, caseData.notes, caseData.next_hearing_date,
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(q);
}

function Section({ title, titleClass, iconColor, cases, badgeFor, onDelete, onReopen, reveal }) {
  const [ref, inView] = useReveal();
  if (cases.length === 0) return null;
  const revealCls = reveal ? ` reveal-up${inView ? ' in-view' : ''}` : '';
  return (
    <>
      <div className={`section-title ${titleClass || ''}${revealCls}`} style={iconColor ? { color: iconColor, borderColor: 'rgba(100,116,139,0.2)' } : undefined}>
        <Icon name="calendar" style={{ stroke: iconColor }} />
        {title}
      </div>
      <div className={`case-list${revealCls}`} ref={reveal ? ref : undefined}>
        {cases.map((c) => (
          <CaseCard key={c.id} caseData={c} cssClass={badgeFor.cls} badgeText={badgeFor.text(c)} onDelete={onDelete} onReopen={onReopen} />
        ))}
      </div>
    </>
  );
}

export default function Dashboard() {
  const addFlash = useFlash();
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState('list');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [filterDate, setFilterDate] = useState(null);

  const load = () => {
    api.get('/dashboard').then(setData);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (caseId) => {
    const res = await api.del(`/cases/${caseId}`);
    addFlash(res.message, 'success');
    load();
  };

  const allCases = useMemo(() => {
    if (!data) return [];
    return [...data.overdue, ...data.today, ...data.this_week, ...data.upcoming];
  }, [data]);

  const filter = (cases) => cases.filter((c) => matchesQuery(c, query) && (!filterDate || c.next_hearing_date === filterDate));

  const datesCount = useMemo(() => {
    const counts = {};
    allCases.forEach((c) => {
      counts[c.next_hearing_date] = (counts[c.next_hearing_date] || 0) + 1;
    });
    return counts;
  }, [allCases]);

  if (!data) return <Skeleton count={4} rows={2} widths={['50%', '85%']} />;

  const overdue = filter(data.overdue);
  const today = filter(data.today);
  const thisWeek = filter(data.this_week);
  const upcoming = filter(data.upcoming);

  const goMonth = (delta) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCalMonth(m);
    setCalYear(y);
  };

  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const dayCells = [];
  for (let i = 0; i < firstDayIndex; i++) dayCells.push(null);
  for (let day = 1; day <= totalDays; day++) dayCells.push(day);

  return (
    <>
      <div className="stats-row">
        <StatCard value={data.total_cases} label="Total Active Cases" color="var(--accent)" />
        <StatCard value={data.overdue.length} label="Overdue Hearings" color="var(--danger)" />
        <StatCard value={data.today.length} label="Today's Hearings" color="var(--warning)" />
        <StatCard value={data.this_week.length} label="This Week" color="var(--info)" />
        <StatCard value={data.stale_cases_count} label={`Stale Cases (≥${data.stale_case_days}d)`} color="var(--warning)" />
      </div>

      <div className="dashboard-actions">
        <div className="search-box">
          <Icon name="search" />
          <input type="text" placeholder="Search cases by client, case no, court, notes..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className={`btn-export${view === 'list' ? ' active-view' : ''}`} onClick={() => setView('list')} title="Show list of hearings" type="button">List View</button>
          <button className={`btn-export${view === 'calendar' ? ' active-view' : ''}`} onClick={() => setView('calendar')} title="Show calendar monthly view" type="button">Calendar View</button>
          <Link to="/cases/bulk-update-dates" className="btn-export" title="Import hearing dates from cause list text">
            <Icon name="bulk" /> Bulk Import
          </Link>
          {data.total_cases > 0 && (
            <a href="/api/export" className="btn-export" title="Export case diary to CSV spreadsheet" onClick={(e) => {
              e.preventDefault();
              api.raw('/export').then(async (res) => {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'advo_buddy_cases_export.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              });
            }}>
              <Icon name="case" /> Export (CSV)
            </a>
          )}
        </div>
      </div>

      {view === 'calendar' && (
        <div style={{ marginBottom: 30 }} className="staggered-entry">
          <div className="card-form" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button className="btn-edit" style={{ padding: '6px 12px', cursor: 'pointer' }} onClick={() => goMonth(-1)} type="button">&larr; Prev</button>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
                {MONTH_NAMES[calMonth]} {calYear}
              </h2>
              <button className="btn-edit" style={{ padding: '6px 12px', cursor: 'pointer' }} onClick={() => goMonth(1)} type="button">Next &rarr;</button>
            </div>
            <div id="calendar-grid">
              {WEEKDAYS.map((d) => (
                <div key={d} style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', color: 'var(--text-main)', textAlign: 'center', padding: '8px 0' }}>{d}</div>
              ))}
              {dayCells.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="calendar-day empty"></div>;
                const mStr = String(calMonth + 1).padStart(2, '0');
                const dStr = String(day).padStart(2, '0');
                const cellDate = `${calYear}-${mStr}-${dStr}`;
                const hasEvents = !!datesCount[cellDate];
                const selected = filterDate === cellDate;
                return (
                  <div
                    key={cellDate}
                    className={`calendar-day${hasEvents ? ' has-events' : ''}${selected ? ' selected-day' : ''}`}
                    title={hasEvents ? `${datesCount[cellDate]} hearing(s)` : undefined}
                    onClick={() => setFilterDate((prev) => (prev === cellDate ? null : cellDate))}
                  >
                    <span className="day-number">{day}</span>
                    {hasEvents && <div className="calendar-event-dot"></div>}
                  </div>
                );
              })}
            </div>
            {filterDate && (
              <div style={{ display: 'flex', marginTop: 14, padding: '10px 14px', background: 'var(--accent-bg)', borderLeft: '3px solid var(--accent)', borderRadius: 'var(--radius-sm)', fontSize: 13.5, color: 'var(--text-main)', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Showing hearings for: <strong>{filterDate}</strong></span>
                <button onClick={() => setFilterDate(null)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 700, fontSize: 13, textDecoration: 'underline' }}>
                  Show All Hearings
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Section title="Overdue — Action Needed" titleClass="overdue" cases={overdue} badgeFor={{ cls: 'overdue', text: (c) => `${Math.abs(c.days_left)} days overdue` }} onDelete={handleDelete} />
      <Section title="Today's Hearings" titleClass="today" cases={today} badgeFor={{ cls: 'today', text: () => 'Today' }} onDelete={handleDelete} />
      <Section title="This Week" iconColor="var(--accent)" cases={thisWeek} badgeFor={{ cls: 'week', text: (c) => `${c.days_left} days left` }} onDelete={handleDelete} reveal />
      <Section title="Upcoming" iconColor="var(--gray-500)" cases={upcoming} badgeFor={{ cls: 'upcoming', text: (c) => `${c.days_left} days left` }} onDelete={handleDelete} reveal />

      {data.total_cases === 0 && (
        <div className="empty-state staggered-entry">
          <Icon name="case" style={{ width: 48, height: 48, stroke: '#cbd5e1' }} />
          <span>No cases added yet. Click "+ Add Case" to get started.</span>
        </div>
      )}
    </>
  );
}
