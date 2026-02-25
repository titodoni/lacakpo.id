import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/themes/ThemeProvider";

export const metadata: Metadata = {
  title: "Kreasilog - PO Tracking",
  description: "Concurrent Multi-Department Manufacturing Progress Tracking System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
