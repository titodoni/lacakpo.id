import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/themes/ThemeProvider";
import { RealtimeProvider } from "@/components/realtime-provider";
import { PushNotifications } from "@/components/push-notifications";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
        {/* Pusher Beams SDK for push notifications */}
        <script 
          src="https://js.pusher.com/beams/1.0/push-notifications-cdn.js"
          async
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </ThemeProvider>
        {/* Push notifications registration (only works when user is logged in) */}
        <PushNotifications />
        <SpeedInsights />
      </body>
    </html>
  );
}
