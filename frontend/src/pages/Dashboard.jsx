import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  Briefcase,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Layers,
  Plus,
  Search,
  X,
  Download,
  RotateCcw,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
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
    caseData.client_name,
    caseData.case_number,
    caseData.court_name,
    caseData.case_type,
    caseData.notes,
    caseData.next_hearing_date,
    caseData.judge_name,
    caseData.opposing_counsel,
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(q);
}

function Section({ title, titleClass, iconColor, cases, badgeFor, onDelete, onReopen, reveal, icon }) {
  const [ref, inView] = useReveal();
  if (cases.length === 0) return null;
  const revealCls = reveal ? ` reveal-up${inView ? ' in-view' : ''}` : '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ marginBottom: 28 }}
    >
      <div
        className={`section-title ${titleClass || ''}${revealCls}`}
        style={iconColor ? { color: iconColor, borderColor: 'var(--border-card)' } : undefined}
      >
        {icon || <Icon name="calendar" style={{ stroke: iconColor }} />}
        <span>{title}</span>
        <span className="section-count-badge">({cases.length})</span>
      </div>
      <div className={`case-list${revealCls}`} ref={reveal ? ref : undefined}>
        {cases.map((c) => (
          <CaseCard
            key={c.id}
            caseData={c}
            cssClass={badgeFor.cls}
            badgeText={badgeFor.text(c)}
            onDelete={onDelete}
            onReopen={onReopen}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { advocate } = useAuth();
  const addFlash = useFlash();
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState('list');
  const [activeCategory, setActiveCategory] = useState('all');
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

  const filter = (cases) =>
    cases.filter((c) => matchesQuery(c, query) && (!filterDate || c.next_hearing_date === filterDate));

  const datesCount = useMemo(() => {
    const counts = {};
    allCases.forEach((c) => {
      counts[c.next_hearing_date] = (counts[c.next_hearing_date] || 0) + 1;
    });
    return counts;
  }, [allCases]);

  const handleExportCsv = (e) => {
    e.preventDefault();
    api.raw('/export').then(async (res) => {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `advo_diary_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  if (!data) {
    return (
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <Skeleton count={4} rows={2} widths={['50%', '85%']} />
      </div>
    );
  }

  const overdue = filter(data.overdue);
  const today = filter(data.today);
  const thisWeek = filter(data.this_week);
  const upcoming = filter(data.upcoming);
  const stale = allCases.filter((c) => c.is_stale && matchesQuery(c, query) && (!filterDate || c.next_hearing_date === filterDate));

  const totalFilteredCount = overdue.length + today.length + thisWeek.length + upcoming.length;

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
    <div className="dashboard-container">
      {/* 1. Executive Hero Welcome Banner */}
      <motion.div
        className="dashboard-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="dashboard-hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-pill">
              <Scale size={13} /> Chambers Legal Workspace
            </span>
            <span className="hero-date-chip">
              <CalendarIcon size={13} /> {todayDateStr}
            </span>
            {advocate?.bar_registration_number && (
              <span className="hero-bar-chip" title="Bar Council Registration">
                Bar No: {advocate.bar_registration_number}
              </span>
            )}
          </div>

          <h1 className="hero-greeting">
            {greeting}, {advocate?.name ? `Advocate ${advocate.name}` : 'Advocate'}
          </h1>

          <p className="hero-briefing">
            Today you have{' '}
            <strong style={{ color: data.today.length > 0 ? 'var(--warning)' : 'var(--text-dark)' }}>
              {data.today.length} hearing{data.today.length === 1 ? '' : 's'} scheduled
            </strong>
            {data.overdue.length > 0 && (
              <>
                ,{' '}
                <strong style={{ color: 'var(--danger)' }}>
                  {data.overdue.length} overdue matter{data.overdue.length === 1 ? '' : 's'}
                </strong>
              </>
            )}
            , and <strong>{data.this_week.length} upcoming</strong> this week.
          </p>
        </div>
      </motion.div>

      {/* 2. Interactive KPI Stats Grid */}
      <motion.div
        className="stats-row"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <StatCard
          value={data.total_cases}
          label="Total Active Cases"
          color="var(--accent)"
          icon={<Briefcase size={18} />}
          hint="All active court files"
          isActive={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        />

        <StatCard
          value={data.overdue.length}
          label="Overdue Hearings"
          color="var(--danger)"
          icon={<AlertTriangle size={18} />}
          hint={data.overdue.length > 0 ? 'Urgent action required' : 'All matters up to date'}
          isActive={activeCategory === 'overdue'}
          onClick={() => setActiveCategory((prev) => (prev === 'overdue' ? 'all' : 'overdue'))}
        />

        <StatCard
          value={data.today.length}
          label="Today's Hearings"
          color="var(--warning)"
          icon={<CalendarIcon size={18} />}
          hint={data.today.length > 0 ? 'Listed for today' : 'No hearings today'}
          isActive={activeCategory === 'today'}
          onClick={() => setActiveCategory((prev) => (prev === 'today' ? 'all' : 'today'))}
        />

        <StatCard
          value={data.this_week.length}
          label="This Week"
          color="var(--info)"
          icon={<Clock size={18} />}
          hint="Next 7 days schedule"
          isActive={activeCategory === 'week'}
          onClick={() => setActiveCategory((prev) => (prev === 'week' ? 'all' : 'week'))}
        />

        <StatCard
          value={data.stale_cases_count}
          label={`Stale Cases (≥${data.stale_case_days}d)`}
          color="var(--gray-500)"
          icon={<Layers size={18} />}
          hint="Awaiting court updates"
          isActive={activeCategory === 'stale'}
          onClick={() => setActiveCategory((prev) => (prev === 'stale' ? 'all' : 'stale'))}
        />
      </motion.div>

      {/* 3. Command Deck: Search, View Controls & Filter Tabs */}
      <motion.div
        className="dashboard-command-deck"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="command-bar-row">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by client, case no, court, judge, notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="search-clear-btn"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="command-bar-controls">
            {/* Segmented View Switcher */}
            <div className="view-switch-segmented">
              <button
                type="button"
                className={`segmented-btn${view === 'list' ? ' active' : ''}`}
                onClick={() => setView('list')}
              >
                {view === 'list' && (
                  <motion.span layoutId="activeViewPill" className="segmented-pill-indicator" />
                )}
                <span className="segmented-btn-label">List View</span>
              </button>

              <button
                type="button"
                className={`segmented-btn${view === 'calendar' ? ' active' : ''}`}
                onClick={() => setView('calendar')}
              >
                {view === 'calendar' && (
                  <motion.span layoutId="activeViewPill" className="segmented-pill-indicator" />
                )}
                <span className="segmented-btn-label">Calendar View</span>
              </button>
            </div>

            {data.total_cases > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="btn-export-compact"
                title="Export diary cases to CSV"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Filter Pills Ribbon */}
        <div className="filter-tabs-strip" style={{ position: 'relative' }}>
          {[
            { id: 'all', label: 'All Matters', count: allCases.length },
            ...(data.overdue.length > 0 ? [{ id: 'overdue', label: 'Overdue', count: data.overdue.length, dot: 'dot-overdue', isOverdue: true }] : []),
            { id: 'today', label: 'Today', count: data.today.length, dot: 'dot-today' },
            { id: 'week', label: 'This Week', count: data.this_week.length, dot: 'dot-week' },
            { id: 'upcoming', label: 'Upcoming', count: data.upcoming.length, dot: 'dot-upcoming' },
          ].map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`filter-tab${tab.isOverdue ? ' tab-overdue' : ''}${isActive ? ' active' : ''}`}
                onClick={() => setActiveCategory(tab.id)}
                style={{ position: 'relative' }}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeFilterTabIndicator"
                    className="filter-tab-active-bg"
                    transition={{ type: 'spring', stiffness: 480, damping: 32 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {tab.dot && <span className={`tab-dot ${tab.dot}`} />}
                  <span>{tab.label}</span>
                  <span className={`tab-count${tab.isOverdue ? ' count-overdue' : ''}`}>{tab.count}</span>
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 4. Active Filters Indicator Pill Bar */}
      <AnimatePresence>
        {(query || filterDate || activeCategory !== 'all') && (
          <motion.div
            className="active-filter-strip"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="filter-summary">
              <span>Showing {totalFilteredCount} matching case{totalFilteredCount === 1 ? '' : 's'}:</span>
              {query && <span className="filter-tag">Keyword: "{query}"</span>}
              {activeCategory !== 'all' && <span className="filter-tag">Filter: {activeCategory.toUpperCase()}</span>}
              {filterDate && <span className="filter-tag">Hearing Date: {filterDate}</span>}
            </div>
            <button
              type="button"
              className="btn-reset-filters"
              onClick={() => {
                setQuery('');
                setActiveCategory('all');
                setFilterDate(null);
              }}
            >
              <RotateCcw size={13} />
              <span>Clear Filters</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Calendar View */}
      {view === 'calendar' && (
        <motion.div
          style={{ marginBottom: 32 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          <div className="card-form calendar-card-wrapper" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button
                className="btn-edit"
                style={{ padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => goMonth(-1)}
                type="button"
              >
                &larr; Prev Month
              </button>

              <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
                {MONTH_NAMES[calMonth]} {calYear}
              </h2>

              <button
                className="btn-edit"
                style={{ padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => goMonth(1)}
                type="button"
              >
                Next Month &rarr;
              </button>
            </div>

            <div id="calendar-grid">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: 'var(--text-main)',
                    textAlign: 'center',
                    padding: '10px 0',
                  }}
                >
                  {d}
                </div>
              ))}

              {dayCells.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="calendar-day empty"></div>;
                const mStr = String(calMonth + 1).padStart(2, '0');
                const dStr = String(day).padStart(2, '0');
                const cellDate = `${calYear}-${mStr}-${dStr}`;
                const hasEvents = !!datesCount[cellDate];
                const selected = filterDate === cellDate;
                const isToday = cellDate === new Date().toISOString().slice(0, 10);

                return (
                  <div
                    key={cellDate}
                    className={`calendar-day${hasEvents ? ' has-events' : ''}${selected ? ' selected-day' : ''}${isToday ? ' is-today' : ''}`}
                    title={hasEvents ? `${datesCount[cellDate]} hearing(s) on ${cellDate}` : undefined}
                    onClick={() => setFilterDate((prev) => (prev === cellDate ? null : cellDate))}
                  >
                    <span className="day-number">{day}</span>
                    {hasEvents && (
                      <div className="calendar-event-pill">
                        {datesCount[cellDate]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filterDate && (
              <div style={{ display: 'flex', marginTop: 18, padding: '12px 18px', background: 'var(--accent-bg)', borderLeft: '3px solid var(--accent)', borderRadius: 'var(--radius-sm)', fontSize: 15.5, color: 'var(--text-main)', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Showing hearings listed on: <strong>{filterDate}</strong></span>
                <button
                  onClick={() => setFilterDate(null)}
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 700, fontSize: 15 }}
                >
                  ✕ Show All Dates
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 6. Hearing Sections */}
      {activeCategory === 'all' ? (
        <>
          <Section
            title="Overdue — Action Needed"
            titleClass="overdue"
            iconColor="var(--danger)"
            icon={<AlertTriangle size={18} color="var(--danger)" />}
            cases={overdue}
            badgeFor={{ cls: 'overdue', text: (c) => `${Math.abs(c.days_left)} days overdue` }}
            onDelete={handleDelete}
          />

          <Section
            title="Today's Hearings"
            titleClass="today"
            iconColor="var(--warning)"
            icon={<CalendarIcon size={18} color="var(--warning)" />}
            cases={today}
            badgeFor={{ cls: 'today', text: () => 'Today' }}
            onDelete={handleDelete}
          />

          <Section
            title="This Week"
            iconColor="var(--accent)"
            icon={<Clock size={18} color="var(--accent)" />}
            cases={thisWeek}
            badgeFor={{ cls: 'week', text: (c) => `${c.days_left} days left` }}
            onDelete={handleDelete}
            reveal
          />

          <Section
            title="Upcoming Hearings"
            iconColor="var(--gray-500)"
            icon={<Layers size={18} color="var(--gray-500)" />}
            cases={upcoming}
            badgeFor={{ cls: 'upcoming', text: (c) => `${c.days_left} days left` }}
            onDelete={handleDelete}
            reveal
          />
        </>
      ) : activeCategory === 'overdue' ? (
        <Section
          title="Overdue Cases — Urgent Action Required"
          titleClass="overdue"
          iconColor="var(--danger)"
          icon={<AlertTriangle size={18} color="var(--danger)" />}
          cases={overdue}
          badgeFor={{ cls: 'overdue', text: (c) => `${Math.abs(c.days_left)} days overdue` }}
          onDelete={handleDelete}
        />
      ) : activeCategory === 'today' ? (
        <Section
          title="Today's Scheduled Hearings"
          titleClass="today"
          iconColor="var(--warning)"
          icon={<CalendarIcon size={18} color="var(--warning)" />}
          cases={today}
          badgeFor={{ cls: 'today', text: () => 'Today' }}
          onDelete={handleDelete}
        />
      ) : activeCategory === 'week' ? (
        <Section
          title="Hearings Listed This Week"
          iconColor="var(--accent)"
          icon={<Clock size={18} color="var(--accent)" />}
          cases={thisWeek}
          badgeFor={{ cls: 'week', text: (c) => `${c.days_left} days left` }}
          onDelete={handleDelete}
        />
      ) : activeCategory === 'upcoming' ? (
        <Section
          title="Upcoming Hearings"
          iconColor="var(--gray-500)"
          icon={<Layers size={18} color="var(--gray-500)" />}
          cases={upcoming}
          badgeFor={{ cls: 'upcoming', text: (c) => `${c.days_left} days left` }}
          onDelete={handleDelete}
        />
      ) : (
        <Section
          title="Stale Matters (≥ 30 Days Without Update)"
          iconColor="var(--gray-500)"
          icon={<Layers size={18} color="var(--gray-500)" />}
          cases={stale}
          badgeFor={{ cls: 'upcoming', text: (c) => `${c.days_since_update || 0}d stale` }}
          onDelete={handleDelete}
        />
      )}

      {/* 7. Empty State */}
      {totalFilteredCount === 0 && (
        <motion.div
          className="empty-state staggered-entry"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '48px 24px', textAlign: 'center' }}
        >
          <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Scale size={28} />
          </div>
          <h3 style={{ fontFamily: "'Lora', serif", fontSize: 22, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 6 }}>
            {query ? 'No matching court files found' : 'Docket is all clear'}
          </h3>
          <p style={{ color: 'var(--text-main)', fontSize: 16, maxWidth: 440, margin: '0 auto 20px' }}>
            {query
              ? `No cases matched your search query "${query}". Try adjusting keywords or clearing the filter.`
              : 'There are no active cases in this section. Add a new case file to track schedules and hearings.'}
          </p>
          {query ? (
            <button
              type="button"
              className="btn-export"
              onClick={() => { setQuery(''); setActiveCategory('all'); }}
            >
              Clear Search Query
            </button>
          ) : (
            <Link to="/add" className="hero-btn-primary" style={{ display: 'inline-flex' }}>
              <Plus size={16} /> Add New Case
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}
