export default function AdminUsersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded-xl" />
          <div>
            <div className="h-7 w-40 bg-muted rounded" />
            <div className="h-4 w-56 bg-muted rounded mt-1" />
          </div>
        </div>
        <div className="h-10 w-32 bg-muted rounded-xl" />
      </div>

      {/* Users Table */}
      <div className="bg-muted/30 rounded-2xl border border-border overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50">
          <div className="col-span-3 h-4 w-16 bg-muted rounded" />
          <div className="col-span-2 h-4 w-12 bg-muted rounded" />
          <div className="col-span-2 h-4 w-16 bg-muted rounded" />
          <div className="col-span-2 h-4 w-20 bg-muted rounded" />
          <div className="col-span-2 h-4 w-12 bg-muted rounded" />
          <div className="col-span-1 h-4 w-12 bg-muted rounded" />
        </div>

        {/* Table Rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b border-border last:border-0">
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div>
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded mt-1" />
              </div>
            </div>
            <div className="col-span-2 h-4 w-20 bg-muted rounded self-center" />
            <div className="col-span-2 h-4 w-24 bg-muted rounded self-center" />
            <div className="col-span-2 h-6 w-16 bg-muted rounded-full self-center" />
            <div className="col-span-2 h-4 w-12 bg-muted rounded self-center" />
            <div className="col-span-1 flex items-center justify-end gap-2">
              <div className="w-8 h-8 bg-muted rounded-lg" />
              <div className="w-8 h-8 bg-muted rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
