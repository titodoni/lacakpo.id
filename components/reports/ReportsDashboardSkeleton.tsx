// New Color Palette
const PALETTE = {
  deepTeal700: '#aabbb4',
  deepTeal900: '#e3e8e6',
};

export function ReportsDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border h-28" style={{ borderColor: PALETTE.deepTeal700 }} />
        ))}
      </div>

      {/* Performance Gauge Skeleton */}
      <div className="bg-white rounded-2xl p-6 border h-40" style={{ borderColor: PALETTE.deepTeal700 }} />

      {/* Tables Skeleton */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border h-64" style={{ borderColor: PALETTE.deepTeal700 }} />
        ))}
      </div>
    </div>
  );
}
