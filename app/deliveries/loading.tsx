export default function DeliveriesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-56 bg-muted rounded-lg" />
        <div className="h-4 w-72 bg-muted rounded mt-2" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-muted/50 rounded-2xl p-4 border border-border">
            <div className="h-8 w-12 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded mt-1" />
          </div>
        ))}
      </div>

      {/* Ready Items Section */}
      <div className="space-y-4">
        <div className="h-6 w-40 bg-muted rounded" />
        
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-muted/50 rounded-2xl p-5 border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-5 w-48 bg-muted rounded" />
                  <div className="h-4 w-32 bg-muted rounded mt-2" />
                  <div className="flex items-center gap-4 mt-2">
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-4 w-20 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-10 w-24 bg-muted rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Items Section */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-muted rounded" />
        
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-muted/30 rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded mt-1" />
                </div>
                <div className="h-6 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
