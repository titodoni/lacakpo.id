'use client';

import { useRealtimeSync } from '@/hooks/use-realtime-sync';

interface RealtimeProviderProps {
  children: React.ReactNode;
}

/**
 * RealtimeProvider - Wraps the app with real-time sync functionality
 * 
 * This provider initializes Pusher connection and listens for:
 * - Track progress updates
 * - New PO creation
 * - Issue reports
 * 
 * Usage: Wrap around the app in layout.tsx (inside body, can be sibling to ThemeProvider)
 */
export function RealtimeProvider({ children }: RealtimeProviderProps) {
  // Initialize real-time sync hook
  useRealtimeSync();

  return <>{children}</>;
}
