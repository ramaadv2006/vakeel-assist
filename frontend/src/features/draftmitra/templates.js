/* ---------------------------------------------------------------
   DraftMitra — template + field definitions
   Full Legal Court Templates with exact formatting, alignment, 
   and Backing Sheet / Docket sections modeled on Tamil Nadu / Indian
   District & High Court drafting practice.
----------------------------------------------------------------*/

export const ADVOCATE_DEFAULTS = {
  advocateName: "Hariharan V.N., B.A., LL.B.",
  enrolNo: "2386/2025",
  advocateAddress: "Pochampalli, Krishnagiri – 635206",
  phone: "7502323717",
  email: "vnhariharanballb@gmail.com",
};

export const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

export const F = (id, label, opts = {}) => ({
  id,
  label,
  type: opts.type || "text",
  ph: opts.ph || "",
  w: opts.w || "full",
  def: opts.def ?? "",
  area: !!opts.area,
});

export const up = (s) => (s || "").toUpperCase();

export const TEMPLATES = [
  {
    id: "surrender",
    name: "Surrender Petition",
    sub: "Filed on behalf of Accused",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "Judicial Magistrate Court, Pochampalli" }),
      F("crimeNo", "Crime Number", { def: "12 of 2025", w: "half" }),
      F("caseNo", "S.T.C. / C.C. Number", { def: "34 of 2025", w: "half" }),
      F("client", "Accused Name & Parentage", { def: "Ravi kumar S/O Kiran" }),
      F("clientAddr", "Accused Address", { def: "Pochampalli, Krishnagiri – 635206" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner / Accused", w: "half" }),
      F("opponent", "Respondent (Police Station)", { def: "State represented by Inspector of Police", w: "full" }),
      F("opponentRole", "Respondent Role", { def: "Respondent / Complainant", w: "half" }),
      F("section", "Under Section", { ph: "e.g. 379", w: "half" }),
      F("act", "Act (e.g. I.P.C. / B.N.S.)", { def: "I.P.C. / B.N.S.", w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
    ],
    generate: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Crime No.: ${d.crimeNo || "____"}\nIn\nS.T.C. / C.C. No.: ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: `${d.client || "________________"}\n${d.clientAddr || ""}`, role: `${d.clientRole}` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `${d.opponentRole}` },
      { t: "space" },
      { t: "title", v: "SURRENDER PETITION FILED ON BEHALF OF THE ACCUSED." },
      { t: "space" },
      { t: "num", n: 1, v: `It is submitted that the above case is pending against the accused filed by the ${d.opponent} under section ${d.section || "_____"} of ${d.act || "_____"}.` },
      { t: "num", n: 2, v: "The accused is surrendered before this Hon’ble court." },
      { t: "num", n: 3, v: "The accused offer sufficiently surety and solvenance regarding his bail." },
      { t: "num", n: 4, v: "It is therefore prays that this Hon’ble Court may be pleased to release the accused on bail after accepting the surrender and thus render justice." },
      { t: "space" },
      { t: "signblock", v: "Accused                                                Counsel for Accused" },
    ],
    generateCover: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Crime No.: ${d.crimeNo || "____"}\nIn\nS.T.C. / C.C. No.: ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole}` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole}` },
      { t: "space" },
      { t: "title", v: "SURRENDER PETITION\nFILED ON BEHALF OF THE\nACCUSED." },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate}` },
    ],
  },
  {
    id: "copy_app",
    name: "Copy Application",
    sub: "Application for Certified Copies",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "Judicial Magistrate Court, Pochampalli" }),
      F("caseNo", "No. (e.g. C.C. 34/2025)", { def: "C.C. 34/2025", w: "half" }),
      F("client", "Petitioner/Appellant/Complainant Name", { def: "Ravi kumar", w: "half" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner / Appellant / Complainant", w: "half" }),
      F("opponent", "Respondent Name", { def: "State represented by Inspector of Police", w: "half" }),
      F("opponentRole", "Respondent Role", { def: "Respondent / Counter / Accused", w: "half" }),
      F("filedBy", "Filed on behalf of", { def: "Accused", w: "half" }),
      F("furnishedTo", "Furnished to (e.g. Counsel for Accused)", { def: "Counsel for Accused", w: "half" }),
      F("docsTable", "Documents requested (Format: S.No | Date of Filing | Date of Doc | Description | Remarks)", {
        area: true,
        def: "1 | 15-06-2025 | 15-06-2025 | FIR and Complaint | Copy required for trial\n2 | 20-07-2025 | 20-07-2025 | Deposition of PW1 | Copy required for arguments"
      }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName }),
    ],
    generate: (d) => {
      const lines = (d.docsTable || "").split("\n").filter(Boolean);
      const rows = lines.map((line) => {
        const parts = line.split("|").map((s) => s.trim());
        return {
          sno: parts[0] || "",
          filedDate: parts[1] || "",
          docDate: parts[2] || "",
          desc: parts[3] || "",
          remarks: parts[4] || "",
        };
      });

      return [
        { t: "center", v: "APPLICATION FOR COPIES" },
        { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
        { t: "left", v: `No.: ${d.caseNo || "____"}` },
        { t: "party", v: d.client || "________________", role: `${d.clientRole}` },
        { t: "versus" },
        { t: "party", v: d.opponent || "________________", role: `${d.opponentRole}` },
        { t: "space" },
        { t: "left", v: "To\nThe Judge of the said Court" },
        { t: "left", v: `Application for certified copies filed on behalf of ${d.filedBy || "Accused"}:` },
        { t: "para", v: `It is requested that the Certified Copies of the documents here under mentioned may be furnished to the ${d.furnishedTo || "Counsel for Accused"}:` },
        { t: "table", rows },
        { t: "signblock", v: `Counsel for ${d.filedBy || "Accused"}` },
        { t: "left", v: "Date of Hearing:\nDate of disposal:" },
      ];
    },
    generateCover: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `No. ${d.caseNo || "____"}` },
      { t: "space" },
      { t: "title", v: "COPY APPLICATION" },
      { t: "left", v: `Filed on behalf of the ${d.filedBy || "Accused"}` },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate}` },
    ],
  },
  {
    id: "memo_appearance",
    name: "Memo of Appearance",
    sub: "Filed on behalf of Accused",
    group: "Appearance & Vakalat",
    fields: [
      F("court", "Court Name", { def: "Judicial Magistrate Court, Pochampalli" }),
      F("crlMpNo", "Crl. M.P. No. (if any)", { w: "half" }),
      F("crimeNo", "Crime Number (if any)", { def: "45 of 2025", w: "half" }),
      F("caseNo", "Spl. S.C. / S.C. / C.C. / S.T.C. Number", { def: "C.C. No. 120 of 2025" }),
      F("complainant", "Complainant Name", { def: "State represented by Inspector of Police" }),
      F("accused", "Accused Name", { def: "Ravi kumar" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName }),
      F("barNo", "Advocate Bar Council No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress, w: "half" }),
      F("date", "Date", { def: today(), w: "half" }),
      F("place", "Place", { def: "Pochampalli", w: "half" }),
    ],
    generate: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Crl. M.P. No: ${d.crlMpNo || "   "}    Of 20\nCrime No.: ${d.crimeNo || "   "}    Of 20\nSpl. S.C. / S.C. / C.C. / S.T.C. No.: ${d.caseNo || "   "}` },
      { t: "space" },
      { t: "party", v: d.complainant || "________________", role: "Complainant" },
      { t: "versus" },
      { t: "party", v: d.accused || "________________", role: "Accused" },
      { t: "space" },
      { t: "title", v: "MEMO OF APPEARANCE FILED ON BEHALF OF THE ACCUSED." },
      { t: "space" },
      { t: "para", v: `I, ${d.advocate}, Advocate, Enrol. No.: ${d.barNo}, ${d.officeAddr}, do hereby declare that I have been duly engaged and instructed to appear, plead, and act on behalf of the Accused in the above case.` },
      { t: "space" },
      { t: "left", v: `Date: ${d.date}\nPlace: ${d.place}` },
      { t: "signblock", v: "Counsel for Accused." },
    ],
    generateCover: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Crl. M.P. No: ${d.crlMpNo || "____"}\nCrime No.: ${d.crimeNo || "____"}\nSpl. S.C. / S.C. / C.C. / S.T.C. No.: ${d.caseNo || "____"}` },
      { t: "space" },
      { t: "party", v: d.complainant || "________________", role: "...Complainant" },
      { t: "versus" },
      { t: "party", v: d.accused || "________________", role: "...Accused" },
      { t: "space" },
      { t: "title", v: "MEMO OF APPEARANCE\nFILED ON BEHALF OF THE\nACCUSED." },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate}` },
    ],
  },
  {
    id: "advance_petition",
    name: "Advance Petition",
    sub: "Petition to Advance Hearing",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "Judicial Magistrate Court, Pochampalli" }),
      F("caseNo", "C.C. Number", { def: "C.C. No. 120 of 2025" }),
      F("complainant", "Complainant Name", { def: "State represented by Sub-Inspector Of Police, Pochampalli Police station" }),
      F("accused", "Accused Name", { def: "Ravi kumar" }),
      F("absentDate", "Date Accused was Absent", { def: "15.06.2025", w: "half" }),
      F("postedDate", "Next Scheduled Date", { def: "20.08.2025", w: "half" }),
      F("advFromDate", "Advance from Date", { def: "20.08.2025", w: "half" }),
      F("advToDate", "Advance to Date", { def: "10.07.2025", w: "half" }),
      F("filedBy", "Filed on behalf of (Accused / Complainant)", { def: "Accused", w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
    ],
    generate: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `C.C. No.: ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.complainant || "________________", role: "Complainant." },
      { t: "versus" },
      { t: "party", v: d.accused || "________________", role: "Accused" },
      { t: "space" },
      { t: "title", v: `ADVANCE PETITION FILED ON BEHALF OF THE ${(d.filedBy || "ACCUSED").toUpperCase()}.` },
      { t: "space" },
      { t: "para", v: "It is submitted that the above case is pending before this Hon’ble court in trail stage." },
      { t: "para", v: `The accused was absent on ${d.absentDate}` },
      { t: "para", v: `The case stands posted to ${d.postedDate}` },
      { t: "para", v: "The petitioner / Accused / complainant have files the advance petition in the above case before this Hon’ble Court." },
      { t: "para", v: `Hence, it prays that the above case may be advanced from date ${d.advFromDate} to ${d.advToDate} for proper adjudication of the case.` },
      { t: "space" },
      { t: "signblock", v: `Counsel for ${d.filedBy}.` },
    ],
    generateCover: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `C.C. No.: ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.complainant || "________________", role: "...Complainant" },
      { t: "versus" },
      { t: "party", v: d.accused || "________________", role: "...Accused" },
      { t: "space" },
      { t: "title", v: `ADVANCE PETITION\nFILED ON BEHALF OF THE\n${(d.filedBy || "ACCUSED").toUpperCase()}.` },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate}` },
    ],
  },
  {
    id: "hc_vakalat",
    name: "High Court Vakalat",
    sub: "Madras High Court Vakalatnama",
    group: "Appearance & Vakalat",
    fields: [
      F("appealNo", "Appeal / Petition Number (e.g. W.P. No. 12456 of 2026)", { def: "W.P. No. 12456 of 2026" }),
      F("againstNo", "Against Appeal / Petition Number", { def: "O.S. No. 450 of 2024", w: "half" }),
      F("againstCourt", "Against Court / Lower Court", { def: "District Court, Coimbatore", w: "half" }),
      F("client", "Appellant / Petitioner Name(s)", { def: "K. Ramesh Babu" }),
      F("clientRole", "Client Role (e.g. Appellant / Petitioner)", { def: "Appellant / Petitioner", w: "half" }),
      F("opponent", "Respondent Name(s)", { def: "V. Suresh Kumar" }),
      F("opponentRole", "Opposing Role (e.g. Respondent)", { def: "Respondent", w: "half" }),
      F("advocateName", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName }),
      F("advocateDegree", "Advocate Qualifications & Enrollment", { def: `B.A., LL.B. Enrol. No. ${ADVOCATE_DEFAULTS.enrolNo}` }),
      F("advocateAddr", "Advocate Service Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
      F("translationLang", "Read Out & Explained Language", { def: "Tamil", w: "half" }),
      F("date", "Date of Execution", { def: today(), w: "half" }),
    ],
    generate: (d) => [
      { t: "center", v: "IN THE COURT OF THE JUDICATURE AT MADRAS." },
      { t: "left", v: `No. ${d.appealNo}\nAgainst\nNo. ${d.againstNo} on the file of the ${d.againstCourt}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `${d.clientRole}` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `${d.opponentRole}` },
      { t: "space" },
      { t: "para", v: `I / We, the ${d.clientRole} do hereby appoint and retain:` },
      { t: "para", v: `Mr./Ms. ${d.advocateName}, ${d.advocateDegree}, Advocate of the High Court to appear for me / us in the Appeal / Petition and to conduct and to prosecute (or defend) the same and all proceedings that may be taken in respect of any application concord with the same or any decree or order passed therein include all application for return of documents or the receipt of any mones that may be payable to me / us in the said Appeal / Petition and also in Appeal under section 15 of the Letters Patent and in application for Leave to the supreme court of India, and in all application for review of Judgement.` },
      { t: "space" },
      { t: "para", v: `I certify that the contents of this Vakalat were read out and explained in ${d.translationLang} in my presence to the executants who appeared perfectly to understand the same his / her / their signature / mark in my presence.` },
      { t: "para", v: `Executed before me this ${d.date}.` },
      { t: "space" },
      { t: "para", v: "Accepted" },
      { t: "signblock", v: `Counsel for ${d.clientRole}\nThe Address for the service of the said counsel:\n${d.advocateAddr}` },
    ],
    generateCover: (d) => [
      { t: "center", v: "IN THE COURT OF THE JUDICATURE AT MADRAS." },
      { t: "left", v: `No. ${d.appealNo}\nAgainst\nNo. ${d.againstNo}\nOn the file of the ${d.againstCourt}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole}` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole}` },
      { t: "space" },
      { t: "title", v: "VAKALAT\nAccepted" },
      { t: "space" },
      { t: "signblock", v: `By counsel:\n${d.advocateName}\n\nCounsel for Petitioner / Appellant / Respondent` },
    ],
  },
  {
    id: "bail_app",
    name: "Bail Application",
    sub: "Section 480 B.N.S.S.",
    group: "Bail & Sureties",
    fields: [
      F("court", "Court Name", { def: "Judicial Magistrate Court, Pochampalli" }),
      F("crlMpNo", "Cr. M.P. Number", { def: "15 of 2025", w: "half" }),
      F("crimeNo", "Crime Number", { def: "45 of 2025", w: "half" }),
      F("caseNo", "S.T.C. / C.C. Number", { def: "C.C. No. 120 of 2025", w: "half" }),
      F("client", "Petitioner / Accused Name", { def: "Ravi kumar" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner / Accused", w: "half" }),
      F("opponent", "Respondent / Complainant Name", { def: "State represented by Inspector of Police" }),
      F("opponentRole", "Respondent Role", { def: "Respondent / Complainant", w: "half" }),
      F("section", "Offence Section(s)", { def: "379", w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
    ],
    generate: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Cr. M.P. No. : ${d.crlMpNo}\nCrime No.: ${d.crimeNo}\nS.T.C. / C.C. No.: ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `${d.clientRole}` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `${d.opponentRole}` },
      { t: "space" },
      { t: "title", v: "BAIL APPLICATION FILED ON BEHALF OF THE PETITIONER / ACCUSED UNDER SECTION 480 OF B.N.S.S." },
      { t: "space" },
      { t: "num", n: 1, v: `The above named Petitioner / Accused has been arrested by the Respondent and remanded to custody by this Hon’ble Court for alleged offences under section ${d.section}.` },
      { t: "num", n: 2, v: "That the accused is not guilty of any offences and did not commit the said offences. The accused is wrongly implicated." },
      { t: "num", n: 3, v: "That the said offences is /are bailable / non bailable in nature." },
      { t: "num", n: 4, v: "That the accused is a law abiding citizen and the accused will not abscond. The liability of the accused is essential to arrange the defence." },
      { t: "num", n: 5, v: "That the accused is ready to furnish substantial sureties to the satisfaction of this Hon’ble Court enlarge the accused on bail." },
      { t: "num", n: 6, v: "It is therefore prayed that this Hon’ble Court may pleased to order the release of the Petitioner / Accused on bail pending disposal of the case on such terms as this Hon’ble court may deem fit and proper in the circumstances of the case." },
      { t: "space" },
      { t: "signblock", v: "Counsel for the Petitioner / Accused" },
    ],
    generateCover: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Cr. M.P. No. : ${d.crlMpNo}\nCrime No.: ${d.crimeNo}\nS.T.C. / C.C. No.: ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole}` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole}` },
      { t: "space" },
      { t: "title", v: "BAIL APPLICATION FILED\nON BEHALF OF THE\nPETITIONER / ACCUSED\nUNDER SECTION 480 OF\nB.N.S.S." },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate}` },
    ],
  },
  {
    id: "recall_warrant",
    name: "Recall Warrant Petition",
    sub: "Section 72(2) B.N.S.S.",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "Judicial Magistrate Court, Pochampalli" }),
      F("crlMpNo", "Crl. M.P. Number", { def: "14 of 2025", w: "half" }),
      F("caseNo", "C.C. / S.T.C. Number", { def: "C.C. No. 120 of 2025", w: "half" }),
      F("client", "Petitioner / Accused Name", { def: "Ravi kumar" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner / Accused", w: "half" }),
      F("opponent", "Respondent / Complainant Name", { def: "Sub-Inspector of Police, Pochampalli Police Station" }),
      F("opponentRole", "Respondent Role", { def: "Respondent / Complainant", w: "half" }),
      F("section", "Under Section", { def: "379", w: "half" }),
      F("absentDate", "Date Accused was Absent", { def: "15.06.2025", w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
    ],
    generate: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Cr. M.P. No.: ${d.crlMpNo}\nIn\nC.C. / S.T.C. No.: ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `${d.clientRole}` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `${d.opponentRole}.` },
      { t: "space" },
      { t: "title", v: "PETITION FILED ON BEHALF OF THE PETITIONER / ACCUSED UNDER SECTION 72(2) OF THE B.N.S.S." },
      { t: "space" },
      { t: "num", n: 1, v: `The petitioner begs to submit that accused stands charged for an offence under section ${d.section} and same is pending before this Hon’ble court.` },
      { t: "num", n: 2, v: `It is submitted that the petitioner was not able to appear before this Hon’ble court on ${d.absentDate}. Since he was suffering from illness. The accused absence is neither wilful nor wanton. This court issued Non-Bailable warrant against the accused. Today the accused is present before this Hon’ble Court and the accused undertake to appear before this Hon’ble Court regularly in further.` },
      { t: "num", n: 3, v: "It is therefore prayed that this Hon’ble Court may be pleased to recall the Non-Bailable Warrant as against the petitioner and pass necessary orders." },
      { t: "space" },
      { t: "signblock", v: "Accused                                                Counsel for Accused" },
    ],
    generateCover: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Cr. M.P. No.: ${d.crlMpNo}\nIn\nC.C. / S.T.C. No.: ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole}` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole}.` },
      { t: "space" },
      { t: "title", v: "PETITION FILED ON\nBEHALF OF THE\nPETITIONER / ACCUSED\nUNDER SECTION 72(2) OF\nTHE B.N.S.S." },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate}` },
    ],
  },
  {
    id: "condone_absence",
    name: "Condonation of Absence Petition",
    sub: "Section 355 B.N.S.S.",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "Judicial Magistrate Court, Pochampalli" }),
      F("crlMpNo", "Crl. M.P. Number", { def: "16 of 2025", w: "half" }),
      F("caseNo", "STC/MC/DVC/C.C. Number", { def: "C.C. No. 120 of 2025", w: "half" }),
      F("client", "Petitioner / Accused Name", { def: "Ravi kumar" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner / Accused", w: "half" }),
      F("opponent", "Respondent Name", { def: "Sub-Inspector of Police, Pochampalli Police Station" }),
      F("opponentRole", "Respondent Role", { def: "Respondent / Complainant", w: "half" }),
      F("reason", "Reason for Absence", { def: "fever and severe illness" }),
      F("date", "Date", { def: today(), w: "half" }),
      F("place", "Place", { def: "Pochampalli", w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
    ],
    generate: (d) => [
      { t: "center", v: `IN THE COURT OF THE JUDICIAL MAGISTRATE COURT, ${up(d.court)}` },
      { t: "left", v: `Crl. M.P.: ${d.crlMpNo}\nIn\nSTC/MC/DVC/C.C. No.; ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `${d.clientRole}.` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `${d.opponentRole}.` },
      { t: "space" },
      { t: "title", v: `THE PETITION FILED ON BEHALF OF THE ${(d.clientRole || "").toUpperCase()} U/s 355/ 279/ 145 OF BNSS.` },
      { t: "space" },
      { t: "num", n: 1, v: `The ${d.clientRole} is not in position to appear before this Honorable Court in person due to ${d.reason}.` },
      { t: "num", n: 2, v: `The absence of the ${d.clientRole} is not wilful or wanton.` },
      { t: "num", n: 3, v: `It is therefore prayed that this Honorable Court may be pleased to condone the absence of the petitioner today and permit his/their counsel to represent on behalf of the ${d.clientRole} and pass necessary orders.` },
      { t: "space" },
      { t: "left", v: `Date: ${d.date}\nPlace: ${d.place}` },
      { t: "signblock", v: `Counsel for ${d.clientRole}.` },
    ],
    generateCover: (d) => [
      { t: "center", v: `IN THE COURT OF THE JUDICIAL MAGISTRATE COURT, ${up(d.court)}` },
      { t: "left", v: `Crl. M.P.: ${d.crlMpNo}\nIn\nSTC/MC/DVC/C.C. No.; ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole}.` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole}.` },
      { t: "space" },
      { t: "title", v: `THE PETITION FILED ON\nBEHALF OF THE\n${(d.clientRole || "").toUpperCase()}\nU/s 355/ 279/ 145 OF BNSS.` },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate}` },
    ],
  },
  {
    id: "solvency_memo",
    name: "Solvency Memo",
    sub: "Filing Solvency Certificates",
    group: "Bail & Sureties",
    fields: [
      F("court", "Court Name", { def: "Judicial Magistrate Court, Pochampalli" }),
      F("crlMpNo", "Cr. M.P. Number", { def: "15 of 2025", w: "half" }),
      F("crimeNo", "Crime Number", { def: "45 of 2025", w: "half" }),
      F("caseNo", "C.C. / S.T.C. Number", { def: "C.C. No. 120 of 2025", w: "half" }),
      F("client", "Petitioner / Accused Name", { def: "Ravi kumar" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner / Accused", w: "half" }),
      F("opponent", "Respondent Name", { def: "Sub-Inspector of Police, Pochampalli Police Station" }),
      F("opponentRole", "Respondent Role", { def: "Respondent / Complainant", w: "half" }),
      F("bailCourt", "Bail Ordering Court (e.g. Court of Sessions, Krishnagiri / High Court, Chennai)", { def: "this Court" }),
      F("bailMpNo", "Bail Order Cr.M.P. No.", { def: "15 of 2025", w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
    ],
    generate: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Cr. M.P. No. : ${d.crlMpNo}\nCrime No.: ${d.crimeNo}\nC.C. No.: ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `${d.clientRole}.` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `${d.opponentRole}.` },
      { t: "space" },
      { t: "title", v: "SOLVENCY MEMO FILED ON BEHALF OF THE ACCUSED." },
      { t: "space" },
      { t: "para", v: `It is respectfully submitted that in the above said case, the Hon’ble Court of ${d.bailCourt} has passed an order in Cr.M.P. No. ${d.bailMpNo} to release the accused on bail. The order copy is filed herein.` },
      { t: "para", v: "It is therefore prayed that this Hon’ble Court may be pleased to accept the Solvencies filed herewith and released the accused on bail and thereby render justice." },
      { t: "space" },
      { t: "signblock", v: "Counsel for the Petitioner / Accused" },
    ],
    generateCover: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Cr. M.P. No. : ${d.crlMpNo}\nCrime No.: ${d.crimeNo}\nC.C. No.: ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole}.` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole}.` },
      { t: "space" },
      { t: "title", v: "SOLVENCY MEMO\nFILED ON BEHALF OF THE ACCUSED." },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate}` },
    ],
  },
  {
    id: "surety_memo_petitioner",
    name: "Surety Memo of Petitioner",
    sub: "Surety Memo Filed by the Petitioner(s) / Accused",
    group: "Bail & Sureties",
    fields: [
      F("court", "Court Name", { def: "Judicial Magistrate No. I, Salem" }),
      F("cmpNo", "C. M. P. No. & Year", { def: "15 of 2025", w: "half" }),
      F("crimeNo", "Crime No. & Year", { def: "45 of 2025", w: "half" }),
      F("policeStation", "Police Station / Respondent", { def: "S. I. of Police, Salem Town Police Station" }),
      F("client", "Petitioner / Accused Name", { def: "Ravi kumar" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner / Accused", w: "half" }),
      F("opponentRole", "Respondent Role", { def: "Respondent / Complainant", w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("counselLabel", "Counsel Label", { def: "Counsel for Petitioner (s) / Accused", w: "half" }),
    ],
    generate: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court || "JUDICIAL MAGISTRATE NO. SALEM")}` },
      { t: "space" },
      { t: "center", v: `C. M. P. No. ${d.cmpNo || "    /20"}\nin\nCrime No. ${d.crimeNo || "    /20"}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioner / Accused"}` },
      { t: "versus", v: "-Vs-" },
      { t: "party", v: d.policeStation || "S. I. of Police", role: `...${d.opponentRole || "Respondent / Complainant"}` },
      { t: "space" },
      { t: "title", v: "SURETY MEMO FILED BY THE PETITIONER(S) / ACCUSED" },
      { t: "space" },
      { t: "para", v: "The above named Petitioner (s) / Accused submits that the Petitioner (s) / Accused is / are herewith produced the sureties along with solvency certificate." },
      { t: "para", v: "Hence the above sureties and solvency may be accepted and release the Accused and thus render justice." },
      { t: "space" },
      { t: "signblock", v: `${d.counselLabel || "Counsel for Petitioner (s) / Accused"}\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}` },
    ],
    generateCover: (d) => [
      { t: "center", v: `IN THE COURT OF THE\n${up(d.court || "JUDICIAL MAGISTRATE NO. SALEM")}` },
      { t: "space" },
      { t: "center", v: `C. M. P. No. ${d.cmpNo || "    /20"}\nin\nCrime No. ${d.crimeNo || "    /20"}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioner / Accused"}` },
      { t: "versus", v: "-Vs-" },
      { t: "party", v: d.policeStation || "S. I. of Police", role: `...${d.opponentRole || "Respondent / Complainant"}` },
      { t: "space" },
      { t: "title", v: "SURETY MEMO FILED BY THE\nPETITIONER(S) / ACCUSED" },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}` },
    ],
  },
  {
    id: "suretyship_app",
    name: "Suretyship Form 46",
    sub: "Application for Suretyship",
    group: "Bail & Sureties",
    fields: [
      F("court", "Court Name", { def: "Judicial Magistrate Court, Pochampalli" }),
      F("crlMpNo", "Cr.M.P. Number", { def: "15 of 2025", w: "half" }),
      F("crimeNo", "Crime Number", { def: "45 of 2025", w: "half" }),
      F("complainant", "Complainant Name", { def: "State represented by Sub-Inspector of Police, Pochampalli Police Station" }),
      F("accused", "Accused Name", { def: "Ravi kumar" }),
      F("suretyName", "Surety Full Name", { def: "K. Ramesh Babu", w: "half" }),
      F("suretyParent", "Surety Parent Name (S/O or D/O or W/O)", { def: "K. Srinivasan", w: "half" }),
      F("suretyAddress", "Surety Address & Residency Period", { def: "12, Gandhi Street, Pochampalli, Krishnagiri - 15 Years" }),
      F("suretyQual", "Surety Qualifications (if any)", { def: "Graduate", w: "half" }),
      F("suretyRent", "Rent Paid for Residence (if none, write No)", { def: "No", w: "half" }),
      F("suretyTaxName", "Property Tax Receipt in Surety Name (Yes/No)", { def: "Yes", w: "half" }),
      F("suretyJob", "Surety Occupation & Address", { def: "Agriculture, Own Land at Pochampalli" }),
      F("suretyEmployer", "Employer Details (if in service, else No)", { def: "No" }),
      F("suretyHouse", "House Property particulars & Encumbrances", { def: "Yes, Door No. 45/2, Pochampalli, Value Rs. 15,00,000/-. Not Encumbered." }),
      F("suretyTax", "Income Tax Paid details (e.g. No)", { def: "No", w: "half" }),
      F("suretyBank", "Banking accounts & Amounts lying", { def: "SBI Pochampalli - Rs. 50,000" }),
      F("suretyKnownAccused", "Relationship & how long known accused", { def: "Friend - 10 Years", w: "half" }),
      F("suretyStood", "Stood surety for any other person in last 6 months (Yes/No & Details)", { def: "No", w: "half" }),
      F("suretyChargeUs", "Accused charged U/s", { def: "379 B.N.S.", w: "half" }),
      F("bailAmount", "Bail Amount (Rs.)", { def: "10,000", w: "half" }),
      F("bailAmountWords", "Bail Amount in Words", { def: "Ten Thousand", w: "half" }),
      F("bailJudge", "Bail Order Judge / Magistrate", { def: "Judicial Magistrate, Pochampalli", w: "half" }),
      F("bailDate", "Bail Order Date", { def: today(), w: "half" }),
      F("proofDoc", "Verification Document (Passport / Election ID / PAN Card / ATM Card)", { def: "Identity card issued by the Election Commission of India" }),
      F("date", "Date of Execution", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
    ],
    generate: (d) => [
      { t: "small", v: "Judicial Form No. 46 [See Rule 14(4)]" },
      { t: "center", v: "APPLICATION FOR SURETY SHIP" },
      { t: "space" },
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Cr.M.P. No.: ${d.crlMpNo}\nIn\nCrime No.: ${d.crimeNo}` },
      { t: "space" },
      { t: "party", v: `State represented by ${d.complainant}`, role: "Complainant" },
      { t: "versus" },
      { t: "party", v: d.accused || "________________", role: "Accused" },
      { t: "space" },
      { t: "para", v: `I, ${d.suretyName} S/O ${d.suretyParent}, solemnly affirm and state as follows:` },
      { t: "num", n: 1, v: `I beg to offer myself as a Surety for Petitioner / Accused ${d.accused}, who is charged U/s ${d.suretyChargeUs} and who has been ordered to be released on bail in the sum of Rs ${d.bailAmount} (${d.bailAmountWords}) with the two sureties in the like amount, by the Hon’ble ${d.bailJudge} on ${d.bailDate}.` },
      { t: "num", n: 2, v: "I give below certain particulars Concerning myself:" },
      { t: "para", v: `(A) I. Full name of the surety                      : ${d.suretyName}\n    II. Qualifications, if any                      : ${d.suretyQual}\n    III. Full residential address, Period for       : ${d.suretyAddress}\n         which surety has been Residing at the\n         above address\n    IV. Rent paid for the residence                 : ${d.suretyRent}\n    V. Whether the rent bill or property tax        : ${d.suretyTaxName}\n       Receipt of the residence stands in the\n       Surety’s name` },
      { t: "para", v: `(B) Occupation or business                          : ${d.suretyJob}\n    I. Full business address                        : ${d.suretyJob}\n    II. Nature and extent of business and           : No\n        Surety’s share therein\n    III. Rent paid for the place of business        : No\n    IV. Whether the rent bill/property tax          : No\n        Receipt of the place of business\n        stands in the surety’s name` },
      { t: "para", v: `(C) Name and address of the employer, if            : ${d.suretyEmployer}\n    The surety is in service\n    I. Full address of the place of service         : No\n    II. Amount of monthly pay and                   : No\n        Allowances drawn\n    III. Length of service with the employer        : No\n    IV. Amount of Provident Fund, if any, at        : No\n        Surety’s credit` },
      { t: "para", v: `(D) Full particulars of house property              : ${d.suretyHouse}\n    Owned, if any, its location, rate able\n    Value and the surety’s share or interest\n    Therein and whether it is in any way\n    Encumbered` },
      { t: "para", v: `(E) Amount of income tax paid                       : No\n    I. During each of the last three years          : No\n    II. Banking accounts, if any                    : ${d.suretyBank}\n    III. Amounts now lying in each banking          : ${d.suretyBank}\n         Account` },
      { t: "para", v: `(F) Length of time for which the surety             : ${d.suretyKnownAccused}\n    has known the accused personally\n    I. Whether the surety is related to the         : No\n       accused, if so, how?\n    II. Whether the Surety has stood surety         : ${d.suretyStood}\n        or any other person in the preceding\n        six months.\n    III. The Court and the number of the case       : No\n         against those accused\n    VI. whether the case or cases against           : No\n        those persons are pending or have\n        concluded\n    V. Whether the Surety has, at any time,         : No\n       made an application for surety ship\n       which was rejected, if so, give the\n       particulars thereof\n    VI. Whether the surety is (or has been)         : No\n        involved in any civil litigation\n    VII. Whether the surety himself has been        : No\n         concerned in any case as accused\n         person, if so, give particulars of the\n         case` },
      { t: "para", v: `(G) Any other particulars in regard to the          : No\n    status of the surety or his income and\n    assets, which the surety may desire to\n    give` },
      { t: "num", n: 3, v: `I produce the following proof in support of my statements and give particulars of the same as below:\n   ${d.proofDoc}\n\n   A. As per sub rule(4) of Rule14, I produce one of the following documents mentioned below:\n      - ${d.proofDoc}\n\n   B. As per sub rule (6) of Rule14, I produce two copies of my latest passport size photograph.` },
      { t: "num", n: 4, v: "I hereby declare that I have not stood surety before / stood surety for Accused person (give all the relevant particulars)." },
      { t: "num", n: 5, v: `I pray that I may be accepted as a surety for the above mentioned accused in the sum of Rs. ${d.bailAmount} (${d.bailAmountWords}). I solemnly affirmed at Pochampalli this ${d.date}.` },
      { t: "space" },
      { t: "left", v: "Identified by:\nBefore me:" },
      { t: "signblock", v: "Signature of Surety: _______________________\nSignature of Surety Advocate: _______________________" },
    ]
  },
  {
    id: "process_memo",
    name: "Process Memo",
    sub: "Summons to Witness",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "Judicial Magistrate Court, Pochampalli" }),
      F("caseNo", "C.C. / S.T.C. Number", { def: "C.C. No. 120 of 2025" }),
      F("client", "Petitioner/Accused Name", { def: "Ravi kumar" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner", w: "half" }),
      F("opponent", "Respondent Name", { def: "State represented by Inspector of Police" }),
      F("opponentRole", "Respondent Role", { def: "Respondent", w: "half" }),
      F("filedBy", "Filed on behalf of", { def: "Petitioner", w: "half" }),
      F("witnessNo", "Prosecution Witness Number", { def: "1", w: "half" }),
      F("channel", "Summons Channel", { def: "Sub-Inspector of Police, Pochampalli Police Station" }),
      F("witnessAddress", "Address of the Witness", { area: true, def: "S. Murugan,\nNo. 12, Gandhi Street,\nPochampalli, Krishnagiri" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName }),
    ],
    generate: (d) => [
      { t: "center", v: `IN THE COURT OF THE JUDICIAL MAGISTRATE COURT, ${up(d.court)}` },
      { t: "left", v: `C.C. / S.T.C. No. ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `${d.clientRole}` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `${d.opponentRole}` },
      { t: "space" },
      { t: "title", v: `PROCESS MEMO FILED ON BEHALF OF THE ${(d.filedBy || "").toUpperCase()}/ ACCUSED / COMPLAINANT.` },
      { t: "space" },
      { t: "para", v: `It is prayed that this Hon’ble Court may be pleased to issue summons to the prosecution witness No. ${d.witnessNo} through the ${d.channel} to the under mentioned address and pass necessary orders under the circumstances of the case.` },
      { t: "space" },
      { t: "signblock", v: `Counsel for the ${d.filedBy || "Petitioner"}.` },
      { t: "space" },
      { t: "left", v: "Address of the Witness:" },
      { t: "para", v: d.witnessAddress },
    ],
    generateCover: (d) => [
      { t: "center", v: `IN THE COURT OF THE JUDICIAL MAGISTRATE COURT, ${up(d.court)}` },
      { t: "left", v: `C.C. / S.T.C. No. ${d.caseNo}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole}` },
      { t: "versus" },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole}` },
      { t: "space" },
      { t: "title", v: `PROCESS MEMO\nFILED ON BEHALF OF THE\n${(d.filedBy || "").toUpperCase()}/ ACCUSED / COMPLAINANT.` },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate}` },
    ],
  },
  {
    id: "vakalat_criminal",
    name: "Vakalathnama Form 72",
    sub: "Criminal — Judicial Form No. 72",
    group: "Appearance & Vakalat",
    fields: [
      F("court", "Court name", { def: "JUDICIAL MAGISTRATE COURT, POCHAMPALLI" }),
      F("caseNo", "Case No.", { w: "half" }),
      F("year", "Year", { def: String(new Date().getFullYear()), w: "half" }),
      F("petitioner", "Petitioner / Accused / Complainant"),
      F("respondent", "Respondent / Complainant / Accused"),
      F("language", "Language explained in", { def: "Tamil", w: "half" }),
      F("date", "Date", { def: today(), w: "half" }),
      F("advocateName", "Advocate name", { def: ADVOCATE_DEFAULTS.advocateName }),
      F("enrolNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("advocateAddress", "Advocate address", { def: ADVOCATE_DEFAULTS.advocateAddress, w: "half" }),
      F("phone", "Phone", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("email", "Email", { def: ADVOCATE_DEFAULTS.email, w: "half" }),
    ],
    generate: (d) => [
      { t: "small", v: "Judiciary Form No. 72 [See Rule 27(6)]" },
      { t: "titleTop", v: "VAKALATHNAMA" },
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Case No.: ${d.caseNo || "____"} / ${d.year}` },
      { t: "space" },
      { t: "party", v: d.petitioner || "________________", role: "...Petitioner / Accused / Complainant" },
      { t: "versus" },
      { t: "party", v: d.respondent || "________________", role: "...Respondent / Complainant / Accused" },
      { t: "space" },
      { t: "para", v: `I / We do hereby appoint and retain Mr. ${d.advocateName}, Advocate, Enrol. No.: ${d.enrolNo}, ${d.advocateAddress}, to appear for me / us in the above case on my / our behalf and to plead, and I / We further empower him / them to accept on my / our behalf, service of notice of all proceedings in the above case, until disposal of the case.` },
      { t: "space" },
      { t: "right", v: "[Signature / L.T.I. of the Accused / Respondent / Complainant]" },
      { t: "space" },
      { t: "para", v: `I certify that the contents of this Vakalathnama were read over and explained in ${d.language} in my presence to the Executant who appeared perfectly to understand the same and made his / her / their signature in my presence.` },
      { t: "para", v: `Executed before me this ${d.date}.` },
      { t: "space" },
      { t: "para", v: "I / We accept the Vakalathnama." },
      { t: "signblock", v: `${d.advocateName}\nAdvocate, Enrol. No.: ${d.enrolNo}\n${d.advocateAddress}\nPh: ${d.phone}   Email: ${d.email}` },
    ],
  },
  {
    id: "petition_256",
    name: "Absence Condone Petition (Sec 256)",
    sub: "u/s 256 Cr.P.C. (Complainant side)",
    group: "Petitions",
    fields: [
      F("court", "Court name", { def: "JUDICIAL MAGISTRATE COURT No.3, SALEM" }),
      F("cmpNo", "C.M.P. No.", { w: "half" }),
      F("year", "Year", { def: String(new Date().getFullYear()), w: "half" }),
      F("stcNo", "S.T.C. No.", { w: "full" }),
      F("petitioner", "Petitioner / Complainant"),
      F("respondent", "Respondent / Accused"),
      F("date", "Date", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
    ],
    generate: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `C.M.P. ${d.cmpNo || "____"} /${d.year}\nIN\nS.T.C. No. ${d.stcNo || "____"}` },
      { t: "space" },
      { t: "party", v: d.petitioner || "________________", role: "...Petitioner / Complainant" },
      { t: "versus" },
      { t: "party", v: d.respondent || "________________", role: "...Respondent / Accused" },
      { t: "space" },
      { t: "title", v: "PETITION FILED UNDER SECTION 256 Cr.P.C." },
      { t: "space" },
      { t: "para", v: "The above named Petitioner / Complainant is not doing well. So he is not able to appear before this Hon'ble Court today. This absence is neither wilful nor wanton." },
      { t: "para", v: "Therefore it is prayed that this Hon'ble Court may be pleased to condone the absence of the Petitioner / Complainant and thus render justice." },
      { t: "space" },
      { t: "right", v: `Date: ${d.date}` },
      { t: "signblock", v: "Counsel for the Petitioner / Complainant" },
    ],
    generateCover: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `C.M.P. ${d.cmpNo || "____"} /${d.year}\nIN\nS.T.C. No. ${d.stcNo || "____"}` },
      { t: "space" },
      { t: "party", v: d.petitioner || "________________", role: "...Petitioner / Complainant" },
      { t: "versus" },
      { t: "party", v: d.respondent || "________________", role: "...Respondent / Accused" },
      { t: "space" },
      { t: "title", v: "PETITION FILED UNDER SECTION\n256 Cr.P.C." },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}` },
    ],
  },
  {
    id: "lodgment_schedule",
    name: "Lodgment Schedule",
    sub: "Rule 131, Form No. 37 — Civil Rules of Practice (C.M. 10)",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "District Munsif Court, Pochampalli" }),
      F("osNo", "Original Suit (O.S.) No.", { def: "45 of 2025", w: "half" }),
      F("appealNo", "Appeal No. (if any)", { ph: "e.g. 12 of 2025 (Leave blank if none)", w: "half" }),
      F("client", "Plaintiff / Appellant Name(s) & Details", { def: "R. Shanmugam S/O Ramasamy" }),
      F("clientRole", "Petitioner / Appellant Role", { def: "Plaintiff / Appellant", w: "half" }),
      F("opponent", "Defendant / Respondent Name(s) & Details", { def: "M. Venkatesan S/O Murugesan" }),
      F("opponentRole", "Respondent Role", { def: "Defendant / Respondent", w: "half" }),
      F("accountOf", "To the Account of", { def: "the Plaintiff towards decree debt in O.S. No. 45 of 2025", w: "half" }),
      F("orderDate", "Under Decree / Order Dated (Day & Month / Year)", { def: "10th day of June 2025", w: "half" }),
      F("itemsTable", "Lodgment Entries (Format: Particulars | Person to make lodgment | Cash Rs. | Cash P. | Securities Rs. | Securities P.)", {
        area: true,
        def: "Decreetal amount deposited as per decree | M. Venkatesan (Defendant) | 50,000 | 00 | — | —"
      }),
      F("totalCashRs", "Total Cash (Rs.) [Leave blank to auto-calculate]", { def: "50,000", w: "half" }),
      F("totalCashP", "Total Cash (Paise)", { def: "00", w: "half" }),
      F("totalSecRs", "Total Securities (Rs.)", { def: "—", w: "half" }),
      F("totalSecP", "Total Securities (Paise)", { def: "—", w: "half" }),
      F("dated", "Dated line", { def: "15th day of July 2025", w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
    ],
    generate: (d) => {
      const lines = (d.itemsTable || "").split("\n").filter(Boolean);
      let calcCashRs = 0;
      let hasNumeric = false;

      const rows = lines.map((line) => {
        const parts = line.split("|").map((s) => s.trim());
        const cashRs = parts[2] || "—";
        const cashP = parts[3] || "—";
        const secRs = parts[4] || "—";
        const secP = parts[5] || "—";

        const cleanVal = cashRs.replace(/,/g, "");
        if (/^\d+(\.\d+)?$/.test(cleanVal)) {
          calcCashRs += parseFloat(cleanVal);
          hasNumeric = true;
        }

        return {
          particulars: parts[0] || "",
          lodger: parts[1] || "",
          cashRs,
          cashP,
          secRs,
          secP,
        };
      });

      const totals = {
        cashRs: d.totalCashRs || (hasNumeric ? calcCashRs.toLocaleString("en-IN") : "—"),
        cashP: d.totalCashP || (hasNumeric ? "00" : "—"),
        secRs: d.totalSecRs || "—",
        secP: d.totalSecP || "—",
      };

      const caseLine = d.appealNo
        ? `Original Suit No.: ${d.osNo || "____"}\nAppeal No.: ${d.appealNo}`
        : `Original Suit No.: ${d.osNo || "____"}`;

      return [
        { t: "small", v: "C. M. 10 — Rule No. 131, Form No. 37 — Civil Rule of Practice" },
        { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
        { t: "left", v: caseLine },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Plaintiff / Appellant"}` },
        { t: "versus", v: "AND" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Defendant / Respondent"}` },
        { t: "space" },
        { t: "title", v: "LODGMENT SCHEDULE" },
        { t: "para", v: `Schedule of lodgment to be made to the credit of the above suit to the account of ${d.accountOf || "________________"} under the decree / order dated the ${d.orderDate || "_____ day of ____________ 20___"}.` },
        { t: "lodgmentTable", rows, totals },
        { t: "para", v: "It is requested that an order for lodgment may be issued." },
        { t: "space" },
        { t: "left", v: `Dated the ${d.dated || "_____ day of ____________ 20___"}` },
        { t: "signblock", v: `Advocate\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}` },
      ];
    },
    generateCover: (d) => [
      { t: "right", v: "C. M. 10" },
      { t: "small", v: "Rule No. 131, Form No. 37\nCivil Rule of Practice" },
      { t: "space" },
      { t: "title", v: "LODGMENT SCHEDULE" },
      { t: "space" },
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Original Suit No.: ${d.osNo || "____"}${d.appealNo ? `\nAppeal No.: ${d.appealNo}` : ""}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Plaintiff / Appellant"}` },
      { t: "versus", v: "AND" },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Defendant / Respondent"}` },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}` },
    ],
  },
  {
    id: "ep_order21_rule11",
    name: "Execution Petition (Order 21 Rule 11)",
    sub: "Civil — Order XXI Rule 11 C.P.C. (நிறைவேற்று மனு — R.E.P.)",
    group: "Petitions",
    fields: [
      F("court", "Court Name (நீதிமன்றம்)", { def: "முதன்மை சார்பு நீதிமன்றம், சேலம்" }),
      F("place", "Place / District (ஊர்)", { def: "சேலம்", w: "half" }),
      F("repNo", "R.E.P. Number (மனு எண்)", { def: "      / 2025", w: "half" }),
      F("osNo", "O.S. Number (அசல்தவா எண்)", { def: "145 / 2023", w: "half" }),
      F("petitioner", "Petitioner / Decree Holder (மனுதாரர்/தீர்ப்பாணை பெற்றவர்)", { area: true, def: "ரா. சண்முகம், த/பெ. ராமசாமி, எண். 12, காந்தி ரோடு, சேலம்." }),
      F("respondent", "Respondent / Judgment Debtor (எதிர்மனுதாரர்/தீர்ப்புக் கடனாளி)", { area: true, def: "மு. வெங்கடேசன், த/பெ. முருகேசன், எண். 45, நேரு தெரு, சேலம்." }),
      F("decreeDate", "Date of Decree (டிகிரி தேதி)", { def: "15.06.2024", w: "half" }),
      F("appealDetails", "Appeal Particulars, if any (அப்பீல் விபரம்)", { def: "இல்லை", w: "half" }),
      F("adjustmentDetails", "Adjustment since Decree (பைசல் விபரம்)", { def: "இல்லை", w: "half" }),
      F("priorEpDetails", "Prior EP Applications (முந்தைய மனுக்கள் விபரம்)", { def: "இல்லை. இதுவே முதல் மனு.", w: "half" }),
      F("assignmentDetails", "Assignment & Insolvency Details (மேடோவர் / இன்சால்வென்சி)", { def: "இல்லை", w: "half" }),
      F("decreeAmountDue", "Amount due with Interest & Relief (வரவேண்டிய பாக்கித் தொகை & வட்டி)", { area: true, def: "அசல்தவா தொகையான ரூ. 1,00,000/- (ஒரு லட்சம்) மற்றும் அதற்கான வட்டி ஆண்டிற்கு 6% வீதம் டிகிரி தேதியிலிருந்து மனு தேதி வரை ரூ. 4,500/- ஆக மொத்தம் ரூ. 1,04,500/- வரவேண்டியது." }),
      F("costsAwarded", "Costs Awarded in Decree (டிகிரி செலவுத் தொகை)", { def: "ரூ. 6,850/-", w: "half" }),
      F("stampCost", "Stamp Fee (ஸ்டாம்ப் ரூ.)", { def: "50", w: "half" }),
      F("advCost", "Advocate Fee (வழக்கறிஞர் கட்டணம் ரூ.)", { def: "3,000", w: "half" }),
      F("processCost", "Process Fee (பிராசஸ் செலவு ரூ.)", { def: "150", w: "half" }),
      F("typingCost", "Typing Charges (தட்டச்சு கூலி ரூ.)", { def: "200", w: "half" }),
      F("againstWhom", "Against Whom or What Execution Sought (யார் பேரில் / எதன் பேரில்)", { area: true, def: "எதிர்மனுதாரர்/தீர்ப்புக் கடனாளி பேரில் மற்றும் கீழே கண்டுள்ள சொத்து விபரத்தின் பேரில்." }),
      F("prayer", "Relief and Prayer (பரிகாரமும் கோரிக்கையும்)", { area: true, def: "ஆகவே, இந்த கனம் நீதிமன்றத்தார் தயவு செய்து, கீழே சொத்து விபரத்தில் கண்டுள்ள எதிர்மனுதாரருக்கு பாத்தியப்பட்ட சொத்துக்களை உரிமையியல் நடைமுறைச் சட்டம் கட்டளை 21 விதி 54-ன் படி ஜப்தி செய்தும், கட்டளை 21 விதி 66-ன் படி பொது ஏலம் விட்டு, ஏலத் தொகையிலிருந்து மனுதாரருக்கு சேரவேண்டிய தொகை மற்றும் செலவுத் தொகையை பட்டுவாடா செய்து நீதி வழங்கும்படி மிகவும் பணிவுடன் பிரார்த்திக்கப்படுகிறது." }),
      F("propertySchedule", "Property Schedule (சொத்து விபரம்)", { area: true, def: "சேலம் மாவட்டம், சேலம் மேற்கு வட்டம், சூரமங்கலம் கிராமத்தில் உள்ள புன்செய் நிலம்:\nசர்வே எண்: 45/2B\nவிஸ்தீரணம்: 1,800 சதுர அடி நிலமும் அதில் கட்டப்பட்டுள்ள வீடும்.\nஎல்லைகள்:\nவடக்கு: ராமசாமி வீட்டு மனை\nதெற்கு: 20 அடி அகல பொதுப்பாதை\nகிழக்கு: முனுசாமி நிலம்\nமேற்கு: கந்தசாமி மனை\nஇவைகளுக்கு உட்பட்ட முழு சொத்தும்." }),
      F("verifyDate", "Verification Day (உறுதிமொழி தேதி)", { def: "15", w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
    ],
    generate: (d) => {
      const stamp = parseFloat((d.stampCost || "0").replace(/,/g, "")) || 0;
      const adv = parseFloat((d.advCost || "0").replace(/,/g, "")) || 0;
      const proc = parseFloat((d.processCost || "0").replace(/,/g, "")) || 0;
      const typing = parseFloat((d.typingCost || "0").replace(/,/g, "")) || 0;
      const totalCost = (stamp + adv + proc + typing).toLocaleString("en-IN");

      const costs = {
        stamp: d.stampCost || "50",
        advocate: d.advCost || "3,000",
        process: d.processCost || "150",
        typing: d.typingCost || "200",
        total: totalCost,
      };

      const rows = [
        { no: "1", title: "வியாஜ்ஜிய நெ", val: d.osNo ? `அசல்தவா எண். ${d.osNo}` : "" },
        {
          no: "2",
          title: "மனுதாரரின் பெயர் மற்றும் முகவரி",
          val: d.petitioner || "",
          subTitle: "எதிர்மனுதாரரின் பெயர் மற்றும் முகவரி",
          subVal: d.respondent || "",
        },
        { no: "3", title: "டிகிரி தேதி", val: d.decreeDate || "" },
        { no: "4", title: "டிகிரி பேரில் அப்பீல் செய்யப் பட்டிருந்தால் அதன் விபரம்", val: d.appealDetails || "இல்லை" },
        { no: "5", title: "டிகிரிக்கு பின்னிட்டு தரப்பினர் விவாத விஷயத்தைக் குறித்து ஏதாவது பைசலிருந்தால் அதுவும் அந்த பைசல் இன்னதென்பது", val: d.adjustmentDetails || "இல்லை" },
        { no: "6", title: "டிகிரியை நிறைவேற்றும் படி முன்னிட்டு ஏதாவது மனுக்கள் செய்யப்பட்டு இருந்தால் அதுவும் அந்த மனுக்கள் இன்னவை என்பதும் அதுகள் முடிந்த விபரமும்", val: d.priorEpDetails || "இல்லை" },
        { no: "6a", title: "டிக்கிரியை மேடோவர் செய்யப்பட்டிருந்தால் அந்த விவரமும் உபயவாதிகள் இன்சால்வெண்டு மனு தாக்கல் செய்திருந்தால் அந்த விபரமும்", val: d.assignmentDetails || "இல்லை" },
        { no: "7", title: "வட்டி ஏதாவது இருந்தால் அது சகிதமாய் டிக்கிரியின் பேரில் வரவேண்டிய பாக்கித் தொகை அல்லது பிரதி பலன் அல்லது அதனால் உண்டான வேறு பரிகாரம்", val: d.decreeAmountDue || "" },
        { no: "8", title: "ஏதாவது செலவுக்கு தீர்ப்பாயிருந்தால் அந்த செலவுத் தொகை", val: d.costsAwarded || "", costs },
        { no: "9", title: "யார் பேரில் அல்லது எதன் பேரில்", val: d.againstWhom || "" },
        { no: "10", title: "பரிகாரமும் கோரிக்கையும்", val: d.prayer || "" },
      ];

      return [
        { t: "center", v: `கனம் ${d.court || "நீதிமன்றம்"}` },
        { t: "left", v: `R.E.P. No. ${d.repNo || "    /2025"}\nin\nO.S. No. ${d.osNo || "    /20"}` },
        { t: "space" },
        { t: "party", v: d.petitioner || "________________", role: "...மனுதாரர் / தீர்ப்பாணை பெற்றவர்" },
        { t: "versus", v: "எதிர்" },
        { t: "party", v: d.respondent || "________________", role: "...எதிர்மனுதாரர் / தீர்ப்புக் கடனாளி" },
        { t: "space" },
        { t: "title", v: "மனுதாரர் உரிமையியல் நடைமுறைச் சட்டம் கட்டளை 21 விதி 11-ன் படிக்கு தாக்கல் செய்யும் நிறைவேற்று மனு" },
        { t: "epTable", rows, costs },
        { t: "signdual", left: "மனுதாரரின் வழக்கறிஞர்", right: "மனுதாரர்/தீர்ப்பாணை பெற்றவர்" },
        { t: "space" },
        { t: "para", v: `இதில் சொல்லப்பட்டிருப்பது எங்களுக்கு மிகவும் நன்றாய் தெரிந்திருக்கிற மட்டிலும் நம்பிக்கையுண்டாயிருக்கிற மட்டிலும் உண்மை என்று மனுதாரர்கள் ஆகிய நாங்கள் ${d.place || "சேலம்"}-ல் ${d.verifyDate || "      "}-ம் தேதியில் உறுதியாய் சொல்கிறேன்.` },
        { t: "right", v: "மனுதாரர்/தீர்ப்பாணை பெற்றவர்" },
        { t: "space" },
        { t: "title", v: "சொத்து விபரம்" },
        { t: "para", v: d.propertySchedule || "____________________________________" },
        { t: "right", v: "மனுதாரர்/வாதி" },
        { t: "space" },
        { t: "para", v: `இதில் சொத்து விபரங்கள் எனக்கு மிகவும் நன்றாய் தெரிந்திருக்கிற மட்டிலும் நம்பிக்கையுண்டாயிருக்கிற மட்டிலும் உண்மை என்று மனுதாரர் ஆகிய நான் ${d.place || "சேலம்"}-ல் ${d.verifyDate || "      "}-ம் தேதியில் உறுதியாய் சொல்கிறேன்.` },
        { t: "right", v: "மனுதாரர்/வாதி" },
      ];
    },
    generateCover: (d) => [
      { t: "center", v: `கனம் ${d.court || "நீதிமன்றம்"}` },
      { t: "left", v: `R.E.P. No. ${d.repNo || "    /2025"}\nin\nO.S. No. ${d.osNo || "    /20"}` },
      { t: "space" },
      { t: "party", v: d.petitioner || "________________", role: "...மனுதாரர் / தீர்ப்பாணை பெற்றவர்" },
      { t: "versus", v: "எதிர்" },
      { t: "party", v: d.respondent || "________________", role: "...எதிர்மனுதாரர் / தீர்ப்புக் கடனாளி" },
      { t: "space" },
      { t: "title", v: "மனுதாரர் உரிமையியல் நடைமுறைச் சட்டம்\nகட்டளை 21 விதி 11-ன் படிக்கு தாக்கல் செய்யும்\nநிறைவேற்று மனு" },
      { t: "space" },
      { t: "signblock", v: `மனுதாரரின் வழக்கறிஞர்:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}` },
    ],
  },
  {
    id: "prop_particulars_rule13",
    name: "Particulars of Immovable Property",
    sub: "Rule 13 C.R.P. / Order XXI Rule 13 C.P.C. (Valuation for Court Fees)",
    group: "Petitions",
    fields: [
      F("court", "Court Name (நீதிமன்றம்)", { def: "District Munsif Court, Pochampalli" }),
      F("caseType", "Case Type (e.g. O. S. No. / E. P. No. / R.E.P. No.)", { def: "O. S. No.", w: "half" }),
      F("caseNo", "Case Number & Year (e.g. 145 of 2025)", { def: "145 of 2025", w: "half" }),
      F("client", "Plaintiff / Decree Holder Name", { def: "Ravi kumar" }),
      F("clientRole", "Plaintiff Role", { def: "Plaintiff", w: "half" }),
      F("opponent", "Defendant / Judgment Debtor Name", { def: "Kiran & Others" }),
      F("opponentRole", "Defendant Role", { def: "Defendant", w: "half" }),
      F("subHeading", "Valuation Sub-Heading", { def: "Valuation of immovable property for Purposes of Court fees." }),
      F("propTable", "Particulars Table Rows (Format: Section of Act | Nature of suit | Annual revenue or rent payable | Market Value | Value for Purposes of Court fees)", {
        area: true,
        def: "Sec. 25(b) of T.N. Court Fees Act | Suit for Declaration of Title and Permanent Injunction | Rs. 45.00 (Kist) | Rs. 12,50,000/- | Rs. 6,25,000/- (Half of Market Value)\nSec. 27(c) of T.N. Court Fees Act | Permanent Injunction regarding Item 2 Land | — | Rs. 4,00,000/- | Rs. 1,000/- (Fixed Valuation)",
      }),
      F("propertySchedule", "Schedule / Description of Immovable Property (Order 21 Rule 13 / Rule 13 Particulars)", {
        area: true,
        def: "All that piece and parcel of punja land situated in Krishnagiri District, Pochampalli Taluk, Barur Village:\nSurvey No. 142/3A — Extent: 1.25 Acres (0.50.5 Hectares).\nFour Boundaries:\nNorth by : Murugesan's land\nSouth by : 20 feet East-West pathway\nEast by : Ramasamy's land\nWest by : Channel and Perumal's land\nTogether with all trees, well, motor pump-set, service connection and all easementary rights.",
      }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("counselLabel", "Counsel Designation", { def: "Counsel for Plaintiff", w: "half" }),
    ],
    generate: (d) => {
      const lines = (d.propTable || "").split("\n").filter(Boolean);
      const rows = lines.map((line) => {
        const parts = line.split("|").map((s) => s.trim());
        return {
          section: parts[0] || "",
          nature: parts[1] || "",
          revenue: parts[2] || "—",
          marketVal: parts[3] || "—",
          courtFeeVal: parts[4] || "—",
        };
      });

      return [
        { t: "titleTop", v: "PARTICULARS OF IMMOVABLE PROPERTY" },
        { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
        { t: "left", v: `${d.caseType || "O. S. No."} ${d.caseNo || "________ of 20____"}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Plaintiff"}` },
        { t: "versus", v: "— Versus —" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Defendant"}` },
        { t: "space" },
        { t: "center", v: d.subHeading || "Valuation of immovable property for Purposes of Court fees." },
        { t: "propValuationTable", rows },
        ...(d.propertySchedule && d.propertySchedule.trim() ? [
          { t: "space" },
          { t: "title", v: "DESCRIPTION OF IMMOVABLE PROPERTY" },
          { t: "para", v: d.propertySchedule },
        ] : []),
        { t: "space" },
        { t: "signblock", v: `${d.counselLabel || "Counsel for Plaintiff"}\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}` },
      ];
    },
    generateCover: (d) => [
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `${d.caseType || "O. S. No."} ${d.caseNo || "________ of 20____"}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Plaintiff"}` },
      { t: "versus", v: "— Versus —" },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Defendant"}` },
      { t: "space" },
      { t: "title", v: "PARTICULARS OF IMMOVABLE\nPROPERTY\n(Valuation for Court Fees / Rule 13)" },
      { t: "space" },
      { t: "signblock", v: `By Counsel:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}` },
    ],
  },
  {
    id: "bill_of_costs",
    name: "Bill of Costs (கொடுத்த செலவு ஜாப்தா)",
    sub: "Form No. 187, Rule No. 190 — Civil Rules of Practice",
    group: "Petitions",
    fields: [
      F("court", "Court Name (நீதிமன்றம்)", { def: "முதன்மை மாவட்ட உரிமையியல் நீதிமன்றம், போச்சம்பள்ளி" }),
      F("year", "Year (ஆண்டு)", { def: "2025", w: "half" }),
      F("caseType", "Case Type (வழக்கு வகை)", { def: "அசல்தவா", w: "half" }),
      F("caseNo", "Case Number (வழக்கு எண்)", { def: "145 / 2024", w: "half" }),
      F("client", "Plaintiff / Winning Party (வாதி)", { def: "ரா. சண்முகம்" }),
      F("clientRole", "Client Role (தரப்பு)", { def: "வாதி", w: "half" }),
      F("opponent", "Defendant / Losing Party (பிரதிவாதி)", { def: "மு. வெங்கடேசன்" }),
      F("opponentRole", "Opponent Role (எதிர்தரப்பு)", { def: "பிரதிவாதி", w: "half" }),
      F("filedBy", "Bill Filed On Behalf Of (ஜாப்தா சமர்ப்பிப்பது)", { def: "வாதி", w: "half" }),
      F("cost1_plaint", "1. பிராது ஸ்டாம்பு (Plaint Stamp Rs.)", { def: "1,500", w: "half" }),
      F("cost2_vakalat", "2. வக்காலத்து நாமா ஸ்டாம்பு (Vakalat Stamp Rs.)", { def: "30", w: "half" }),
      F("cost3_docs", "3. தஸ்தாவேஜுகளுக்கு ஸ்டாம்பு (Documents Stamp Rs.)", { def: "50", w: "half" }),
      F("cost4_adv", "4. வக்கீல் பீஸ் (Advocate Fee Rs.)", { def: "5,000", w: "half" }),
      F("cost5_process", "5. புரோசஸ் கட்டணம் (Process Fee Rs.)", { def: "150", w: "half" }),
      F("cost6_app", "6. விண்ணப்பம் செலவு (Application Cost Rs.)", { def: "100", w: "half" }),
      F("cost7_penalty", "7. ஸ்டாம்பு டூடி & பெனால்டி (Stamp Duty & Penalty Rs.)", { def: "0", w: "half" }),
      F("cost8_trans", "8. தர்ஜமா செலவு (Translation Cost Rs.)", { def: "0", w: "half" }),
      F("cost9_witness", "9. சாக்ஷிகளுக்கு செலவிட்ட பத்தா (Witness Batty Rs.)", { def: "500", w: "half" }),
      F("cost10_comm", "10. கமிஷன் செலவு (Commission Cost Rs.)", { def: "0", w: "half" }),
      F("cost11_copy", "11. நகல் செலவு (Copy Application Rs.)", { def: "250", w: "half" }),
      F("cost12_record", "12. சர்க்கார் ரிக்கார்டு தருவித்த செலவு (Govt Record Rs.)", { def: "0", w: "half" }),
      F("cost13_order", "13. கோர்ட்டாரால் உத்திரவான செலவு (Court Ordered Cost Rs.)", { def: "0", w: "half" }),
      F("cost14_notice", "14. நோட்டீஸ் செலவு (Notice Cost Rs.)", { def: "1,000", w: "half" }),
      F("cost15_process2", "15. புரோசஸ் (Process Charges Rs.)", { def: "100", w: "half" }),
      F("cost16_typing", "16. எழுத்துக்கூலி (Typing Charges Rs.)", { def: "300", w: "half" }),
      F("creditCosts", "Credit Costs Allowed to Opponents (கழிவுத்தொகை)", { def: "0", w: "half" }),
      F("advocateFeeWords", "Advocate Fee in Words (கட்டணம் எழுத்தால்)", { def: "Five Thousand Rupees only", w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Address for Service", { def: ADVOCATE_DEFAULTS.advocateAddress }),
      F("date", "Date", { def: today(), w: "half" }),
    ],
    generate: (d) => {
      const items = [
        { no: 1, title: "பிராது ஸ்டாம்பு", val: d.cost1_plaint || "0" },
        { no: 2, title: "வக்காலத்து நாமா ஸ்டாம்பு", val: d.cost2_vakalat || "0" },
        { no: 3, title: "தஸ்தாவேஜுகளுக்கு ஸ்டாம்பு", val: d.cost3_docs || "0" },
        { no: 4, title: "வக்கீல் பீஸ்", sub: "ரூபாயின் பேரில்", val: d.cost4_adv || "0" },
        { no: 5, title: "புரோசஸ் கட்டணம்", val: d.cost5_process || "0" },
        { no: 6, title: "விண்ணப்பம் செலவு", val: d.cost6_app || "0" },
        { no: 7, title: "ஸ்டாம்பு டூடி & பெனால்டி", val: d.cost7_penalty || "0" },
        { no: 8, title: "தர்ஜமா செலவு", val: d.cost8_trans || "0" },
        { no: 9, title: "சாக்ஷிகளுக்கு செலவிட்ட பத்தா", val: d.cost9_witness || "0" },
        { no: 10, title: "கமிஷன் செலவு", val: d.cost10_comm || "0" },
        { no: 11, title: "நகல் செலவு", val: d.cost11_copy || "0" },
        { no: 12, title: "சர்க்கார் ரிக்கார்டு தருவித்த செலவு", val: d.cost12_record || "0" },
        { no: 13, title: "கோர்ட்டாரால் உத்திரவான செலவு", val: d.cost13_order || "0" },
        { no: 14, title: "நோட்டீஸ் செலவு", val: d.cost14_notice || "0" },
        { no: 15, title: "புரோசஸ்", val: d.cost15_process2 || "0" },
        { no: 16, title: "எழுத்துக்கூலி", val: d.cost16_typing || "0" },
      ];

      const parseNum = (v) => parseFloat(String(v || "0").replace(/,/g, "").trim()) || 0;
      let totalNum = 0;
      items.forEach((it) => {
        totalNum += parseNum(it.val);
      });
      const creditNum = parseNum(d.creditCosts || "0");
      const balanceNum = Math.max(0, totalNum - creditNum);

      const totalCosts = totalNum.toLocaleString("en-IN");
      const creditCosts = creditNum.toLocaleString("en-IN");
      const balanceClaimed = balanceNum.toLocaleString("en-IN");

      return [
        { t: "center", v: `கனம் ${d.court || "நீதிமன்றம்"} சமூகத்திற்கு` },
        { t: "left", v: `${d.year || "2025"}-ம் ளு    ${d.caseType || "அசல்தவா"} நெ. ${d.caseNo || "    "}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "வாதி"}` },
        { t: "versus", v: "எதிர்" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "பிரதிவாதி"}` },
        { t: "space" },
        { t: "signdual", left: `${d.filedBy || "வாதி"}`, right: "வணக்கமாய் ஒப்புவித்த சிலவு ஜாப்தா" },
        {
          t: "billOfCostsTable",
          items,
          totalCosts,
          creditCosts,
          balanceClaimed,
          advocateCert: `I hereby certify that I have received from the above named ${d.client || "________________"} in the above suit not less than the legal fee prescribed by law viz. Rupees ${d.advocateFeeWords || (d.cost4_adv ? d.cost4_adv + " Rupees only" : "________________")}.`,
          filedBy: d.filedBy || "வாதி",
          date: d.date || today(),
        },
      ];
    },
    generateCover: (d) => [
      { t: "small", v: "Form No. 187, Rule No. 190\nBill of Costs" },
      { t: "space" },
      { t: "center", v: `கனம் ${d.court || "நீதிமன்றம்"}` },
      { t: "left", v: `${d.year || "2025"}-ம் ளு    ${d.caseType || "அசல்தவா"} நெ. ${d.caseNo || "    "}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole || "வாதி"}` },
      { t: "versus", v: "எதிர்" },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "பிரதிவாதி"}` },
      { t: "space" },
      { t: "title", v: "கொடுத்த செலவு ஜாப்தா" },
      { t: "space" },
      { t: "signblock", v: `வக்கீல்: ${d.advocate || ADVOCATE_DEFAULTS.advocateName}\nAddress for Service:\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}\n\nPresented by: Counsel for ${d.filedBy || "வாதி"}` },
    ],
  },
  {
    id: "form14_certified_copy",
    name: "Form No. 14 Rule 24-A Certified Copies (கொடுத்த நகல் மனு)",
    sub: "Form No. 14, Rule No. 24-A — Application for Certified Copies",
    group: "Petitions",
    fields: [
      F("court", "Court Name (நீதிமன்றம்)", { def: "டிஸ்டிரிக்ட்டு முன்சீப்" }),
      F("caseType", "Case Type (வழக்கு வகை)", { def: "அசல் வழக்கு", w: "half" }),
      F("caseNo", "Case Number (வழக்கு எண்)", { def: "145 / 2024", w: "half" }),
      F("client", "Applicant / Party Name (மனுதாரர் / வாதி)", { def: "ரா. சண்முகம்", w: "half" }),
      F("clientRole", "Party Role (தரப்பு)", { def: "வாதி", w: "half" }),
      F("opponent", "Opponent / Respondent Name (எதிர்மனுதாரர் / பிரதிவாதி)", { def: "மு. வெங்கடேசன்", w: "half" }),
      F("opponentRole", "Opponent Role (எதிர்தரப்பு)", { def: "பிரதிவாதி", w: "half" }),
      F("copyType", "Copy Type (தயார் வகை)", { def: "சாதாரண நகல் (Ordinary)", w: "half" }),
      F("tamilDate", "Tamil Date (ளு மீ உ)", { def: "2025-ம் ளு    அக்டோபர் மீ    3 உ", w: "half" }),
      F("docsTable", "Documents Requested (லக்கம் | தாக்கலான தேதி | தஸ்தாவேசு தேதி | தஸ்தாவேசு விபரம் | உத்திரவின் விபரம்)", {
        area: true,
        def: "1 | 15-03-2024 | 15-03-2024 | பிராது (Plaint) | வழக்கில் பார்வைக்காக\n2 | 10-06-2024 | 10-06-2024 | கிரயப்பத்திரம் (Sale Deed Ex.A1) | சான்றளிக்கப்பட்ட நகல் தேவை\n3 | 20-01-2025 | 20-01-2025 | தீர்ப்பு மற்றும் தீர்ப்பாணை (Judgment & Decree) | மேல்முறையீடு செய்ய"
      }),
      F("enclosure", "Enclosure (இணைப்பு)", { def: "கோர்ட்டு கட்டண ஸ்டாம்புகள் மற்றும் நகல் தாள்கள்", w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Address for Service", { def: ADVOCATE_DEFAULTS.advocateAddress }),
      F("date", "Date", { def: today(), w: "half" }),
    ],
    generate: (d) => {
      const lines = (d.docsTable || "").split("\n").filter(Boolean);
      const rows = lines.map((line, idx) => {
        const parts = line.split("|").map((s) => s.trim());
        return {
          sno: parts[0] || String(idx + 1),
          filedDate: parts[1] || "",
          docDate: parts[2] || "",
          desc: parts[3] || "",
          purpose: parts[4] || "",
        };
      });

      return [
        { t: "small", v: "Form No. 14, Rule No. 24-A — Civil Rules of Practice\nApplication for Certified Copies" },
        { t: "right", v: `${d.court ? d.court : "டிஸ்டிரிக்ட்டு"} கோர்ட்டாரவர்கள் சமூகத்திற்கு` },
        { t: "left", v: `${d.caseType ? d.caseType + " " : ""}நெ. ${d.caseNo || "    /20"}` },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "வாதி"}` },
        { t: "versus", v: "எதிர்" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "பிரதிவாதி"}` },
        { t: "space" },
        { t: "left", v: `${d.clientRole || "வாதி"} வணக்கமாய் எழுதிக்கொண்ட நகல் மனு:` },
        { t: "para", v: "அடியில்கண்ட ரிக்கார்டு அல்லது தஸ்தாவேசுகளுக்கு சர்டிபைட் காபி செய்து கொடுக்க கோருகிறேன்." },
        { t: "right", v: `தயார் வகை: ${d.copyType || "சாதாரண நகல் (Ordinary)"}` },
        {
          t: "caForm14Table",
          rows,
        },
        { t: "space" },
        {
          t: "signdual",
          left: d.tamilDate ? `${d.tamilDate}\nதேதி: ${d.date || today()}` : `      ளு          மீ          உ\nதேதி: ${d.date || today()}`,
          right: `Advocate for ${d.clientRole || "வாதி"}\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}`,
        },
      ];
    },
    generateCover: (d) => [
      { t: "small", v: "Form No. 14, Rule No. 24-A\nApplication for Certified Copies" },
      { t: "space" },
      { t: "center", v: `டி. ${d.court || "டிஸ்டிரிக்ட்டு"} கோர்ட்டு` },
      { t: "left", v: `${d.caseType ? d.caseType + " " : ""}நெ. ${d.caseNo || "    /20"}` },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole || "வாதி"}` },
      { t: "space" },
      { t: "title", v: "கொடுத்த நகல் மனு" },
      { t: "space" },
      {
        t: "signblock",
        v: `வக்கீல்:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nசெல்: ${d.phone || ADVOCATE_DEFAULTS.phone}\n\nEnclosure:\n${d.enclosure || "1. கோர்ட்டு கட்டண ஸ்டாம்புகள் / நகல் தாள்கள்"}\n\nPresented by: Counsel for ${d.clientRole || "வாதி"}`
      },
    ],
  },
  {
    id: "judicial_form46_suretyship",
    name: "Application for Suretyship (Judicial Form No. 46)",
    sub: "Judicial Form No. 46 (See Rule 14(4)) — Criminal Rules of Practice",
    group: "Bail & Sureties",
    fields: [
      F("court", "Court Name", { def: "Judicial Magistrate Court, Pochampalli" }),
      F("mpNo", "Miscellaneous Petition No.", { def: "12 / 2025", w: "half" }),
      F("caseType", "Case Type (C.C. / Cr. / S.T.C. / Case No.)", { def: "C.C.", w: "half" }),
      F("caseNo", "Case Number", { def: "145 / 2024", w: "half" }),
      F("policeStation", "Police Station / Complainant", { def: "Pochampalli P.S.", w: "half" }),
      F("accused", "Accused Name", { def: "Ravi kumar", w: "half" }),
      F("accusedNo", "Accused No. (e.g. A-1)", { def: "A-1", w: "half" }),
      F("chargedSection", "Charged under Section", { def: "379 IPC / 303(2) B.N.S.", w: "half" }),
      F("bailAmount", "Bail Amount (Rs.)", { def: "10,000", w: "half" }),
      F("bailAmountWords", "Bail Amount in Words", { def: "Ten Thousand Rupees only", w: "half" }),
      F("numSureties", "Number of Sureties", { def: "two", w: "half" }),
      F("bailJudge", "Bail Ordered by Judge / Magistrate", { def: "Judicial Magistrate, Pochampalli", w: "half" }),
      F("bailDate", "Date of Bail Order", { def: today(), w: "half" }),

      // 2. Personal Particulars of Surety
      F("suretyName", "Full Name of the Surety", { def: "K. Ramesh Babu" }),
      F("suretyParent", "Father's / Husband's Name (S/o, W/o, D/o)", { def: "K. Srinivasan", w: "half" }),
      F("suretyQual", "Qualification, if any", { def: "B.Com. Graduate", w: "half" }),
      F("suretyAddress", "Full Residential Address", { def: "Door No. 12, Gandhi Nagar, Pochampalli, Krishnagiri District - 635206" }),
      F("residencePeriod", "Period Residing at Above Address", { def: "15 Years", w: "half" }),
      F("rentPaid", "Rent Paid for Residence (or Nil if own)", { def: "Nil (Own House)", w: "half" }),
      F("rentBillName", "Rent Bill / Property Tax Receipt in Surety's Name", { def: "Yes, Property Tax Receipt Assessment No. 4521 stands in Surety's Name" }),

      // B. Occupation / Business
      F("occupation", "Occupation or Business", { def: "Self-Employed / Retail Merchant", w: "half" }),
      F("businessAddress", "Full Business Address", { def: "Door No. 4, Bazaar Street, Pochampalli", w: "half" }),
      F("businessNature", "Nature & Extent of Business & Share", { def: "Retail Grocery Store, Sole Proprietor (100% share)" }),
      F("businessRent", "Rent Paid for Place of Business", { def: "Rs. 4,000/- per month", w: "half" }),
      F("businessTaxName", "Business Rent / Tax Receipt in Surety's Name", { def: "Yes, Rent Agreement stands in Surety's name", w: "half" }),

      // C. Service
      F("employerName", "Name & Address of Employer (if in Service)", { def: "Not Applicable / Self-Employed" }),
      F("placeOfService", "Full Address of Place of Service", { def: "Not Applicable", w: "half" }),
      F("monthlyPay", "Monthly Pay & Allowances Drawn", { def: "Monthly Income approx Rs. 35,000/-", w: "half" }),
      F("serviceLength", "Length of Service with Employer", { def: "Not Applicable", w: "half" }),
      F("providentFund", "Amount of Provident Fund at Credit", { def: "Nil", w: "half" }),

      // D. House Property
      F("houseProperty", "Full Particulars of House Property Owned, Location, Value, Encumbrances", {
        area: true,
        def: "Own Residential RCC Terraced House at Door No. 12, Gandhi Nagar, Pochampalli, Krishnagiri Dist. Market Value approx Rs. 20,00,000/-. Sole owner, free from all encumbrances."
      }),

      // E. Income Tax & Banking
      F("incomeTaxPaid", "Income Tax Paid during each of last 3 years", { def: "A.Y. 2022-23: Rs. 12,000; A.Y. 2023-24: Rs. 14,500; A.Y. 2024-25: Rs. 15,200" }),
      F("bankAccounts", "Banking Accounts, if any", { def: "State Bank of India, Pochampalli Branch, S.B. A/c No. 30894561234", w: "half" }),
      F("bankBalance", "Amounts Lying in Banking Account", { def: "Rs. 65,000/-", w: "half" }),

      // F. Relationship & Antecedents
      F("knownAccusedPeriod", "Length of Time Known Accused Personally", { def: "12 Years", w: "half" }),
      F("relatedAccused", "Whether Related to Accused, if so How?", { def: "Family Friend and Neighbor", w: "half" }),
      F("stoodSuretyDetails", "Stood Surety for other accused / Court & Case details / Pending or Concluded", { def: "No, have not stood surety for any other accused earlier." }),
      F("suretyRejected", "Whether any earlier Suretyship Application Rejected", { def: "No", w: "half" }),
      F("civilLitigation", "Involved in Any Civil Litigation", { def: "No", w: "half" }),
      F("accusedLitigation", "Concerned in Any Case as an Accused Person", { def: "No", w: "half" }),
      F("otherParticulars", "Any Other Particulars regarding status/assets", { def: "Aadhaar Card, Bank Passbook, and Property Tax Receipt produced herewith." }),

      // 3. Proof & Declaration
      F("idProofType", "Identity Document (Rule 14(4))", { def: "Aadhaar Card / Voter ID Card / PAN Card", w: "half" }),
      F("idProofNo", "Identity Document No.", { def: "XXXX-XXXX-1234", w: "half" }),
      F("otherProof", "Other Proof Documents Produced", { def: "Family Ration Card, Property Tax Receipt, Bank Passbook", w: "half" }),
      F("priorSuretyDecl", "Prior Surety Declaration", { def: "not stood surety before for any other", w: "half" }),

      // Verification & Counsel
      F("place", "Place of Affirmation", { def: "Pochampalli", w: "half" }),
      F("date", "Date of Affirmation", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Advocate Bar Council No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
    ],
    generate: (d) => {
      const particulars = [
        { section: "A. Personal Particulars of the Surety", isHeader: true },
        { q: "Full name of the Surety", a: `${d.suretyName || "________________"} (S/o, W/o, D/o: ${d.suretyParent || "________________"})` },
        { q: "Qualification, if any", a: d.suretyQual || "Nil" },
        { q: "Full residential address", a: d.suretyAddress || "________________" },
        { q: "Period for which Surety has been residing at the above address", a: d.residencePeriod || "—" },
        { q: "Rent paid for the residence", a: d.rentPaid || "Nil (Own House)" },
        { q: "Whether the rent bill / property tax receipt of the residence stands in the Surety's Name", a: d.rentBillName || "Yes" },

        { section: "B. Occupation or Business", isHeader: true },
        { q: "Occupation or business", a: d.occupation || "—" },
        { q: "Full business Address", a: d.businessAddress || "Nil" },
        { q: "Nature and extent of business and Surety's share therein", a: d.businessNature || "Nil" },
        { q: "Rent paid for the place of Business", a: d.businessRent || "Nil" },
        { q: "Whether the rent bill / property tax receipt of the place of business stands in the Surety's name", a: d.businessTaxName || "Nil" },

        { section: "C. Employment / Service", isHeader: true },
        { q: "Name and address of the employer, if the Surety is in Service", a: d.employerName || "Nil / Not in service" },
        { q: "Full address of the Place of Service", a: d.placeOfService || "Nil" },
        { q: "Amount of Monthly pay and allowances drawn", a: d.monthlyPay || "Nil" },
        { q: "Length of service with the employer", a: d.serviceLength || "Nil" },
        { q: "Amount of Provident Fund; if any at Surety's credit", a: d.providentFund || "Nil" },

        { section: "D. House Property Owned", isHeader: true },
        { q: "Full particulars of house property owned, if any, its location, ratable value and the Surety's share or interest therein and whether it is in any way encumbered", a: d.houseProperty || "Nil" },

        { section: "E. Income Tax & Banking Accounts", isHeader: true },
        { q: "Amount of Income Tax paid during each of the last three years", a: d.incomeTaxPaid || "Nil" },
        { q: "Banking accounts, if any", a: d.bankAccounts || "Nil" },
        { q: "Amounts now lying in each Banking Account", a: d.bankBalance || "Nil" },

        { section: "F. Relationship & Antecedents", isHeader: true },
        { q: "Length of time for which the Surety has known the accused personally", a: d.knownAccusedPeriod || "—" },
        { q: "Whether the surety is related to the Accused, if so, how?", a: d.relatedAccused || "No" },
        { q: "Whether the Surety has stood Surety for them; the Court and the number of the case against those accused; and whether the case or cases against those persons are pending or have concluded", a: d.stoodSuretyDetails || "No" },
        { q: "Whether the Surety has, at any time made an application for Suretyship which was rejected, if so, give the particulars thereof", a: d.suretyRejected || "No" },
        { q: "Whether the surety is (or has been) Involved in any Civil litigation", a: d.civilLitigation || "No" },
        { q: "Whether the surety himself has been concerned in any case as an accused person, if, so, give particulars of the case", a: d.accusedLitigation || "No" },

        { section: "G. Other Particulars", isHeader: true },
        { q: "Any other particulars in regard to the status of the Surety or his income and assets which the surety may desire to give", a: d.otherParticulars || "Nil" },
      ];

      return [
        { t: "small", v: "Judicial Form No. 46\n(See Rule 14(4)) — Criminal Rules of Practice\nAPPLICATION FOR SURETYSHIP" },
        { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
        { t: "left", v: `Miscellaneous Petition No. ${d.mpNo || "       "}/20   in   ${d.caseType || "CC / Cr / STC / Case"} No. ${d.caseNo || "       "}/20` },
        { t: "space" },
        { t: "party", v: `State rep. by Inspector of Police,\n${d.policeStation || "________________ Police Station"}`, role: "...Complainant" },
        { t: "versus", v: "VS." },
        { t: "party", v: `${d.accused || "________________"}`, role: "...Accused" },
        { t: "space" },
        { t: "para", v: `I, ${d.suretyName || "________________"}, S/o, W/o, D/o ${d.suretyParent || "________________"}, do hereby solemnly affirm and state as follows :` },
        { t: "para", v: `1) I beg to offer myself as a surety for Accused No. ${d.accusedNo || "A-1"}, ${d.accused || "________________"}, who is charged under Section ${d.chargedSection || "________________"} and who has been ordered to be released on bail in the sum of Rs. ${d.bailAmount || "_______"}/- (Rupees ${d.bailAmountWords || "________________"}) with the ${d.numSureties || "two"} Surety / Sureties in the like amount, by the Judge / Magistrate ${d.bailJudge || "________________"} on ${d.bailDate || "_______ 20___"}.` },
        { t: "left", v: "2) I give below certain particulars concerning myself :" },
        {
          t: "form46ParticularsTable",
          items: particulars,
        },
        { t: "space" },
        { t: "para", v: `3. I produce the following proof in support of my statements and give particulars of the same as below:\n\nRent bills of place of residence, Ration Card, Rent bills of place of business.\nDeed of partnership or other documents relating to business, Certificate from the employer, Certificate of amount in the Provident fund, Title Deeds of properties, Municipality / Panchayat bills of the properties, Bank Pass Books, Income Tax payment receipts.\n\nOther Proof : ${d.otherProof || "Ration Card, Property Tax Receipt, Bank Passbook"}` },
        { t: "para", v: `3 A. As per sub-rule (4) of Rule 14, I produce one of the following documents mentioned below:\ni) Passport\nii) Identity Card issued by the Election Commission of India.\niii) Permanent Account Number Card ie. PAN Card issued by the Income Tax Department.\niv) ATM / Debit Card or Credit Card issued by any Nationalized or Private Bank of standing at the National Level, having photograph of the holder thereon may be accepted in conjunction with any other authentic document like telephone bill or electric bill proof of residential Address.\nv) Identity Card issued by the Government Authorities or the Public Statutory corporations.\nvi) Any such document which is ordinarily issued by an Authority after due verification of the identity of the person and his address which the Judge or the Magistrate may think just and proper, in the interest of justice, by recording specific reason.\n\nIdentity Document Produced: ${d.idProofType || "Voter ID Card / Aadhaar Card / PAN Card"} (No. ${d.idProofNo || "________________"})` },
        { t: "para", v: "3. B. As per sub-rule (6) of Rule 14, I produce two copies of my latest Passport size Photograph." },
        { t: "para", v: `4. I hereby declare that I have ${d.priorSuretyDecl || "not stood surety before / stood surety for"} person (give all the relevant particulars).` },
        { t: "para", v: `5. I pray that I may be accepted as a Surety for the above mentioned accused in the sum of Rs. ${d.bailAmount || "_______"}/- (Rupees ${d.bailAmountWords || "________________"}).` },
        { t: "space" },
        { t: "right", v: `Signature of Surety\n(${d.suretyName || "Surety"})` },
        { t: "space" },
        {
          t: "left",
          v: `Solemnly affirmed at ${d.place || "Pochampalli"} this ${d.date || today()}.\n\nIdentified by:\n\nBefore me:\n\n(Signature of Surety Advocate)\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\nEnrolment No.: ${d.barNo || ADVOCATE_DEFAULTS.enrolNo}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}`,
        },
      ];
    },
    generateCover: (d) => [
      { t: "small", v: "Judicial Form No. 46\n(See Rule 14(4)) — Criminal Rules of Practice" },
      { t: "space" },
      { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
      { t: "left", v: `Miscellaneous Petition No. ${d.mpNo || "       "}/20   in   ${d.caseType || "C.C."} No. ${d.caseNo || "       "}/20` },
      { t: "space" },
      { t: "party", v: `State represented by Inspector of Police,\n${d.policeStation || "Police Station"}`, role: "...Complainant" },
      { t: "versus", v: "VS." },
      { t: "party", v: `${d.accused || "________________"}`, role: "...Accused" },
      { t: "space" },
      { t: "title", v: "APPLICATION FOR SURETYSHIP\n(JUDICIAL FORM NO. 46)" },
      { t: "space" },
      { t: "left", v: `Surety Name: ${d.suretyName || "________________"}\nSurety for: Accused No. ${d.accusedNo || "A-1"} (${d.accused || ""})\nBail Amount: Rs. ${d.bailAmount || "_______"}/-` },
      { t: "space" },
      {
        t: "signblock",
        v: `Advocate for Surety:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nEnrol No.: ${d.barNo || ADVOCATE_DEFAULTS.enrolNo}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}`,
      },
    ],
  },
  {
    id: "xerox_memo",
    name: "Xerox Memo",
    sub: "Xerox Memo Filed by Petitioner / Respondent for Copy Charges",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "In the Court of the District Judge / Sub Judge / District Munsif / J. M." }),
      F("courtNo", "Court / Chamber No. (if any)", { def: "No. I", w: "half" }),
      F("place", "Place / Station", { def: "SALEM", w: "half" }),
      F("caNo", "C. A. No. (Copy Application Number)", { def: "124 / 2025", w: "half" }),
      F("caseType", "Case Type (O.S. / M.C.O.P. / C.C. / Case)", { def: "O. S. / MCOP.", w: "half" }),
      F("caseNo", "Case Number", { def: "145 / 2024", w: "half" }),
      F("client", "Petitioner Name", { def: "Ravi kumar", w: "half" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner / Plaintiff", w: "half" }),
      F("opponent", "Respondent Name", { def: "State represented by Inspector of Police", w: "half" }),
      F("opponentRole", "Respondent Role", { def: "Respondent / Defendant", w: "half" }),
      F("filedBy", "Memo Filed By", { def: "THE PETITIONER", w: "half" }),
      F("courtFeeAmount", "Court Fee Amount for Xerox (Rs.)", { def: "150", w: "half" }),
      F("courtFeeWords", "Court Fee in Words", { def: "One Hundred and Fifty Rupees only", w: "half" }),
      F("docDetails", "Documents Requested for Xerox Copy", { def: "Certified Copies of Plaint, Written Statement, and Judgment & Decree" }),
      F("date", "Date", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
    ],
    generate: (d) => {
      const courtLine = `${d.court || "In the Court of the District Judge / Sub Judge / District Munsif / J. M."}${d.courtNo ? " " + d.courtNo : ""}, ${d.place || "SALEM"}.`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        { t: "left", v: `C. A. No. ${d.caNo || "          / 20"}\n----------------------------------------\n${d.caseType || "O. S. / MCOP."} No. ${d.caseNo || "          / 20"}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioner"}` },
        { t: "versus", v: "Versus" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondent"}` },
        { t: "space" },
        { t: "title", v: `XEROX MEMO FILED BY ${up(d.filedBy || "THE PETITIONER")}` },
        { t: "space" },
        {
          t: "para",
          v: `The ${d.filedBy || "Petitioner"} is herewith affixing a Court fee for sum of Rs. ${d.courtFeeAmount || "_______"} /- (${d.courtFeeWords || "________________"}) towards the Xerox charges${d.docDetails ? " for obtaining copies of " + d.docDetails : ""}.`,
        },
        { t: "space" },
        {
          t: "sign",
          place: d.place || "Salem",
          date: d.date || today(),
          label: `COUNSEL FOR ${up(d.filedBy || "PETITIONER")}\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}`,
        },
      ];
    },
    generateCover: (d) => {
      const courtLine = `${d.court || "In the Court of the District Judge /\nSub Judge / District Munsif / J. M."}${d.courtNo ? " " + d.courtNo : ""}.\n${d.place || "SALEM"}.`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        { t: "left", v: `C. A. No. ${d.caNo || "          / 20"}\n----------------------------------------\n${d.caseType || "O. S. / MCOP."} No. ${d.caseNo || "          / 20"}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioner"}` },
        { t: "versus", v: "Versus" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondent"}` },
        { t: "space" },
        { t: "title", v: `XEROX MEMO FILED BY\n${up(d.filedBy || "THE PETITIONER")}` },
        { t: "space" },
        {
          t: "signblock",
          v: `By Counsel:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nEnrol No.: ${d.barNo || ADVOCATE_DEFAULTS.enrolNo}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}`,
        },
      ];
    },
  },
  {
    id: "notice_to_other_side",
    name: "Notice Given to Other Side",
    sub: "Notice to Opposite Counsel in I.A. for Filing Counter",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "District Munsif Court, Pochampalli" }),
      F("iaNo", "I. A. No.", { def: "12", w: "half" }),
      F("iaYear", "I. A. Year", { def: "2025", w: "half" }),
      F("mainCaseType", "Main Case Type (O. S. / MCOP / HMOP)", { def: "O. S.", w: "half" }),
      F("caseNo", "Main Case No.", { def: "145", w: "half" }),
      F("caseYear", "Main Case Year", { def: "2024", w: "half" }),
      F("client", "Petitioner Name", { def: "Ravi kumar", w: "half" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner / Plaintiff", w: "half" }),
      F("opponent", "Respondent Name", { def: "V. Suresh", w: "half" }),
      F("opponentRole", "Respondent Role", { def: "Respondent / Defendant", w: "half" }),
      F("oppCounsel", "Opposite Counsel Name", { def: "M. K. Senguttuvan", w: "half" }),
      F("oppParty", "Opposite Counsel For", { def: "Respondent / Defendant", w: "half" }),
      F("hearingDate", "Posted Date for Counter", { def: "15-10-2025", w: "half" }),
      F("date", "Date of Notice", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
    ],
    generate: (d) => [
      { t: "center", v: `In the Court of the ${d.court || "________________________"}` },
      { t: "space" },
      {
        t: "center",
        v: `I. A. No.  ${d.iaNo || "       "}  of  ${d.iaYear || "2025"}\nin\n${d.mainCaseType || "No."}  ${d.caseNo || "       "}  of  ${d.caseYear || "2024"}`,
      },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioner"}` },
      { t: "versus", v: "-Vs-" },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondent"}` },
      { t: "space" },
      { t: "title", v: "NOTICE GIVEN TO OTHER SIDE" },
      { t: "space" },
      {
        t: "left",
        v: `To\n    Sri ${d.oppCounsel || "________________"},\n    Advocate for ${d.oppParty || "Respondent / Defendant"}`,
      },
      { t: "space" },
      {
        t: "para",
        v: `Sir,\n    Please take notice that the above I. a. is posted to ${d.hearingDate || "________________"} for filing your counter. A copy of the affidavit and petition were already given to you.`,
      },
      { t: "space" },
      {
        t: "signdual",
        left: `Date : ${d.date || today()}`,
        right: `Counsel for Petitioner\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}`,
      },
    ],
    generateCover: (d) => [
      { t: "center", v: `In the Court of the ${d.court || "________________________"}` },
      { t: "space" },
      {
        t: "center",
        v: `I. A. No.  ${d.iaNo || "       "}  of  ${d.iaYear || "2025"}\nin\n${d.mainCaseType || "No."}  ${d.caseNo || "       "}  of  ${d.caseYear || "2024"}`,
      },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioner"}` },
      { t: "versus", v: "-Vs-" },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondent"}` },
      { t: "space" },
      { t: "title", v: "NOTICE GIVEN TO OTHER SIDE" },
      { t: "space" },
      {
        t: "signblock",
        v: `By Counsel:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nEnrol No.: ${d.barNo || ADVOCATE_DEFAULTS.enrolNo}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}`,
      },
    ],
  },
  {
    id: "advance_petition_2",
    name: "Advance Petition 2 (முன்னேற்ற மனு)",
    sub: "Section 151 C.P.C. — சி. பு. கோ. பிரிவு 151 படி தாக்கல் செய்யும் முன்னேற்ற மனு",
    group: "Petitions",
    fields: [
      F("court", "Court Name (நீதிமன்றம்)", { def: "முதன்மை மாவட்ட உரிமையியல் நீதிமன்றம், போச்சம்பள்ளி" }),
      F("iaNo", "I. A. No.", { def: "15", w: "half" }),
      F("iaYear", "I. A. Year", { def: "2025", w: "half" }),
      F("mainCaseType", "Main Case Type (O. S. / MCOP / HMOP)", { def: "O. S.", w: "half" }),
      F("caseNo", "Main Case No.", { def: "145", w: "half" }),
      F("caseYear", "Main Case Year", { def: "2024", w: "half" }),
      F("client", "Petitioner Name (மனுதாரர்)", { def: "ரா. சண்முகம்", w: "half" }),
      F("clientRole", "Petitioner Role (தரப்பு)", { def: "வாதி", w: "half" }),
      F("opponent", "Respondent Name (எதிர்மனுதாரர்)", { def: "மு. வெங்கடேசன்", w: "half" }),
      F("opponentRole", "Respondent Role (எதிர்தரப்பு)", { def: "பிரதிவாதி", w: "half" }),
      F("sectionRule", "Section / Rule (சட்டப்பிரிவு)", { def: "சி. பு. கோ. & பிரிவு 151", w: "half" }),
      F("advFromDate", "Current Posted Date (தற்போதைய வாய்தா தேதி)", { def: "28-11-2025", w: "half" }),
      F("advToDate", "Advance Date (முன்னேற்றம் கோரும் தேதி)", { def: "10-10-2025", w: "half" }),
      F("prayer", "Prayer Details (கோரிக்கை விபரம்)", {
        area: true,
        def: "மேற்படி வழக்கின் விசாரணை தேதியை 28-11-2025-ம் தேதியிலிருந்து 10-10-2025-ம் தேதிக்கு முன்னதாக எடுத்து வைத்து விசாரணை செய்ய உத்திரவிட வேண்டுகிறேன்."
      }),
      F("place", "Place (இடம்)", { def: "போச்சம்பள்ளி", w: "half" }),
      F("date", "Date (நாள்)", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
    ],
    generate: (d) => [
      { t: "center", v: `கனம் ${d.court || "நீதிமன்ற"} கோர்ட்டார் அவர்கள் சமூகம்` },
      { t: "space" },
      {
        t: "center",
        v: `I. A. No.  ${d.iaNo || "       "}  of  ${d.iaYear || "2025"}\nin\n${d.mainCaseType || "O. S."} No.  ${d.caseNo || "       "}  of  ${d.caseYear || "2024"}`,
      },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...மனுதாரர் / ${d.clientRole || "வாதி"}` },
      { t: "versus", v: "-இடையே-" },
      { t: "party", v: d.opponent || "________________", role: `...எதிர்மனுதாரர் / ${d.opponentRole || "பிரதிவாதி"}` },
      { t: "space" },
      { t: "title", v: `மனுதாரர் ${d.sectionRule || "சி. பு. கோ. & பிரிவு 151"} படி\nதாக்கல் செய்யும் மனு` },
      { t: "space" },
      {
        t: "para",
        v: `இத்துடன் சமர்ப்பிக்கப்பட்டுள்ள பிரமாண பத்திரிக்கையில் கண்டுள்ள காரணங்களுக்காக சமூகம் கோர்ட்டார் அவர்கள் தயவு செய்து ${d.prayer || "மேற்படி வழக்கின் விசாரணை தேதியை முன்னதாக எடுத்து வைத்து விசாரணை செய்ய உத்திரவிட வேண்டுகிறேன்."}`,
      },
      { t: "space" },
      {
        t: "signdual",
        left: `இடம் : ${d.place || "போச்சம்பள்ளி"}\nநாள் : ${d.date || today()}`,
        right: `மனுதாரர் வழக்கறிஞர்\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}`,
      },
    ],
    generateCover: (d) => [
      { t: "center", v: `கனம் ${d.court || "நீதிமன்ற"} கோர்ட்டார் அவர்கள் சமூகம்` },
      { t: "space" },
      {
        t: "center",
        v: `I. A. No.  ${d.iaNo || "       "}  of  ${d.iaYear || "2025"}\nin\n${d.mainCaseType || "O. S."} No.  ${d.caseNo || "       "}  of  ${d.caseYear || "2024"}`,
      },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...மனுதாரர் / ${d.clientRole || "வாதி"}` },
      { t: "versus", v: "-இடையே-" },
      { t: "party", v: d.opponent || "________________", role: `...எதிர்மனுதாரர் / ${d.opponentRole || "பிரதிவாதி"}` },
      { t: "space" },
      { t: "title", v: `மனுதாரர் ${d.sectionRule || "சி. பு. கோ. & பிரிவு 151"} படி\nதாக்கல் செய்யும் மனு` },
      { t: "space" },
      {
        t: "signblock",
        v: `மனுதாரர் வழக்கறிஞர்:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nசெல்: ${d.phone || ADVOCATE_DEFAULTS.phone}`,
      },
    ],
  },
  {
    id: "plea_of_guilty_petition",
    name: "Plea of Guilty Petition (Section 279 BNSS)",
    sub: "Petition Filed Under Section 279 BNSS — In the Court of Judicial Magistrate",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "In The Court of The Judicial Magistrate" }),
      F("courtNo", "Magistrate Court No. (e.g. No. I)", { def: "No. I", w: "half" }),
      F("place", "Place / Station", { def: "SALEM", w: "half" }),
      F("crlMpNo", "Crl. M. P. No.", { def: "12 / 2025", w: "half" }),
      F("caseNo", "C. C. No.", { def: "145 / 2024", w: "half" }),
      F("section", "Section & Act", { def: "SECTION 279 BNSS", w: "half" }),
      F("client", "Petitioner / Complainant Name", { def: "K. Ramanathan", w: "half" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner / Complainant", w: "half" }),
      F("opponent", "Respondent / Accused Name", { def: "Ravi kumar", w: "half" }),
      F("opponentRole", "Respondent Role", { def: "Respondent / Accused", w: "half" }),
      F("postedFor", "Case Posted Today For", { def: "examination of witnesses / hearing", w: "half" }),
      F("reason", "Reason for Inability to Attend", { def: "he is suffering from severe viral fever and doctor advised bed rest" }),
      F("date", "Date", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
    ],
    generate: (d) => {
      const courtLine = `${d.court || "In The Court of The Judicial Magistrate"}${d.courtNo ? " " + d.courtNo : ""} of ${d.place || "SALEM"}`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        { t: "left", v: `Crl. M. P. No.  ${d.crlMpNo || "          / 20"}\nin\nC. C. No.  ${d.caseNo || "          / 20"}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioner / Complainant"}` },
        { t: "versus", v: "Vs." },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondent / Accused"}` },
        { t: "space" },
        { t: "title", v: `PETITION FILED UNDER ${up(d.section || "SECTION 279 BNSS")}` },
        { t: "space" },
        { t: "left", v: `The ${d.clientRole || "Petitioner / Complainant"} most respectfully submits as follows :` },
        { t: "num", n: 1, v: `The above case is posted today for ${d.postedFor || "hearing"}.` },
        { t: "num", n: 2, v: `The ${d.clientRole || "Petitioner / Complainant"} is unable to attend the proceedings of this Honourable Court today because ${d.reason || "he is indisposed and unable to travel"}.` },
        { t: "num", n: 3, v: `The absence of the ${d.clientRole || "Petitioner / Complainant"} is neither wilful nor wanton.` },
        { t: "space" },
        {
          t: "para",
          v: `Hence it is prayed that this Honourable Court may be pleased to dispense with the personal appearance of the ${d.clientRole || "Petitioner / Complainant"} and permit his pleader to appear on his behalf and thus render justice.`,
        },
        { t: "space" },
        {
          t: "sign",
          place: d.place || "Salem",
          date: d.date || today(),
          label: `Counsel for ${d.clientRole || "Petitioner / Complainant"}\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}`,
        },
      ];
    },
    generateCover: (d) => {
      const courtLine = `IN THE COURT OF THE JUDICIAL\nMAGISTRATE NO. ${d.courtNo ? d.courtNo.replace(/^No\.\s*/i, "") : "      "} OF ${d.place || "SALEM"}`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        { t: "left", v: `Crl. M. P. No.  ${d.crlMpNo || "          / 20"}\nin\nC. C. No.  ${d.caseNo || "          / 20"}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioner / Complainant"}` },
        { t: "versus", v: "Vs." },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondent / Accused"}` },
        { t: "space" },
        { t: "title", v: `PETITION FILED UNDER SECTION\n${up(d.section ? d.section.replace(/^SECTION\s*/i, "") : "279 BNSS")}` },
        { t: "space" },
        {
          t: "signblock",
          v: `By Counsel:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nEnrol No.: ${d.barNo || ADVOCATE_DEFAULTS.enrolNo}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}`,
        },
      ];
    },
  },
  {
    id: "warrant_recall_petition",
    name: "Warrant Recall Petition (Section 70(2) Cr.P.C.)",
    sub: "Warrant Recall Petition Filed U/s 70(2) Cr.P.C. — Judicial Magistrate Court",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "IN THE COURT OF THE JUDICIAL MAGISTRATE" }),
      F("courtNo", "Magistrate Court No. (e.g. NO. I)", { def: "NO. I", w: "half" }),
      F("place", "Place / Station", { def: "SALEM", w: "half" }),
      F("cmpNo", "C. M. P. No.", { def: "12 / 2025", w: "half" }),
      F("crimeNo", "Cr. No.", { def: "45 / 2024", w: "half" }),
      F("section", "Implicated U/s. (Offences)", { def: "294(b), 323, 506(i) IPC", w: "half" }),
      F("statuteTitle", "Petition Title", { def: "WARRANT RECALL PETITION FILED U/s 70(2) OF Cr.P.C." }),
      F("client", "Petitioner / Accused Name", { def: "K. Ramanathan", w: "half" }),
      F("clientRole", "Petitioner Role", { def: "Petitioners / Accused", w: "half" }),
      F("opponent", "Respondent / Complainant", { def: "The State rep. by Sub-Inspector of Police", w: "half" }),
      F("opponentRole", "Respondent Role", { def: "Respondents / Complainant", w: "half" }),
      F("postedDate", "Case Posted / Warrant Date", { def: "10.05.2025", w: "half" }),
      F("reason", "Reason for Non-Appearance / Inability", { def: "he was suffering from acute illness and viral fever and was unable to travel or instruct his advocate" }),
      F("date", "Date", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
    ],
    generate: (d) => {
      const courtLine = `${d.court || "IN THE COURT OF THE JUDICIAL MAGISTRATE"}${d.courtNo ? " " + d.courtNo : ""}  ${d.place || "SALEM"}`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        { t: "left", v: `C. M. P. No.  ${d.cmpNo || "          / 20"}    in Cr. No.  ${d.crimeNo || "          / 20"}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioners / Accused"}` },
        { t: "versus", v: "Versus" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondents / Complainant"}` },
        { t: "space" },
        { t: "title", v: up(d.statuteTitle || "WARRANT RECALL PETITION FILED U/s 70(2) OF Cr.P.C.") },
        { t: "space" },
        { t: "para", v: `Petitioner States that the Petitioner / Accused was implicated by this Honourable court U/s. ${d.section || "________________"}.` },
        { t: "para", v: `That the above case in posted to ${d.postedDate || "_______________"} for further proceedings. Due to his absence of the petitioner this Honourable Court was issued N. B. W. against Petitioner.` },
        { t: "para", v: `Petitioner States that the non appearance of the petitioner on that day is neither wilful nor wanton one.` },
        { t: "para", v: `I am unable to appear before this Honourable Court and also not able to inform the advocate to file necessary petitioner before this Honourable Court because ${d.reason || "he was indisposed and unable to travel"}.` },
        { t: "space" },
        {
          t: "para",
          v: `Therefore, the petitioner humbly prays that this Honourable Court may be pleased to recall the N. B. W. issued against Petitioner / Accused and thus render justice.`,
        },
        { t: "space" },
        {
          t: "signdual",
          left: "PETITIONER.",
          right: `COUNSEL FOR PETITIONER.\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}`,
        },
        {
          t: "left",
          v: `${d.place || "Salem"}\nDate : ${d.date || today()}`,
        },
      ];
    },
    generateCover: (d) => {
      const courtLine = `IN THE COURT OF THE JUDICIAL\nMAGISTRATE NO. ${d.courtNo ? d.courtNo.replace(/^No\.\s*/i, "") : "      "}  ${d.place || "SALEM"}`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        { t: "left", v: `C. M. P. No.  ${d.cmpNo || "          / 20"}\n        in\nCrime No.  ${d.crimeNo || "          / 20"}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioners / Accused"}` },
        { t: "versus", v: "Versus" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondents / Complainant"}` },
        { t: "space" },
        { t: "title", v: `WARRANT RECALL PETITION FILED\nU/S 70(2) OF Cr. P. C.` },
        { t: "space" },
        {
          t: "signblock",
          v: `By Counsel:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nEnrol No.: ${d.barNo || ADVOCATE_DEFAULTS.enrolNo}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}`,
        },
      ];
    },
  },
  {
    id: "surrender_petition_salem",
    name: "Surrender Petition (Judicial Magistrate Court)",
    sub: "Surrender Petition Filed on Behalf of Petitioner / Accused — Salem Format",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "IN THE COURT OF THE JUDICIAL MAGISTRATE" }),
      F("courtNo", "Magistrate Court No. (e.g. NO. I)", { def: "NO. I", w: "half" }),
      F("place", "Place / Station", { def: "SALEM", w: "half" }),
      F("cmpNo", "C. M. P. No.", { def: "14 / 2025", w: "half" }),
      F("crimeNo", "Cr. No.", { def: "45 / 2024", w: "half" }),
      F("section", "Charged U/s. (Offences)", { def: "294(b), 323, 506(i) IPC", w: "half" }),
      F("client", "Petitioner / Accused Name", { def: "K. Ramanathan", w: "half" }),
      F("clientRole", "Petitioner Role", { def: "Petitioners / Accused", w: "half" }),
      F("opponent", "Respondent / Complainant", { def: "The State rep. by Sub-Inspector of Police", w: "half" }),
      F("opponentRole", "Respondent Role", { def: "Respondents / Complainant", w: "half" }),
      F("postedDate", "Case Posted Date", { def: "10.05.2025", w: "half" }),
      F("reason", "Reason for Non-Appearance", { def: "suffering from severe jaundice and advised complete bed rest" }),
      F("date", "Date", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
    ],
    generate: (d) => {
      const courtLine = `${d.court || "IN THE COURT OF THE JUDICIAL MAGISTRATE"}${d.courtNo ? " " + d.courtNo : ""}  ${d.place || "SALEM"}`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        { t: "left", v: `C. M. P. No.  ${d.cmpNo || "          / 20"}    in Cr. No.  ${d.crimeNo || "          / 20"}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioners / Accused"}` },
        { t: "versus", v: "Versus" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondents / Complainant"}` },
        { t: "space" },
        { t: "title", v: "SURRENDER PETITION" },
        { t: "space" },
        { t: "para", v: `Petitioner States that the petitioner was charged for an alleged offence U/s. ${d.section || "________________"}.` },
        { t: "para", v: `That the above case is posted on ${d.postedDate || "_______________"} for further proceedings. Due to the absence of the petitioner this Honourable Court was issued N. B. W. against the Petitioner / Accused since the Petitioner / Accused was ${d.reason || "suffering from acute illness and unable to travel"}.` },
        { t: "para", v: `Due to the above said circumstances the Petitioner / Accused is unable to attend before this Honourable Court. His / Her absence is neither wilful nor wanton one.` },
        { t: "para", v: `Petitioner States that the petitioner is voluntarily surrendered before this Honourable Court. The Petitioner / Accused has filed recall petition before this Honourable Court.` },
        { t: "space" },
        {
          t: "para",
          v: `Therefore the petitioner humbly prays that this Honourable Court may be pleased to accept the surrender of the Petitioner / Accused and thus render justice.`,
        },
        { t: "space" },
        {
          t: "signdual",
          left: "PETITIONER.",
          right: `COUNSEL FOR PETITIONER.\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}`,
        },
        {
          t: "left",
          v: `${d.place || "Salem"}\nDate : ${d.date || today()}`,
        },
      ];
    },
    generateCover: (d) => {
      const courtLine = `IN THE COURT OF THE JUDICIAL\nMAGISTRATE NO. ${d.courtNo ? d.courtNo.replace(/^No\.\s*/i, "") : "      "}  ${d.place || "SALEM"}`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        { t: "left", v: `C. M. P. No.  ${d.cmpNo || "          / 20"}\n        in\nCrime No.  ${d.crimeNo || "          / 20"}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioners / Accused"}` },
        { t: "versus", v: "Versus" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondents / Complainant"}` },
        { t: "space" },
        { t: "title", v: `SURRENDER PETITION` },
        { t: "space" },
        {
          t: "signblock",
          v: `By Counsel:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nEnrol No.: ${d.barNo || ADVOCATE_DEFAULTS.enrolNo}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}`,
        },
      ];
    },
  },
  {
    id: "advance_hearing_petition_salem",
    name: "Advance Hearing Petition (Judicial Magistrate Court)",
    sub: "Advance Hearing Petition Filed by the Petitioner (Sec 70(ii) Cr.P.C.) — Salem Format",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "IN THE COURT OF THE JUDICIAL MAGISTRATE" }),
      F("courtNo", "Magistrate Court No. (e.g. NO. I)", { def: "NO. I", w: "half" }),
      F("place", "Place / Station", { def: "SALEM", w: "half" }),
      F("cmpNo", "C. M. P. No.", { def: "15 / 2025", w: "half" }),
      F("crimeNo", "Cr. No.", { def: "45 / 2024", w: "half" }),
      F("section", "Invoking Section", { def: "section 70 (ii) of Cr. P. C.", w: "half" }),
      F("client", "Petitioner / Accused Name", { def: "K. Ramanathan", w: "half" }),
      F("clientRole", "Petitioner Role", { def: "Petitioners / Accused", w: "half" }),
      F("opponent", "Respondent / Complainant", { def: "The State rep. by Sub-Inspector of Police", w: "half" }),
      F("opponentRole", "Respondent Role", { def: "Respondents / Complainant", w: "half" }),
      F("advanceFromDate", "Advance Hearing Date From", { def: "25.06.2025", w: "half" }),
      F("advanceToDate", "Advance Hearing To Date", { def: "today", w: "half" }),
      F("date", "Date", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
    ],
    generate: (d) => {
      const courtLine = `${d.court || "IN THE COURT OF THE JUDICIAL MAGISTRATE"}${d.courtNo ? " " + d.courtNo : ""}  ${d.place || "SALEM"}`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        { t: "left", v: `C. M. P. No.  ${d.cmpNo || "          / 20"}    in Cr. No.  ${d.crimeNo || "          / 20"}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioners / Accused"}` },
        { t: "versus", v: "Versus" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondents / Complainant"}` },
        { t: "space" },
        { t: "title", v: "ADVANCE HEARING PETITION FILED BY THE PETITIONER" },
        { t: "space" },
        {
          t: "para",
          v: `Petitioner States that the order of invoking ${d.section || "section 70 (ii) of Cr. P. C."} that this Honourable Court may be pleased to advance the hearing date from ${d.advanceFromDate || "_______________"} To ${d.advanceToDate || "today"} and thus render justice.`,
        },
        { t: "space" },
        {
          t: "signdual",
          left: "PETITIONER.",
          right: `COUNSEL FOR PETITIONER.\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}`,
        },
        {
          t: "left",
          v: `${d.place || "Salem"}\nDate : ${d.date || today()}`,
        },
      ];
    },
    generateCover: (d) => {
      const courtLine = `IN THE COURT OF THE JUDICIAL\nMAGISTRATE NO. ${d.courtNo ? d.courtNo.replace(/^No\.\s*/i, "") : "      "}  ${d.place || "SALEM"}`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        { t: "left", v: `C. M. P. No.  ${d.cmpNo || "          / 20"}\n        in\nCrime No.  ${d.crimeNo || "          / 20"}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioners / Accused"}` },
        { t: "versus", v: "Versus" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondents / Complainant"}` },
        { t: "space" },
        { t: "title", v: `ADVANCE HEARING PETITION\nFILED BY THE PETITIONER` },
        { t: "space" },
        {
          t: "signblock",
          v: `By Counsel:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nEnrol No.: ${d.barNo || ADVOCATE_DEFAULTS.enrolNo}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}`,
        },
      ];
    },
  },
  {
    id: "bail_application_crpc",
    name: "Bail Application under Cr.P.C. (Sec. 436 / 437)",
    sub: "Bail Application under Sec. 436 / 437 of Cr. Procedure Code — Magistrate Court Format",
    group: "Bail & Sureties",
    fields: [
      F("court", "Court Name", { def: "In the Court of the Judicial Magistrate" }),
      F("courtNo", "Magistrate Court No. (e.g. No. I)", { def: "No. I", w: "half" }),
      F("place", "Place / Station", { def: "Salem", w: "half" }),
      F("crlMpNo", "Cr. M. P. No.", { def: "18 / 2025", w: "half" }),
      F("caseType", "Case Type (C.C. / P.R.)", { def: "C.C.", w: "half" }),
      F("caseNo", "C.C. / P.R. Number & Year", { def: "120 / 2024", w: "half" }),
      F("sectionCrpc", "Bail Section", { def: "Sec.436/437 of Cr. Procedure Code", w: "half" }),
      F("section", "Remanded / Charged Under Section(s)", { def: "Section 294(b), 323, 506(i) IPC", w: "half" }),
      F("offenceNature", "Nature of Offence", { def: "bailable / non bailable", w: "half" }),
      F("opponent", "Complainant Name / Station", { def: "State represented by Inspector of Police", w: "half" }),
      F("opponentRole", "Complainant Role", { def: "Complainant", w: "half" }),
      F("client", "Accused Name", { def: "K. Ramanathan", w: "half" }),
      F("clientRole", "Accused Role", { def: "Accused", w: "half" }),
      F("date", "Date", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
    ],
    generate: (d) => {
      const courtLine = `${d.court || "In the Court of the Judicial Magistrate"}${d.courtNo ? " " + d.courtNo : ""}${d.place ? ", " + d.place : ""}`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        {
          t: "left",
          v: `Cr. M. P.  ${d.crlMpNo || "          / 20"}\nin  ${d.caseType || "C.C."} / P.R.  ${d.caseNo || "          / 20"}`,
        },
        { t: "space" },
        { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Complainant"}` },
        { t: "versus", v: "Vs." },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Accused"}` },
        { t: "space" },
        { t: "title", v: `Bail Application under ${d.sectionCrpc || "Sec.436/437 of Cr. Procedure Code"}` },
        { t: "space" },
        { t: "left", v: "The above named accused humbly begs to state as follows :-" },
        {
          t: "num",
          n: 1,
          v: `That the accused has been remanded/charged for an offence under ${d.section || "Sec. ________________"} by this Honourable Court`,
        },
        {
          t: "num",
          n: 2,
          v: "That the accused is not guilty of any offence, and did not commit the said offence.",
        },
        {
          t: "num",
          n: 3,
          v: `That the above said offence is a ${d.offenceNature || "bailable / non bailable"} one, not punishable with death or imprisonment for life.`,
        },
        {
          t: "num",
          n: 4,
          v: "That the accused is a respectable citizen of the place and will not abscond.",
        },
        {
          t: "num",
          n: 5,
          v: "That the accused is ready to furnish substantial sureties to the satisfaction of this Honourable Court, to enlarge the accused on bail.",
        },
        {
          t: "num",
          n: 6,
          v: "That the accused is willing to abide by any condition that may be imposed by this Honourable Court in Bail.",
        },
        { t: "space" },
        {
          t: "para",
          v: "Therefore the accused above named humbly prays that this Honourable Court may kindly be pleased to enlarge the accused on bail and thus render justice.",
        },
        { t: "space" },
        {
          t: "sign",
          place: d.place || "Salem",
          date: d.date || today(),
          label: `Counsel for the Accused.\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}`,
        },
      ];
    },
    generateCover: (d) => {
      const courtLine = `In the Court of the\n${d.courtNo ? d.courtNo + " " : ""}MAGISTRATE${d.place ? ", " + d.place.toUpperCase() : ""}`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        {
          t: "left",
          v: `CR. M.P.  ${d.crlMpNo || "          / 20"}\n\nin  ${d.caseType || "C. C."} / P. R.  ${d.caseNo || "          / 20"}`,
        },
        { t: "space" },
        { t: "party", v: d.opponent || "________________", role: `...${(d.opponentRole || "COMPLAINANT").toUpperCase()}` },
        { t: "versus", v: "Vs." },
        { t: "party", v: d.client || "________________", role: `...${(d.clientRole || "ACCUSED").toUpperCase()}` },
        { t: "space" },
        {
          t: "title",
          v: `BAIL APPLICATION\nUnder Sec. ${d.sectionCrpc ? d.sectionCrpc.replace(/^Sec\.?\s*/i, "") : "436/437 of Cr. Procedure Code"}`,
        },
        { t: "space" },
        {
          t: "signblock",
          v: `Presented by :-\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nEnrol No.: ${d.barNo || ADVOCATE_DEFAULTS.enrolNo}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}`,
        },
      ];
    },
  },
  {
    id: "affidavit_by_surety",
    name: "Affidavit by the Surety",
    sub: "Affidavit Filed by the Surety — Judicial Magistrate Court Format",
    group: "Bail & Sureties",
    fields: [
      F("court", "Court Name", { def: "In the Court of the Judicial Magistrate" }),
      F("courtNo", "Magistrate Court No. (e.g. No. I)", { def: "No. I", w: "half" }),
      F("place", "Place / Station", { def: "Salem", w: "half" }),
      F("caseNo", "C. C. Number & Year", { def: "120 / 2024", w: "half" }),
      F("complainant", "Complainant Name / Station", { def: "Sub-Inspector of Police", w: "half" }),
      F("complainantRole", "Complainant Role", { def: "Complainant", w: "half" }),
      F("accused", "Accused Name", { def: "K. Ramanathan", w: "half" }),
      F("accusedRole", "Accused Role", { def: "Accused", w: "half" }),
      F("suretyName", "Surety Full Name", { def: "M. Senthil Kumar", w: "half" }),
      F("fatherName", "Father's / Husband's Name", { def: "M. Murugesan", w: "half" }),
      F("age", "Age in Years", { def: "42", w: "half" }),
      F("caste", "Caste / Community", { def: "Hindu", w: "half" }),
      F("occupation", "Calling / Occupation", { def: "Business / Agriculture", w: "half" }),
      F("address", "Full Residential Address", { def: "No. 14, Gandhi Road, Salem - 636007" }),
      F("propertyVal", "Property Worth (Rs.)", { def: "15,00,000/-", w: "half" }),
      F("propertyPlace", "Property Location / Village / S.No.", { def: "S.No. 45/2, Ammapet, Salem", w: "half" }),
      F("taxAmount", "Property Tax Paid Half-Yearly (Rs.)", { def: "1,250/-", w: "half" }),
      F("language", "Language Read Over", { def: "Tamil", w: "half" }),
      F("date", "Date of Affirmation", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
    ],
    generate: (d) => {
      const courtLine = `${d.court || "In the Court of the Judicial Magistrate"}${d.courtNo ? " " + d.courtNo : ""}${d.place ? ", " + d.place : ""}`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        { t: "left", v: `C. C. No.  ${d.caseNo || "          / 20"}` },
        { t: "space" },
        { t: "party", v: d.complainant || "Sub-Inspector of Police", role: `...${d.complainantRole || "Complainant"}` },
        { t: "versus", v: "Versus" },
        { t: "party", v: d.accused || "________________", role: `...${d.accusedRole || "Accused"}` },
        { t: "space" },
        { t: "title", v: "AFFIDAVIT FILED BY THE SURETY" },
        { t: "space" },
        {
          t: "para",
          v: `I, ${d.suretyName || "________________"} son of ${d.fatherName || "________________"} aged ${d.age || "____"} years by caste ${d.caste || "________"} calling ${d.occupation || "________________"} residing at ${d.address || "________________"} do hereby solemnly affirm and state as follows :`,
        },
        { t: "num", n: 1, v: "I know the accused." },
        {
          t: "num",
          n: 2,
          v: `I own and possess in my name property worth Rs. ${d.propertyVal || "________________"} in ${d.propertyPlace || "________________"}. I am paying tax in respect of this property, a sum of Rs. ${d.taxAmount || "________"} half-yearly. There is no encumbrance over the property.`,
        },
        { t: "num", n: 3, v: "I am willing to stand as surety to the above accused." },
        {
          t: "num",
          n: 4,
          v: "It is therefore just and necessary that this Honourable Court may be pleased to accept this surety and release the accused on bail and thus render justice.",
        },
        { t: "space" },
        {
          t: "signdual",
          left: "",
          right: "Deponent / Surety",
        },
        { t: "space" },
        {
          t: "para",
          v: `Solemnly affirmed and signed before me at ${d.place || "Salem"} on ${d.date || today()} after the above contents were read over to the deponent in ${d.language || "Tamil"} and admitted by him to be correct.`,
        },
        { t: "space" },
        {
          t: "sign",
          place: "",
          date: "",
          label: `Advocate.\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}`,
        },
      ];
    },
    generateCover: (d) => {
      const courtLine = `In the Court of the Judicial\nMagistrate ${d.courtNo || ""}${d.place ? " " + d.place : ""}`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        { t: "left", v: `C. C. No.  ${d.caseNo || "          / 20"}` },
        { t: "space" },
        { t: "party", v: d.complainant || "Sub-Inspector of Police", role: `...${d.complainantRole || "Complainant"}` },
        { t: "versus", v: "Versus" },
        { t: "party", v: d.accused || "________________", role: `...${d.accusedRole || "Accused"}` },
        { t: "space" },
        { t: "title", v: `AFFIDAVIT FILED BY\nTHE SURETY` },
        { t: "space" },
        {
          t: "signblock",
          v: `Advocate:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nEnrol No.: ${d.barNo || ADVOCATE_DEFAULTS.enrolNo}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}`,
        },
      ];
    },
  },
  {
    id: "nbw_recall_petition_salem",
    name: "Non-Bailable Warrant Recall Petition (Salem Format)",
    sub: "Application for recalling non-bailable warrant filed by the Petitioner",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "In the Court of the Judicial Magistrate" }),
      F("courtNo", "Magistrate Court No. (e.g. No. I)", { def: "No. I", w: "half" }),
      F("place", "Place / Station", { def: "Salem", w: "half" }),
      F("cmpNo", "C.M.P. No. & Year", { def: "19 / 2025", w: "half" }),
      F("caseNo", "C.C. No. & Year", { def: "120 / 2024", w: "half" }),
      F("section", "Section & Act Charged Under", { def: "Section 294(b), 323, 506(i) of Indian Penal Code / T.N.P. Act", w: "half" }),
      F("client", "Petitioner / Accused Name", { def: "K. Ramanathan", w: "half" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner / Accused", w: "half" }),
      F("opponent", "Respondent / Complainant", { def: "Sub-Inspector of Police", w: "half" }),
      F("opponentRole", "Respondent Role", { def: "Respondent / Complainant", w: "half" }),
      F("postedDate", "Hearing Date Posted for Appearance", { def: "10.05.2025", w: "half" }),
      F("reason", "Specific Reason for Absence (Point 4)", { def: "That on the said hearing date, the petitioner was suddenly taken ill with severe viral fever and stomach ache, and was unable to travel or attend the court." }),
      F("gender", "Pronoun for Petitioner (his / her)", { def: "his", w: "half" }),
      F("date", "Date", { def: today(), w: "half" }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
    ],
    generate: (d) => {
      const courtLine = `${d.court || "In the Court of the Judicial Magistrate"}${d.courtNo ? " " + d.courtNo : ""}    ${d.place || "Salem"}.`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        {
          t: "left",
          v: `C.M.P. No.  ${d.cmpNo || "          / 20"}\nC.C.No.  ${d.caseNo || "          / 20"}`,
        },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioner / Accused"}` },
        { t: "versus", v: "Versus" },
        { t: "party", v: d.opponent || "Sub-Inspector of Police", role: `...${d.opponentRole || "Respondent / Complainant"}` },
        { t: "space" },
        { t: "title", v: "Application for recalling non-bailable warrant filed by the Petitioner." },
        { t: "space" },
        {
          t: "num",
          n: 1,
          v: `The petitioner is / are charged for an offence under ${d.section || "section of Indian Penal Code / T.N.P. Act"}.`,
        },
        {
          t: "num",
          n: 2,
          v: `The abovesaid case was posted on ${d.postedDate || "_______________"} for the appearance of the accused.`,
        },
        {
          t: "num",
          n: 3,
          v: "Due to the absence of the petitioner on the said hearing date nonbailable warrant was issued.",
        },
        {
          t: "num",
          n: 4,
          v: d.reason || "That on the said hearing date, the petitioner was suddenly indisposed and unable to contact counsel.",
        },
        {
          t: "num",
          n: 5,
          v: "In the above stated circumstances, the Petitioner was/were unable to attend the court on the said hearing date.",
        },
        {
          t: "num",
          n: 6,
          v: "The absence of the Petitioner is neither wilful nor wanton one.",
        },
        { t: "space" },
        {
          t: "para",
          v: `Therefore the Petitioner humbly prays that the Honourable Court may be pleased to excuse his absence on the said hearing date and may be pleased to recall the non-bailable warrant issued against ${d.gender === "her" ? "her" : "him/her"} and thus render justice.`,
        },
        { t: "space" },
        {
          t: "sign",
          place: `${d.place || "Salem"}-7.`,
          date: d.date || today(),
          label: `Counsel for the petitioner.\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}`,
        },
      ];
    },
    generateCover: (d) => {
      const courtLine = `In the Court of the Judicial\nMagistrate ${d.courtNo || ""}${d.place ? " " + d.place : ""}.`;
      return [
        { t: "center", v: courtLine },
        { t: "space" },
        {
          t: "left",
          v: `C.M.P. No.  ${d.cmpNo || "          / 20"}\n        in\nC.C.No.  ${d.caseNo || "          / 20"}`,
        },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioner / Accused"}` },
        { t: "versus", v: "Versus" },
        { t: "party", v: d.opponent || "Sub-Inspector of Police", role: `...${d.opponentRole || "Respondent / Complainant"}` },
        { t: "space" },
        {
          t: "title",
          v: `APPLICATION FOR RECALLING\nNON-BAILABLE WARRANT\nFILED BY THE PETITIONER`,
        },
        { t: "space" },
        {
          t: "signblock",
          v: `By Counsel:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nEnrol No.: ${d.barNo || ADVOCATE_DEFAULTS.enrolNo}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}`,
        },
      ];
    },
  },
  {
    id: "order38_rule5_notice",
    name: "Order 38 Rule 5 Notice (Attachment Before Judgment)",
    sub: "Notice / Direction to Defendant to Furnish Security (Order 38 Rule 5 C.P.C.)",
    group: "Petitions",
    fields: [
      F("court", "Court Name", { def: "In the Court of the Subordinate Judge, Salem" }),
      F("iaNo", "I. A. No. & Year", { def: "45 / 2025", w: "half" }),
      F("osNo", "O. S. No. & Year", { def: "120 / 2024", w: "half" }),
      F("client", "Petitioner(s) / Plaintiff(s) Name", { def: "R. Manickam", w: "half" }),
      F("clientRole", "Petitioner Role", { def: "Petitioner (s) / Plaintiff (s)", w: "half" }),
      F("opponent", "Respondent(s) / Defendant(s) Name", { def: "S. Varadharajan", w: "half" }),
      F("opponentRole", "Respondent Role", { def: "Respondents / Defendants", w: "half" }),
      F("defendantAddress", "To: Defendant(s) Name & Address", { def: "S. Varadharajan, S/o Subbarayan, No. 45, Bazaar Street, Salem - 636001" }),
      F("directionDate", "Directed On or Before (Date)", { def: "20.06.2025", w: "half" }),
      F("securityAmount", "Security Amount (Rs.)", { def: "5,00,000/-", w: "half" }),
      F("securityAmountWords", "Security Amount in Words", { def: "Five Lakhs", w: "half" }),
      F("date", "Date of Order / Seal", { def: today(), w: "half" }),
      F("judge", "Judge Designation", { def: "JUDGE", w: "half" }),
      F("schedule", "Schedule of Property to be Attached", { def: "All that piece and parcel of land and building bearing Door No. 45, Old S.No. 124/2, New Town Survey No. 45, Ward D, Block 12, situated at Bazaar Street, Salem Town, Salem District, bounded on:\nNorth by : Road\nSouth by : Property of Murugesan\nEast by : Property of Senthil\nWest by : Common Lane\nMeasuring East-West 30 feet, North-South 50 feet, totaling 1,500 sq.ft." }),
      F("advocate", "Advocate Name", { def: ADVOCATE_DEFAULTS.advocateName, w: "half" }),
      F("barNo", "Enrolment No.", { def: ADVOCATE_DEFAULTS.enrolNo, w: "half" }),
      F("phone", "Mobile No.", { def: ADVOCATE_DEFAULTS.phone, w: "half" }),
      F("officeAddr", "Advocate Office Address", { def: ADVOCATE_DEFAULTS.advocateAddress }),
    ],
    generate: (d) => [
      { t: "small", v: "(Order 38 Rule 5)" },
      { t: "center", v: d.court || "In the Court of the Subordinate Judge, Salem" },
      { t: "space" },
      {
        t: "left",
        v: `I. A. No.  ${d.iaNo || "          / 20"}\nin\nO. S. No.  ${d.osNo || "          / 20"}`,
      },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioner (s) / Plaintiff (s)"}` },
      { t: "versus", v: "Vs." },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondents / Defendants"}` },
      { t: "space" },
      {
        t: "left",
        v: `To\n(defendants name and address (es))\n${d.defendantAddress || d.opponent || "________________"}`,
      },
      { t: "space" },
      {
        t: "para",
        v: "Whereas the plaintiff (s) has/have made in the above application Praying for an attachment before judgement of the property mentioned in the schedule hereunder to answer any judgement that may be passed in his favour",
      },
      {
        t: "para",
        v: `Taking notice that you the defendant(s) is/are hereby directed on or before ${d.directionDate || "_______________"}`,
      },
      {
        t: "num",
        n: 1,
        v: `To furnish security of a sum of Rs. ${d.securityAmount || "________________"} (Rupees ${d.securityAmountWords || "________________"} only)`,
      },
      {
        t: "num",
        n: 2,
        v: "To produce and place at the disposal of the Court who require the entire property item(s) of the property the value of the entire property mentioned in the schedule hereunder sufficient to satisfy the decree that may be passed in favour of the plaintiff(s)",
      },
      {
        t: "num",
        n: 3,
        v: "In the default of furnishing security in the matter of the property mentioned belonging will be attached",
      },
      { t: "space" },
      {
        t: "para",
        v: `Given under my hand and the seal of the court this the ${d.date || today()}`,
      },
      { t: "space" },
      {
        t: "signblock",
        v: `${d.judge || "JUDGE."}\n\nAdvocate for Petitioner:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}`,
      },
      { t: "space" },
      { t: "title", v: "Schedule" },
      { t: "pre", v: d.schedule || "________________" },
    ],
    generateCover: (d) => [
      { t: "small", v: "(Order 38 Rule 5)" },
      { t: "center", v: d.court || "In the Court of the Subordinate Judge, Salem" },
      { t: "space" },
      {
        t: "left",
        v: `I. A. No.  ${d.iaNo || "          / 20"}\n        in\nO. S. No.  ${d.osNo || "          / 20"}`,
      },
      { t: "space" },
      { t: "party", v: d.client || "________________", role: `...${d.clientRole || "Petitioner (s) / Plaintiff (s)"}` },
      { t: "versus", v: "Vs." },
      { t: "party", v: d.opponent || "________________", role: `...${d.opponentRole || "Respondents / Defendants"}` },
      { t: "space" },
      {
        t: "title",
        v: `NOTICE UNDER ORDER 38 RULE 5\n(ATTACHMENT BEFORE JUDGMENT)`,
      },
      { t: "space" },
      {
        t: "signblock",
        v: `By Counsel:\n${d.advocate || ADVOCATE_DEFAULTS.advocateName}\n${d.officeAddr || ADVOCATE_DEFAULTS.advocateAddress}\nEnrol No.: ${d.barNo || ADVOCATE_DEFAULTS.enrolNo}\nMobile: ${d.phone || ADVOCATE_DEFAULTS.phone}`,
      },
    ],
  },
];

/* ---------------------------------------------------------------
   Rendering helpers — shared by preview, print, Word export
----------------------------------------------------------------*/

export function blocksToPlainText(blocks) {
  return blocks
    .map((b) => {
      switch (b.t) {
        case "center":
        case "titleTop":
        case "left":
        case "right":
        case "small":
        case "title":
        case "para":
          return b.v;
        case "party":
          return `${b.v}\t${b.role}`;
        case "versus":
          return b.v || "Versus";
        case "num":
          return `${b.n}. ${b.v}`;
        case "signblock":
          return `\n${b.v}`;
        case "signdual":
          return `\n${b.left || ""}\t\t${b.right || ""}`;
        case "sign":
          return `\n${b.place ? `Place: ${b.place}\n` : ""}${b.date ? `Date: ${b.date}\n` : ""}${b.label || ""}`;
        case "space":
          return "";
        case "table": {
          const rows = b.rows || [];
          return rows.map((r) => `${r.sno}\t${r.filedDate}\t${r.docDate}\t${r.desc}\t${r.remarks}`).join("\n");
        }
        case "caForm14Table": {
          const rows = b.rows || [];
          const header = "லக்கம்\tதஸ்தாவேசு தாக்கலான தேதி\tதஸ்தாவேசு தேதி\tதஸ்தாவேசு விபரம்\tஎந்த உத்திரவின் பேரில் மனு கொடுக்கப்படுகிறதோ அந்த உத்திரவின் விபரம்";
          const dataRows = rows.map((r) => `${r.sno}\t${r.filedDate}\t${r.docDate}\t${r.desc}\t${r.purpose || r.remarks || ""}`).join("\n");
          return `${header}\n${dataRows}`;
        }
        case "form46ParticularsTable": {
          const items = b.items || [];
          return items
            .map((it) => {
              if (it.isHeader) return `\n[${it.section}]\n`;
              return `${it.q} : ${it.a}`;
            })
            .join("\n");
        }
        case "lodgmentTable": {
          const rows = b.rows || [];
          const header = "Particulars of funds to be lodged\tPerson to make the lodgment\tCash Rs.\tCash P.\tSecurities Rs.\tSecurities P.";
          const dataRows = rows.map((r) => `${r.particulars}\t${r.lodger}\t${r.cashRs}\t${r.cashP}\t${r.secRs}\t${r.secP}`).join("\n");
          const totals = b.totals || {};
          const totalRow = `Total\t\t${totals.cashRs || "—"}\t${totals.cashP || "—"}\t${totals.secRs || "—"}\t${totals.secP || "—"}`;
          return `${header}\n${dataRows}\n${totalRow}`;
        }
        case "epTable": {
          const rows = b.rows || [];
          return rows.map((r) => {
            if (r.subTitle) {
              return `${r.no}. ${r.title}:\n${r.val}\n\n${r.subTitle}:\n${r.subVal}`;
            }
            if (r.costs) {
              const c = r.costs;
              return `${r.no}. ${r.title}:\n${r.val}\nஇந்த மனுவுக்கான ஸ்டாம்ப்: ரூ. ${c.stamp}\nஇம்மனுவுக்கான வழக்கறிஞர் கட்டணம்: ரூ. ${c.advocate}\nஇம்மனு பிராசஸ் செலவு: ரூ. ${c.process}\nதட்டச்சு கூலி: ரூ. ${c.typing}\nமொத்தம்: ரூ. ${c.total}`;
            }
            return `${r.no}. ${r.title}:\n${r.val}`;
          }).join("\n\n");
        }
        case "propValuationTable": {
          const rows = b.rows || [];
          const header = "Section and sub section of the Act.\tNature of suit\tAnnual revenue or rent payable\tMarket Value\tValue for Purposes of Court fees";
          const dataRows = rows.map((r) => `${r.section}\t${r.nature}\t${r.revenue}\t${r.marketVal}\t${r.courtFeeVal}`).join("\n");
          return `${header}\n${dataRows}`;
        }
        case "billOfCostsTable": {
          const items = b.items || [];
          const lines = items.map((it) => `${it.no}. ${it.title}${it.sub ? ` (${it.sub})` : ""}: Rs. ${it.val}`);
          return [
            "நெ.\tவிபரம்\tதொகை (ரூ.)",
            ...lines,
            `Total Costs :- Rs. ${b.totalCosts || "0"}`,
            `Credit Costs allowed to opponents: Rs. ${b.creditCosts || "0"}`,
            `Balance Claimed: Rs. ${b.balanceClaimed || "0"}`,
            "",
            b.advocateCert || "",
            `Date: ${b.date || ""}    Advocate for ${b.filedBy || "வாதி"}`,
            "Sum if any disallow: ____________    Amount allowed: ____________",
            "Checked                                District Judge / Munsif."
          ].join("\n");
        }
        case "pre":
          return b.v;
        default:
          return "";
      }
    })
    .join("\n\n");
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");

/**
 * Blocks → HTML string. `folded` renders for the narrow backing-sheet
 * column: party name and role stack instead of sitting on one line, and
 * body text is left-aligned rather than justified.
 *
 * Party rows use a two-cell table rather than flexbox — Word's HTML
 * renderer ignores flex, which would drop the role right beside the
 * name instead of aligning it to the right margin.
 */
export function renderBlocks(blocks, { folded = false } = {}) {
  const align = folded ? "left" : "justify";
  return blocks
    .map((b) => {
      switch (b.t) {
        case "small":
          return `<p style="text-align:center;font-size:14px;margin:0 0 8px;color:#555;">${esc(b.v)}</p>`;
        case "titleTop":
          return `<p style="text-align:center;font-weight:bold;font-size:19px;text-decoration:underline;letter-spacing:2px;margin:0 0 14px;">${esc(b.v)}</p>`;
        case "center":
          return `<p style="text-align:center;font-weight:bold;font-size:17.5px;margin:6px 0 12px;line-height:1.65;letter-spacing:0.25px;white-space:pre-line;">${esc(b.v)}</p>`;
        case "left":
          return `<p style="margin:6px 0;line-height:1.7;font-size:17px;white-space:pre-line;">${esc(b.v)}</p>`;
        case "right":
          return `<p style="text-align:right;margin:6px 0;line-height:1.7;font-size:17px;white-space:pre-line;">${esc(b.v)}</p>`;
        case "party":
          return folded
            ? `<div style="margin:12px 0;line-height:1.6;white-space:pre-line;"><strong style="font-size:16.5px;">${esc(b.v)}</strong><br/><span style="font-size:14.5px;color:#333;font-style:italic;">${esc(b.role)}</span></div>`
            : `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 10px;"><tr>` +
            `<td valign="top" style="white-space:pre-line;line-height:1.7;font-weight:bold;font-size:17px;">${esc(b.v)}</td>` +
            `<td valign="top" align="right" style="text-align:right;color:#333;white-space:nowrap;line-height:1.7;font-style:italic;padding-left:14px;font-size:16px;">...${esc(b.role ? b.role.replace(/^\.\.\./, "") : "")}</td>` +
            `</tr></table>`;
        case "versus":
          return `<p style="text-align:center;font-style:italic;margin:10px 0;font-size:16px;color:#444;">${b.v ? `— ${esc(b.v)} —` : "— Versus —"}</p>`;
        case "title":
          return `<p style="text-align:center;font-weight:bold;font-size:18px;text-decoration:underline;letter-spacing:0.5px;margin:22px 0 18px;line-height:1.7;white-space:pre-line;">${esc(b.v)}</p>`;
        case "num":
          return `<p style="margin:12px 0;text-align:${align};line-height:1.85;text-indent:32px;font-size:17px;white-space:pre-line;"><b>${b.n}.</b>&nbsp;&nbsp;${esc(b.v)}</p>`;
        case "para":
          return `<p style="margin:12px 0;text-align:${align};line-height:1.85;text-indent:${folded ? "0" : "32px"};font-size:17px;white-space:pre-line;">${esc(b.v)}</p>`;
        case "prayer":
          return `<div style="margin:18px 0;padding:12px 16px;background:#fafafa;border-left:3.5px solid #b8935e;"><p style="font-weight:bold;margin:0 0 6px;font-size:17px;text-decoration:underline;">PRAYER:</p><p style="margin:0;text-align:${align};line-height:1.85;text-indent:20px;font-size:17px;white-space:pre-line;">${esc(b.v)}</p></div>`;
        case "table": {
          const rows = b.rows || [];
          return `<table width="100%" cellpadding="5" cellspacing="0" style="width:100%;border-collapse:collapse;border:1.5px solid #222;margin:12px 0;font-size:14.5px;">
<thead>
<tr style="background:#f2f2f2;">
<th style="border:1px solid #222;padding:6px 5px;text-align:center;width:8%;">S. No.</th>
<th style="border:1px solid #222;padding:6px 5px;text-align:left;width:22%;">Date of Filing</th>
<th style="border:1px solid #222;padding:6px 5px;text-align:left;width:22%;">Date of Document</th>
<th style="border:1px solid #222;padding:6px 5px;text-align:left;width:30%;">Description of Documents</th>
<th style="border:1px solid #222;padding:6px 5px;text-align:left;width:18%;">Remarks</th>
</tr>
</thead>
<tbody>
${rows.map((r) => `<tr>
<td style="border:1px solid #222;padding:5px 6px;text-align:center;">${esc(r.sno)}</td>
<td style="border:1px solid #222;padding:5px 6px;">${esc(r.filedDate)}</td>
<td style="border:1px solid #222;padding:5px 6px;">${esc(r.docDate)}</td>
<td style="border:1px solid #222;padding:5px 6px;">${esc(r.desc)}</td>
<td style="border:1px solid #222;padding:5px 6px;">${esc(r.remarks)}</td>
</tr>`).join("")}
</tbody>
</table>`;
        }
        case "caForm14Table": {
          const rows = b.rows || [];
          return `<table width="100%" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;border:1.5px solid #222;margin:14px 0;font-size:14px;">
<thead>
<tr style="background:#f2f2f2;font-weight:bold;text-align:center;">
<th style="border:1px solid #222;padding:6px 4px;width:8%;vertical-align:middle;">லக்கம்<br/><span style="font-size:11.5px;font-weight:normal;color:#444;">(S.No.)</span></th>
<th style="border:1px solid #222;padding:6px 6px;width:18%;vertical-align:middle;text-align:center;">தஸ்தாவேசு தாக்கலான தேதி<br/><span style="font-size:11.5px;font-weight:normal;color:#444;">(Date of Filing)</span></th>
<th style="border:1px solid #222;padding:6px 6px;width:18%;vertical-align:middle;text-align:center;">தஸ்தாவேசு தேதி<br/><span style="font-size:11.5px;font-weight:normal;color:#444;">(Date of Doc)</span></th>
<th style="border:1px solid #222;padding:6px 8px;width:28%;vertical-align:middle;text-align:left;">தஸ்தாவேசு விபரம்<br/><span style="font-size:11.5px;font-weight:normal;color:#444;">(Description of Document)</span></th>
<th style="border:1px solid #222;padding:6px 8px;width:28%;vertical-align:middle;text-align:left;">எந்த உத்திரவின் பேரில் மனு கொடுக்கப்படுகிறதோ அந்த உத்திரவின் விபரம்<br/><span style="font-size:11.5px;font-weight:normal;color:#444;">(Order / Purpose Details)</span></th>
</tr>
</thead>
<tbody>
${rows.map((r) => `<tr>
<td style="border:1px solid #222;padding:6px 4px;text-align:center;vertical-align:top;">${esc(r.sno)}</td>
<td style="border:1px solid #222;padding:6px 6px;text-align:center;vertical-align:top;">${esc(r.filedDate)}</td>
<td style="border:1px solid #222;padding:6px 6px;text-align:center;vertical-align:top;">${esc(r.docDate)}</td>
<td style="border:1px solid #222;padding:6px 8px;vertical-align:top;line-height:1.5;">${esc(r.desc)}</td>
<td style="border:1px solid #222;padding:6px 8px;vertical-align:top;line-height:1.5;">${esc(r.purpose || r.remarks || "")}</td>
</tr>`).join("")}
</tbody>
</table>`;
        }
        case "form46ParticularsTable": {
          const items = b.items || [];
          return `<table width="100%" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;border:1.5px solid #333;margin:14px 0;font-size:14.5px;">
<tbody>
${items.map((it) => {
  if (it.isHeader) {
    return `<tr style="background:#ebebeb;font-weight:bold;">
<td colspan="2" style="border:1px solid #333;padding:7px 10px;font-size:14.5px;color:#111;">${esc(it.section)}</td>
</tr>`;
  }
  return `<tr>
<td valign="top" style="border:1px solid #ccc;width:52%;padding:6px 9px;line-height:1.6;font-weight:600;color:#222;">${esc(it.q)}</td>
<td valign="top" style="border:1px solid #ccc;width:48%;padding:6px 9px;line-height:1.6;color:#111;"><b>:</b> ${esc(it.a)}</td>
</tr>`;
}).join("")}
</tbody>
</table>`;
        }
        case "lodgmentTable": {
          const rows = b.rows || [];
          const totals = b.totals || {};
          return `<table width="100%" cellpadding="5" cellspacing="0" style="width:100%;border-collapse:collapse;border:1.5px solid #222;margin:14px 0;font-size:14.5px;">
<thead>
<tr style="background:#f2f2f2;">
<th rowspan="3" style="border:1px solid #222;padding:6px 6px;text-align:left;vertical-align:middle;width:34%;">Particulars of funds to be lodged</th>
<th rowspan="3" style="border:1px solid #222;padding:6px 6px;text-align:left;vertical-align:middle;width:26%;">Person to make the lodgment</th>
<th colspan="4" style="border:1px solid #222;padding:5px 6px;text-align:center;width:40%;">Amount</th>
</tr>
<tr style="background:#f7f7f7;">
<th colspan="2" style="border:1px solid #222;padding:4px 4px;text-align:center;width:20%;">Cash</th>
<th colspan="2" style="border:1px solid #222;padding:4px 4px;text-align:center;width:20%;">Securities</th>
</tr>
<tr style="background:#fafafa;font-size:13px;">
<th style="border:1px solid #222;padding:3px 4px;text-align:center;width:14%;">Rs.</th>
<th style="border:1px solid #222;padding:3px 4px;text-align:center;width:6%;">P.</th>
<th style="border:1px solid #222;padding:3px 4px;text-align:center;width:14%;">Rs.</th>
<th style="border:1px solid #222;padding:3px 4px;text-align:center;width:6%;">P.</th>
</tr>
</thead>
<tbody>
${rows.map((r) => `<tr>
<td style="border:1px solid #222;padding:6px 6px;text-align:left;">${esc(r.particulars)}</td>
<td style="border:1px solid #222;padding:6px 6px;text-align:left;">${esc(r.lodger)}</td>
<td style="border:1px solid #222;padding:6px 5px;text-align:right;">${esc(r.cashRs)}</td>
<td style="border:1px solid #222;padding:6px 4px;text-align:center;">${esc(r.cashP)}</td>
<td style="border:1px solid #222;padding:6px 5px;text-align:right;">${esc(r.secRs)}</td>
<td style="border:1px solid #222;padding:6px 4px;text-align:center;">${esc(r.secP)}</td>
</tr>`).join("")}
<tr style="font-weight:bold;background:#f7f7f7;">
<td colspan="2" style="border:1px solid #222;padding:6px 8px;text-align:right;">Total</td>
<td style="border:1px solid #222;padding:6px 5px;text-align:right;">${esc(totals.cashRs || "—")}</td>
<td style="border:1px solid #222;padding:6px 4px;text-align:center;">${esc(totals.cashP || "—")}</td>
<td style="border:1px solid #222;padding:6px 5px;text-align:right;">${esc(totals.secRs || "—")}</td>
<td style="border:1px solid #222;padding:6px 4px;text-align:center;">${esc(totals.secP || "—")}</td>
</tr>
</tbody>
</table>`;
        }
        case "epTable": {
          const rows = b.rows || [];
          return `<table width="100%" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;border:1.5px solid #222;margin:14px 0;font-size:14.5px;">
<tbody>
${rows.map((r) => {
            if (r.subTitle) {
              return `<tr>
<td valign="top" style="border:1px solid #222;width:45%;font-weight:bold;padding:7px 8px;line-height:1.6;">
  <div>${esc(r.no)}. ${esc(r.title)}</div>
  <div style="margin-top:24px;">${esc(r.subTitle)}</div>
</td>
<td valign="top" style="border:1px solid #222;width:55%;padding:7px 8px;line-height:1.6;white-space:pre-line;">
  <div>${esc(r.val)}</div>
  <div style="margin-top:16px;padding-top:8px;border-top:1px dashed #bbb;">${esc(r.subVal)}</div>
</td>
</tr>`;
            }
            if (r.costs) {
              const c = r.costs;
              return `<tr>
<td valign="top" style="border:1px solid #222;width:45%;font-weight:bold;padding:7px 8px;line-height:1.6;">
  ${esc(r.no)}. ${esc(r.title)}
</td>
<td valign="top" style="border:1px solid #222;width:55%;padding:7px 8px;line-height:1.6;">
  <div style="margin-bottom:8px;font-weight:bold;">${esc(r.val)}</div>
  <table width="100%" cellpadding="3" cellspacing="0" style="font-size:13.5px;border-collapse:collapse;margin-top:6px;">
    <tr><td>இந்த மனுவுக்கான ஸ்டாம்ப்</td><td align="right" style="text-align:right;">ரூ. ${esc(c.stamp)}</td></tr>
    <tr><td>இம்மனுவுக்கான வழக்கறிஞர் கட்டணம்</td><td align="right" style="text-align:right;">ரூ. ${esc(c.advocate)}</td></tr>
    <tr><td>இம்மனு பிராசஸ் செலவு</td><td align="right" style="text-align:right;">ரூ. ${esc(c.process)}</td></tr>
    <tr><td>தட்டச்சு கூலி</td><td align="right" style="text-align:right;">ரூ. ${esc(c.typing)}</td></tr>
    <tr style="border-top:1.5px solid #333;font-weight:bold;">
      <td>மொத்தம்</td><td align="right" style="text-align:right;">ரூ. ${esc(c.total)}</td>
    </tr>
  </table>
</td>
</tr>`;
            }
            return `<tr>
<td valign="top" style="border:1px solid #222;width:45%;font-weight:bold;padding:7px 8px;line-height:1.6;">
  ${esc(r.no)}. ${esc(r.title)}
</td>
<td valign="top" style="border:1px solid #222;width:55%;padding:7px 8px;line-height:1.6;white-space:pre-line;">
  ${esc(r.val)}
</td>
</tr>`;
          }).join("")}
</tbody>
</table>`;
        }
        case "propValuationTable": {
          const rows = b.rows || [];
          return `<table width="100%" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;border:1.5px solid #222;margin:14px 0;font-size:14px;">
<thead>
<tr style="background:#f2f2f2;font-weight:bold;">
<th style="border:1px solid #222;padding:7px 6px;text-align:left;width:20%;">Section and sub section of the Act.</th>
<th style="border:1px solid #222;padding:7px 6px;text-align:left;width:28%;">Nature of suit</th>
<th style="border:1px solid #222;padding:7px 6px;text-align:center;width:17%;">Annual revenue or rent payable</th>
<th style="border:1px solid #222;padding:7px 6px;text-align:center;width:17%;">Market Value</th>
<th style="border:1px solid #222;padding:7px 6px;text-align:center;width:18%;">Value for Purposes of Court fees</th>
</tr>
</thead>
<tbody>
${rows.map((r) => `<tr>
<td style="border:1px solid #222;padding:6px 6px;text-align:left;vertical-align:top;">${esc(r.section)}</td>
<td style="border:1px solid #222;padding:6px 6px;text-align:left;vertical-align:top;">${esc(r.nature)}</td>
<td style="border:1px solid #222;padding:6px 6px;text-align:right;vertical-align:top;">${esc(r.revenue)}</td>
<td style="border:1px solid #222;padding:6px 6px;text-align:right;vertical-align:top;">${esc(r.marketVal)}</td>
<td style="border:1px solid #222;padding:6px 6px;text-align:right;vertical-align:top;">${esc(r.courtFeeVal)}</td>
</tr>`).join("")}
</tbody>
</table>`;
        }
        case "billOfCostsTable": {
          const items = b.items || [];
          return `<table width="100%" cellpadding="5" cellspacing="0" style="width:100%;border-collapse:collapse;border:1.5px solid #222;margin:12px 0;font-size:14.5px;">
<thead>
<tr style="background:#f2f2f2;font-weight:bold;">
<th style="border:1px solid #222;padding:6px;text-align:center;width:8%;">நெ.</th>
<th style="border:1px solid #222;padding:6px;text-align:left;width:68%;">விபரம்</th>
<th style="border:1px solid #222;padding:6px;text-align:right;width:24%;">தொகை (ரூ.)</th>
</tr>
</thead>
<tbody>
${items.map((it) => `<tr>
<td style="border:1px solid #222;padding:5px 6px;text-align:center;vertical-align:top;">${it.no}</td>
<td style="border:1px solid #222;padding:5px 8px;vertical-align:top;">
  <div style="font-weight:500;">${esc(it.title)}</div>
  ${it.sub ? `<div style="font-size:12.5px;color:#555;text-align:right;padding-right:20px;">${esc(it.sub)}</div>` : ""}
</td>
<td style="border:1px solid #222;padding:5px 8px;text-align:right;vertical-align:top;font-family:monospace;font-size:15px;">
  ${it.val === "0" || it.val === "—" ? "—" : esc(it.val)}
</td>
</tr>`).join("")}
<tr style="font-weight:bold;background:#fafafa;border-top:1.5px solid #222;">
<td colspan="2" style="border:1px solid #222;padding:7px 10px;text-align:right;">Total Costs :-</td>
<td style="border:1px solid #222;padding:7px 8px;text-align:right;font-family:monospace;font-size:15.5px;">ரூ. ${esc(b.totalCosts || "0")}</td>
</tr>
<tr style="font-size:13.5px;">
<td colspan="2" style="border:1px solid #222;padding:6px 10px;text-align:right;">Credit the Costs allowed to the opponents:</td>
<td style="border:1px solid #222;padding:6px 8px;text-align:right;font-family:monospace;">${b.creditCosts === "0" ? "—" : "ரூ. " + esc(b.creditCosts || "0")}</td>
</tr>
<tr style="font-weight:bold;background:#f5f5f5;">
<td colspan="2" style="border:1px solid #222;padding:7px 10px;text-align:right;">Balance Claimed:</td>
<td style="border:1px solid #222;padding:7px 8px;text-align:right;font-family:monospace;font-size:15.5px;">ரூ. ${esc(b.balanceClaimed || "0")}</td>
</tr>
</tbody>
</table>
<div style="margin-top:14px;border:1px solid #bbb;padding:12px;background:#fafafa;font-size:14px;line-height:1.6;page-break-inside:avoid;">
  <div style="font-style:italic;margin-bottom:8px;">${esc(b.advocateCert || "")}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
    <tr>
      <td valign="top" style="width:50%;"><div>Date :- ${esc(b.date || "")}</div></td>
      <td valign="top" align="right" style="width:50%;text-align:right;font-weight:bold;">Advocate for ${esc(b.filedBy || "வாதி")}</td>
    </tr>
  </table>
  <div style="margin-top:12px;padding-top:8px;border-top:1px dashed #aaa;display:flex;justify-content:space-between;">
    <div>Sum if any disallow: ____________</div>
    <div style="font-weight:bold;">Amount allowed: ____________</div>
  </div>
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;font-weight:bold;font-size:15px;page-break-inside:avoid;">
  <tr>
    <td align="left">Checked</td>
    <td align="right" style="text-align:right;">District Judge / Munsif.</td>
  </tr>
</table>`;
        }
        case "signdual":
          return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:24px;margin-bottom:8px;page-break-inside:avoid;"><tr>` +
            `<td valign="bottom" align="left" style="font-weight:bold;font-size:17px;line-height:1.7;">${esc(b.left || "Accused")}</td>` +
            `<td valign="bottom" align="right" style="text-align:right;font-weight:bold;font-size:17px;line-height:1.7;">${esc(b.right || "Counsel for Accused")}</td>` +
            `</tr></table>`;
        case "sign":
          return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:24px;margin-bottom:8px;page-break-inside:avoid;"><tr>` +
            `<td valign="bottom" align="left" style="font-size:16px;line-height:1.65;">` +
            (b.place ? `<div>Place: ${esc(b.place)}</div>` : "") +
            (b.date ? `<div>Date: ${esc(b.date)}</div>` : "") +
            `</td>` +
            `<td valign="bottom" align="right" style="text-align:right;font-weight:bold;font-size:17px;line-height:1.7;">${esc(b.label || "Counsel")}</td>` +
            `</tr></table>`;
        case "signblock": {
          const raw = b.v || "";
          if (raw.includes("\t") || /\s{4,}/.test(raw)) {
            const parts = raw.split(/\t|\s{4,}/);
            const leftPart = parts[0] || "";
            const rightPart = parts[1] || "";
            return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:24px;margin-bottom:8px;page-break-inside:avoid;"><tr>` +
              `<td valign="bottom" align="left" style="font-weight:bold;font-size:17px;line-height:1.7;">${esc(leftPart.trim())}</td>` +
              `<td valign="bottom" align="right" style="text-align:right;font-weight:bold;font-size:17px;line-height:1.7;">${esc(rightPart.trim())}</td>` +
              `</tr></table>`;
          }
          return `<div style="margin-top:20px;margin-bottom:6px;text-align:right;line-height:1.75;font-size:16.5px;white-space:pre-line;page-break-inside:avoid;">${esc(raw)}</div>`;
        }
        case "space":
          return `<div style="height:10px;">&nbsp;</div>`;
        case "pre":
          return `<pre style="font-family:'Courier New',monospace;font-size:13.5px;line-height:1.5;white-space:pre-wrap;margin:12px 0;padding:8px;background:#f9f9f9;border:1px solid #ddd;">${esc(b.v)}</pre>`;
        default:
          return "";
      }
    })
    .join("\n");
}

export function partitionBlocks(blocks) {
  if (!blocks || blocks.length === 0) return { main: [], footer: [] };

  // Find index where signature/closing starts
  let signIdx = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].t === "signblock" || blocks[i].t === "signdual" || blocks[i].t === "sign") {
      signIdx = i;
      break;
    }
  }

  if (signIdx === -1) {
    return { main: blocks, footer: [] };
  }

  // Include preceding Date/Place or Acceptance block if right before signature
  let footerStart = signIdx;
  if (footerStart > 0) {
    const prev = blocks[footerStart - 1];
    if (
      (prev.t === "left" && /Date|Place|Identified/i.test(prev.v)) ||
      (prev.t === "right" && /Date|Place/i.test(prev.v)) ||
      (prev.t === "para" && /^Accepted/i.test(prev.v))
    ) {
      footerStart = footerStart - 1;
    }
  }

  // Strip any trailing space blocks from main section before footer
  let mainEnd = footerStart;
  while (mainEnd > 0 && blocks[mainEnd - 1].t === "space") {
    mainEnd--;
  }

  return {
    main: blocks.slice(0, mainEnd),
    footer: blocks.slice(footerStart),
  };
}

/**
 * Main petition page as an HTML fragment: covers throughout the page
 * with court header, parties, averments, and prayer in the upper section,
 * and advocate / party signatures & hearing dates anchored at the bottom.
 */
export function petitionPageFragment(blocks) {
  const { main, footer } = partitionBlocks(blocks);
  return `<div class="petition-page-wrapper" style="min-height:24.5cm;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;">
  <div class="petition-main-body" style="flex:1 0 auto;">
    ${renderBlocks(main)}
  </div>
  ${footer.length > 0 ? `
  <div class="petition-footer-zone" style="margin-top:auto;padding-top:28px;">
    ${renderBlocks(footer)}
  </div>` : ""}
</div>`;
}

/**
 * Full printable/Word document for page 1 plus an optional page 2
 * (the folded backing sheet).
 *
 * Page 1 and Page 2 are wrapped in WordSection divs.
 * In browser Print / PDF, div.WordSection2 uses page-break-before: always
 * and break-before: page to cleanly place Page 2 on sheet 2 without inserting
 * empty artifact paragraphs.
 * For Microsoft Word (.doc export), an mso section break is provided so
 * Word creates a clean Section Break with distinct margins for the Docket.
 */
export function buildDocumentHtml(page1, page2, title) {
  const hasTwoPages = Boolean(page2 && page2.length > 0);
  // When there are two pages, Page 1 is the folded backing sheet (docket) and Page 2 is the main petition
  const section1 = hasTwoPages ? foldedPageFragment(page1) : petitionPageFragment(page1);
  const section2 = hasTwoPages ? petitionPageFragment(page2) : "";

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word">
<title>${esc(title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
@page { size: A4 portrait; margin: 0; }
${hasTwoPages ? `
@page WordSection1 { size: 21.0cm 29.7cm; margin: 0; mso-page-orientation: portrait; }
div.WordSection1 { page: WordSection1; box-sizing: border-box; padding: 1.8cm 1.5cm 1.8cm 1.5cm; }
@page WordSection2 { size: 21.0cm 29.7cm; margin: 0; mso-page-orientation: portrait; }
div.WordSection2 { page: WordSection2; page-break-before: always; break-before: page; box-sizing: border-box; padding: 2.2cm 2.0cm 1.4cm 2.8cm; }
` : `
@page WordSection1 { size: 21.0cm 29.7cm; margin: 0; mso-page-orientation: portrait; }
div.WordSection1 { page: WordSection1; box-sizing: border-box; padding: 2.2cm 2.0cm 1.4cm 2.8cm; }
`}
body { 
  font-family: 'Times New Roman', 'Liberation Serif', serif; 
  font-size: 17px; 
  line-height: 1.9; 
  color: #111111; 
  margin: 0; 
  padding: 0;
}
@media screen { 
  body { max-width: 780px; margin: 30px auto; padding: 24px; } 
}
@media print {
  body { margin: 0; }
  div.WordSection2 { page-break-before: always; break-before: page; }
  .petition-page-wrapper { min-height: 24.5cm !important; }
}
</style>
</head>
<body>
<div class="WordSection1">
${section1}
</div>
${hasTwoPages ? `<!--[if mso]>
<br clear="all" style="page-break-before:always;mso-break-type:section-break" />
<![endif]-->
<div class="WordSection2">
${section2}
</div>` : ""}
</body>
</html>`;
}

/** Single page only — kept for callers that don't need a backing sheet. */
export function blocksToHtml(blocks, title) {
  return buildDocumentHtml(blocks, null, title);
}

/**
 * Page 2 — the backing sheet / docket — as an HTML fragment: a table
 * with a blank left column, a dashed fold line, and the docket content
 * in the right column, so the sheet folds with the docket facing
 * outwards, exactly as filed.
 *
 * Word's HTML renderer ignores flexbox and absolute positioning but
 * handles tables well, so the fold survives both browser Print and the
 * .doc download. The page break that puts this on its own sheet is
 * handled cleanly on div.WordSection2.
 */
export function foldedPageFragment(blocks) {
  const mainBlocks = blocks.filter((b) => b.t !== "signblock");
  const signBlocks = blocks.filter((b) => b.t === "signblock");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;height:100%;min-height:24cm;border-collapse:collapse;font-family:'Times New Roman',serif;font-size:16.5px;">
<tr>
<td width="48%" valign="top" style="width:48%;">&nbsp;</td>
<td width="2%" valign="top" style="width:2%;border-left:1.5px dashed #888888;">&nbsp;</td>
<td width="50%" valign="top" style="width:50%;padding:24px 10px 20px 18px;vertical-align:top;">
  <div style="min-height:22cm;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;">
    <div>
      ${renderBlocks(mainBlocks, { folded: true })}
    </div>
    <div style="margin-top:auto;padding-top:32px;">
      ${renderBlocks(signBlocks, { folded: true })}
    </div>
  </div>
</td>
</tr>
</table>`;
}

/* ---------------------------------------------------------------
   Custom (AI-imported) template helpers
----------------------------------------------------------------*/

export function paramsFromCustomTemplate(tpl) {
  return tpl.fields.map((f) => F(f.id, f.label, { w: "full" }));
}

export function generateFromCustomTemplate(tpl, data) {
  const paragraphs = tpl.template.split(/\n\n+/);
  return paragraphs.map((p) => {
    const filled = p.replace(/\{\{(\w+)\}\}/g, (_, id) => {
      const v = data[id];
      return v && v.trim() ? v : "________";
    });
    const trimmed = filled.trim();
    const isTitleLike =
      /^[A-Z0-9 .,'()/\-–]+$/.test(trimmed) && trimmed.length > 8 && trimmed === trimmed.toUpperCase();
    return { t: isTitleLike ? "title" : "para", v: trimmed };
  });
}
