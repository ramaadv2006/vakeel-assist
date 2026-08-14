/* ============================================================
   LANDING CONTENT — every claim on this page, in one file.

   RULE: nothing here is a marketing invention. Each number and
   capability below is checkable against the code, and the comment
   next to it says where. If a feature is removed or renamed, this
   file is the single place the page has to be corrected.

   Domain notes (why the wording is what it is):
   - The criminal codes changed on 1 July 2024: BNS replaced the IPC,
     BNSS replaced the CrPC, BSA replaced the Evidence Act. The bail,
     recall-warrant and exemption templates already cite BNSS sections
     (480, 72(2), 355 — see templates.js), so the page says exactly
     that rather than claiming a blanket "all sections updated": one
     template still carries its Cr.P.C. 256 heading, and several show
     the "I.P.C. / B.N.S." pair the way working drafts still do.
   - BCI Rules (Part VI, Ch. II, Rule 36) bar advocates from soliciting
     or advertising. This page therefore sells a private back-office
     tool to advocates — it never offers to list, rank, rate or refer
     them to clients, and there are no testimonials or named advocates
     anywhere on it. That restraint matters to this audience, so the
     "Private by design" section states it plainly.
   ============================================================ */

export const NAV_SECTIONS = [
  { id: 'why', label: 'Why' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'ai', label: 'AI' },
  { id: 'faq', label: 'FAQ' },
];

export const ROTATING = ['a hearing', 'a deadline', 'a filing', 'a limitation', 'a surety date'];

/* Trust strip under the hero. All four are code-checkable. */
export const HERO_PROOF = [
  { k: '13', v: 'court-ready drafts' },     // TEMPLATES.length in templates.js
  { k: '8', v: 'workspace modules' },       // NAV_LINKS in Header.jsx
  { k: '3', v: 'reminder channels' },       // whatsapp | sms | email in Settings.jsx
  { k: '₹0', v: 'to start' },               // no billing gate anywhere in the API
];

export const PERSONAS = [
  {
    icon: 'user',
    title: 'Solo advocates',
    body: 'Run the whole practice from one screen — today’s board, tomorrow’s drafts, this month’s fees.',
    points: ['Cause-list diary', 'Automatic reminders', 'One-tap drafts'],
  },
  {
    icon: 'clients',
    title: 'Chambers & juniors',
    body: 'Briefs, checklists and hearing dates stay in one shared place instead of five WhatsApp groups.',
    points: ['Per-case checklists', 'Client rolodex', 'Adjournment history'],
  },
  {
    icon: 'billing',
    title: 'Litigation teams',
    body: 'Track every matter across courts and benches, and see what is billed, pending and closed.',
    points: ['Fee & expense ledger', 'Case archive', 'Field-level audit trail'],
  },
];

export const STEPS = [
  {
    n: '01',
    title: 'Add the matter',
    body: 'Client, case number, court, case type and next date. Thirty seconds, once.',
  },
  {
    n: '02',
    title: 'Get the board',
    body: 'Every morning the dashboard sorts itself into Overdue, Today, This Week and Upcoming.',
  },
  {
    n: '03',
    title: 'Draft in minutes',
    body: 'Pick a template, fill the particulars, print with the backing sheet attached.',
  },
  {
    n: '04',
    title: 'Never miss a date',
    body: 'Reminders go out days before the hearing, and every edit is written to the case audit log.',
  },
];

/* ---------------------------------------------------------------
   The eight modules, in Header.jsx order. `mock` names the preview
   drawn by LandingArt for the interactive workspace explorer.
   --------------------------------------------------------------- */
export const MODULES = [
  {
    id: 'diary',
    icon: 'calendar',
    tab: 'Court diary',
    title: 'A cause list you can carry',
    body: 'The day’s hearings grouped by court, in date order, with a print button that produces a clean board — no app chrome, no colours, just the list you take with you.',
    points: ['Grouped by court', 'Print-ready layout', 'Client and case number on every row'],
    mock: 'diary',
  },
  {
    id: 'board',
    icon: 'case',
    tab: 'Case board',
    title: 'Four buckets, no sorting by hand',
    body: 'Active matters fall into Overdue, Today, This Week and Upcoming on their own. A matter untouched for 60 days is flagged stale, so nothing quietly rots at the bottom of the list.',
    points: ['Overdue · Today · This week · Upcoming', 'Stale-matter flag at 60 days', 'WhatsApp the next date to a client in one tap'],
    mock: 'board',
  },
  {
    id: 'clients',
    icon: 'clients',
    tab: 'Clients',
    title: 'Every client, and every matter they have with you',
    body: 'One searchable rolodex. Open a client and their active matters, phone and email are all on the same card — no scrolling a case list looking for the name.',
    points: ['Search by name or number', 'Active matters per client', 'Phone and email on the card'],
    mock: 'clients',
  },
  {
    id: 'tasks',
    icon: 'tasks',
    tab: 'Pre-hearing tasks',
    title: 'The checklist that travels with the matter',
    body: 'Attach tasks to a case — get the surety, collect the affidavit, file the copy application — and the hub lists every open item across matters, soonest hearing first.',
    points: ['Tasks live on the case', 'Hub sorted by next hearing', 'Open count per matter'],
    mock: 'tasks',
  },
  {
    id: 'billing',
    icon: 'billing',
    tab: 'Fee ledger',
    title: 'Agreed, collected, pending, spent',
    body: 'Four running totals across the whole practice, and the same four per matter. Expenses are tracked apart from fees, so the pending figure is the one you can actually chase.',
    points: ['Fee agreed vs. collected', 'Pending per client', 'Out-of-pocket expenses'],
    mock: 'ledger',
  },
  {
    id: 'archive',
    icon: 'archive',
    tab: 'Archive',
    title: 'Disposed, not deleted',
    body: 'Closed matters move out of the working board into the archive, grouped by how they ended. If one comes back on appeal or in revision, reopen it and the whole history comes with it.',
    points: ['Grouped by outcome', 'One-click reopen', 'History and audit log preserved'],
    mock: 'archive',
  },
  {
    id: 'audit',
    icon: 'audit',
    tab: 'Audit trail',
    title: 'Who changed the date, and when',
    body: 'Every edit to a matter is written to a per-case audit log with the old value, the new value and the timestamp. Adjournments also build a hearing history you can read like a docket.',
    points: ['Field-level change log', 'Adjournment history per case', 'Timestamped, newest first'],
    mock: 'audit',
  },
  {
    id: 'profile',
    icon: 'settings',
    tab: 'Chamber profile',
    title: 'Your letterhead details, entered once',
    body: 'Name with prefix, Bar Council enrolment number, chamber address and practice area sit in your profile — and flow into the drafts, so you are not retyping the signature block every time.',
    points: ['Enrolment number on file', 'Chamber address & practice area', 'Reminder channel and window'],
    mock: 'profile',
  },
];

/* ---------------------------------------------------------------
   All 13 DraftMitra templates, in the three groups templates.js
   defines, with the sub-lines it already carries.
   --------------------------------------------------------------- */
export const DRAFT_GROUPS = [
  {
    group: 'Petitions',
    items: [
      { name: 'Surrender Petition', sub: 'On behalf of the accused' },
      { name: 'Copy Application', sub: 'For certified copies' },
      { name: 'Advance Petition', sub: 'To advance the hearing' },
      { name: 'Recall Warrant Petition', sub: 'Section 72(2) B.N.S.S.' },
      { name: 'Condonation of Absence', sub: 'Section 355 B.N.S.S.' },
      { name: 'Process Memo', sub: 'Summons to witness' },
      { name: 'Absence Condone Petition', sub: 'Section 256 Cr.P.C. — complainant side' },
    ],
  },
  {
    group: 'Bail & Sureties',
    items: [
      { name: 'Bail Application', sub: 'Section 480 B.N.S.S.' },
      { name: 'Solvency Memo', sub: 'Filing solvency certificates' },
      { name: 'Suretyship Form 46', sub: 'Application for suretyship' },
    ],
  },
  {
    group: 'Appearance & Vakalat',
    items: [
      { name: 'Memo of Appearance', sub: 'On behalf of the accused' },
      { name: 'High Court Vakalat', sub: 'Madras High Court vakalatnama' },
      { name: 'Vakalathnama Form 72', sub: 'Criminal — Judicial Form No. 72' },
    ],
  },
];

export const DRAFT_FEATURES = [
  {
    icon: 'case',
    t: 'Backing sheet as a real page two',
    d: 'The docket is generated as a genuine second page and folded so it faces outward, the way the registry takes it.',
  },
  {
    icon: 'check',
    t: 'Cause title aligned for you',
    d: 'Party blocks, the “Versus”, the roles and the counsel signature block land where the court expects them.',
  },
  {
    icon: 'edit',
    t: 'Print, or download as Word',
    d: 'Send it straight to the printer, or export a .doc you can carry to any typist’s machine.',
  },
  {
    icon: 'ai',
    t: 'Import your own formats',
    d: 'Paste a petition you already file — the AI importer turns it into a fillable template beside the built-in thirteen.',
  },
];

/* Reminder channels, exactly as Settings.jsx offers them. */
export const REMINDER_CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', body: 'The alert lands where your day already happens.' },
  { id: 'sms', label: 'SMS', body: 'No smartphone or data needed at the other end.' },
  { id: 'email', label: 'Email', body: 'A written trail, sitting next to the brief in your inbox.' },
];

export const REMINDER_WINDOWS = [1, 2, 3, 5, 7];

export const AI_CAPABILITIES = [
  {
    icon: 'ai',
    title: 'Ask about the matter',
    body: 'A chat assistant that holds the thread of the conversation — for the question you would otherwise ask a junior at 11pm.',
  },
  {
    icon: 'audit',
    title: 'Read a document before you do',
    body: 'Upload a PDF, DOCX or TXT and get it back as six structured fields instead of forty pages.',
    chips: ['Summary', 'Key parties', 'Key issues', 'Sections cited', 'Risk assessment', 'Recommendations'],
  },
  {
    icon: 'edit',
    title: 'Turn a petition into a template',
    body: 'Paste a draft you already use. The importer works out the fillable fields and adds it to your library.',
  },
];

export const OUTCOMES = [
  { before: 'Dates copied into three diaries', after: 'One board, reminders sent for you' },
  { before: 'Drafts retyped from an old file', after: 'Thirteen templates, filled and printed' },
  { before: 'Backing sheets aligned by hand', after: 'Page two generated, folded, filing-ready' },
  { before: 'Fees tracked on a notepad', after: 'A ledger that totals itself' },
  { before: '“When did the date change?”', after: 'A timestamped audit log per matter' },
];

/* Written from what the code actually enforces — see the file header. */
export const PRIVACY_POINTS = [
  {
    icon: 'lock',
    t: 'Scoped to your account',
    d: 'Every query in the API is filtered by the logged-in advocate’s id. There is no shared pool and no cross-chamber view.',
  },
  {
    icon: 'archive',
    t: 'Your data leaves when you want',
    d: 'Export the full case list to CSV — client, phone, email, case number, court, type, next date, notes and status.',
  },
  {
    icon: 'user',
    t: 'No directory, no listing',
    d: 'Advo Buddy never publishes, ranks or refers advocates to clients. It is back-office software, which keeps it clear of the bar on solicitation.',
  },
  {
    icon: 'audit',
    t: 'Nothing changes silently',
    d: 'Edits to a matter are recorded with the old value, the new value and the time — so a disputed date has an answer.',
  },
];

export const FAQS = [
  {
    q: 'Do I need to change how I already work?',
    a: 'No. Add matters as they come in and use whichever modules help. The diary, drafts, tasks and billing sections work independently of each other, so you can start with just the case board and grow into the rest.',
  },
  {
    q: 'Are the drafts formatted for actual filing?',
    a: 'Yes. Each template renders the petition on page one and its backing sheet as a genuine second page, folded so the docket faces outward. Print it, or download it as a Word file and hand it to a typist.',
  },
  {
    q: 'Do the templates use the new criminal codes?',
    a: 'Where the section changed, yes — the bail application cites Section 480 B.N.S.S., the recall-warrant petition Section 72(2) and the exemption petition Section 355, and the party blocks carry the “I.P.C. / B.N.S.” pairing that working drafts still show. Read every section reference before you sign it: these are an aid to drafting, not a substitute for your own check.',
  },
  {
    q: 'Which courts is the drafting built around?',
    a: 'The built-in set follows Tamil Nadu district-court and Madras High Court practice — S.T.C. and C.C. numbering, C.M.P. petitions, Judicial Form 72 vakalathnama, Form 46 suretyship. Court names, numbering and parties are all editable, and anything the set does not cover you can import from a draft of your own.',
  },
  {
    q: 'How do the reminders actually reach me?',
    a: 'You pick a channel — WhatsApp, SMS or email — and how many days ahead you want warning: 1, 2, 3, 5 or 7. A daily dispatch job sends the alerts. There is also a WhatsApp share button on each case card, for telling a client the next date the moment it changes.',
  },
  {
    q: 'Where is my case data stored?',
    a: 'In a Postgres database, against your own advocate account. Every case, client, task and draft is scoped to the logged-in advocate, and you can export the lot to CSV whenever you want it elsewhere.',
  },
  {
    q: 'Does the AI see my client’s papers?',
    a: 'Only the document you choose to upload for analysis, and only at the moment you upload it. The AI features are optional — the diary, drafts, tasks and ledger all work with them left alone entirely.',
  },
  {
    q: 'Does it work on my phone?',
    a: 'Yes — the whole workspace is responsive, so the diary and your checklists are readable from the corridor outside the courtroom.',
  },
];

export const MARQUEE_TERMS = [
  'Bail applications', 'Vakalathnama', 'Memo of appearance', 'Cause-list diary', 'Process memo',
  'Surrender petition', 'Copy application', 'Fee ledger', 'Solvency memo', 'Case archive',
  'Adjournment history', 'Pre-hearing checklists', 'Suretyship Form 46', 'Audit trail', 'Advance petition',
  'Recall warrant', 'Client rolodex', 'Backing sheets', 'Condonation of absence', 'CSV export',
];
