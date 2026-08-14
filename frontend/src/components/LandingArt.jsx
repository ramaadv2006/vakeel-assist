/**
 * Inline SVG product mocks for the landing page.
 *
 * These are drawn rather than photographed on purpose: the page ships with
 * no external image requests, they re-theme with CSS custom properties, and
 * they stay sharp at any size. Swap any of them for a real screenshot by
 * replacing the component body with an <img>.
 *
 * Everything below shares one 520x340 stage and the `art-*` primitives, so
 * the eight workspace previews line up pixel for pixel as the explorer
 * crossfades between them — a preview that shifts its own chrome between
 * tabs reads as eight different products rather than one.
 */

const STAGE_W = 520;
const STAGE_H = 340;

/* ---------------------------------------------------------------
   Primitives
   --------------------------------------------------------------- */

const ACCENTS = {
  danger: '#e0685f',
  warn: '#e2b04a',
  ok: '#5fb37a',
  brass: '#c9a45f',
  info: '#6f9ae0',
};

/** A text-shaped bar. Real strings are avoided in the mocks: they would
 *  need translating, they alias at small sizes, and a mock that looks
 *  readable but is not invites the reader to squint at it. */
function Bar({ x, y, w, h = 7, o = 1, fill = 'var(--art-mute)', r }) {
  return <rect x={x} y={y} width={w} height={h} rx={r ?? h / 2} fill={fill} opacity={o} />;
}

function Ink({ x, y, w, h = 8, o = 0.8 }) {
  return <Bar x={x} y={y} w={w} h={h} o={o} fill="var(--art-text)" />;
}

function Pill({ x, y, w = 62, h = 18, tone = 'brass', label = 34 }) {
  const c = ACCENTS[tone];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={c} opacity="0.16" />
      <rect x={x + (w - label) / 2} y={y + h / 2 - 3} width={label} height="6" rx="3" fill={c} opacity="0.85" />
    </g>
  );
}

function Card({ x, y, w, h, children, tone }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={w} height={h} rx="10" fill="var(--art-card)" stroke="var(--art-stroke)" />
      {tone && <rect width="4" height={h} rx="2" fill={ACCENTS[tone]} />}
      {children}
    </g>
  );
}

/** The window chrome every preview sits inside. */
function Stage({ children, label, className = '' }) {
  return (
    <svg
      className={`art-window ${className}`}
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id="artChrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--art-chrome-a)" />
          <stop offset="100%" stopColor="var(--art-chrome-b)" />
        </linearGradient>
        <linearGradient id="artAccent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c9a45f" />
          <stop offset="100%" stopColor="#9c7a48" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={STAGE_W} height={STAGE_H} rx="16" fill="url(#artChrome)" stroke="var(--art-stroke)" />
      <rect x="0" y="0" width={STAGE_W} height="38" rx="16" fill="var(--art-bar)" />
      <rect x="0" y="26" width={STAGE_W} height="12" fill="var(--art-bar)" />
      <circle cx="20" cy="19" r="4" fill={ACCENTS.danger} />
      <circle cx="35" cy="19" r="4" fill={ACCENTS.warn} />
      <circle cx="50" cy="19" r="4" fill={ACCENTS.ok} />
      <Bar x="70" y="13" w="120" h="12" r="6" />
      {children}
    </svg>
  );
}

/* ---------------------------------------------------------------
   Hero — the case board, with rows that deal themselves in
   --------------------------------------------------------------- */

export function AppWindowMock() {
  return (
    <Stage label="Advo Buddy case board preview" className="art-hero">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${20 + i * 163}, 54)`} className="art-pop" style={{ '--i': i }}>
          <rect width="147" height="58" rx="10" fill="var(--art-card)" stroke="var(--art-stroke)" />
          <Bar x="12" y="14" w="46" h="8" />
          <rect x="12" y="30" width="28" height="14" rx="4" fill="url(#artAccent)" />
        </g>
      ))}

      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(20, ${128 + i * 55})`} className="art-row" style={{ '--i': i }}>
          <rect width="480" height="46" rx="10" fill="var(--art-card)" stroke="var(--art-stroke)" />
          <rect x="0" y="0" width="4" height="46" rx="2"
            fill={i === 0 ? ACCENTS.danger : i === 1 ? ACCENTS.warn : 'url(#artAccent)'} />
          <circle cx="30" cy="23" r="11" fill="var(--art-mute)" opacity="0.5" />
          <Ink x="52" y="12" w="118" h="9" o="0.75" />
          <Bar x="52" y="27" w="76" />
          <Bar x="250" y="18" w="90" h="9" />
          <Pill x="378" y="14" w="86" tone={i === 0 ? 'danger' : i === 1 ? 'warn' : 'brass'} label={62} />
        </g>
      ))}
    </Stage>
  );
}

/* ---------------------------------------------------------------
   Workspace explorer previews — one per module in content.js
   --------------------------------------------------------------- */

/** Court diary: hearings grouped under court headings, print-shaped. */
function DiaryMock() {
  const groups = [
    { rows: 2 },
    { rows: 2 },
  ];
  let y = 56;
  const out = [];
  groups.forEach((g, gi) => {
    out.push(
      <g key={`h${gi}`} transform={`translate(20, ${y})`} className="art-pop" style={{ '--i': gi * 3 }}>
        <rect width="480" height="24" rx="6" fill={ACCENTS.brass} opacity="0.13" />
        <Ink x="12" y="8" w={gi === 0 ? 132 : 108} o="0.7" />
        <Bar x="440" y="9" w="28" h="6" />
      </g>
    );
    y += 30;
    for (let r = 0; r < g.rows; r += 1) {
      out.push(
        <g key={`r${gi}-${r}`} transform={`translate(20, ${y})`} className="art-row" style={{ '--i': gi * 3 + r + 1 }}>
          <Card x={0} y={0} w={480} h={44}>
            <Bar x="14" y="12" w="26" h="20" r="5" fill={ACCENTS.brass} o="0.22" />
            <Ink x="54" y="13" w="126" h="8" o="0.72" />
            <Bar x="54" y="27" w="88" h="6" />
            <Bar x="236" y="19" w="74" h="7" />
            <Bar x="336" y="19" w="52" h="7" />
            <Pill x="412" y="13" w={54} tone="ok" label={30} />
          </Card>
        </g>
      );
      y += 50;
    }
  });
  return <>{out}</>;
}

/** Case board: the four buckets, one flagged stale. */
function BoardMock() {
  const buckets = ['danger', 'warn', 'info', 'brass'];
  return (
    <>
      <g transform="translate(20, 54)">
        {buckets.map((tone, i) => (
          <g key={tone} transform={`translate(${i * 121}, 0)`} className="art-pop" style={{ '--i': i }}>
            <rect width="108" height="52" rx="10" fill="var(--art-card)" stroke="var(--art-stroke)" />
            <rect x="0" y="0" width="108" height="3" rx="1.5" fill={ACCENTS[tone]} />
            <Bar x="12" y="14" w="52" h="6" />
            <Ink x="12" y="27" w="22" h="13" o="0.85" />
          </g>
        ))}
      </g>

      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(20, ${124 + i * 62})`} className="art-row" style={{ '--i': i + 2 }}>
          <Card x={0} y={0} w={480} h={52} tone={i === 0 ? 'danger' : i === 1 ? 'warn' : 'brass'}>
            <Ink x="18" y="13" w="140" h="9" o="0.75" />
            <Bar x="18" y="30" w="96" h="6" />
            <Bar x="240" y="21" w="82" h="7" />
            {/* The stale flag — a matter untouched for 60 days. */}
            {i === 2
              ? <Pill x="344" y="17" w={70} tone="warn" label={42} />
              : null}
            <Pill x={i === 2 ? 424 : 380} y="17" w={i === 2 ? 42 : 86} tone={i === 0 ? 'danger' : 'ok'} label={i === 2 ? 22 : 58} />
          </Card>
        </g>
      ))}
    </>
  );
}

/** Clients: a search field over rolodex cards. */
function ClientsMock() {
  return (
    <>
      <g transform="translate(20, 54)" className="art-pop">
        <rect width="480" height="34" rx="17" fill="var(--art-card)" stroke="var(--art-stroke)" />
        <circle cx="24" cy="17" r="6" fill="none" stroke="var(--art-mute)" strokeWidth="2" />
        <line x1="28.5" y1="21.5" x2="33" y2="26" stroke="var(--art-mute)" strokeWidth="2" strokeLinecap="round" />
        <Bar x="44" y="13" w="150" h="8" />
      </g>

      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${20 + (i % 2) * 245}, ${102 + Math.floor(i / 2) * 108})`}
          className="art-pop" style={{ '--i': i }}>
          <rect width="235" height="96" rx="12" fill="var(--art-card)" stroke="var(--art-stroke)" />
          <circle cx="34" cy="32" r="16" fill={ACCENTS.brass} opacity="0.18" />
          <circle cx="34" cy="27" r="5.5" fill={ACCENTS.brass} opacity="0.6" />
          <path d="M24 42a10 10 0 0 1 20 0z" fill={ACCENTS.brass} opacity="0.6" />
          <Ink x="60" y="22" w="104" h="9" o="0.75" />
          <Bar x="60" y="37" w="72" h="6" />
          <line x1="16" y1="60" x2="219" y2="60" stroke="var(--art-stroke)" strokeDasharray="3 3" />
          <Pill x="16" y="70" w={78} tone="brass" label={48} />
          <Bar x="104" y="76" w="60" h="6" />
          <Bar x="174" y="76" w="44" h="6" />
        </g>
      ))}
    </>
  );
}

/** Pre-hearing tasks: checkboxes that tick themselves on reveal. */
function TasksMock() {
  return (
    <>
      {[0, 1].map((gi) => (
        <g key={gi} transform={`translate(20, ${56 + gi * 138})`}>
          <g className="art-pop" style={{ '--i': gi * 4 }}>
            <Ink x="0" y="0" w={gi === 0 ? 128 : 104} h="9" o="0.7" />
            <Pill x={gi === 0 ? 140 : 116} y="-4" w={48} tone={gi === 0 ? 'danger' : 'warn'} label={26} />
            <Bar x="420" y="1" w="60" h="7" />
          </g>
          {[0, 1, 2].map((i) => {
            const done = gi === 0 && i === 0;
            return (
              <g key={i} transform={`translate(0, ${22 + i * 36})`} className="art-row" style={{ '--i': gi * 4 + i + 1 }}>
                <Card x={0} y={0} w={480} h={30}>
                  <rect x="12" y="8" width="14" height="14" rx="4"
                    fill={done ? ACCENTS.ok : 'none'} opacity={done ? 0.22 : 1}
                    stroke={done ? ACCENTS.ok : 'var(--art-mute)'} strokeWidth="1.6" />
                  {done && (
                    <path className="art-tick" d="M15.5 15l3 3 6-6"
                      fill="none" stroke={ACCENTS.ok} strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" />
                  )}
                  <Bar x="38" y="11" w={[190, 150, 168][i]} h="8"
                    fill={done ? 'var(--art-mute)' : 'var(--art-text)'} o={done ? 0.5 : 0.62} />
                  {done && <line x1="38" y1="15" x2={38 + 190} y2="15" stroke="var(--art-mute)" strokeWidth="1.4" />}
                  <Bar x="404" y="11" w="60" h="8" />
                </Card>
              </g>
            );
          })}
        </g>
      ))}
    </>
  );
}

/** Fee ledger: four totals and a per-matter breakdown with a fill bar. */
function LedgerMock() {
  const tones = ['brass', 'ok', 'danger', 'info'];
  return (
    <>
      <g transform="translate(20, 54)">
        {tones.map((tone, i) => (
          <g key={tone} transform={`translate(${i * 121}, 0)`} className="art-pop" style={{ '--i': i }}>
            <rect width="108" height="60" rx="10" fill="var(--art-card)" stroke="var(--art-stroke)" />
            <Bar x="12" y="13" w="58" h="6" />
            <Ink x="12" y="27" w={[54, 46, 42, 38][i]} h="14" o="0.85" />
            <rect x="12" y="47" width={[84, 62, 40, 30][i]} height="4" rx="2" fill={ACCENTS[tone]} opacity="0.55" />
          </g>
        ))}
      </g>

      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(20, ${132 + i * 58})`} className="art-row" style={{ '--i': i + 2 }}>
          <Card x={0} y={0} w={480} h={48}>
            <Ink x="16" y="12" w="120" h="8" o="0.72" />
            <Bar x="16" y="27" w="80" h="6" />
            {/* collected / agreed, drawn as a proportion so the bar means something */}
            <rect x="180" y="21" width="180" height="7" rx="3.5" fill="var(--art-mute)" opacity="0.35" />
            <rect className="art-fill" x="180" y="21" width={[144, 92, 40][i]} height="7" rx="3.5"
              fill={ACCENTS.ok} opacity="0.75" style={{ '--i': i }} />
            <Bar x="380" y="20" w="42" h="8" fill="var(--art-text)" o="0.6" />
            <Bar x="432" y="20" w="34" h="8" fill={ACCENTS.danger} o="0.65" />
          </Card>
        </g>
      ))}
    </>
  );
}

/** Archive: closed matters grouped by outcome, with a reopen affordance. */
function ArchiveMock() {
  return (
    <>
      {[0, 1].map((gi) => (
        <g key={gi} transform={`translate(20, ${56 + gi * 140})`}>
          <g className="art-pop" style={{ '--i': gi * 3 }}>
            <rect width="480" height="26" rx="6" fill="var(--art-mute)" opacity="0.16" />
            <Ink x="12" y="9" w={gi === 0 ? 96 : 118} o="0.6" />
            <Pill x={gi === 0 ? 120 : 142} y="4" w={38} tone={gi === 0 ? 'ok' : 'info'} label={20} />
          </g>
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(0, ${34 + i * 52})`} className="art-row" style={{ '--i': gi * 3 + i + 1 }}>
              <Card x={0} y={0} w={480} h={44}>
                <Ink x="16" y="11" w="128" h="8" o="0.6" />
                <Bar x="16" y="26" w="90" h="6" />
                <Bar x="240" y="18" w="76" h="7" />
                <g className="art-reopen">
                  <rect x="378" y="12" width="86" height="20" rx="10" fill={ACCENTS.brass} opacity="0.16" />
                  <path d="M400 22a7 7 0 1 1 2 5" fill="none" stroke={ACCENTS.brass} strokeWidth="2" strokeLinecap="round" />
                  <Bar x="414" y="19" w="38" h="6" fill={ACCENTS.brass} o="0.85" />
                </g>
              </Card>
            </g>
          ))}
        </g>
      ))}
    </>
  );
}

/** Audit trail: a timeline of old value → new value, newest first. */
function AuditMock() {
  return (
    <>
      <line x1="46" y1="66" x2="46" y2="308" stroke="var(--art-stroke)" strokeWidth="2" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(20, ${58 + i * 62})`} className="art-row" style={{ '--i': i }}>
          <circle cx="26" cy="26" r="7" fill="var(--art-card)" stroke={i === 0 ? ACCENTS.brass : 'var(--art-mute)'} strokeWidth="2.5" />
          <Card x={48} y={0} w={452} h={52}>
            <Ink x="16" y="11" w={[104, 88, 120, 96][i]} h="8" o="0.72" />
            <Bar x="16" y="28" w="70" h="6" />
            {/* old → new */}
            <rect x="180" y="16" width="86" height="20" rx="6" fill={ACCENTS.danger} opacity="0.12" />
            <Bar x="192" y="23" w="62" h="6" fill={ACCENTS.danger} o="0.7" />
            <path d="M276 26h14m-5-4l5 4-5 4" fill="none" stroke="var(--art-mute)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="300" y="16" width="86" height="20" rx="6" fill={ACCENTS.ok} opacity="0.14" />
            <Bar x="312" y="23" w="62" h="6" fill={ACCENTS.ok} o="0.75" />
            <Bar x="400" y="23" w="38" h="6" />
          </Card>
        </g>
      ))}
    </>
  );
}

/** Chamber profile: the details that flow into every draft's signature block. */
function ProfileMock() {
  return (
    <>
      <g transform="translate(20, 54)" className="art-pop">
        <rect width="480" height="86" rx="12" fill="var(--art-card)" stroke="var(--art-stroke)" />
        <circle cx="56" cy="43" r="26" fill={ACCENTS.brass} opacity="0.18" stroke={ACCENTS.brass} strokeWidth="2" />
        <circle cx="56" cy="36" r="9" fill={ACCENTS.brass} opacity="0.65" />
        <path d="M40 56a16 16 0 0 1 32 0z" fill={ACCENTS.brass} opacity="0.65" />
        <Ink x="98" y="24" w="150" h="10" o="0.78" />
        <Bar x="98" y="42" w="112" h="7" />
        <Pill x="98" y="56" w={104} tone="brass" label={70} />
      </g>

      {[
        ['Enrolment number', 'Practice area'],
        ['Chamber address', 'Phone'],
      ].map((row, ri) => (
        <g key={ri} transform={`translate(20, ${152 + ri * 62})`}>
          {row.map((_, ci) => (
            <g key={ci} transform={`translate(${ci * 245}, 0)`} className="art-pop" style={{ '--i': ri * 2 + ci }}>
              <Bar x="0" y="0" w={[74, 62, 88, 44][ri * 2 + ci]} h="6" />
              <rect x="0" y="12" width="235" height="32" rx="8" fill="var(--art-card)" stroke="var(--art-stroke)" />
              <Bar x="12" y="24" w={[120, 96, 150, 84][ri * 2 + ci]} h="8" fill="var(--art-text)" o="0.55" />
            </g>
          ))}
        </g>
      ))}

      <g transform="translate(20, 282)" className="art-pop" style={{ '--i': 4 }}>
        <rect width="480" height="38" rx="10" fill={ACCENTS.brass} opacity="0.1" />
        <circle cx="26" cy="19" r="8" fill="none" stroke={ACCENTS.brass} strokeWidth="2" />
        <path d="M26 15v5l3 2" fill="none" stroke={ACCENTS.brass} strokeWidth="2" strokeLinecap="round" />
        <Bar x="46" y="15" w="180" h="8" fill={ACCENTS.brass} o="0.6" />
        <Pill x="396" y="10" w={68} tone="ok" label={40} />
      </g>
    </>
  );
}

const MOCKS = {
  diary: DiaryMock,
  board: BoardMock,
  clients: ClientsMock,
  tasks: TasksMock,
  ledger: LedgerMock,
  archive: ArchiveMock,
  audit: AuditMock,
  profile: ProfileMock,
};

/**
 * The explorer's preview pane. `name` picks the body; `label` is what a
 * screen reader gets, so it carries the module's own title rather than a
 * generic "preview".
 */
export function ModuleMock({ name, label }) {
  const Body = MOCKS[name] || BoardMock;
  return (
    <Stage label={label}>
      <Body />
    </Stage>
  );
}

/* ---------------------------------------------------------------
   Standalone art
   --------------------------------------------------------------- */

export function DraftPageMock() {
  return (
    <svg className="art-draft" viewBox="0 0 300 380" role="img" aria-label="Court-ready draft with backing sheet">
      {/* page 2 / backing sheet, peeking behind */}
      <g transform="translate(26, 16)">
        <rect width="260" height="348" rx="8" fill="var(--art-paper-2)" stroke="var(--art-stroke)" />
      </g>
      {/* page 1 */}
      <g transform="translate(8, 4)">
        <rect width="260" height="348" rx="8" fill="var(--art-paper)" stroke="var(--art-stroke)" />
        <line x1="26" y1="0" x2="26" y2="348" stroke="#b5433d" strokeOpacity="0.45" strokeWidth="1.5" />
        <rect x="62" y="30" width="150" height="9" rx="4" fill="#2b2725" opacity="0.85" />
        <rect x="42" y="54" width="90" height="6" rx="3" fill="#2b2725" opacity="0.45" />
        <rect x="42" y="68" width="70" height="6" rx="3" fill="#2b2725" opacity="0.45" />
        <rect x="42" y="94" width="110" height="6" rx="3" fill="#2b2725" opacity="0.55" />
        <rect x="180" y="94" width="46" height="6" rx="3" fill="#2b2725" opacity="0.35" />
        <text x="134" y="122" textAnchor="middle" fontSize="9" fill="#2b2725" fontStyle="italic" opacity="0.6">Versus</text>
        <rect x="42" y="136" width="110" height="6" rx="3" fill="#2b2725" opacity="0.55" />
        <rect x="180" y="136" width="46" height="6" rx="3" fill="#2b2725" opacity="0.35" />
        <rect x="70" y="166" width="134" height="8" rx="4" fill="#2b2725" opacity="0.8" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} className="art-line" style={{ '--i': i }}
            x="42" y={196 + i * 16} width={i % 3 === 2 ? 120 : 184} height="5" rx="2.5"
            fill="#2b2725" opacity="0.3" />
        ))}
        <rect x="146" y="308" width="80" height="6" rx="3" fill="#2b2725" opacity="0.5" />
      </g>
    </svg>
  );
}

export function PhoneMock() {
  return (
    <svg className="art-phone" viewBox="0 0 220 420" role="img" aria-label="Hearing reminder on a phone">
      <rect x="10" y="6" width="200" height="408" rx="30" fill="var(--art-chrome-b)" stroke="var(--art-stroke)" strokeWidth="1.5" />
      <rect x="20" y="16" width="180" height="388" rx="24" fill="var(--art-card)" />
      <rect x="82" y="26" width="56" height="7" rx="3.5" fill="var(--art-mute)" />

      <g transform="translate(34, 58)">
        <rect width="152" height="70" rx="12" fill="var(--art-bar)" stroke="var(--art-stroke)" />
        <circle cx="24" cy="24" r="10" fill="rgba(224,104,95,0.2)" />
        <rect x="42" y="18" width="66" height="7" rx="3.5" fill="var(--art-text)" opacity="0.8" />
        <rect x="42" y="31" width="94" height="6" rx="3" fill="var(--art-mute)" />
        <rect x="16" y="48" width="120" height="6" rx="3" fill="var(--art-mute)" opacity="0.7" />
      </g>

      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(34, ${146 + i * 62})`}>
          <rect width="152" height="50" rx="12" fill="var(--art-bar)" stroke="var(--art-stroke)" />
          <rect x="14" y="14" width="70" height="7" rx="3.5" fill="var(--art-text)" opacity="0.7" />
          <rect x="14" y="29" width="52" height="6" rx="3" fill="var(--art-mute)" />
          <circle cx="130" cy="25" r="9" fill="rgba(201,164,95,0.25)" />
        </g>
      ))}
    </svg>
  );
}

/**
 * The reminders illustration: a notification arriving on a phone, with the
 * alert bubbles staggered so the eye reads them as landing in sequence.
 */
export function ReminderPhoneMock() {
  return (
    <svg className="art-phone art-reminder" viewBox="0 0 240 420" role="img" aria-label="A hearing reminder arriving on a phone">
      <rect x="20" y="6" width="200" height="408" rx="30" fill="var(--art-chrome-b)" stroke="var(--art-stroke)" strokeWidth="1.5" />
      <rect x="30" y="16" width="180" height="388" rx="24" fill="var(--art-card)" />
      <rect x="92" y="26" width="56" height="7" rx="3.5" fill="var(--art-mute)" />

      {/* the alert that just arrived */}
      <g transform="translate(42, 52)" className="art-alert">
        <rect width="156" height="76" rx="14" fill="var(--art-bar)" stroke={ACCENTS.brass} strokeWidth="1.5" />
        <circle cx="26" cy="26" r="12" fill={ACCENTS.brass} opacity="0.2" />
        <path d="M26 20a4.5 4.5 0 0 0-4.5 4.5c0 5-2.2 6.5-2.2 6.5h13.4s-2.2-1.5-2.2-6.5A4.5 4.5 0 0 0 26 20z"
          fill="none" stroke={ACCENTS.brass} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M24.6 33.5a1.7 1.7 0 0 0 2.8 0" fill="none" stroke={ACCENTS.brass} strokeWidth="1.6" strokeLinecap="round" />
        <rect x="48" y="18" width="82" height="8" rx="4" fill="var(--art-text)" opacity="0.8" />
        <rect x="48" y="32" width="98" height="6" rx="3" fill="var(--art-mute)" />
        <rect x="16" y="52" width="124" height="6" rx="3" fill="var(--art-mute)" opacity="0.7" />
      </g>

      {/* older items in the tray */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(42, ${148 + i * 66})`} className="art-tray" style={{ '--i': i }}>
          <rect width="156" height="54" rx="12" fill="var(--art-bar)" stroke="var(--art-stroke)" />
          <circle cx="24" cy="27" r="9" fill={ACCENTS.brass} opacity="0.22" />
          <rect x="42" y="15" width="72" height="7" rx="3.5" fill="var(--art-text)" opacity="0.66" />
          <rect x="42" y="29" width="54" height="6" rx="3" fill="var(--art-mute)" />
          <rect x="124" y="24" width="20" height="6" rx="3" fill="var(--art-mute)" opacity="0.7" />
        </g>
      ))}

      {/* signal rings, pulsing outward from the top of the handset */}
      {[0, 1, 2].map((i) => (
        <circle key={i} className="art-ping" style={{ '--i': i }}
          cx="120" cy="90" r="60" fill="none" stroke={ACCENTS.brass} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/**
 * The AI panel: an uploaded document resolving into the six structured
 * fields /api/analyze-case actually returns.
 */
export function AiPanelMock() {
  return (
    <svg className="art-window art-ai" viewBox="0 0 460 330" role="img" aria-label="A case document analysed into structured fields">
      <rect x="0" y="0" width="460" height="330" rx="16" fill="url(#artChromeAi)" stroke="var(--art-stroke)" />
      <defs>
        <linearGradient id="artChromeAi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--art-chrome-a)" />
          <stop offset="100%" stopColor="var(--art-chrome-b)" />
        </linearGradient>
      </defs>

      {/* the source document */}
      <g transform="translate(20, 20)" className="art-pop">
        <rect width="120" height="150" rx="8" fill="var(--art-paper)" stroke="var(--art-stroke)" />
        <rect x="14" y="16" width="70" height="7" rx="3.5" fill="#2b2725" opacity="0.7" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x="14" y={34 + i * 13} width={i % 3 === 2 ? 58 : 92} height="4" rx="2" fill="#2b2725" opacity="0.28" />
        ))}
        <rect x="14" y="128" width="46" height="5" rx="2.5" fill="#2b2725" opacity="0.4" />
      </g>

      <g transform="translate(20, 186)" className="art-pop" style={{ '--i': 1 }}>
        <rect width="120" height="30" rx="15" fill={ACCENTS.brass} opacity="0.16" />
        <rect x="16" y="12" width="88" height="6" rx="3" fill={ACCENTS.brass} opacity="0.8" />
      </g>

      {/* the beam from document to fields */}
      <path className="art-beam" d="M148 96 C 178 96, 178 60, 208 60" fill="none" stroke={ACCENTS.brass} strokeWidth="1.6" opacity="0.55" />
      <path className="art-beam" style={{ '--i': 1 }} d="M148 96 C 178 96, 178 160, 208 160" fill="none" stroke={ACCENTS.brass} strokeWidth="1.6" opacity="0.55" />
      <path className="art-beam" style={{ '--i': 2 }} d="M148 96 C 178 96, 178 260, 208 260" fill="none" stroke={ACCENTS.brass} strokeWidth="1.6" opacity="0.55" />

      {/* the six fields it comes back as */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} transform={`translate(${212 + (i % 2) * 118}, ${34 + Math.floor(i / 2) * 100})`}
          className="art-pop" style={{ '--i': i + 2 }}>
          <rect width="108" height="86" rx="10" fill="var(--art-card)" stroke="var(--art-stroke)" />
          <rect x="0" y="0" width="108" height="3" rx="1.5" fill={ACCENTS.brass} opacity="0.7" />
          <rect x="12" y="16" width={[54, 44, 40, 58, 48, 66][i]} height="6" rx="3" fill={ACCENTS.brass} opacity="0.75" />
          {[0, 1, 2].map((r) => (
            <rect key={r} x="12" y={34 + r * 13} width={r === 2 ? 52 : 84} height="5" rx="2.5" fill="var(--art-mute)" />
          ))}
          <rect x="12" y="70" width="34" height="5" rx="2.5" fill="var(--art-mute)" opacity="0.6" />
        </g>
      ))}
    </svg>
  );
}
