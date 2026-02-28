import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/lib/themes/ThemeProvider";
import { RealtimeProvider } from "@/components/realtime-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import { NavigationProgress } from "@/components/navigation-progress";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NotificationToastContainer } from "@/components/NotificationToast";

export const metadata: Metadata = {
  title: "lacakPO.id - Sistem Tracking PO",
  description: "Concurrent Multi-Department Manufacturing Progress Tracking System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pusher Channels SDK for real-time sync */}
        <script src="https://js.pusher.com/8.4.0/pusher.min.js"></script>
      </head>
      <body className="antialiased bg-background text-foreground">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Providers>
          <ThemeProvider>
            <ErrorBoundary>
              <RealtimeProvider>
                {children}
              </RealtimeProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </Providers>
        <NotificationToastContainer />
        <SpeedInsights />
      </body>
    </html>
  );
}
