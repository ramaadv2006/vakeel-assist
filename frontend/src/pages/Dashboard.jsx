import { useEffect, useMemo, useState, useRef } from 'react';
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
  List,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import CaseCard from '../components/CaseCard';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { useReveal } from '../hooks/useReveal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatSelectedDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const searchInputRef = useRef(null);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [query, filterDate, activeCategory]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const datesCount = useMemo(() => {
    const counts = {};
    allCases.forEach((c) => {
      counts[c.next_hearing_date] = (counts[c.next_hearing_date] || 0) + 1;
    });
    return counts;
  }, [allCases]);

  const monthEventsCount = useMemo(() => {
    let count = 0;
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    Object.keys(datesCount).forEach((d) => {
      if (d.startsWith(prefix)) count += datesCount[d];
    });
    return count;
  }, [datesCount, calMonth, calYear]);

  const dayCells = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let day = 1; day <= totalDays; day++) cells.push(day);
    return cells;
  }, [calYear, calMonth]);

  const goMonth = (delta) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCalMonth(m);
    setCalYear(y);
  };

  const goToToday = () => {
    const now = new Date();
    setCalMonth(now.getMonth());
    setCalYear(now.getFullYear());
    setFilterDate(now.toISOString().slice(0, 10));
  };

  const filter = (cases) =>
    (cases || []).filter((c) => matchesQuery(c, query) && (!filterDate || c.next_hearing_date === filterDate));

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

  const overdue = useMemo(() => (data ? filter(data.overdue) : []), [data, query, filterDate]);
  const today = useMemo(() => (data ? filter(data.today) : []), [data, query, filterDate]);
  const thisWeek = useMemo(() => (data ? filter(data.this_week) : []), [data, query, filterDate]);
  const upcoming = useMemo(() => (data ? filter(data.upcoming) : []), [data, query, filterDate]);
  const stale = useMemo(() => (data ? allCases.filter((c) => c.is_stale && matchesQuery(c, query) && (!filterDate || c.next_hearing_date === filterDate)) : []), [data, allCases, query, filterDate]);

  const totalFilteredCount = overdue.length + today.length + thisWeek.length + upcoming.length;

  const activeCategoryCount =
    activeCategory === 'overdue' ? overdue.length :
    activeCategory === 'today' ? today.length :
    activeCategory === 'week' ? thisWeek.length :
    activeCategory === 'upcoming' ? upcoming.length :
    activeCategory === 'stale' ? stale.length :
    totalFilteredCount;

  // Paginated Slices calculation
  const allFilteredCombined = useMemo(() => {
    return [...overdue, ...today, ...thisWeek, ...upcoming];
  }, [overdue, today, thisWeek, upcoming]);

  const pageStartIndex = (page - 1) * pageSize;
  const pageEndIndex = page * pageSize;

  const pagedAllCombined = useMemo(() => {
    return allFilteredCombined.slice(pageStartIndex, pageEndIndex);
  }, [allFilteredCombined, pageStartIndex, pageEndIndex]);

  const pagedOverdue = useMemo(() => pagedAllCombined.filter((c) => c.days_left < 0), [pagedAllCombined]);
  const pagedToday = useMemo(() => pagedAllCombined.filter((c) => c.days_left === 0), [pagedAllCombined]);
  const pagedThisWeek = useMemo(() => pagedAllCombined.filter((c) => c.days_left > 0 && c.days_left <= 7), [pagedAllCombined]);
  const pagedUpcoming = useMemo(() => pagedAllCombined.filter((c) => c.days_left > 7), [pagedAllCombined]);

  const targetCategoryList = useMemo(() => {
    if (activeCategory === 'overdue') return overdue;
    if (activeCategory === 'today') return today;
    if (activeCategory === 'week') return thisWeek;
    if (activeCategory === 'upcoming') return upcoming;
    if (activeCategory === 'stale') return stale;
    return allFilteredCombined;
  }, [activeCategory, overdue, today, thisWeek, upcoming, stale, allFilteredCombined]);

  const pagedTargetCategoryList = useMemo(() => {
    return targetCategoryList.slice(pageStartIndex, pageEndIndex);
  }, [targetCategoryList, pageStartIndex, pageEndIndex]);

  if (!data) {
    return (
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <Skeleton count={4} rows={2} widths={['50%', '85%']} />
      </div>
    );
  }

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
              <Scale size={13} /> <span>Chambers Workspace</span>
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
            Hi 😊, {advocate?.name ? (advocate.name.toLowerCase().startsWith('advocate') ? advocate.name : `Advocate ${advocate.name}`) : 'Advocate'}
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
          <div className="search-box" onClick={() => searchInputRef.current?.focus()}>
            <Search size={16} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="command-deck-search-input"
              placeholder="Search by client, case no, court, judge, notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search matters"
            />
            {query ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery('');
                  searchInputRef.current?.focus();
                }}
                className="search-clear-btn"
                title="Clear search"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="search-shortcut-hint" title="Press Ctrl+K or ⌘K to search">
                <kbd className="kbd-shortcut">⌘K</kbd>
              </span>
            )}
          </div>

          <div className="command-bar-controls">
            {/* Segmented View Switcher */}
            <div className="view-switch-segmented" role="tablist" aria-label="Matter views">
              <button
                type="button"
                role="tab"
                aria-selected={view === 'list'}
                className={`segmented-btn${view === 'list' ? ' active' : ''}`}
                onClick={() => setView('list')}
              >
                {view === 'list' && (
                  <motion.span
                    layoutId="activeViewPill"
                    className="segmented-pill-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="segmented-btn-content">
                  <List size={14} strokeWidth={2.2} />
                  <span>List View</span>
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={view === 'calendar'}
                className={`segmented-btn${view === 'calendar' ? ' active' : ''}`}
                onClick={() => setView('calendar')}
              >
                {view === 'calendar' && (
                  <motion.span
                    layoutId="activeViewPill"
                    className="segmented-pill-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="segmented-btn-content">
                  <CalendarIcon size={14} strokeWidth={2.2} />
                  <span>Calendar View</span>
                </span>
              </button>
            </div>

            {data.total_cases > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="btn-export-compact"
                title="Export diary cases to CSV"
              >
                <Download size={14} className="export-icon" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        <div className="command-deck-divider" />

        {/* Quick Category Filter Pills Ribbon */}
        <div className="filter-tabs-strip">
          <div className="filter-tabs-group" role="tablist" aria-label="Filter matters by timeframe">
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
                  role="tab"
                  aria-selected={isActive}
                  className={`filter-tab${tab.isOverdue ? ' tab-overdue' : ''}${isActive ? ' active' : ''}`}
                  onClick={() => setActiveCategory(tab.id)}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeFilterTabIndicator"
                      className={`filter-tab-active-bg${tab.isOverdue ? ' active-bg-overdue' : ''}`}
                      transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                    />
                  )}
                  <span className="filter-tab-content">
                    {tab.dot && <span className={`tab-dot ${tab.dot}`} />}
                    <span className="tab-label">{tab.label}</span>
                    <span className={`tab-count${tab.isOverdue ? ' count-overdue' : ''}`}>{tab.count}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="filter-strip-meta">
            {(activeCategory !== 'all' || query || filterDate) && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setQuery('');
                  setFilterDate(null);
                }}
                className="btn-filter-quick-reset"
                title="Reset active category & filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
            <span className="filter-meta-count">
              Showing <strong>{activeCategoryCount}</strong> of <strong>{allCases.length}</strong> matters
            </span>
          </div>
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

      {/* 5. Compact Executive Calendar View */}
      {view === 'calendar' && (
        <motion.div
          style={{ marginBottom: 32 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          <div className="card-form calendar-card-wrapper">
            {/* Header Navigation Bar */}
            <div className="calendar-header-bar">
              <div className="calendar-header-title-group">
                <div className="calendar-header-icon-badge">
                  <CalendarDays size={18} color="var(--accent)" />
                </div>
                <div>
                  <div className="calendar-header-month">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </div>
                  <div className="calendar-header-sub">
                    {monthEventsCount > 0 ? (
                      <span className="calendar-month-badge">
                        <span className="calendar-badge-dot" />
                        {monthEventsCount} hearing{monthEventsCount === 1 ? '' : 's'} scheduled
                      </span>
                    ) : (
                      <span className="calendar-month-badge empty">
                        No hearings listed
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="calendar-nav-controls">
                <button
                  className="btn-calendar-today"
                  onClick={goToToday}
                  type="button"
                  title="Jump to today's date"
                >
                  Today
                </button>

                <div className="calendar-month-arrows">
                  <button
                    className="btn-calendar-nav"
                    onClick={() => goMonth(-1)}
                    type="button"
                    aria-label="Previous Month"
                    title="Previous Month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    className="btn-calendar-nav"
                    onClick={() => goMonth(1)}
                    type="button"
                    aria-label="Next Month"
                    title="Next Month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="calendar-weekdays-row">
              {WEEKDAYS.map((d) => (
                <div key={d} className="calendar-weekday-cell">
                  {d}
                </div>
              ))}
            </div>

            {/* Compact Days Grid */}
            <div id="calendar-grid" className="calendar-compact-grid">
              {dayCells.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="calendar-day empty" />;
                const mStr = String(calMonth + 1).padStart(2, '0');
                const dStr = String(day).padStart(2, '0');
                const cellDate = `${calYear}-${mStr}-${dStr}`;
                const eventCount = datesCount[cellDate] || 0;
                const hasEvents = eventCount > 0;
                const selected = filterDate === cellDate;
                const isToday = cellDate === new Date().toISOString().slice(0, 10);

                return (
                  <motion.div
                    key={cellDate}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`calendar-day${hasEvents ? ' has-events' : ''}${selected ? ' selected-day' : ''}${isToday ? ' is-today' : ''}`}
                    title={hasEvents ? `${eventCount} hearing${eventCount === 1 ? '' : 's'} on ${cellDate}` : undefined}
                    onClick={() => setFilterDate((prev) => (prev === cellDate ? null : cellDate))}
                  >
                    <div className="calendar-day-header">
                      <span className="day-number">{day}</span>
                      {isToday && <span className="today-chip">Today</span>}
                    </div>
                    {hasEvents && (
                      <div className="calendar-event-pill">
                        <span className="event-dot" />
                        <span className="event-count">{eventCount}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Filter Date Banner */}
            {filterDate && (
              <div className="calendar-filter-banner">
                <div className="filter-banner-text">
                  <span className="filter-banner-icon">⚖️</span>
                  <span>
                    Showing listed hearings for{' '}
                    <strong>
                      {formatSelectedDate(filterDate)}
                    </strong>
                    {datesCount[filterDate] ? ` (${datesCount[filterDate]} matter${datesCount[filterDate] === 1 ? '' : 's'})` : ' (0 matters)'}
                  </span>
                </div>
                <button
                  onClick={() => setFilterDate(null)}
                  type="button"
                  className="btn-filter-banner-clear"
                >
                  <X size={14} />
                  <span>Show All Hearings</span>
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
            cases={pagedOverdue}
            badgeFor={{ cls: 'overdue', text: (c) => `${Math.abs(c.days_left)} days overdue` }}
            onDelete={handleDelete}
          />

          <Section
            title="Today's Hearings"
            titleClass="today"
            iconColor="var(--warning)"
            icon={<CalendarIcon size={18} color="var(--warning)" />}
            cases={pagedToday}
            badgeFor={{ cls: 'today', text: () => 'Today' }}
            onDelete={handleDelete}
          />

          <Section
            title="This Week"
            iconColor="var(--accent)"
            icon={<Clock size={18} color="var(--accent)" />}
            cases={pagedThisWeek}
            badgeFor={{ cls: 'week', text: (c) => `${c.days_left} days left` }}
            onDelete={handleDelete}
            reveal
          />

          <Section
            title="Upcoming Hearings"
            iconColor="var(--gray-500)"
            icon={<Layers size={18} color="var(--gray-500)" />}
            cases={pagedUpcoming}
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
          cases={pagedTargetCategoryList}
          badgeFor={{ cls: 'overdue', text: (c) => `${Math.abs(c.days_left)} days overdue` }}
          onDelete={handleDelete}
        />
      ) : activeCategory === 'today' ? (
        <Section
          title="Today's Scheduled Hearings"
          titleClass="today"
          iconColor="var(--warning)"
          icon={<CalendarIcon size={18} color="var(--warning)" />}
          cases={pagedTargetCategoryList}
          badgeFor={{ cls: 'today', text: () => 'Today' }}
          onDelete={handleDelete}
        />
      ) : activeCategory === 'week' ? (
        <Section
          title="Hearings Listed This Week"
          iconColor="var(--accent)"
          icon={<Clock size={18} color="var(--accent)" />}
          cases={pagedTargetCategoryList}
          badgeFor={{ cls: 'week', text: (c) => `${c.days_left} days left` }}
          onDelete={handleDelete}
        />
      ) : activeCategory === 'upcoming' ? (
        <Section
          title="Upcoming Hearings"
          iconColor="var(--gray-500)"
          icon={<Layers size={18} color="var(--gray-500)" />}
          cases={pagedTargetCategoryList}
          badgeFor={{ cls: 'upcoming', text: (c) => `${c.days_left} days left` }}
          onDelete={handleDelete}
        />
      ) : (
        <Section
          title="Stale Matters (≥ 30 Days Without Update)"
          iconColor="var(--gray-500)"
          icon={<Layers size={18} color="var(--gray-500)" />}
          cases={pagedTargetCategoryList}
          badgeFor={{ cls: 'upcoming', text: (c) => `${c.days_since_update || 0}d stale` }}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination Controls */}
      {activeCategoryCount > 0 && (
        <Pagination
          currentPage={page}
          totalItems={activeCategoryCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          itemLabel="matters"
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
