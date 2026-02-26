export default function SearchLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="h-8 w-48 bg-muted rounded-lg" />

      {/* Search Input */}
      <div className="h-14 w-full bg-muted rounded-xl" />

      {/* Results */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
