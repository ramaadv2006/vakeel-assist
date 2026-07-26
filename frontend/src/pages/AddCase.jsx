import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import CaseForm from '../components/CaseForm';
import Icon from '../components/Icon';

export default function AddCase() {
  const addFlash = useFlash();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      const res = await api.post('/cases', values);
      if (res.conflicts && res.conflicts.length > 0) {
        addFlash(`Warning: Hearing date conflict detected! You already have active case(s) (${res.conflicts.join(', ')}) at '${values.court_name}' on ${values.next_hearing_date}.`, 'warning');
      }
      addFlash(res.message, 'success');
      navigate('/');
    } catch (err) {
      addFlash(err.message, 'error');
    }
  };

  return (
    <div className="form-container">
      <Link to="/" className="back-link staggered-entry">
        <Icon name="back" />
        Back to Dashboard
      </Link>

      <div className="form-header staggered-entry">
        <h2>Add New Case</h2>
        <p>Record a new case file and set the hearing date schedule</p>
      </div>

      <CaseForm onSubmit={handleSubmit} submitLabel="Save Case File" />
    </div>
  );
}
