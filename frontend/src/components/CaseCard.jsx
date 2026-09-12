import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Calendar, Building2, Phone, Edit3 } from 'lucide-react';
import { api } from '../api/client';
import Icon from './Icon';
import CaseDetailModal from './CaseDetailModal';
import WhatsAppLanguageModal, { openWhatsAppWithLanguage } from './WhatsAppLanguageModal';

export function shareOnWhatsApp(caseData, lang = 'en') {
  openWhatsAppWithLanguage(caseData, lang);
}

export function TasksDrawer({ caseId, tasks, setTasks }) {
  const [newTitle, setNewTitle] = useState('');
  const [removing, setRemoving] = useState(new Set());
  const [busy, setBusy] = useState(false);

  const addTask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setBusy(true);
    try {
      const data = await api.post(`/cases/${caseId}/tasks`, { title });
      setTasks((prev) => [...(prev || []), data.task]);
      setNewTitle('');
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = async (taskId) => {
    const data = await api.post(`/case-tasks/${taskId}/toggle`);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, is_completed: data.is_completed ? 1 : 0 } : t)));
  };

  const deleteTask = async (taskId) => {
    setRemoving((prev) => new Set(prev).add(taskId));
    await api.del(`/case-tasks/${taskId}`);
    setTimeout(() => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }, 250);
  };

  if (tasks === null) {
    return (
      <div className="loading-text">
        <div className="skeleton-line" style={{ width: '70%' }}></div>
        <div className="skeleton-line" style={{ width: '45%', marginTop: 6 }}></div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <input
          type="text"
          placeholder="Add checklist item..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }}
          style={{ flex: 1, padding: '6px 10px', fontSize: 14, height: 28 }}
        />
        <button type="button" className="btn-submit" disabled={busy} onClick={addTask} style={{ padding: '0 10px', fontSize: 13, height: 28, lineHeight: '28px' }}>
          Add
        </button>
      </div>

      {tasks.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', gap: 8,
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                opacity: removing.has(task.id) ? 0 : 1,
                transform: removing.has(task.id) ? 'scale(0.92)' : 'scale(1)',
              }}
            >
              <div className="checkbox-group" style={{ gap: 8 }}>
                <input type="checkbox" checked={task.is_completed === 1} onChange={() => toggleTask(task.id)} id={`card-task-${task.id}`} />
                <label
                  htmlFor={`card-task-${task.id}`}
                  style={{ fontSize: 14.5, textDecoration: task.is_completed === 1 ? 'line-through' : 'none', opacity: task.is_completed === 1 ? 0.5 : 1 }}
                >
                  {task.title}
                </label>
              </div>
              <button
                type="button"
                onClick={() => deleteTask(task.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--gray-400)', fontSize: 14, fontStyle: 'italic' }}>No tasks added yet.</div>
      )}
    </>
  );
}

export default function CaseCard({ caseData, cssClass, badgeText, onDelete, onReopen }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tasks, setTasks] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [waModalOpen, setWaModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get(`/cases/${caseData.id}/tasks`).then((data) => {
      if (!cancelled) setTasks(data.tasks);
    });
    return () => { cancelled = true; };
  }, [caseData.id]);

  const completedCount = tasks ? tasks.filter((t) => t.is_completed === 1).length : 0;
  const totalTasks = tasks ? tasks.length : 0;
  const taskProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const pendingFee = (caseData.total_fee || 0) - (caseData.fee_paid || 0);

  const handleWhatsAppClick = () => {
    if (!caseData.client_phone) {
      alert("No client phone number listed for this case. Please add a phone number via 'Edit'.");
      return;
    }
    setWaModalOpen(true);
  };

  return (
    <>
      <motion.div
        className={`case-card ${cssClass}`}
        data-date={caseData.next_hearing_date}
        whileHover={{ y: -3, boxShadow: 'var(--shadow-md)' }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      >
        {/* =========================================================
            MOBILE STREAMLINED CARD VIEW (VISIBLE ON MOBILE ONLY)
        ========================================================= */}
        <div className="case-card-mobile-layout">
          {/* Top Row: Case Number / Type + Status Badge */}
          <div className="case-card-mobile-top">
            <div className="mobile-tags-group">
              {caseData.case_type && (
                <span className="case-type-tag">{caseData.case_type}</span>
              )}
              <span className="mobile-case-no">
                <Icon name="case" style={{ width: 13, height: 13 }} />
                <span>{caseData.case_number}</span>
              </span>
            </div>

            <div className="case-badge-container">
              <span className={`badge ${cssClass}`}>{badgeText}</span>
              {caseData.is_stale && (
                <span className="badge badge-stale" title={`No updates in ${caseData.days_since_update} days`}>
                  ⚠️ Stale
                </span>
              )}
            </div>
          </div>

          {/* Client / Party Title */}
          <h3 className="case-card-mobile-title" onClick={() => setModalOpen(true)}>
            {caseData.client_name}
          </h3>

          {/* Key Compact Metadata */}
          <div className="case-card-mobile-meta">
            <div className="mobile-meta-item court-meta" title={caseData.court_name}>
              <Building2 size={13} className="meta-icon" />
              <span className="truncate-text">{caseData.court_name || 'Court not specified'}</span>
            </div>

            <div className="mobile-meta-row-pills">
              <div className="mobile-pill-date" title="Next Hearing Date">
                <Calendar size={13} />
                <span>{caseData.next_hearing_date || 'No Date'}</span>
              </div>

              {caseData.court_hall && (
                <div className="mobile-pill-hall">
                  <span>Hall: {caseData.court_hall}</span>
                </div>
              )}

              {caseData.client_phone && (
                <div className="mobile-pill-phone" title="Client Contact">
                  <Phone size={12} />
                  <span>{caseData.client_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Actions: Prominent View Details Button */}
          <div className="case-card-mobile-actions">
            <button
              type="button"
              className="btn-mobile-view-details"
              onClick={() => setModalOpen(true)}
              aria-label={`View details for ${caseData.client_name}`}
            >
              <Eye size={15} />
              <span>View Details</span>
            </button>

            {caseData.client_phone && (
              <button
                type="button"
                className="btn-mobile-quick-action btn-wa"
                onClick={handleWhatsAppClick}
                title="Send WhatsApp update"
              >
                <Icon name="phone" style={{ width: 13, height: 13 }} />
                <span>WhatsApp</span>
              </button>
            )}

            <Link
              to={`/edit/${caseData.id}`}
              className="btn-mobile-quick-action btn-edit-quick"
              title="Edit case"
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </Link>
          </div>
        </div>

        {/* =========================================================
            DESKTOP FULL CARD VIEW (VISIBLE ON DESKTOP SCREENS)
        ========================================================= */}
        <div className="case-card-desktop-layout">
          <div className="case-card-header">
            <div className="case-title-row">
              <span className="client">{caseData.client_name}</span>
              {caseData.case_type && (
                <span className="case-type-tag">{caseData.case_type}</span>
              )}
            </div>

            <div className="case-badge-container">
              <span className={`badge ${cssClass}`}>{badgeText}</span>
              {caseData.is_stale && (
                <span className="badge badge-stale" title={`No new hearing history update in ${caseData.days_since_update} days`}>
                  ⚠️ Stale ({caseData.days_since_update}d)
                </span>
              )}
            </div>
          </div>

          <div className="case-info">
            <div className="meta-chips-container">
              <div className="meta-chip" title="Case Number">
                <Icon name="case" />
                <span>{caseData.case_number}</span>
              </div>

              <div className="meta-chip" title="Court Name">
                <Icon name="court" />
                <span>{caseData.court_name}</span>
              </div>

              <div className="meta-chip date-chip" title="Next Hearing Date">
                <Icon name="calendar" />
                <strong>{caseData.next_hearing_date}</strong>
              </div>

              {caseData.court_hall && (
                <div className="meta-chip" title="Court Hall">
                  <span>Hall: <strong>{caseData.court_hall}</strong></span>
                </div>
              )}

              {caseData.item_number && (
                <div className="meta-chip" title="Item Number">
                  <span>Item No: <strong>{caseData.item_number}</strong></span>
                </div>
              )}

              {caseData.case_stage && (
                <div className="meta-chip stage-chip" title="Case Stage">
                  <span>Stage: <strong>{caseData.case_stage}</strong></span>
                </div>
              )}

              {caseData.client_phone && (
                <div className="meta-chip" title="Client Phone">
                  <Icon name="phone" />
                  <span>{caseData.client_phone}</span>
                </div>
              )}

              {pendingFee > 0 && (
                <div className="meta-chip fee-chip" title="Pending Fee Balance">
                  <span>Pending: <strong>₹{pendingFee.toLocaleString('en-IN')}</strong></span>
                </div>
              )}

              {caseData.judge_name && (
                <div className="meta-chip" title="Presiding Judge">
                  <span>Judge: <em>{caseData.judge_name}</em></span>
                </div>
              )}

              {caseData.opposing_counsel && (
                <div className="meta-chip" title="Opposing Counsel">
                  <span>Opp: <em>{caseData.opposing_counsel}</em></span>
                </div>
              )}
            </div>

            {caseData.notes && (
              <div className="case-notes">
                <strong>Notes:</strong> {caseData.notes}
              </div>
            )}

            <div className="card-checklist-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setDrawerOpen((v) => !v)}
                  className="btn-checklist-toggle"
                >
                  <Icon
                    name="chevronDown"
                    style={{
                      width: 14,
                      height: 14,
                      transform: drawerOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.25s ease',
                    }}
                  />
                  {drawerOpen ? 'Hide' : 'Show'} Pre-Hearing Checklist ({tasks === null ? '...' : `${completedCount}/${totalTasks}`})
                </button>

                {totalTasks > 0 && (
                  <div className="checklist-progress-bar-container" title={`${completedCount} of ${totalTasks} tasks completed (${taskProgress}%)`}>
                    <div
                      className="checklist-progress-fill"
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                )}
              </div>

              <AnimatePresence>
                {drawerOpen && (
                  <motion.div
                    style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <TasksDrawer caseId={caseData.id} tasks={tasks} setTasks={setTasks} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="case-card-footer">
            <div className="card-footer-left">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                className="btn-icon-text btn-whatsapp"
                onClick={handleWhatsAppClick}
                title="Share hearing details on WhatsApp"
              >
                <Icon name="phone" style={{ width: 13, height: 13 }} />
                <span>WhatsApp</span>
              </motion.button>

              <a
                href="https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-icon-text btn-ecourts"
                title="Opens eCourts official site"
              >
                Verify ↗
              </a>
            </div>

            <div className="card-footer-right">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                className="btn-icon-text btn-edit"
                onClick={() => setModalOpen(true)}
                title="Open complete case overview popup"
              >
                <Eye size={13} />
                <span>View</span>
              </motion.button>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to={`/history/${caseData.id}`} className="btn-icon-text btn-edit" title="View hearing date history for this case">
                  Hearing History
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to={`/edit/${caseData.id}`} className="btn-icon-text btn-edit">
                  Edit case
                </Link>
              </motion.div>

              {caseData.status !== 'Active' && onReopen && (
                <button
                  type="button"
                  className="btn-icon-text btn-restore"
                  onClick={() => {
                    if (window.confirm(caseData.status === 'Deleted' ? 'Restore this case and set status back to Active?' : 'Reopen this case and set status back to Active?')) {
                      onReopen(caseData.id);
                    }
                  }}
                  title="Move this case back to Active"
                >
                  {caseData.status === 'Deleted' ? 'Restore' : 'Reopen'}
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  className="btn-icon-text btn-delete"
                  onClick={() => {
                    const isDeletedStatus = caseData.status === 'Deleted';
                    const msg = isDeletedStatus
                      ? 'Are you sure you want to permanently delete this case? This action cannot be undone.'
                      : 'Are you sure you want to delete this case? It will be moved to the deleted archive / trash.';
                    if (window.confirm(msg)) onDelete(caseData.id);
                  }}
                >
                  {caseData.status === 'Deleted' ? 'Delete Permanently' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Case Details Popup Modal */}
      <CaseDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        caseData={caseData}
        cssClass={cssClass}
        badgeText={badgeText}
        onDelete={onDelete}
        onReopen={onReopen}
        tasks={tasks}
        setTasks={setTasks}
        onWhatsApp={() => setWaModalOpen(true)}
      />

      {/* WhatsApp Language Choice Modal */}
      <WhatsAppLanguageModal
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        caseData={caseData}
      />
    </>
  );
}
