// Lightweight loading placeholder reusing the existing .skeleton-line shimmer
// (already used in CaseCard's task drawer) so pages that fetch on mount don't
// flash a blank screen before their first paint of real data.
export function SkeletonCard({ rows = 3, widths = ['60%', '85%', '40%'] }) {
  return (
    <div className="card-form" style={{ padding: 20 }}>
      {widths.slice(0, rows).map((w, i) => (
        <div key={i} className="skeleton-line" style={{ width: w, marginTop: i === 0 ? 0 : 10 }} />
      ))}
    </div>
  );
}

export default function Skeleton({ count = 3, rows, widths }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} rows={rows} widths={widths} />
      ))}
    </div>
  );
}
