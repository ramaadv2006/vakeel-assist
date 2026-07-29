import { useRef, useState } from 'react';
import SearchableSelect from './SearchableSelect';

const CASE_TYPES = [
  'AP-Approval Petition',
  'Arb.Appeal- Arbitration Appeal',
  'Arb.Appln-Arbitration Application',
  'Arb.E.P-Arbitration Enforcement Petition',
  'Arb.O.P-Arbitration Original Petition',
  'ARBOP-Arbitration Original Petition',
  'AS-Appeal Suit',
  'C-Complaint Petition',
  'CAS-Commercial Appeal',
  'CC-Calendar Case',
  'CMA-Civil Miscellaneous Appeal',
  'CMACS-Civil Miscellaneous Appeal(CS)',
  'CMP-Civil Miscellaneous Petition',
  'COS-Commercial Original Suit',
  'CP-Claim Petition',
  'CRLA- Criminal Appeal',
  'CRLMP-Criminal Miscellaneous Petition',
  'CRLR-Criminal Revision Petition',
  'CRP-Civil Revision Petition',
  'Dist. Application-Distress Application',
  'DVC-Domestic Violence Case',
  'EOCC-Economic Offence Case',
  'EP-Execution Petition',
  'GWOP- Guardian and Wards Original Petition',
  'HMOP-Hindu Marriage Original Petition',
  'ID-Industrial Disputes',
  'IP-Insolvency Petition',
  'JC-Juvenile Case',
  'LAOP-Land Acquisition Original Petition',
  'MC-Maintenance Case',
  'MCOP-Motor Accidents Claim Original Petition',
  'MJC-Miscellaneous Judicial Case',
  'MTA-Municipal Taxation Appeal/ Corporation Taxation Appeal',
  'NT Application-New Trial Application',
  'OA-Original Application',
  'OP-Original Petition',
  'POP-Pauper Original Petition',
  'PRC-Preliminary Register Case',
  'PWA-Payment Wages Appeal',
  'RC-Reference Case',
  'RCA-Rent Control Appeal',
  'RCOP-Rent Control Original Petition',
  'RCS-Referred Charge Sheet',
  'RLTA-Regulation Of Rights and Responsibilities of Landlord and Tenant Appeals',
  'RLTOP-Regulation of Rights and Responsibilities of Landlord and Tenant Original Petition',
  'RP-Review Petition',
  'RTA-Rent Tribunal Appeal',
  'S-Original Suit',
  'SA-Second Appeal',
  'SC-Sessions Case',
  'SCS-Small Cause Suit',
  'SOA-Standing Order Appeal',
  'SPLCC-Special Calendar Case',
  'SPL.SC-Special Sessions Case',
  'STC-Small Cause Calendar case Summary Trial Case',
  'Tr.OP-Transfer Original Petition'
];

const EMPTY = {
  client_name: '', client_phone: '', client_email: '', case_number: '', court_name: '', case_type: '',
  next_hearing_date: '', opposing_counsel: '', opposing_counsel_phone: '', judge_name: '',
  court_hall: '', item_number: '', case_stage: '', total_fee: '', fee_paid: '', expenses: '',
  notes: '', notify_client: false, status: 'Active',
};

export default function CaseForm({ initialValues, onSubmit, submitLabel, showStatus = false }) {
  const [form, setForm] = useState({ ...EMPTY, ...initialValues });
  const [shakeForm, setShakeForm] = useState(false);
  const formRef = useRef(null);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const required = ['client_name', 'case_number', 'court_name', 'next_hearing_date'];
    const missing = required.filter((field) => !String(form[field] || '').trim());
    if (missing.length > 0) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 400);
      return;
    }
    onSubmit(form);
  };

  return (
    <form className={`card-form staggered-entry${shakeForm ? ' shake-error' : ''}`} onSubmit={handleSubmit} noValidate ref={formRef} id="billing-section">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="client_name">Client Name *</label>
          <input type="text" id="client_name" required value={form.client_name} onChange={update('client_name')} placeholder="e.g. Ramesh Kumar" style={!form.client_name.trim() && shakeForm ? { borderColor: 'var(--danger)' } : undefined} />
        </div>
        <div className="form-group">
          <label htmlFor="client_phone">Client Phone Number</label>
          <input type="tel" id="client_phone" value={form.client_phone} onChange={update('client_phone')} placeholder="e.g. 9876543210" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="client_email">Client Email Address</label>
          <input type="email" id="client_email" value={form.client_email} onChange={update('client_email')} placeholder="e.g. client@example.com" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="case_number">Case Number *</label>
          <input type="text" id="case_number" required value={form.case_number} onChange={update('case_number')} placeholder="e.g. CC 1234/2026" />
        </div>
        <div className="form-group">
          <label htmlFor="court_name">Court Name *</label>
          <input type="text" id="court_name" required value={form.court_name} onChange={update('court_name')} placeholder="e.g. Chennai District Court" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="case_type">Case Type</label>
          <SearchableSelect
            options={CASE_TYPES}
            value={form.case_type}
            onChange={(val) => setForm((f) => ({ ...f, case_type: val }))}
            placeholder="-- Select Type --"
          />
        </div>
        <div className="form-group">
          <label htmlFor="next_hearing_date">Next Hearing Date *</label>
          <input type="date" id="next_hearing_date" required value={form.next_hearing_date} onChange={update('next_hearing_date')} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="opposing_counsel">Opposing Counsel Name</label>
          <input type="text" id="opposing_counsel" value={form.opposing_counsel} onChange={update('opposing_counsel')} placeholder="e.g. Adv. Suresh Babu" />
        </div>
        <div className="form-group">
          <label htmlFor="opposing_counsel_phone">Opposing Counsel Phone</label>
          <input type="tel" id="opposing_counsel_phone" value={form.opposing_counsel_phone} onChange={update('opposing_counsel_phone')} placeholder="e.g. 9876543210" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="judge_name">Presiding Judge / Bench</label>
          <input type="text" id="judge_name" value={form.judge_name} onChange={update('judge_name')} placeholder="e.g. Hon'ble Justice Ramachandran" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="court_hall">Court Hall Number</label>
          <input type="text" id="court_hall" value={form.court_hall} onChange={update('court_hall')} placeholder="e.g. Court Hall 3 / Chamber B" />
        </div>
        <div className="form-group">
          <label htmlFor="item_number">Item Number</label>
          <input type="text" id="item_number" value={form.item_number} onChange={update('item_number')} placeholder="e.g. Item 14" />
        </div>
        <div className="form-group">
          <label htmlFor="case_stage">Case Stage / Purpose</label>
          <input type="text" id="case_stage" value={form.case_stage} onChange={update('case_stage')} placeholder="e.g. For Arguments / Admission" />
        </div>
      </div>

      <div style={{ marginTop: 18, marginBottom: 12, borderBottom: '1px dashed var(--border-card)', paddingBottom: 6, gridColumn: '1 / -1' }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-dark)', margin: 0, fontFamily: "'Inter', sans-serif" }}>Ledger & Professional Fees (INR)</h3>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="total_fee">Total Agreed Professional Fee</label>
          <input type="number" id="total_fee" min="0" value={form.total_fee} onChange={update('total_fee')} placeholder="e.g. 50000" />
        </div>
        <div className="form-group">
          <label htmlFor="fee_paid">Retainer / Advance Fee Paid</label>
          <input type="number" id="fee_paid" min="0" value={form.fee_paid} onChange={update('fee_paid')} placeholder="e.g. 15000" />
        </div>
        <div className="form-group">
          <label htmlFor="expenses">Court Fees & filing Expenses</label>
          <input type="number" id="expenses" min="0" value={form.expenses} onChange={update('expenses')} placeholder="e.g. 3000" />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes & Observations</label>
        <textarea id="notes" value={form.notes} onChange={update('notes')} placeholder="Any key comments, facts, or instructions regarding this hearing date..."></textarea>
      </div>

      {showStatus ? (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Case Status</label>
            <select id="status" value={form.status} onChange={update('status')}>
              <option>Active</option>
              <option>Closed</option>
              <option>On Hold</option>
            </select>
          </div>
          <div className="form-group checkbox-group" style={{ justifyContent: 'center' }}>
            <input type="checkbox" id="notify_client" checked={form.notify_client} onChange={update('notify_client')} />
            <label htmlFor="notify_client">Also send automated reminders directly to the client</label>
          </div>
        </div>
      ) : (
        <div className="form-group checkbox-group">
          <input type="checkbox" id="notify_client" checked={form.notify_client} onChange={update('notify_client')} />
          <label htmlFor="notify_client">Also send automated reminders directly to the client</label>
        </div>
      )}

      <button type="submit" className="btn-submit" style={{ marginTop: 8 }}>{submitLabel}</button>
    </form>
  );
}
