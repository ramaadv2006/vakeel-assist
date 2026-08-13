/**
 * Inline SVG product mocks for the landing page.
 *
 * These are drawn rather than photographed on purpose: the page ships with
 * no external image requests, they re-theme with CSS custom properties, and
 * they stay sharp at any size. Swap any of them for a real screenshot by
 * replacing the component body with an <img>.
 */

export function AppWindowMock() {
  return (
    <svg className="art-window" viewBox="0 0 520 360" role="img" aria-label="Advo Buddy case dashboard preview">
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

      <rect x="0" y="0" width="520" height="360" rx="16" fill="url(#artChrome)" stroke="var(--art-stroke)" />
      <rect x="0" y="0" width="520" height="38" rx="16" fill="var(--art-bar)" />
      <rect x="0" y="26" width="520" height="12" fill="var(--art-bar)" />
      <circle cx="20" cy="19" r="4" fill="#e0685f" />
      <circle cx="35" cy="19" r="4" fill="#e2b04a" />
      <circle cx="50" cy="19" r="4" fill="#5fb37a" />
      <rect x="70" y="13" width="120" height="12" rx="6" fill="var(--art-mute)" />

      {/* stat row */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${20 + i * 163}, 54)`}>
          <rect width="147" height="58" rx="10" fill="var(--art-card)" stroke="var(--art-stroke)" />
          <rect x="12" y="14" width="46" height="8" rx="4" fill="var(--art-mute)" />
          <rect x="12" y="30" width="28" height="14" rx="4" fill="url(#artAccent)" />
        </g>
      ))}

      {/* case rows */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(20, ${128 + i * 55})`} className="art-row" style={{ '--i': i }}>
          <rect width="480" height="46" rx="10" fill="var(--art-card)" stroke="var(--art-stroke)" />
          <rect x="0" y="0" width="4" height="46" rx="2" fill={i === 0 ? '#e0685f' : i === 1 ? '#e2b04a' : 'url(#artAccent)'} />
          <circle cx="30" cy="23" r="11" fill="var(--art-mute)" opacity="0.5" />
          <rect x="52" y="12" width="118" height="9" rx="4" fill="var(--art-text)" opacity="0.75" />
          <rect x="52" y="27" width="76" height="7" rx="3" fill="var(--art-mute)" />
          <rect x="250" y="18" width="90" height="9" rx="4" fill="var(--art-mute)" />
          <rect x="378" y="14" width="86" height="18" rx="9"
            fill={i === 0 ? 'rgba(224,104,95,0.16)' : i === 1 ? 'rgba(226,176,74,0.18)' : 'rgba(201,164,95,0.16)'} />
          <rect x="390" y="20" width="62" height="6" rx="3"
            fill={i === 0 ? '#c9524a' : i === 1 ? '#a8781f' : '#9c7a48'} />
        </g>
      ))}
    </svg>
  );
}

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
          <rect key={i} x="42" y={196 + i * 16} width={i % 3 === 2 ? 120 : 184} height="5" rx="2.5" fill="#2b2725" opacity="0.3" />
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
