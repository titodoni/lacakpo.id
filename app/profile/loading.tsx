export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="h-8 w-24 bg-muted rounded-lg" />

      {/* User Info Card */}
      <div className="bg-muted/30 border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-muted rounded-xl" />
          <div className="h-6 w-40 bg-muted rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded flex items-center gap-2">
                <div className="w-4 h-4 bg-muted rounded" />
              </div>
              <div className="h-6 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Theme Settings Card */}
      <div className="bg-muted/30 border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-muted rounded-xl" />
          <div>
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="h-4 w-56 bg-muted rounded mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
