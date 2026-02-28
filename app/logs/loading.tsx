export default function LogsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-72 bg-muted rounded mt-2" />
        </div>
        <div className="h-11 w-48 bg-muted rounded-xl" />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-muted/50 rounded-2xl p-4 border border-border">
            <div className="h-8 w-12 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded mt-1" />
          </div>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="bg-muted/30 rounded-2xl border border-border">
        {/* Date Group */}
        <div className="p-6">
          <div className="h-5 w-40 bg-muted rounded mb-4" />
          
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 py-2">
                {/* Avatar placeholder */}
                <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-4 w-16 bg-muted rounded" />
                  </div>
                  <div className="h-3 w-48 bg-muted rounded mt-1" />
                  <div className="h-3 w-24 bg-muted rounded mt-1" />
                </div>
                
                <div className="h-4 w-16 bg-muted rounded flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
