export default function POSLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-10 w-32 bg-muted rounded-lg" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-4">
        <div className="h-10 w-40 bg-muted rounded-lg" />
        <div className="h-10 w-40 bg-muted rounded-lg" />
        <div className="h-10 w-40 bg-muted rounded-lg" />
      </div>

      {/* Cards Skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
