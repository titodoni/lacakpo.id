'use client';

import { Suspense } from 'react';
import SearchPageContent from './SearchPageContent';

// Loading fallback for Suspense
function SearchPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Memuat...</p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}
