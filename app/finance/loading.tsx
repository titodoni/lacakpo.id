export default function FinanceLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-4 w-64 bg-muted rounded mt-2" />
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between gap-2">
        <div className="h-10 w-24 bg-muted rounded-xl" />
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-10 w-24 bg-muted rounded-xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-muted/50 rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div>
                <div className="h-8 w-12 bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-28 bg-muted rounded-xl" />
        ))}
      </div>

      {/* PO List Header */}
      <div className="h-6 w-48 bg-muted rounded" />

      {/* PO Cards */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-muted/50 rounded-2xl p-5 border border-border">
            {/* Card Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-5 w-16 bg-muted rounded-full" />
                </div>
                <div className="h-4 w-24 bg-muted rounded mt-2" />
                <div className="h-3 w-32 bg-muted rounded mt-1" />
              </div>
            </div>
            {/* Finance Status Area */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-16 bg-muted rounded-xl" />
                <div className="h-16 bg-muted rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
