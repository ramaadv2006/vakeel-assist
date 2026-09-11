import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Briefcase, Calendar, Plus, Trash2, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';
import { useReveal } from '../hooks/useReveal';

function HubCase({ group, onChanged }) {
  const [tasks, setTasks] = useState(group.tasks);
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [revealRef, inView] = useReveal();

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const openCount = tasks.length - completedCount;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  useEffect(() => {
    if (openCount === 0 && tasks.length > 0) {
      const timer = setTimeout(() => onChanged(), 400);
      return () => clearTimeout(timer);
    }
  }, [openCount, tasks.length, onChanged]);

  const toggle = async (taskId) => {
    const data = await api.post(`/case-tasks/${taskId}/toggle`);
    setTasks((prev) =>
      prev.map((t) => (t.task_id === taskId ? { ...t, is_completed: data.is_completed ? 1 : 0 } : t))
    );
  };

  const remove = async (taskId) => {
    await api.del(`/case-tasks/${taskId}`);
    setTasks((prev) => prev.filter((t) => t.task_id !== taskId));
  };

  const addTask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setBusy(true);
    try {
      const data = await api.post(`/cases/${group.case_id}/tasks`, { title });
      setTasks((prev) => [
        ...prev,
        { task_id: data.task.id, title: data.task.title, is_completed: 0, case_id: group.case_id },
      ]);
      setNewTitle('');
    } finally {
      setBusy(false);
    }
  };

  if (openCount === 0 && tasks.length > 0) return null;

  return (
    <motion.div
      layout
      ref={revealRef}
      className={`card-form reveal-up hub-case-section${inView ? ' in-view' : ''}`}
      style={{
        padding: '22px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-card)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-sm)',
      }}
      whileHover={{ y: -3, boxShadow: '0 12px 28px -6px rgba(11, 21, 38, 0.10)' }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
              {group.client_name}
            </h3>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--danger)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              {openCount} Pending Action{openCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="meta" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="meta-item" style={{ fontWeight: 600 }}>
              <Icon name="case" style={{ width: 13, height: 13 }} />
              {group.case_number}
            </span>
            <span style={{ color: 'var(--gray-300)' }}>•</span>
            <span className="meta-item">
              <Icon name="court" style={{ width: 13, height: 13 }} />
              {group.court_name}
            </span>
            <span style={{ color: 'var(--gray-300)' }}>•</span>
            <span className="meta-item" style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>
              <Calendar size={13} />
              Hearing: {group.next_hearing_date}
            </span>
          </div>

          {/* Mini progress bar */}
          {tasks.length > 0 && (
            <div style={{ marginTop: 10, maxWidth: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Progress</span>
                <span>{completedCount}/{tasks.length} Done ({progressPercent}%)</span>
              </div>
              <div style={{ height: 5, width: '100%', background: 'var(--bg-app)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'var(--accent)',
                    borderRadius: 3,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Link
            to={`/edit/${group.case_id}`}
            className="btn-icon-text btn-export"
            style={{ fontSize: 14.5, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>Open Case</span>
            <ArrowRight size={12} />
          </Link>
        </motion.div>
      </div>

      {/* Task Checklist Items */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border-card)', paddingTop: 14 }}>
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div
              key={task.task_id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 14px',
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-card)',
                gap: 10,
                overflow: 'hidden',
              }}
            >
              <div className="checkbox-group" style={{ gap: 10, flex: 1 }}>
                <input
                  type="checkbox"
                  checked={!!task.is_completed}
                  onChange={() => toggle(task.task_id)}
                  id={`hub-task-${task.task_id}`}
                />
                <label
                  htmlFor={`hub-task-${task.task_id}`}
                  style={{
                    fontSize: 15,
                    cursor: 'pointer',
                    textDecoration: task.is_completed ? 'line-through' : 'none',
                    opacity: task.is_completed ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {task.title}
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.15, color: 'var(--danger)' }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => remove(task.task_id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                }}
                title="Delete task item"
              >
                <Trash2 size={13} />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick Add Input */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          type="text"
          placeholder="Add pre-hearing checklist item..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTask();
            }
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 14.5,
            height: 36,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-card)',
            background: 'var(--bg-app)',
          }}
        />
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          className="btn-submit"
          disabled={busy}
          onClick={addTask}
          style={{
            padding: '0 16px',
            fontSize: 14.5,
            height: 36,
            lineHeight: '36px',
            margin: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={14} />
          <span>Add</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Tasks() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(
    () =>
      api
        .get('/tasks')
        .then((res) => {
          setData(res);
          setError(null);
        })
        .catch((err) => setError(err.message || 'Could not load your tasks.')),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="form-container" style={{ maxWidth: 940 }}>
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
      <div className="form-container" style={{ maxWidth: 940 }}>
        <Skeleton count={3} rows={2} widths={['45%', '75%']} />
      </div>
    );
  }

  const totalOpen = data.case_groups.reduce(
    (sum, g) => sum + g.tasks.filter((t) => !t.is_completed).length,
    0
  );

  return (
    <div className="form-container" style={{ maxWidth: 940 }}>
      {/* Top Hero Navigation */}
      <div className="page-hero-nav">
        <Link to="/" className="btn-back-dashboard">
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
        <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Tasks Hub</span>
        </div>
      </div>

      <div className="form-header staggered-entry">
        <h2>Action Items & Case Tasks</h2>
        <p>Pre-hearing checklists and procedural action items grouped by case docket</p>
      </div>

      {/* KPI Stats */}
      <div
        className="stats-row staggered-entry"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}
      >
        <StatCard
          value={totalOpen}
          label="Open Action Items"
          color="var(--accent)"
          icon={<CheckSquare size={18} />}
          hint="Items pending completion"
        />

        <StatCard
          value={data.case_groups.length}
          label="Cases with Checklist"
          color="var(--info)"
          icon={<Briefcase size={18} />}
          hint="Active matters with tasks"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.case_groups.map((group) => (
          <HubCase key={group.case_id} group={group} onChanged={load} />
        ))}
      </div>

      {data.case_groups.length === 0 && (
        <div className="empty-state staggered-entry">
          <CheckCircle2 size={48} color="var(--success)" style={{ opacity: 0.8 }} />
          <span style={{ fontWeight: 600, fontSize: 17, color: 'var(--text-dark)' }}>
            All Set — No Pending Action Items
          </span>
          <span style={{ fontSize: 15, color: 'var(--text-muted)' }}>
            Every active matter is fully checked off. You can add pre-hearing checklist items from any case card.
          </span>
        </div>
      )}
    </div>
  );
}
