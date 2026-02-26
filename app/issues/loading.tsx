export default function IssuesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="h-8 w-48 bg-muted rounded-lg" />

      {/* Stats */}
      <div className="flex gap-4">
        <div className="h-16 w-32 bg-muted rounded-xl" />
        <div className="h-16 w-32 bg-muted rounded-xl" />
      </div>

      {/* Issue Cards */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
