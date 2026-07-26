import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';

const today = () => new Date().toISOString().split('T')[0];

function buildTemplates(advocateName) {
  const advocateDefault = advocateName || 'A. Subramanian';

  return {
    vakalat: {
      title: 'Vakalatnama (Bilingual Advocate Appointment)',
      fields: [
        { id: 'court', label: 'Court Name', default: 'In the Court of the District Judge, Chennai' },
        { id: 'case_no', label: 'Case Number', default: 'O.S. No. 1234 of 2026' },
        { id: 'client', label: 'Client Name(s)', default: 'K. Ramesh Babu' },
        { id: 'client_status', label: 'Client Role (e.g. Plaintiff/Accused)', default: 'Plaintiff' },
        { id: 'opponent', label: 'Opponent Name(s)', default: 'V. Suresh Kumar' },
        { id: 'opponent_status', label: 'Opposing Role (e.g. Defendant)', default: 'Defendant' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
        { id: 'bar_no', label: 'Advocate Bar Council No.', default: 'MS/4321/2018' },
        { id: 'place', label: 'Place', default: 'Chennai' },
        { id: 'date', label: 'Date', default: today() },
      ],
      generate: (f) => `IN THE COURT OF THE: ${f.court}
SUIT / CASE NO: ${f.case_no}

Between:
${f.client}                                        ... ${f.client_status}
                                AND
${f.opponent}                                        ... ${f.opponent_status}

-------------------------------------------------------------------------
                     VAKALATNAMA / வக்காலத்து
-------------------------------------------------------------------------

I/We, the undersigned ${f.client_status} do hereby appoint and retain:

Advocate: ${f.advocate}
Bar Council Enrollment No: ${f.bar_no}

to appear, plead, act and conduct the case on my/our behalf in the above-mentioned matter in this Court or in any other court of appellate or revisionary jurisdiction.

நானும்/நாங்களும் மேற்கண்ட வழக்கு சம்பந்தமாக ஆஜராகி வாதாட வழக்கறிஞர் திரு/திருமதி ${f.advocate} (பதிவு எண்: ${f.bar_no}) அவர்களை எனது/எங்களது வக்கீலாக நியமித்து இதற்கான அதிகாரம் வழங்குகிறேன்/வழங்குகிறோம்.

Place: ${f.place}
Date: ${f.date}

Client Signature: ______________________
(வாடிக்கையாளர் கையெழுத்து)

I accept the Vakalatnama.

Advocate Signature: ____________________`,
    },
    adj: {
      title: 'Adjournment Petition (Section 309 CrPC / CPC)',
      fields: [
        { id: 'court', label: 'Court Name', default: 'In the Court of Judicial Magistrate-I, Coimbatore' },
        { id: 'case_no', label: 'Case/C.C. Number', default: 'C.C. No. 567 of 2025' },
        { id: 'client', label: 'Client Name', default: 'M. Elangovan' },
        { id: 'client_status', label: 'Client Role (e.g. Accused)', default: 'Accused' },
        { id: 'opponent', label: 'Opposing Party', default: 'State represented by Inspector of Police' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
        { id: 'hearing_date', label: 'Scheduled Date of Hearing', default: today() },
        { id: 'reason', label: 'Reason for Adjournment', default: "Advocate is engaged in arguments in another Court and is unable to attend this Hon'ble Court today." },
      ],
      generate: (f) => `IN THE COURT OF: ${f.court}
CASE NO: ${f.case_no}

Between:
${f.client}                                        ... ${f.client_status}
                                AND
${f.opponent}                                        ... Respondent/Complainant

-------------------------------------------------------------------------
PETITION FOR ADJOURNMENT UNDER SECTION 309 OF Cr.P.C. / ORDER XVII CPC
-------------------------------------------------------------------------

The Petitioner/Advocate above named most respectfully submits:

1. The above case is posted today (${f.hearing_date}) for ${f.reason ? 'hearing/cross-examination/arguments' : 'hearing'}.

2. The petitioner is unable to proceed with the case today due to the following reason:
   "${f.reason}"

3. The petitioner submits that the absence is neither willful nor negligent but due to the bona fide reasons stated above.

It is therefore prayed that this Hon'ble Court may be pleased to adjourn the case to any other subsequent date, and thus render justice.

Place: Coimbatore
Date: ${today()}

Filed by:

Counsel for Petitioner:
${f.advocate}, Advocate`,
    },
    notice138: {
      title: 'Sec 138 NI Act Cheque Bounce Notice',
      fields: [
        { id: 'client', label: 'Client (Complainant) Name', default: 'S. Murugan' },
        { id: 'client_addr', label: 'Client Address', default: 'No. 12, Gandhi Street, Madurai - 625001' },
        { id: 'debtor', label: 'Debtor (Accused) Name', default: 'K. Selvam' },
        { id: 'debtor_addr', label: 'Debtor Address', default: 'Flat 4A, Green Meadows, Madurai - 625008' },
        { id: 'cheque_no', label: 'Cheque Number', default: '987654' },
        { id: 'cheque_date', label: 'Cheque Date', default: '2026-06-15' },
        { id: 'bank', label: 'Bank & Branch', default: 'State Bank of India, Madurai Town' },
        { id: 'amount', label: 'Cheque Amount (INR)', default: '75,000' },
        { id: 'bounce_date', label: 'Cheque Return / Bounce Date', default: '2026-07-02' },
        { id: 'reason', label: 'Bounce Reason (e.g. Funds Insufficient)', default: 'Funds Insufficient' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
        { id: 'office_addr', label: 'Advocate Office Address', default: 'Chamber 211, District Court Complex, Madurai' },
      ],
      generate: (f) => `ADVOCATE LEGAL NOTICE

From:
${f.advocate}, Advocate
${f.office_addr}

Date: ${today()}

To:
${f.debtor}
${f.debtor_addr}

Dear Sir/Madam,

Under instructions from my client, ${f.client}, residing at ${f.client_addr}, I hereby serve you with the following Legal Notice:

1. You issued a cheque bearing No: ${f.cheque_no} dated ${f.cheque_date} drawn on ${f.bank} for an amount of Rs. ${f.amount}/- (Rupees ${f.amount} Only) in favor of my client towards the discharge of your legally enforceable debt/liability.

2. My client presented the said cheque for payment through their banker, but the cheque was returned unpaid by your banker with the memo stating: "${f.reason}" on ${f.bounce_date}.

3. My client immediately contacted you, but you failed to arrange the funds. Hence, this notice is sent.

4. I hereby call upon you to make payment of the cheque amount of Rs. ${f.amount}/- to my client within 15 days of receipt of this notice, failing which my client will be constrained to initiate criminal proceedings against you under Section 138 of the Negotiable Instruments Act, 1881.

Copy of this notice is retained in my office for future legal action.

Yours faithfully,

${f.advocate}
Counsel for Complainant`,
    },
    affidavit: {
      title: 'Affidavit of Assets and Liabilities',
      fields: [
        { id: 'court', label: 'Court Name', default: 'In the Family Court of Tiruchirappalli' },
        { id: 'case_no', label: 'M.O.P. / Case Number', default: 'M.O.P. No. 45 of 2026' },
        { id: 'client', label: 'Client (Deponent) Name', default: 'Mrs. Revathi Sundaram' },
        { id: 'relation', label: 'W/o or D/o or S/o Name', default: 'Sundaram Balaji' },
        { id: 'age', label: 'Age', default: '34' },
        { id: 'addr', label: 'Address', default: '15, Salai Road, Tiruchirappalli - 620003' },
        { id: 'income', label: 'Monthly Income (INR)', default: '12,000' },
        { id: 'assets', label: 'Description of Assets', default: 'Gold jewelry weighing 120 grams; Bank savings of approx Rs. 50,000/-' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
      ],
      generate: (f) => `IN THE COURT OF: ${f.court}
CASE NO: ${f.case_no}

Between:
${f.client}                                        ... Petitioner
                                AND
${f.relation}                                        ... Respondent

-------------------------------------------------------------------------
                     AFFIDAVIT OF THE DEPONENT
-------------------------------------------------------------------------

I, ${f.client}, daughter/wife of ${f.relation}, Hindu, aged about ${f.age} years, residing at ${f.addr}, do hereby solemnly affirm and state on oath as follows:

1. I am the Deponent / Petitioner in the above petition and I am well conversant with the facts of the case.

2. I state that I have no source of independent income to maintain myself except a small temporary income of Rs. ${f.income}/- per month from home tuitions.

3. I state that the assets held by me are as follows:
   "${f.assets}"

4. I declare that the statements made above are true and correct to the best of my knowledge, information, and belief.

Solemnly affirmed and signed before me
at Tiruchirappalli on this ____________ day of 2026.

Deponent Signature: _______________________

Identified by:
${f.advocate}, Advocate`,
    },
  };
}

const TEMPLATE_ORDER = [
  { key: 'vakalat', label: 'Vakalatnama', subtitle: 'Bilingual Authorization (Eng/Tam)' },
  { key: 'adj', label: 'Adjournment Petition', subtitle: 'Section 309 CrPC / CPC' },
  { key: 'notice138', label: 'Sec 138 Cheque Notice', subtitle: 'Negotiable Instruments Act' },
  { key: 'affidavit', label: 'Affidavit of Assets', subtitle: 'Standard Civil Declaration' },
];

export default function Templates() {
  const { advocate } = useAuth();
  const addFlash = useFlash();
  const templates = useMemo(() => buildTemplates(advocate?.name), [advocate]);
  const [activeKey, setActiveKey] = useState('vakalat');
  const [values, setValues] = useState(() => {
    const initial = {};
    templates.vakalat.fields.forEach((f) => { initial[f.id] = f.default; });
    return initial;
  });

  useEffect(() => {
    const template = templates[activeKey];
    const initial = {};
    template.fields.forEach((f) => { initial[f.id] = f.default; });
    setValues(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const template = templates[activeKey];
  const draftText = template.generate(values);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draftText).then(() => {
      addFlash('Draft text copied to clipboard successfully!', 'success');
    });
  };

  const downloadDraft = () => {
    const blob = new Blob([draftText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `advo_buddy_draft_${activeKey}_${today()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="drafts-container">
      <div className="template-sidebar staggered-entry">
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 12, paddingLeft: 6 }}>
          Document Templates
        </h3>
        {TEMPLATE_ORDER.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`template-btn${activeKey === t.key ? ' active' : ''}`}
            onClick={() => setActiveKey(t.key)}
          >
            <span>{t.label}</span>
            <span className="subtitle">{t.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="draft-main staggered-entry">
        <div className="card-form" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 18, fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 700, color: 'var(--text-dark)' }}>
            Fill Template Fields: {template.title}
          </h3>
          <div className="form-grid">
            {template.fields.map((field) => (
              <div className="form-group" key={field.id}>
                <label htmlFor={field.id}>{field.label}</label>
                <input
                  type="text"
                  id={field.id}
                  value={values[field.id] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card-form" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
              Live Draft Preview
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn-export" onClick={copyToClipboard} style={{ padding: '6px 14px', fontSize: 13 }}>Copy Clipboard</button>
              <button type="button" className="btn-submit" onClick={downloadDraft} style={{ padding: '6px 14px', fontSize: 13, margin: 0 }}>Download Text</button>
            </div>
          </div>
          <div className="preview-box">
            {draftText}
          </div>
        </div>
      </div>
    </div>
  );
}
