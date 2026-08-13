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
      let table = "-------------------------------------------------------------------------------------------------------\n";
      table += "S. No. | Date of filing documents | Date of the documents | Description of the documents       | Remarks\n";
      table += "-------------------------------------------------------------------------------------------------------\n";
      lines.forEach((line) => {
        const parts = line.split("|").map((s) => s.trim());
        const sno = parts[0] || "";
        const fd = parts[1] || "";
        const dd = parts[2] || "";
        const desc = parts[3] || "";
        const rem = parts[4] || "";
        table += `${sno.padEnd(6)} | ${fd.padEnd(24)} | ${dd.padEnd(21)} | ${desc.padEnd(34)} | ${rem}\n`;
      });
      table += "-------------------------------------------------------------------------------------------------------";

      return [
        { t: "center", v: "APPLICATION FOR COPIES" },
        { t: "space" },
        { t: "center", v: `IN THE COURT OF THE ${up(d.court)}` },
        { t: "left", v: `No.: ${d.caseNo || "____"}` },
        { t: "space" },
        { t: "party", v: d.client || "________________", role: `${d.clientRole}` },
        { t: "versus" },
        { t: "party", v: d.opponent || "________________", role: `${d.opponentRole}` },
        { t: "space" },
        { t: "left", v: "To\nThe judge of the said court" },
        { t: "space" },
        { t: "left", v: `Application for certified copies filed on behalf of ${d.filedBy || "Accused"}` },
        { t: "space" },
        { t: "para", v: `It is requested that the Certified Copies of the documents here under mentioned may be furnished to the ${d.furnishedTo || "Counsel for Accused"}` },
        { t: "space" },
        { t: "pre", v: table },
        { t: "space" },
        { t: "signblock", v: `Counsel for ${d.filedBy || "Accused"}` },
      ];
    },
    generateCover: (d) => [
      { t: "left", v: "Date of Hearing:\nDate of disposal:" },
      { t: "space" },
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
  }
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
          return "Versus";
        case "num":
          return `${b.n}. ${b.v}`;
        case "signblock":
          return `\n${b.v}`;
        case "space":
          return "";
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
function renderBlocks(blocks, { folded = false } = {}) {
  const align = folded ? "left" : "justify";
  return blocks
    .map((b) => {
      switch (b.t) {
        case "small":
          return `<p style="text-align:center;font-size:11px;margin:0 0 4px;">${esc(b.v)}</p>`;
        case "titleTop":
          return `<p style="text-align:center;font-weight:bold;text-decoration:underline;letter-spacing:2px;margin:0 0 10px;">${esc(b.v)}</p>`;
        case "center":
          return `<p style="text-align:center;font-weight:bold;margin:0 0 6px;white-space:pre-line;">${esc(b.v)}</p>`;
        case "left":
          return `<p style="margin:0 0 2px;white-space:pre-line;">${esc(b.v)}</p>`;
        case "right":
          return `<p style="text-align:right;margin:0 0 2px;white-space:pre-line;">${esc(b.v)}</p>`;
        case "party":
          return folded
            ? `<p style="margin:0 0 6px;white-space:pre-line;">${esc(b.v)}<br/><span style="font-size:12px;color:#333;">${esc(b.role)}</span></p>`
            : `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 2px;"><tr>` +
              `<td valign="top" style="white-space:pre-line;">${esc(b.v)}</td>` +
              `<td valign="top" align="right" style="text-align:right;color:#444;white-space:nowrap;">${esc(b.role)}</td>` +
              `</tr></table>`;
        case "versus":
          return `<p style="text-align:center;font-style:italic;margin:2px 0;">Versus</p>`;
        case "title":
          return `<p style="text-align:center;font-weight:bold;text-decoration:underline;margin:14px 0;white-space:pre-line;">${esc(b.v)}</p>`;
        case "num":
          return `<p style="margin:0 0 10px;text-align:${align};white-space:pre-line;"><b>${b.n}.</b> ${esc(b.v)}</p>`;
        case "para":
          return `<p style="margin:0 0 10px;text-align:${align};white-space:pre-line;">${esc(b.v)}</p>`;
        case "signblock":
          return `<p style="margin:24px 0 0;text-align:right;white-space:pre-line;">${esc(b.v)}</p>`;
        case "space":
          return `<div style="height:8px;">&nbsp;</div>`;
        case "pre":
          return `<pre style="font-family:'Courier New',monospace;font-size:11px;white-space:pre-wrap;margin:10px 0;">${esc(b.v)}</pre>`;
        default:
          return "";
      }
    })
    .join("\n");
}

/**
 * Full printable/Word document for page 1 plus an optional page 2
 * (the folded backing sheet).
 *
 * The two pages live in separate WordSection divs with their own @page
 * rules, separated by an explicit break paragraph — this is the
 * structure Microsoft Word itself emits for a document with a page
 * break, and it is the only one Word honours reliably. A bare
 * `page-break-before` on a div or table is silently dropped by Word,
 * which is why everything used to land on one page. Browsers honour
 * the same break paragraph, so Print / Save-as-PDF matches.
 */
export function buildDocumentHtml(page1, page2, title) {
  const section1 = renderBlocks(page1);
  const section2 = page2 ? foldedPageFragment(page2) : "";
  // Exactly one break element. A paragraph is the one construct both
  // Word (maps to the "page break before" paragraph property) and
  // browsers honour; Word drops the property on divs and tables, and
  // browsers drop it on the <br> marker Word prefers. Two markers
  // stacked together would leave a blank page in between.
  const pageBreak = page2
    ? `<p style="page-break-before:always;mso-break-type:page-break;font-size:1pt;line-height:1pt;margin:0;">&nbsp;</p>`
    : "";

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word">
<title>${esc(title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
@page WordSection1 { size: 21.0cm 29.7cm; margin: 2.5cm 2.5cm 2.5cm 3.2cm; mso-page-orientation: portrait; }
div.WordSection1 { page: WordSection1; }
@page WordSection2 { size: 21.0cm 29.7cm; margin: 2.0cm 2.0cm 2.0cm 2.0cm; mso-page-orientation: portrait; }
div.WordSection2 { page: WordSection2; }
body { font-family: 'Times New Roman', serif; font-size: 13.5px; line-height: 1.55; color: #1a1a1a; margin: 0; }
@media screen { body { max-width: 720px; margin: 40px auto; } }
</style>
</head>
<body>
<div class="WordSection1">
${section1}
</div>
${pageBreak}
${page2 ? `<div class="WordSection2">\n${section2}\n</div>` : ""}
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
 * added by buildDocumentHtml, not here.
 */
export function foldedPageFragment(blocks) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-family:'Times New Roman',serif;font-size:13px;">
<tr>
<td width="53%" valign="top" style="width:53%;">&nbsp;</td>
<td width="2%" valign="top" style="width:2%;border-left:1.5px dashed #999999;">&nbsp;</td>
<td width="45%" valign="top" style="width:45%;padding:40px 10px 40px 14px;">
${renderBlocks(blocks, { folded: true })}
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
