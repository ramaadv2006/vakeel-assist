import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, CheckCircle2, PauseCircle, Search, X, RotateCcw, Archive as ArchiveIcon } from 'lucide-react';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import CaseCard from '../components/CaseCard';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';

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

export default function Archive() {
  const addFlash = useFlash();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const load = () => api.get('/archive').then(setData);
  useEffect(() => { load(); }, []);

  useEffect(() => {
    setPage(1);
  }, [query, activeTab]);

  const handleDelete = async (caseId) => {
    const res = await api.del(`/cases/${caseId}`);
    addFlash(res.message, 'success');
    load();
  };

  const handleReopen = async (caseId) => {
    const res = await api.post(`/cases/${caseId}/reopen`);
    addFlash(res.message, 'success');
    load();
  };

  const allArchived = useMemo(() => {
    if (!data) return [];
    return [
      ...(data.deleted_cases || []),
      ...(data.closed_cases || []),
      ...(data.onhold_cases || []),
    ];
  }, [data]);

  const filteredDeleted = useMemo(() => (data?.deleted_cases || []).filter((c) => matchesQuery(c, query)), [data, query]);
  const filteredClosed = useMemo(() => (data?.closed_cases || []).filter((c) => matchesQuery(c, query)), [data, query]);
  const filteredOnHold = useMemo(() => (data?.onhold_cases || []).filter((c) => matchesQuery(c, query)), [data, query]);

  const activeCasesList = useMemo(() => {
    if (activeTab === 'deleted') return filteredDeleted;
    if (activeTab === 'closed') return filteredClosed;
    if (activeTab === 'onhold') return filteredOnHold;
    return [...filteredDeleted, ...filteredClosed, ...filteredOnHold];
  }, [activeTab, filteredDeleted, filteredClosed, filteredOnHold]);

  const pagedCases = useMemo(() => {
    const start = (page - 1) * pageSize;
    return activeCasesList.slice(start, start + pageSize);
  }, [activeCasesList, page, pageSize]);

  if (!data) {
    return (
      <div className="form-container" style={{ maxWidth: 1000 }}>
        <Skeleton count={3} rows={2} widths={['45%', '75%']} />
      </div>
    );
  }

  return (
    <div className="form-container" style={{ maxWidth: 1000 }}>
      {/* Top Hero Navigation */}
      <div className="page-hero-nav">
        <Link to="/" className="btn-back-dashboard">
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
        <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Archive</span>
        </div>
      </div>

      <div className="form-header staggered-entry">
        <h2>Case Archive & Repository</h2>
        <p>Deleted, closed, and on-hold cases are securely archived so you can review and restore them anytime.</p>
      </div>

      {/* Summary KPI Grid */}
      <div
        className="stats-row staggered-entry"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Deleted Cases"
          value={data.deleted_cases?.length || 0}
          color="var(--danger)"
          icon={<Trash2 size={18} />}
          hint="Cases in trash"
          isActive={activeTab === 'deleted'}
          onClick={() => setActiveTab((prev) => (prev === 'deleted' ? 'all' : 'deleted'))}
        />
        <StatCard
          label="Closed Briefs"
          value={data.closed_cases?.length || 0}
          color="var(--gray-500)"
          icon={<CheckCircle2 size={18} />}
          hint="Disposed matters"
          isActive={activeTab === 'closed'}
          onClick={() => setActiveTab((prev) => (prev === 'closed' ? 'all' : 'closed'))}
        />
        <StatCard
          label="On Hold Cases"
          value={data.onhold_cases?.length || 0}
          color="var(--accent)"
          icon={<PauseCircle size={18} />}
          hint="Paused proceedings"
          isActive={activeTab === 'onhold'}
          onClick={() => setActiveTab((prev) => (prev === 'onhold' ? 'all' : 'onhold'))}
        />
      </div>

      {/* Search & Tabs Toolbar */}
      <div className="dashboard-actions staggered-entry" style={{ marginBottom: 20, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="filter-tabs-group" role="tablist" style={{ margin: 0 }}>
          {[
            { id: 'all', label: 'All Archived', count: allArchived.length },
            { id: 'deleted', label: 'Deleted', count: data.deleted_cases?.length || 0, dot: 'dot-overdue' },
            { id: 'closed', label: 'Closed', count: data.closed_cases?.length || 0 },
            { id: 'onhold', label: 'On Hold', count: data.onhold_cases?.length || 0, dot: 'dot-upcoming' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`filter-tab${isActive ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeArchiveTabIndicator"
                    className="filter-tab-active-bg"
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  />
                )}
                <span className="filter-tab-content">
                  {tab.dot && <span className={`tab-dot ${tab.dot}`} />}
                  <span className="tab-label">{tab.label}</span>
                  <span className="tab-count">{tab.count}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="search-box" style={{ maxWidth: 320 }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search archived files..."
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
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Case List or Empty State */}
      {pagedCases.length > 0 ? (
        <>
          <div className="case-list">
            {pagedCases.map((c) => (
              <CaseCard
                key={c.id}
                caseData={c}
                cssClass="archived"
                badgeText={c.status === 'Deleted' ? 'Deleted' : c.status}
                onDelete={handleDelete}
                onReopen={handleReopen}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalItems={activeCasesList.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 15, 25, 50]}
            itemLabel="archived cases"
          />
        </>
      ) : (
        <div className="empty-state staggered-entry">
          <ArchiveIcon size={48} color="var(--gray-300)" style={{ marginBottom: 12 }} />
          <span style={{ fontWeight: 600, fontSize: 16.5, color: 'var(--text-dark)' }}>
            {query ? 'No matching archived files found' : 'No cases in this archive section'}
          </span>
          <span style={{ fontSize: 14.5, color: 'var(--text-muted)' }}>
            {query ? `Try adjusting your search query "${query}" or selecting another category.` : 'Cases marked Closed, Deleted, or On Hold will appear here.'}
          </span>
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setActiveTab('all'); }}
              className="btn-export"
              style={{ marginTop: 12 }}
            >
              Clear Search Query
            </button>
          )}
        </div>
      )}
    </div>
  );
}

