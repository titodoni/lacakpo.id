export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-pulse">
      <div className="w-full max-w-sm">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-muted" />
          <div className="h-9 w-32 mx-auto bg-muted rounded-lg" />
          <div className="h-4 w-56 mx-auto bg-muted rounded mt-4" />
        </div>

        {/* Login Card */}
        <div className="rounded-2xl p-6 border border-border bg-muted/30">
          <div className="h-6 w-16 bg-muted rounded mb-6" />

          <div className="space-y-4">
            {/* Department Selection */}
            <div className="space-y-1">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-12 w-full bg-muted rounded-xl" />
            </div>

            {/* User Selection */}
            <div className="space-y-1">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-12 w-full bg-muted rounded-xl" />
            </div>

            {/* PIN Input */}
            <div className="space-y-1">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-12 w-full bg-muted rounded-xl" />
              <div className="h-3 w-28 bg-muted rounded mt-1" />
            </div>

            {/* Submit Button */}
            <div className="h-14 w-full bg-muted rounded-xl mt-2" />
          </div>
        </div>

        {/* Theme Selector */}
        <div className="mt-6">
          <div className="h-3 w-32 mx-auto bg-muted rounded mb-3" />
          <div className="flex justify-center gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-xl bg-muted" />
            ))}
          </div>
          <div className="h-3 w-24 mx-auto bg-muted rounded mt-2" />
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 text-center">
          <div className="h-3 w-24 mx-auto bg-muted rounded mb-2" />
          <div className="h-4 w-16 mx-auto bg-muted rounded" />
          <div className="h-3 w-48 mx-auto bg-muted rounded mt-2" />
        </div>
      </div>
    </div>
  );
}
