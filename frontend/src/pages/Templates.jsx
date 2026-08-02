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
    surrender: {
      title: 'Surrender Petition (Filed on behalf of Accused)',
      fields: [
        { id: 'court', label: 'Court Name', default: 'Judicial Magistrate Court, Pochampalli' },
        { id: 'crime_no', label: 'Crime Number', default: '12 of 2025' },
        { id: 'case_no', label: 'S.T.C. / C.C. Number', default: '34 of 2025' },
        { id: 'client', label: 'Accused Name & Parentage', default: 'Ravi kumar S/O Kiran' },
        { id: 'client_addr', label: 'Accused Address', default: 'Pochampalli, Krishnagiri – 635206' },
        { id: 'client_role', label: 'Petitioner Role (e.g. Petitioner / Accused)', default: 'Petitioner / Accused' },
        { id: 'opponent', label: 'Respondent (Police Station)', default: 'Sub-Inspector of Police, Pochampalli Police Station' },
        { id: 'opponent_role', label: 'Respondent Role (e.g. Respondent / Complainant)', default: 'Respondent / Complainant' },
        { id: 'section', label: 'Under Section', default: '' },
        { id: 'act', label: 'Act (e.g. I.P.C. / B.N.S.)', default: 'I.P.C. / B.N.S.' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
      ],
      generate: (f) => `IN THE COURT OF THE ${f.court}

                               Crime No.: ${f.crime_no}
                               In
                               S.T.C. / C.C. No.: ${f.case_no}

${f.client},
${f.client_addr}                           ${f.client_role}

                               Versus

${f.opponent}.    ${f.opponent_role}

       SURRENDER PETITON FILED ON BEHALF OF THE ACCUSED.

1. It is submitted that the above case is pending against the accused filed by the ${f.opponent} under section ${f.section} of ${f.act}.

2. The accused is surrendered before this Hon’ble court.

3. The accused offer sufficiently surety and solvenance regarding his bail.

4. It is therefore prays that this Hon’ble Court may be pleased to release the accused on bail after accepting the surrender and thus render justice.


Accused                                                Counsel for Accused


-------------------------------------------------------------------------
                           BACKING SHEET / DOCKET
-------------------------------------------------------------------------

IN THE COURT OF THE ${f.court}

                               Crime No.: ${f.crime_no}
                               In
                               S.T.C. / C.C. No.: ${f.case_no}
${f.client_role}

                               Versus

                               ${f.opponent_role}

                      SURRENDER PETITON
                    FILED ON BEHALF OF THE
                           ACCUSED.

By Counsel:
${f.advocate}
`,
    },
    copy_app: {
      title: 'Copy Application (Application for Copies)',
      fields: [
        { id: 'court', label: 'Court Name', default: 'Judicial Magistrate Court, Pochampalli' },
        { id: 'case_no', label: 'No. (e.g. C.C. 34/2025)', default: 'C.C. 34/2025' },
        { id: 'client', label: 'Petitioner/Appellant/Complainant Name', default: 'Ravi kumar' },
        { id: 'client_role', label: 'Petitioner Role', default: 'Petitioner / Appellant / Complainant' },
        { id: 'opponent', label: 'Respondent Name', default: 'State represented by Inspector of Police' },
        { id: 'opponent_role', label: 'Respondent Role', default: 'Respondent / Counter / Accused' },
        { id: 'filed_by', label: 'Filed on behalf of', default: 'Accused' },
        { id: 'furnished_to', label: 'Furnished to (e.g. Counsel for Accused)', default: 'Counsel for Accused' },
        { id: 'docs_table', label: 'Documents requested (Format: S.No | Date of Filing | Date of Doc | Description | Remarks)', type: 'textarea', default: '1 | 15-06-2025 | 15-06-2025 | FIR and Complaint | Copy required for trial\n2 | 20-07-2025 | 20-07-2025 | Deposition of PW1 | Copy required for arguments' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
      ],
      generate: (f) => {
        const lines = (f.docs_table || '').split('\n').filter(Boolean);
        let table = '-------------------------------------------------------------------------------------------------------\n';
        table += 'S. No. | Date of filing documents | Date of the documents | Description of the documents       | Remarks\n';
        table += '-------------------------------------------------------------------------------------------------------\n';
        lines.forEach((line) => {
          const parts = line.split('|').map(s => s.trim());
          const sno = parts[0] || '';
          const fd = parts[1] || '';
          const dd = parts[2] || '';
          const desc = parts[3] || '';
          const rem = parts[4] || '';
          table += `${sno.padEnd(6)} | ${fd.padEnd(24)} | ${dd.padEnd(21)} | ${desc.padEnd(34)} | ${rem}\n`;
        });
        table += '-------------------------------------------------------------------------------------------------------';

        return `APPALICATION FOR COPIES

IN THE COURT OF THE ${f.court}

                               No.: ${f.case_no}

${f.client}                                   ${f.client_role}

                               Versus

${f.opponent}                                                 ... ${f.opponent_role}

To
The judge of the said court

Application for certified copies filed on behalf of ${f.filed_by}

It is requested that the Certified Copies of the documents here under mentioned may be furnished to the ${f.furnished_to}

${table}

                                                       Counsel for ${f.filed_by}


-------------------------------------------------------------------------
                           BACKING SHEET / DOCKET
-------------------------------------------------------------------------
Date of Hearing:
Date of disposal:

IN THE COURT OF THE ${f.court}

                               No. ${f.case_no}

                           COPY APPALICATION

Filed on behalf of the ${f.filed_by}

By Counsel:
${f.advocate}
`;
      },
    },
    memo_appearance: {
      title: 'Memo of Appearance (Filed on behalf of Accused)',
      fields: [
        { id: 'court', label: 'Court Name', default: 'Judicial Magistrate Court, Pochampalli' },
        { id: 'crl_mp_no', label: 'Crl. M.P. No. (if any)', default: '' },
        { id: 'crime_no', label: 'Crime Number (if any)', default: '45 of 2025' },
        { id: 'case_no', label: 'Spl. S.C. / S.C. / C.C. / S.T.C. Number', default: 'C.C. No. 120 of 2025' },
        { id: 'complainant', label: 'Complainant Name', default: 'State represented by Inspector of Police' },
        { id: 'accused', label: 'Accused Name', default: 'Ravi kumar' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
        { id: 'bar_no', label: 'Advocate Bar Council No.', default: '2386/2025' },
        { id: 'office_addr', label: 'Advocate Office Address', default: 'Pochampalli, Krishnagiri – 635206' },
        { id: 'date', label: 'Date', default: today() },
        { id: 'place', label: 'Place', default: 'Pochampalli' },
      ],
      generate: (f) => `IN THE COURT OF THE ${f.court}

                               Crl. M.P. No: ${f.crl_mp_no || '   '}    Of 20
                               Crime No.: ${f.crime_no || '   '}    Of 20
                               Spl. S.C. / S.C. / C.C. / S.T.C. No.: ${f.case_no || '   '}

${f.complainant}                                              ...Complainant
                               Versus
${f.accused}                                                  ...Accused

                MEMO OF APPEARANCE FILED ON BEHALF OF THE ACCUSED.

I, ${f.advocate}, Advocate, Enrol. No.: ${f.bar_no}, ${f.office_addr}, do hereby declare that I have been duly engaged and instructed to appear, plead, and act on behalf of the Accused in the above case.

Date: ${f.date}
Place: ${f.place}                                           Counsel for Accused.
`,
    },
    advance_petition: {
      title: 'Advance Petition (Petition to Advance Hearing)',
      fields: [
        { id: 'court', label: 'Court Name', default: 'Judicial Magistrate Court, Pochampalli' },
        { id: 'case_no', label: 'C.C. Number', default: 'C.C. No. 120 of 2025' },
        { id: 'complainant', label: 'Complainant Name', default: 'State represented by Sub-Inspector Of Police, Pochampalli Police station' },
        { id: 'accused', label: 'Accused Name', default: 'Ravi kumar' },
        { id: 'absent_date', label: 'Date Accused was Absent', default: '15.06.2025' },
        { id: 'posted_date', label: 'Next Scheduled Date', default: '20.08.2025' },
        { id: 'adv_from_date', label: 'Advance from Date', default: '20.08.2025' },
        { id: 'adv_to_date', label: 'Advance to Date', default: '10.07.2025' },
        { id: 'filed_by', label: 'Filed on behalf of (Accused / Complainant)', default: 'Accused' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
      ],
      generate: (f) => `IN THE COURT OF THE ${f.court}

                               C.C. No.: ${f.case_no}

${f.complainant}                                              ...Complainant.
                               Versus
${f.accused}                                                  ...Accused

        ADVANCE PETITION FILED ON BEHALF OF THE ${f.filed_by.toUpperCase()}.

It is submitted that the above case is pending before this Hon’ble court in trail stage.

The accused was absent on ${f.absent_date}

The case stands posted to ${f.posted_date}

The petitioner / Accused / complainant have files the advance petition in the above case before this Hon’ble Court.

Hence, it prays that the above case may be advanced from date ${f.adv_from_date} to ${f.adv_to_date} for proper adjudication of the case.

                                                        Counsel for ${f.filed_by}.


-------------------------------------------------------------------------
                           BACKING SHEET / DOCKET
-------------------------------------------------------------------------

IN THE COURT OF THE ${f.court}

                               C.C. No.: ${f.case_no}

${f.complainant}                                              ...Complainant.
                               Versus
${f.accused}                                                  ...Accused

                        ADVANCE PETITION
                     FILED ON BEHALF OF THE
                     ${f.filed_by.toUpperCase()}.

By Counsel:
${f.advocate}
`,
    },
    hc_vakalat: {
      title: 'High Court Vakalat (Madras High Court)',
      fields: [
        { id: 'appeal_no', label: 'Appeal / Petition Number (e.g. W.P. No. 12456 of 2026)', default: 'W.P. No. 12456 of 2026' },
        { id: 'against_no', label: 'Against Appeal / Petition Number', default: 'O.S. No. 450 of 2024' },
        { id: 'against_court', label: 'Against Court / Lower Court', default: 'District Court, Coimbatore' },
        { id: 'client', label: 'Appellant / Petitioner Name(s)', default: 'K. Ramesh Babu' },
        { id: 'client_role', label: 'Client Role (e.g. Appellant / Petitioner)', default: 'Appellant / Petitioner' },
        { id: 'opponent', label: 'Respondent Name(s)', default: 'V. Suresh Kumar' },
        { id: 'opponent_role', label: 'Opposing Role (e.g. Respondent)', default: 'Respondent' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
        { id: 'advocate_degree', label: 'Advocate Qualifications & Enrollment', default: 'B.A., LL.B. Enrol. No. 2386 / 2025' },
        { id: 'advocate_addr', label: 'Advocate Service Address', default: 'Chamber 124, High Court Buildings, Madras - 600104' },
        { id: 'translation_lang', label: 'Read Out & Explained Language', default: 'Tamil' },
        { id: 'date', label: 'Date of Execution', default: today() },
      ],
      generate: (f) => `IN THE COURT OF THE JUDICATURE AT MADRAS.

                               No. ${f.appeal_no}
                               Against
                               No. ${f.against_no} on the file of the ${f.against_court}

${f.client}                                                   ... ${f.client_role}
                               Versus
${f.opponent}                                                 ... ${f.opponent_role}

I / We, the ${f.client_role} do hereby appoint and retain:

Mr./Ms. ${f.advocate}, ${f.advocate_degree}, Advocate of the High Court to appear for me / us in the Appeal / Petition and to conduct and to prosecute (or defend) the same and all proceedings that may be taken in respect of any application concord with the same or any decree or order passed therein include all application for return of documents or the receipt of any mones that may be payable to me / us in the said Appeal / Petition and also in Appeal under section 15 of the Letters Patent and in application for Leave to the supreme court of India, and in all application for review of Judgement.

I clarify that the contents of this Vakalat were read out and explained out and explained in ${f.translation_lang} in my presence to the executants who appeared perfectly to understand the same his / her / their signature / mark in my presence.

Executed before me this ${f.date}.

Accepted

Counsel for ${f.client_role}
The Address for the service of the said counsel:
${f.advocate_addr}


-------------------------------------------------------------------------
                           BACKING SHEET / DOCKET
-------------------------------------------------------------------------

IN THE COURT OF THE JUDICATURE AT MADRAS.

                               No. ${f.appeal_no}
                               Against
                               No. ${f.against_no}
                               On the file of the ${f.against_court}

                                  VAKALAT
                                  Accepted

By counsel:
${f.advocate}

Counsel for Petitioner / Appellant / Respondent
`,
    },
    bail_app: {
      title: 'Bail Application (Section 480 B.N.S.S.)',
      fields: [
        { id: 'court', label: 'Court Name', default: 'Judicial Magistrate Court, Pochampalli' },
        { id: 'crl_mp_no', label: 'Cr. M.P. Number', default: '15 of 2025' },
        { id: 'crime_no', label: 'Crime Number', default: '45 of 2025' },
        { id: 'case_no', label: 'S.T.C. / C.C. Number', default: 'C.C. No. 120 of 2025' },
        { id: 'client', label: 'Petitioner / Accused Name', default: 'Ravi kumar' },
        { id: 'client_role', label: 'Petitioner Role (e.g. Petitioner / Accused)', default: 'Petitioner / Accused' },
        { id: 'opponent', label: 'Respondent / Complainant Name', default: 'State represented by Inspector of Police' },
        { id: 'opponent_role', label: 'Respondent Role (e.g. Respondent / Complainant)', default: 'Respondent / Complainant' },
        { id: 'section', label: 'Offence Section(s)', default: '379' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
      ],
      generate: (f) => `IN THE COURT OF THE ${f.court}

                               Cr. M.P. No. : ${f.crl_mp_no}
                               Crime No.: ${f.crime_no}
                               S.T.C. / C.C. No.: ${f.case_no}

${f.client}                                                   ... ${f.client_role}
                               Versus
${f.opponent}                                                 ... ${f.opponent_role}

     BAIL APPALICATION FILED ON BEHALF OF THE PETITIONER / ACCUSED UNDER SECTION 480 OF B.N.S.S.

1. The above named Petitioner / Accused has been arrested by the Respondent and remanded to custody by this Hon’ble Court for alleged offences under section ${f.section}.

2. That the accused is not guilty of any offences and did not commit the said offences. The accused is wrongly implicated.

3. That the said offences is /are bailable / non bailable in nature.

4. That the accused is a law abiding citizen and the accused will not abscond. The liability of the accused is essential to arrange the defence.

5. That the accused is ready to furnish substantial sureties to the satisfaction of this Hon’ble Court enlarge the accused on bail.

6. It is therefore prayed that this Hon’ble Court may pleased to order the release of the Petitioner / Accused on bail pending disposal of the case on such terms as this Hon’ble court may deem fit and proper in the circumstances of the case.

                                                        Counsel for the Petitioner / Accused


-------------------------------------------------------------------------
                           BACKING SHEET / DOCKET
-------------------------------------------------------------------------

IN THE COURT OF THE ${f.court}

                               Cr. M.P. No. : ${f.crl_mp_no}
                               Crime No.: ${f.crime_no}
                               S.T.C. / C.C. No.: ${f.case_no}

                               ... ${f.client_role}
                               Versus
                               ... ${f.opponent_role}

                       BAIL APPALICATION FILED
                           ON BEHALF OF THE
                          PETITIONER / ACCUSED
                          UNDER SECTION 480 OF
                                B.N.S.S.

By Counsel:
${f.advocate}
`,
    },
    recall_warrant: {
      title: 'Recall Warrant Petition (Section 72(2) B.N.S.S.)',
      fields: [
        { id: 'court', label: 'Court Name', default: 'Judicial Magistrate Court, Pochampalli' },
        { id: 'crl_mp_no', label: 'Crl. M.P. Number', default: '14 of 2025' },
        { id: 'case_no', label: 'C.C. / S.T.C. Number', default: 'C.C. No. 120 of 2025' },
        { id: 'client', label: 'Petitioner / Accused Name', default: 'Ravi kumar' },
        { id: 'client_role', label: 'Petitioner Role (e.g. Petitioner / Accused)', default: 'Petitioner / Accused' },
        { id: 'opponent', label: 'Respondent / Complainant Name', default: 'Sub-Inspector of Police, Pochampalli Police Station' },
        { id: 'opponent_role', label: 'Respondent Role (e.g. Respondent / Complainant)', default: 'Respondent / Complainant' },
        { id: 'section', label: 'Under Section', default: '379' },
        { id: 'absent_date', label: 'Date Accused was Absent', default: '15.06.2025' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
      ],
      generate: (f) => `IN THE COURT OF THE ${f.court}

                               Cr. M.P. No.: ${f.crl_mp_no}
                               In
                               C.C. / S.T.C. No.: ${f.case_no}

${f.client}                                                   ... ${f.client_role}
                               Versus
${f.opponent}.                                                ... ${f.opponent_role}.

     PETITION FILED ON BEHALF OF THE PETITIONER / ACCUSED UNDER SECTION 72(2) OF THE B.N.S.S.

1. The petitioner begs to submit that accused stands charged for an offence under section ${f.section} and same is pending before this Hon’ble court.

2. It is submitted that the petitioner was not able to appear before this Hon’ble court on ${f.absent_date}. Since he was suffering from illness. The accused absence is neither wilful nor wanton. This court issued Non-Bailable warrant against the accused. Today the accused is present before this Hon’ble Court and the accused undertake to appear before this Hon’ble Court regularly in further.

3. It is therefore prayed that this Hon’ble Court may be pleased to recall the Non-Bailable Warrant as against the petitioner and pass necessary orders.


Accused                                                Counsel for Accused


-------------------------------------------------------------------------
                           BACKING SHEET / DOCKET
-------------------------------------------------------------------------

IN THE COURT OF THE ${f.court}

                               Cr. M.P. No.: ${f.crl_mp_no}
                               In
                               C.C. / S.T.C. No.: ${f.case_no}

                               ... ${f.client_role}
                               Versus
                               ... ${f.opponent_role}.

                         PETITION FILED ON
                           BEHALF OF THE
                        PETITIONER / ACCUSED
                        UNDER SECTION 72(2) OF
                             THE B.N.S.S.

By Counsel:
${f.advocate}
`,
    },
    condone_absence: {
      title: 'Condonation of Absence Petition (Section 355 B.N.S.S.)',
      fields: [
        { id: 'court', label: 'Court Name', default: 'Judicial Magistrate Court, Pochampalli' },
        { id: 'crl_mp_no', label: 'Crl. M.P. Number', default: '16 of 2025' },
        { id: 'case_no', label: 'STC/MC/DVC/C.C. Number', default: 'C.C. No. 120 of 2025' },
        { id: 'client', label: 'Petitioner / Accused Name', default: 'Ravi kumar' },
        { id: 'client_role', label: 'Petitioner Role (e.g. Petitioner / Accused)', default: 'Petitioner / Accused' },
        { id: 'opponent', label: 'Respondent Name', default: 'Sub-Inspector of Police, Pochampalli Police Station' },
        { id: 'opponent_role', label: 'Respondent Role', default: 'Respondent / Complainant' },
        { id: 'reason', label: 'Reason for Absence', default: 'fever and severe illness' },
        { id: 'date', label: 'Date', default: today() },
        { id: 'place', label: 'Place', default: 'Pochampalli' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
      ],
      generate: (f) => `IN THE COURT OF THE JUDICIAL MAGISTRATE COURT, ${f.court.toUpperCase()}

                               Crl. M.P.: ${f.crl_mp_no}
                               In
                               STC/MC/DVC/C.C. No.; ${f.case_no}

${f.client}                                                   ... ${f.client_role}.
                               Versus
${f.opponent}                                                 ... ${f.opponent_role}.

       THE PETITION FILED ON BEHALF OF THE ${f.client_role.toUpperCase()} U/s 355/ 279/ 145 OF BNSS.

1. The ${f.client_role} is not in position to appear before this Honorable Court in person due to ${f.reason}.

2. The absence of the ${f.client_role} is not wilful or wanton.

3. It is therefore prayed that this Honorable Court may be pleased to condone the absence of the petitioner today and permit his/their counsel to represent on behalf of the ${f.client_role} and pass necessary orders.

Date: ${f.date}
Place: ${f.place}                                           Counsel for ${f.client_role}.


-------------------------------------------------------------------------
                           BACKING SHEET / DOCKET
-------------------------------------------------------------------------

IN THE COURT OF THE JUDICIAL MAGISTRATE COURT, ${f.court.toUpperCase()}

                               Crl. M.P.: ${f.crl_mp_no}
                               In
                               STC/MC/DVC/C.C. No.; ${f.case_no}

                               ... ${f.client_role}.
                               Versus
                               ... ${f.opponent_role}.

                        THE PETITION FILED ON
                            BEHALF OF THE
                        ${f.client_role.toUpperCase()}
                        U/s 355/ 279/ 145 OF BNSS.

By Counsel:
${f.advocate}
`,
    },
    solvency_memo: {
      title: 'Solvency Memo',
      fields: [
        { id: 'court', label: 'Court Name', default: 'Judicial Magistrate Court, Pochampalli' },
        { id: 'crl_mp_no', label: 'Cr. M.P. Number', default: '15 of 2025' },
        { id: 'crime_no', label: 'Crime Number', default: '45 of 2025' },
        { id: 'case_no', label: 'C.C. / S.T.C. Number', default: 'C.C. No. 120 of 2025' },
        { id: 'client', label: 'Petitioner / Accused Name', default: 'Ravi kumar' },
        { id: 'client_role', label: 'Petitioner Role (e.g. Petitioner / Accused)', default: 'Petitioner / Accused' },
        { id: 'opponent', label: 'Respondent Name', default: 'Sub-Inspector of Police, Pochampalli Police Station' },
        { id: 'opponent_role', label: 'Respondent Role', default: 'Respondent / Complainant' },
        { id: 'bail_court', label: 'Bail Ordering Court (e.g. Court of Sessions, Krishnagiri / High Court, Chennai)', default: 'this Court' },
        { id: 'bail_mp_no', label: 'Bail Order Cr.M.P. No.', default: '15 of 2025' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
      ],
      generate: (f) => `IN THE COURT OF THE ${f.court}

                               Cr. M.P. No. : ${f.crl_mp_no}
                               Crime No.: ${f.crime_no}
                               C.C. No.: ${f.case_no}

${f.client}                                                   ... ${f.client_role}.
                               Versus
${f.opponent}                                                 ... ${f.opponent_role}.

                SOLVENCY MEMO FILED ON BEHALF OF THE ACCUSED.

It is respectfully submitted that in the above said case, the Hon’ble Court of ${f.bail_court} has passed an order in Cr.M.P. No. ${f.bail_mp_no} to release the accused on bail. The order copy is filed herein.

It is therefore prayed that this Hon’ble Court may be pleased to accept the Solvencies filed herewith and released the accused on bail and thereby render justice.

                                                        Counsel for the Petitioner / Accused


-------------------------------------------------------------------------
                           BACKING SHEET / DOCKET
-------------------------------------------------------------------------

IN THE COURT OF THE ${f.court}

                               Cr. M.P. No. : ${f.crl_mp_no}
                               Crime No.: ${f.crime_no}
                               C.C. No.: ${f.case_no}

                               SOLVENCY MEMO
                        FILED ON BEHALF OF THE ACCUSED.

By Counsel:
${f.advocate}
`,
    },
    suretyship_app: {
      title: 'Suretyship Application (Judicial Form No. 46)',
      fields: [
        { id: 'court', label: 'Court Name', default: 'Judicial Magistrate Court, Pochampalli' },
        { id: 'crl_mp_no', label: 'Cr.M.P. Number', default: '15 of 2025' },
        { id: 'crime_no', label: 'Crime Number', default: '45 of 2025' },
        { id: 'complainant', label: 'Complainant Name', default: 'State represented by Sub-Inspector of Police, Pochampalli Police Station' },
        { id: 'accused', label: 'Accused Name', default: 'Ravi kumar' },
        { id: 'surety_name', label: 'Surety Full Name', default: 'K. Ramesh Babu' },
        { id: 'surety_parent', label: 'Surety Parent Name (S/O or D/O or W/O)', default: 'K. Srinivasan' },
        { id: 'surety_address', label: 'Surety Address & Residency Period', default: '12, Gandhi Street, Pochampalli, Krishnagiri - 15 Years' },
        { id: 'surety_qual', label: 'Surety Qualifications (if any)', default: 'Graduate' },
        { id: 'surety_rent', label: 'Rent Paid for Residence (if none, write No)', default: 'No' },
        { id: 'surety_tax_name', label: 'Property Tax Receipt in Surety Name (Yes/No)', default: 'Yes' },
        { id: 'surety_job', label: 'Surety Occupation & Address', default: 'Agriculture, Own Land at Pochampalli' },
        { id: 'surety_employer', label: 'Employer Details (if in service, else No)', default: 'No' },
        { id: 'surety_house', label: 'House Property particulars & Encumbrances', default: 'Yes, Door No. 45/2, Pochampalli, Value Rs. 15,00,000/-. Not Encumbered.' },
        { id: 'surety_tax', label: 'Income Tax Paid details (e.g. No)', default: 'No' },
        { id: 'surety_bank', label: 'Banking accounts & Amounts lying (e.g. SBI Pochampalli - Rs. 50,000)', default: 'SBI Pochampalli - Rs. 50,000' },
        { id: 'surety_known_accused', label: 'Relationship & how long known accused', default: 'Friend - 10 Years' },
        { id: 'surety_stood', label: 'Stood surety for any other person in last 6 months (Yes/No & Details)', default: 'No' },
        { id: 'surety_charge_us', label: 'Accused charged U/s', default: '379 B.N.S.' },
        { id: 'bail_amount', label: 'Bail Amount (Rs.)', default: '10,000' },
        { id: 'bail_amount_words', label: 'Bail Amount in Words', default: 'Ten Thousand' },
        { id: 'bail_judge', label: 'Bail Order Judge / Magistrate', default: 'Judicial Magistrate, Pochampalli' },
        { id: 'bail_date', label: 'Bail Order Date', default: today() },
        { id: 'proof_doc', label: 'Verification Document (Passport / Election ID / PAN Card / ATM Card)', default: 'Identity card issued by the Election Commission of India' },
        { id: 'date', label: 'Date of Execution', default: today() },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
      ],
      generate: (f) => `Judicial Form No. 46 [See Rule 14(4)]

                          APPLICATION FOR SURETY SHIP

IN THE COURT OF THE ${f.court}

                                 Cr.M.P. No.: ${f.crl_mp_no}
                                 In
                                 Crime No.: ${f.crime_no}

State represented by ${f.complainant}                           ...Complainant
                               Vs.
${f.accused}                                                  ...Accused

I, ${f.surety_name} S/O ${f.surety_parent}, solemnly affirm and state as follows:

1. I beg to offer myself as a Surety for Petitioner / Accused ${f.accused}, who is charged U/s ${f.surety_charge_us} and who has been ordered to be released on bail in the sum of Rs ${f.bail_amount} (${f.bail_amount_words}) with the two sureties in the like amount, by the Hon’ble ${f.bail_judge} on ${f.bail_date}.

2. I give below certain particulars Concerning myself:

   (A) I. Full name of the surety                      : ${f.surety_name}
       II. Qualifications, if any                      : ${f.surety_qual}
       III. Full residential address, Period for       : ${f.surety_address}
            which surety has been Residing at the
            above address
       IV. Rent paid for the residence                 : ${f.surety_rent}
       V. Whether the rent bill or property tax        : ${f.surety_tax_name}
          Receipt of the residence stands in the
          Surety’s name

   (B) Occupation or business                          : ${f.surety_job}
       I. Full business address                        : ${f.surety_job}
       II. Nature and extent of business and           : No
           Surety’s share therein
       III. Rent paid for the place of business        : No
       IV. Whether the rent bill/property tax          : No
           Receipt of the place of business
           stands in the surety’s name

   (C) Name and address of the employer, if            : ${f.surety_employer}
       The surety is in service
       I. Full address of the place of service         : No
       II. Amount of monthly pay and                   : No
           Allowances drawn
       III. Length of service with the employer        : No
       IV. Amount of Provident Fund, if any, at        : No
           Surety’s credit

   (D) Full particulars of house property              : ${f.surety_house}
       Owned, if any, its location, rate able
       Value and the surety’s share or interest
       Therein and whether it is in any way
       Encumbered

   (E) Amount of income tax paid                       : No
       I. During each of the last three years          : No
       II. Banking accounts, if any                    : ${f.surety_bank}
       III. Amounts now lying in each banking          : ${f.surety_bank}
            Account

   (F) Length of time for which the surety             : ${f.surety_known_accused}
       has known the accused personally
       I. Whether the surety is related to the         : No
          accused, if so, how?
       II. Whether the Surety has stood surety         : ${f.surety_stood}
           or any other person in the preceding
           six months.
       III. The Court and the number of the case       : No
            against those accused
       VI. whether the case or cases against           : No
           those persons are pending or have
           concluded
       V. Whether the Surety has, at any time,         : No
          made an application for surety ship
          which was rejected, if so, give the
          particulars thereof
       VI. Whether the surety is (or has been)         : No
           involved in any civil litigation
       VII. Whether the surety himself has been        : No
            concerned in any case as accused
            person, if so, give particulars of the
            case

   (G) Any other particulars in regard to the          : No
       status of the surety or his income and
       assets, which the surety may desire to
       give

3. I produce the following proof in support of my statements and give particulars of the same as below:
   ${f.proof_doc}

   A. As per sub rule(4) of Rule14, I produce one of the following documents mentioned below:
      - ${f.proof_doc}

   B. As per sub rule (6) of Rule14, I produce two copies of my latest passport size photograph.

4. I hereby declare that I have not stood surety before / stood surety for Accused person (give all the relevant particulars).

5. I pray that I may be accepted as a surety for the above mentioned accused in the sum of Rs. ${f.bail_amount} (${f.bail_amount_words}). I solemnly affirmed at Pochampalli this ${f.date}.

Identified by:
Before me:
                                                       Signature of Surety
                                                       Signature of Surety Advocate
`,
    },
    process_memo: {
      title: 'Process Memo',
      fields: [
        { id: 'court', label: 'Court Name', default: 'Judicial Magistrate Court, Pochampalli' },
        { id: 'case_no', label: 'C.C. / S.T.C. Number', default: 'C.C. No. 120 of 2025' },
        { id: 'client', label: 'Petitioner/Accused Name', default: 'Ravi kumar' },
        { id: 'client_role', label: 'Petitioner Role (e.g. Petitioner / Accused)', default: 'Petitioner' },
        { id: 'opponent', label: 'Respondent Name', default: 'State represented by Inspector of Police' },
        { id: 'opponent_role', label: 'Respondent Role', default: 'Respondent' },
        { id: 'filed_by', label: 'Filed on behalf of (e.g. Petitioner / Accused)', default: 'Petitioner' },
        { id: 'witness_no', label: 'Prosecution Witness Number', default: '1' },
        { id: 'channel', label: 'Summons Channel (e.g. through the Sub-Inspector)', default: 'Sub-Inspector of Police, Pochampalli Police Station' },
        { id: 'witness_address', label: 'Address of the Witness', type: 'textarea', default: 'S. Murugan,\nNo. 12, Gandhi Street,\nPochampalli, Krishnagiri' },
        { id: 'advocate', label: 'Advocate Name', default: advocateDefault },
      ],
      generate: (f) => `IN THE COURT OF THE JUDICIAL MAGISTRATE COURT, ${f.court.toUpperCase()}

                               C.C. / S.T.C. No. ${f.case_no}

${f.client}                                                   ... ${f.client_role}
                               Versus
${f.opponent}                                                 ... ${f.opponent_role}

     PROCESS MEMEO FILED ON BEHALF OF THE ${f.filed_by.toUpperCase()}/ ACCUSED / COMPLAINANT.

  It is prayed that this Hon’ble Court may be pleased to issue summons to the prosecution witness No. ${f.witness_no} through the ${f.channel} to the under mentioned address and pass necessary orders under the circumstances of the case.


                                                        Counsel for the ${f.filed_by}.

Address of the Witness:
${f.witness_address}


-------------------------------------------------------------------------
                           BACKING SHEET / DOCKET
-------------------------------------------------------------------------

IN THE COURT OF THE JUDICIAL MAGISTRATE COURT, ${f.court.toUpperCase()}

                               C.C. / S.T.C. No. ${f.case_no}

                         PROCESS MEMEO
                     FILED ON BEHALF OF THE
                     ${f.filed_by.toUpperCase()}/ ACCUSED / COMPLAINANT.

By Counsel:
${f.advocate}
`,
    },
  };
}

const TEMPLATE_ORDER = [
  { key: 'vakalat', label: 'Vakalatnama', subtitle: 'Bilingual Authorization (Eng/Tam)' },
  { key: 'adj', label: 'Adjournment Petition', subtitle: 'Section 309 CrPC / CPC' },
  { key: 'notice138', label: 'Sec 138 Cheque Notice', subtitle: 'Negotiable Instruments Act' },
  { key: 'affidavit', label: 'Affidavit of Assets', subtitle: 'Standard Civil Declaration' },
  { key: 'surrender', label: 'Surrender Petition', subtitle: 'Filed on behalf of Accused' },
  { key: 'copy_app', label: 'Copy Application', subtitle: 'Application for Certified Copies' },
  { key: 'memo_appearance', label: 'Memo of Appearance', subtitle: 'Filed on behalf of Accused' },
  { key: 'advance_petition', label: 'Advance Petition', subtitle: 'Petition to Advance Hearing' },
  { key: 'hc_vakalat', label: 'High Court Vakalat', subtitle: 'Madras High Court Vakalatnama' },
  { key: 'bail_app', label: 'Bail Application', subtitle: 'Section 480 B.N.S.S.' },
  { key: 'recall_warrant', label: 'Recall Warrant', subtitle: 'Section 72(2) B.N.S.S.' },
  { key: 'condone_absence', label: 'Condone Absence', subtitle: 'Section 355 B.N.S.S.' },
  { key: 'solvency_memo', label: 'Solvency Memo', subtitle: 'Filing Solvency Certificates' },
  { key: 'suretyship_app', label: 'Suretyship Form 46', subtitle: 'Application for Suretyship' },
  { key: 'process_memo', label: 'Process Memo', subtitle: 'Summons to Witness' },
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
              <div className="form-group" key={field.id} style={field.type === 'textarea' ? { gridColumn: 'span 2' } : {}}>
                <label htmlFor={field.id}>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    value={values[field.id] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                    style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                  />
                ) : (
                  <input
                    type="text"
                    id={field.id}
                    value={values[field.id] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                )}
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
