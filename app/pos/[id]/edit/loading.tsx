export default function EditPOLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      {/* Back Link */}
      <div className="h-6 w-32 bg-muted rounded" />

      {/* Header */}
      <div>
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-4 w-64 bg-muted rounded mt-2" />
      </div>

      {/* Form Card */}
      <div className="bg-muted/30 rounded-2xl p-6 border border-border space-y-6">
        {/* PO Number & Client */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-12 w-full bg-muted rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-12 w-full bg-muted rounded-xl" />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-12 w-full bg-muted rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-12 w-full bg-muted rounded-xl" />
          </div>
        </div>

        {/* Status & Urgent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-12 bg-muted rounded" />
            <div className="h-12 w-full bg-muted rounded-xl" />
          </div>
          <div className="h-12 bg-muted rounded-xl self-end" />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <div className="h-4 w-12 bg-muted rounded" />
          <div className="h-24 w-full bg-muted rounded-xl" />
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-10 w-32 bg-muted rounded-xl" />
        </div>

        {/* Item Rows */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-muted/30 rounded-2xl p-4 border border-border">
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-4 space-y-2">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-12 w-full bg-muted rounded-xl" />
              </div>
              <div className="col-span-3 space-y-2">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-12 w-full bg-muted rounded-xl" />
              </div>
              <div className="col-span-2 space-y-2">
                <div className="h-4 w-12 bg-muted rounded" />
                <div className="h-12 w-full bg-muted rounded-xl" />
              </div>
              <div className="col-span-2 space-y-2">
                <div className="h-4 w-12 bg-muted rounded" />
                <div className="h-12 w-full bg-muted rounded-xl" />
              </div>
              <div className="col-span-1">
                <div className="h-10 w-10 bg-muted rounded-lg mx-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <div className="h-12 w-24 bg-muted rounded-xl" />
        <div className="h-12 w-32 bg-muted rounded-xl" />
      </div>
    </div>
  );
}
