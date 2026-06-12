import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { CookieNotice } from "@/components/legal/CookieNotice";
import { TikTokPixel } from "@/components/analytics/TikTokPixel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Voragoal — 2026 World Cup Analytics",
    template: "%s · Voragoal",
  },
  description:
    "An independent, AI-powered analytics platform for the 2026 FIFA World Cup. Schedule, teams, players, stats, and plain-English insights.",
  applicationName: "Voragoal",
  metadataBase: new URL("https://voragoal.com"),
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    title: "Voragoal",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <div id="main" className="flex flex-1 flex-col">
          {children}
        </div>
        <CookieNotice />
        <Analytics />
        <TikTokPixel />
      </body>
    </html>
  );
}
