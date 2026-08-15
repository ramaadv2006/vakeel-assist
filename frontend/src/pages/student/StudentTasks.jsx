import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useFlash } from '../../context/FlashContext';
import Icon from '../../components/Icon';
import Skeleton from '../../components/Skeleton';

const TASK_TYPES = ['Assignment', 'Exam Prep', 'Research Paper', 'Moot Memo', 'Syllabus Reading'];
const PRIORITIES = ['High', 'Medium', 'Low'];

export default function StudentTasks() {
  const addFlash = useFlash();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('All');

  const [form, setForm] = useState({
    subject: '',
    topic: '',
    due_date: '',
    priority: 'Medium',
    task_type: 'Assignment',
  });

  const loadTasks = async () => {
    try {
      const res = await api.get('/student/study-tasks');
      setTasks(res.tasks || []);
    } catch (err) {
      addFlash(err.message || 'Failed to load study tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggle = async (taskId) => {
    try {
      await api.post(`/student/study-tasks/${taskId}/toggle`);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: t.is_completed ? 0 : 1 } : t))
      );
    } catch (err) {
      addFlash(err.message || 'Failed to update task', 'error');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await api.del(`/student/study-tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      addFlash('Task removed', 'success');
    } catch (err) {
      addFlash(err.message || 'Failed to delete task', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/student/study-tasks', form);
      addFlash(res.message || 'Study task added!', 'success');
      setShowModal(false);
      setForm({
        subject: '',
        topic: '',
        due_date: '',
        priority: 'Medium',
        task_type: 'Assignment',
      });
      loadTasks();
    } catch (err) {
      addFlash(err.message || 'Failed to create task', 'error');
    }
  };

  if (loading) return <Skeleton count={4} rows={3} />;

  const filteredTasks = tasks.filter((t) => {
    if (filterType === 'All') return true;
    if (filterType === 'Pending') return !t.is_completed;
    if (filterType === 'Completed') return t.is_completed;
    return t.task_type === filterType;
  });

  const pendingCount = tasks.filter((t) => !t.is_completed).length;

  return (
    <div className="student-tasks-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Bar */}
      <div className="student-page-header staggered-entry">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139, 92, 246, 0.15)', display: 'grid', placeItems: 'center', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <Icon name="tasks" style={{ width: 20, height: 20 }} />
            </div>
            <h2 style={{ fontFamily: "'Lora', serif", margin: 0, fontSize: '1.45rem', color: 'var(--text-dark)', fontWeight: 700 }}>
              Study Schedules & Academic Tasks
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Track assignments, exam syllabus modules, moot memorials, and research paper submission milestones.
          </p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn-student-purple">
          <Icon name="plus" style={{ width: 16, height: 16 }} />
          <span>+ Add Study Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {['All', 'Pending', 'Completed', 'Assignment', 'Exam Prep', 'Research Paper', 'Moot Memo'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilterType(tab)}
            style={{
              whiteSpace: 'nowrap',
              padding: '7px 16px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: filterType === tab ? 'var(--accent)' : 'var(--bg-card)',
              color: filterType === tab ? '#111827' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="card-form" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <Icon name="tasks" style={{ width: 44, height: 44, opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ margin: 0, color: 'var(--text-dark)', fontSize: 18 }}>No tasks in this category</h3>
          <p style={{ fontSize: 14, maxWidth: 450, margin: '8px auto 16px auto' }}>
            Stay ahead of your coursework by tracking your readings and assignments.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            + Create New Study Task
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="card-form staggered-entry"
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                opacity: task.is_completed ? 0.6 : 1,
                border: '1px solid var(--border-color)',
                borderRadius: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                <input
                  type="checkbox"
                  checked={!!task.is_completed}
                  onChange={() => handleToggle(task.id)}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: task.is_completed ? 'line-through' : 'none',
                        color: 'var(--text-dark)',
                      }}
                    >
                      {task.subject}: {task.topic}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 5,
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                      }}
                    >
                      {task.task_type}
                    </span>
                    {task.priority === 'High' && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 5,
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                        }}
                      >
                        High Priority
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {task.due_date && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Due: <strong>{task.due_date}</strong>
                  </span>
                )}
                <button
                  onClick={() => handleDelete(task.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
                  title="Delete Task"
                >
                  <Icon name="trash" style={{ width: 15, height: 15 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div className="card-form" style={{ maxWidth: 520, width: '100%', padding: 24, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Lora', serif", margin: 0, fontSize: 20, color: 'var(--text-dark)' }}>
                Add Academic Study Task
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Subject / Paper *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Constitutional Law / BNS / Law of Torts"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Topic / Assignment Detail *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare notes on Article 32 Writs & Laches"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Task Type</label>
                  <select
                    value={form.task_type}
                    onChange={(e) => setForm({ ...form, task_type: e.target.value })}
                  >
                    {TASK_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: 13 }}
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
