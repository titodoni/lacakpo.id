export default function PODetailLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="h-6 w-32 bg-muted rounded" />

      {/* PO Header Card */}
      <div className="bg-muted rounded-2xl h-40" />

      {/* Finance Card */}
      <div className="bg-muted rounded-2xl h-48" />

      {/* Items Section */}
      <div>
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
