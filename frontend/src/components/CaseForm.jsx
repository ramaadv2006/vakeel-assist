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
    <form className={`card-form staggered-entry${shakeForm ? ' shake-error' : ''}`} onSubmit={handleSubmit} noValidate ref={formRef} id="billing-section" style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: '24px 28px', borderRadius: 'var(--radius-lg)' }}>
      {/* 1. Client & Case Identity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderBottom: '1px solid var(--border-card)', paddingBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}>
          <span>📋</span>
          <span style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>Client & Case File Identity</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="client_name">Client Full Name *</label>
            <input type="text" id="client_name" required value={form.client_name} onChange={update('client_name')} placeholder="e.g. Ramesh Kumar" style={!form.client_name.trim() && shakeForm ? { borderColor: 'var(--danger)' } : undefined} />
          </div>
          <div className="form-group">
            <label htmlFor="client_phone">Client Phone Number</label>
            <input type="tel" id="client_phone" value={form.client_phone} onChange={update('client_phone')} placeholder="e.g. 9876543210" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="client_email">Client Email Address</label>
            <input type="email" id="client_email" value={form.client_email} onChange={update('client_email')} placeholder="e.g. client@example.com" />
          </div>
          <div className="form-group">
            <label htmlFor="case_number">Case / Docket Number *</label>
            <input type="text" id="case_number" required value={form.case_number} onChange={update('case_number')} placeholder="e.g. CC 1234/2026 or OS 45/2025" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="court_name">Court Name *</label>
            <input
              type="text"
              id="court_name"
              required
              value={form.court_name}
              onChange={update('court_name')}
              placeholder="e.g. City Civil Court, Chennai or Sub Court, Madurai"
              list="common-courts-list"
            />
            <datalist id="common-courts-list">
              <option value="Madras High Court" />
              <option value="Madras High Court Bench, Madurai" />
              <option value="City Civil Court, Chennai" />
              <option value="Chennai District Court (Poonamallee)" />
              <option value="Coimbatore District Court" />
              <option value="Principal District Court" />
              <option value="Sub Court (Subordinate Court)" />
              <option value="Chief Judicial Magistrate Court" />
              <option value="Judicial Magistrate Court - I" />
              <option value="Judicial Magistrate Court - II" />
              <option value="Family Court" />
              <option value="Mahila Court (Fast Track Mahila Court)" />
              <option value="Labour Court" />
              <option value="Motor Accident Claims Tribunal (MACT)" />
              <option value="Special Court (POCSO / NDPS)" />
              <option value="Consumer Disputes Redressal Commission" />
            </datalist>
          </div>
          <div className="form-group">
            <label htmlFor="case_type">Case Category / Type</label>
            <SearchableSelect
              options={CASE_TYPES}
              value={form.case_type}
              onChange={(val) => setForm((f) => ({ ...f, case_type: val }))}
              placeholder="-- Select Type --"
            />
          </div>
        </div>
      </div>

      {/* 2. Hearing & Court Schedule */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderBottom: '1px solid var(--border-card)', paddingBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}>
          <span>🏛️</span>
          <span style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>Court Hearing Schedule & Bench</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="next_hearing_date">Next Hearing Date *</label>
            <input type="date" id="next_hearing_date" required value={form.next_hearing_date} onChange={update('next_hearing_date')} style={{ fontWeight: 600 }} />
          </div>
          <div className="form-group">
            <label htmlFor="case_stage">Case Stage / Purpose</label>
            <input type="text" id="case_stage" value={form.case_stage} onChange={update('case_stage')} placeholder="e.g. For Arguments / Evidence / Framing Issues" />
          </div>
        </div>

        <div className="form-row form-row-3">
          <div className="form-group">
            <label htmlFor="court_hall">Court Hall Number</label>
            <input type="text" id="court_hall" value={form.court_hall} onChange={update('court_hall')} placeholder="e.g. Hall 4" />
          </div>
          <div className="form-group">
            <label htmlFor="item_number">Item Number (Cause List)</label>
            <input type="text" id="item_number" value={form.item_number} onChange={update('item_number')} placeholder="e.g. Item 14" />
          </div>
          <div className="form-group">
            <label htmlFor="judge_name">Presiding Judge / Bench</label>
            <input type="text" id="judge_name" value={form.judge_name} onChange={update('judge_name')} placeholder="e.g. Hon'ble Justice..." />
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
      </div>

      {/* 3. Fee Ledger */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderBottom: '1px solid var(--border-card)', paddingBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}>
          <span>💰</span>
          <span style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>Professional Fees & Expenses (INR)</span>
        </div>

        <div className="form-row form-row-3">
          <div className="form-group">
            <label htmlFor="total_fee">Total Agreed Professional Fee</label>
            <input type="number" id="total_fee" min="0" value={form.total_fee} onChange={update('total_fee')} placeholder="e.g. 50000" />
          </div>
          <div className="form-group">
            <label htmlFor="fee_paid">Retainer / Fee Paid to Date</label>
            <input type="number" id="fee_paid" min="0" value={form.fee_paid} onChange={update('fee_paid')} placeholder="e.g. 15000" />
          </div>
          <div className="form-group">
            <label htmlFor="expenses">Court Fees & Filing Expenses</label>
            <input type="number" id="expenses" min="0" value={form.expenses} onChange={update('expenses')} placeholder="e.g. 3000" />
          </div>
        </div>
      </div>

      {/* 4. Notes & Notifications */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}>
          <span>📝</span>
          <span style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>Matter Notes & Client Notifications</span>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes & Key Observations</label>
          <textarea id="notes" rows={3} value={form.notes} onChange={update('notes')} placeholder="Any key arguments, documents to produce, or instructions for this hearing..."></textarea>
        </div>

        {showStatus ? (
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group">
              <label htmlFor="status">Case File Status</label>
              <select id="status" value={form.status} onChange={update('status')}>
                <option>Active</option>
                <option>Closed</option>
                <option>On Hold</option>
                {form.status === 'Deleted' && <option>Deleted</option>}
              </select>
            </div>
            <div className="form-group" style={{ paddingBottom: 6 }}>
              <label className="toggle-switch-card" htmlFor="notify_client">
                <input
                  type="checkbox"
                  id="notify_client"
                  checked={form.notify_client}
                  onChange={update('notify_client')}
                  className="toggle-switch-input"
                />
                <span className="toggle-switch-slider" />
                <span className="toggle-switch-label">Send automated hearing alerts directly to client</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="form-group" style={{ marginTop: 6, alignItems: 'flex-start' }}>
            <label className="toggle-switch-card" htmlFor="notify_client">
              <input
                type="checkbox"
                id="notify_client"
                checked={form.notify_client}
                onChange={update('notify_client')}
                className="toggle-switch-input"
              />
              <span className="toggle-switch-slider" />
              <span className="toggle-switch-label">Send automated hearing alerts directly to client</span>
            </label>
          </div>
        )}
      </div>

      <button type="submit" className="btn-submit" style={{ marginTop: 12, padding: '14px 28px', fontSize: 17, fontWeight: 700, letterSpacing: 0.5 }}>
        {submitLabel}
      </button>
    </form>
  );
}
