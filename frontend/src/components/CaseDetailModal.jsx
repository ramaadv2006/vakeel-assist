import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Scale,
  Calendar,
  Building2,
  Phone,
  User,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Trash2,
  RotateCcw,
  Sparkles,
  Layers,
  MessageCircle,
} from 'lucide-react';
import Icon from './Icon';
import { TasksDrawer } from './CaseCard';

export default function CaseDetailModal({
  isOpen,
  onClose,
  caseData,
  cssClass,
  badgeText,
  onDelete,
  onReopen,
  tasks,
  setTasks,
  onWhatsApp,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !caseData) return null;

  const pendingFee = (caseData.total_fee || 0) - (caseData.fee_paid || 0);

  return createPortal(
    <AnimatePresence>
      <div className="case-modal-overlay" onClick={onClose}>
        <motion.div
          className="case-modal-content"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-modal-title"
        >
          {/* Modal Header */}
          <div className="case-modal-header">
            <div className="case-modal-header-badges">
              {caseData.case_type && (
                <span className="case-type-tag modal-case-type">
                  {caseData.case_type}
                </span>
              )}
              <span className={`badge ${cssClass} modal-badge`}>
                {badgeText}
              </span>
              {caseData.is_stale && (
                <span className="badge badge-stale modal-badge">
                  ⚠️ Stale ({caseData.days_since_update}d)
                </span>
              )}
            </div>

            <button
              type="button"
              className="case-modal-close-btn"
              onClick={onClose}
              aria-label="Close case details"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Title & Case Number */}
          <div className="case-modal-title-section">
            <h2 id="case-modal-title" className="case-modal-client-name">
              {caseData.client_name}
            </h2>
            <div className="case-modal-case-no">
              <Icon name="case" style={{ width: 15, height: 15, color: 'var(--accent)' }} />
              <span>Case No: <strong>{caseData.case_number}</strong></span>
            </div>
          </div>

          {/* Modal Body / Scrollable Details */}
          <div className="case-modal-body">
            {/* Primary Details Grid */}
            <div className="case-modal-grid">
              {/* Court & Location */}
              <div className="case-modal-info-card">
                <div className="case-modal-info-label">
                  <Building2 size={14} className="modal-icon-gold" />
                  <span>Court &amp; Listing</span>
                </div>
                <div className="case-modal-info-val highlight-court">
                  {caseData.court_name || 'Not Specified'}
                </div>
                {(caseData.court_hall || caseData.item_number) && (
                  <div className="case-modal-sub-details">
                    {caseData.court_hall && (
                      <span className="sub-pill">
                        Hall: <strong>{caseData.court_hall}</strong>
                      </span>
                    )}
                    {caseData.item_number && (
                      <span className="sub-pill">
                        Item No: <strong>{caseData.item_number}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Next Hearing & Stage */}
              <div className="case-modal-info-card">
                <div className="case-modal-info-label">
                  <Calendar size={14} className="modal-icon-gold" />
                  <span>Next Hearing Date</span>
                </div>
                <div className="case-modal-info-val highlight-date">
                  {caseData.next_hearing_date || 'No Date Scheduled'}
                </div>
                {caseData.case_stage && (
                  <div className="case-modal-sub-details">
                    <span className="sub-pill stage-pill">
                      Stage: <strong>{caseData.case_stage}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Judge & Opposing Counsel */}
              {(caseData.judge_name || caseData.opposing_counsel) && (
                <div className="case-modal-info-card">
                  <div className="case-modal-info-label">
                    <Scale size={14} className="modal-icon-gold" />
                    <span>Bench &amp; Counsel</span>
                  </div>
                  {caseData.judge_name && (
                    <div className="case-modal-line">
                      <span className="line-label">Presiding Judge:</span>
                      <span className="line-val">{caseData.judge_name}</span>
                    </div>
                  )}
                  {caseData.opposing_counsel && (
                    <div className="case-modal-line">
                      <span className="line-label">Opposing Counsel:</span>
                      <span className="line-val">{caseData.opposing_counsel}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Client Contact & Financials */}
              <div className="case-modal-info-card">
                <div className="case-modal-info-label">
                  <User size={14} className="modal-icon-gold" />
                  <span>Client &amp; Fee Ledger</span>
                </div>
                {caseData.client_phone ? (
                  <div className="case-modal-contact-row">
                    <span className="line-val">📞 {caseData.client_phone}</span>
                    <button
                      type="button"
                      onClick={() => onWhatsApp(caseData)}
                      className="btn-modal-wa-inline"
                      title="Send WhatsApp update"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                ) : (
                  <div className="line-muted">No client phone number recorded</div>
                )}

                {(caseData.total_fee > 0 || caseData.fee_paid > 0) && (
                  <div className="case-modal-fee-breakdown">
                    <div className="fee-item">
                      <span>Total:</span>
                      <strong>₹{(caseData.total_fee || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="fee-item">
                      <span>Paid:</span>
                      <strong style={{ color: 'var(--success)' }}>
                        ₹{(caseData.fee_paid || 0).toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className="fee-item">
                      <span>Pending:</span>
                      <strong style={{ color: pendingFee > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                        ₹{pendingFee.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {caseData.notes && (
              <div className="case-modal-notes-box">
                <div className="notes-label">
                  <FileText size={14} /> Case Notes &amp; History
                </div>
                <div className="notes-content">{caseData.notes}</div>
              </div>
            )}

            {/* Pre-Hearing Checklist Drawer */}
            <div className="case-modal-checklist-card">
              <div className="checklist-card-head">
                <CheckCircle2 size={16} color="var(--accent)" />
                <span>Pre-Hearing Checklist &amp; Tasks</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <TasksDrawer caseId={caseData.id} tasks={tasks} setTasks={setTasks} />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="case-modal-footer">
            <div className="modal-footer-actions-left">
              {caseData.client_phone && (
                <button
                  type="button"
                  className="btn-icon-text btn-whatsapp"
                  onClick={() => onWhatsApp(caseData)}
                >
                  <Icon name="phone" style={{ width: 13, height: 13 }} />
                  <span>WhatsApp</span>
                </button>
              )}
              <a
                href="https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-icon-text btn-ecourts"
              >
                <ExternalLink size={13} />
                <span>eCourts ↗</span>
              </a>
            </div>

            <div className="modal-footer-actions-right">
              <Link
                to={`/history/${caseData.id}`}
                className="btn-icon-text btn-edit"
                onClick={onClose}
              >
                <Clock size={13} />
                <span>History</span>
              </Link>

              <Link
                to={`/edit/${caseData.id}`}
                className="btn-icon-text btn-edit"
                onClick={onClose}
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </Link>

              {caseData.status !== 'Active' && onReopen && (
                <button
                  type="button"
                  className="btn-icon-text btn-restore"
                  onClick={() => {
                    if (
                      window.confirm(
                        caseData.status === 'Deleted'
                          ? 'Restore this case and set status back to Active?'
                          : 'Reopen this case and set status back to Active?'
                      )
                    ) {
                      onReopen(caseData.id);
                      onClose();
                    }
                  }}
                >
                  <RotateCcw size={13} />
                  <span>{caseData.status === 'Deleted' ? 'Restore' : 'Reopen'}</span>
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
                      : 'Are you sure you want to delete this case? It will be moved to trash.';
                    if (window.confirm(msg)) {
                      onDelete(caseData.id);
                      onClose();
                    }
                  }}
                >
                  <Trash2 size={13} />
                  <span>{caseData.status === 'Deleted' ? 'Delete' : 'Delete'}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
