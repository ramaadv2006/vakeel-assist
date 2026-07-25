import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import CaseForm from '../components/CaseForm';
import { TasksDrawer } from '../components/CaseCard';
import Icon from '../components/Icon';

export default function EditCase() {
  const { caseId } = useParams();
  const addFlash = useFlash();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [tasks, setTasks] = useState(null);

  useEffect(() => {
    api.get(`/cases/${caseId}`).then((data) => setCaseData(data.case)).catch(() => {
      addFlash('Case not found.', 'error');
      navigate('/');
    });
    api.get(`/cases/${caseId}/tasks`).then((data) => setTasks(data.tasks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  if (!caseData) return null;

  const handleSubmit = async (values) => {
    try {
      const res = await api.put(`/cases/${caseId}`, values);
      if (res.conflicts && res.conflicts.length > 0) {
        addFlash(`Warning: Hearing date conflict detected! You already have active case(s) (${res.conflicts.join(', ')}) at '${values.court_name}' on ${values.next_hearing_date}.`, 'warning');
      }
      addFlash(res.message, 'success');
      navigate('/');
    } catch (err) {
      addFlash(err.message, 'error');
    }
  };

  const initialValues = {
    ...caseData,
    client_phone: caseData.client_phone || '',
    case_type: caseData.case_type || '',
    opposing_counsel: caseData.opposing_counsel || '',
    opposing_counsel_phone: caseData.opposing_counsel_phone || '',
    judge_name: caseData.judge_name || '',
    court_hall: caseData.court_hall || '',
    item_number: caseData.item_number || '',
    case_stage: caseData.case_stage || '',
    total_fee: caseData.total_fee || 0,
    fee_paid: caseData.fee_paid || 0,
    expenses: caseData.expenses || 0,
    notes: caseData.notes || '',
    notify_client: !!caseData.notify_client,
    status: caseData.status || 'Active',
  };

  return (
    <div className="form-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }} className="staggered-entry">
        <Link to="/" className="back-link">
          <Icon name="back" />
          Back to Dashboard
        </Link>
        <Link to={`/history/${caseId}`} className="back-link" title="See every hearing date recorded for this case">
          View Hearing History
        </Link>
      </div>

      <div className="form-header staggered-entry">
        <h2>Edit Case File</h2>
        <p>Modify client details, status, notes, or reschedule the next hearing date</p>
      </div>

      <CaseForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Update Case File" showStatus />

      <div className="card-form staggered-entry" style={{ marginTop: 24 }}>
        <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="checklist" style={{ stroke: 'var(--accent)' }} />
          Pre-Hearing Sub-Tasks Checklist
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TasksDrawer caseId={caseId} tasks={tasks} setTasks={setTasks} />
        </div>
      </div>
    </div>
  );
}
