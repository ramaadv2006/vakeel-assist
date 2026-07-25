import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Icon from '../components/Icon';

function HubCase({ group, onChanged }) {
  const [tasks, setTasks] = useState(group.tasks);
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const openCount = tasks.filter((t) => !t.is_completed).length;

  useEffect(() => {
    if (openCount === 0) {
      const timer = setTimeout(() => onChanged(), 350);
      return () => clearTimeout(timer);
    }
  }, [openCount, onChanged]);

  const toggle = async (taskId) => {
    const data = await api.post(`/case-tasks/${taskId}/toggle`);
    setTasks((prev) => prev.map((t) => (t.task_id === taskId ? { ...t, is_completed: data.is_completed ? 1 : 0 } : t)));
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
      setTasks((prev) => [...prev, { task_id: data.task.id, title: data.task.title, is_completed: 0, case_id: group.case_id }]);
      setNewTitle('');
    } finally {
      setBusy(false);
    }
  };

  if (openCount === 0) return null;

  return (
    <div className="card-form reveal-up hub-case-section" style={{ padding: '20px 24px', opacity: 1, transition: 'opacity 0.3s ease, transform 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 700, color: 'var(--text-dark)' }}>
            {group.client_name}
          </div>
          <div className="meta" style={{ marginTop: 4 }}>
            <span className="meta-item" title="Case Number"><Icon name="case" />{group.case_number}</span>
            <span className="meta-divider">|</span>
            <span className="meta-item" title="Court Name"><Icon name="court" />{group.court_name}</span>
            <span className="meta-divider">|</span>
            <span className="meta-item" title="Next Hearing Date" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
              <Icon name="calendar" />{group.next_hearing_date}
            </span>
            <span className="meta-divider">|</span>
            <span className="meta-item" style={{ fontWeight: 700, color: 'var(--accent-hover)' }}>{openCount} open</span>
          </div>
        </div>
        <Link to={`/edit/${group.case_id}`} className="btn-icon-text btn-edit">Edit Case</Link>
      </div>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px dashed var(--border-card)', paddingTop: 12 }}>
        {tasks.map((task) => (
          <div key={task.task_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', gap: 8 }}>
            <div className="checkbox-group" style={{ gap: 8 }}>
              <input type="checkbox" checked={!!task.is_completed} onChange={() => toggle(task.task_id)} id={`hub-task-${task.task_id}`} />
              <label htmlFor={`hub-task-${task.task_id}`} style={{ fontSize: 13, textDecoration: task.is_completed ? 'line-through' : 'none', opacity: task.is_completed ? 0.5 : 1 }}>
                {task.title}
              </label>
            </div>
            <button type="button" onClick={() => remove(task.task_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>&times;</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input
          type="text"
          placeholder="Add checklist item..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }}
          style={{ flex: 1, padding: '6px 10px', fontSize: 12, height: 30 }}
        />
        <button type="button" className="btn-submit" disabled={busy} onClick={addTask} style={{ padding: '0 14px', fontSize: 12, height: 30, lineHeight: '30px', margin: 0 }}>Add</button>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [data, setData] = useState(null);

  const load = () => api.get('/tasks').then(setData);
  useEffect(() => { load(); }, []);

  if (!data) return null;

  const totalOpen = data.case_groups.reduce((sum, g) => sum + g.tasks.filter((t) => !t.is_completed).length, 0);

  return (
    <div className="form-container" style={{ maxWidth: 900 }}>
      <div className="form-header staggered-entry">
        <h2>My Tasks Hub</h2>
        <p>Outstanding pre-hearing checklist items across all your active cases</p>
      </div>

      <div className="stats-row staggered-entry" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 28 }}>
        <div className="stat-card" style={{ borderLeftColor: 'var(--accent)' }}>
          <div className="num">{totalOpen}</div>
          <div className="label">Open Items</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--info)' }}>
          <div className="num">{data.case_groups.length}</div>
          <div className="label">Cases with Pending Tasks</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.case_groups.map((group) => (
          <HubCase key={group.case_id} group={group} onChanged={load} />
        ))}
      </div>

      {data.case_groups.length === 0 && (
        <div className="empty-state staggered-entry">
          <Icon name="tasks" style={{ width: 48, height: 48, stroke: '#cbd5e1' }} />
          <span>Nothing outstanding — every active case is fully checked off.</span>
        </div>
      )}
    </div>
  );
}
