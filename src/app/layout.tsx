import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { PwaBootstrap } from "@/components/pwa/PwaBootstrap";
import { AppProviders } from "@/components/providers/AppProviders";
import { ThemeInitScript } from "@/components/theme/ThemeInitScript";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpanLedger Steel",
  description:
    "SpanLedger Steel — steel member calculators for coursework. Runs locally in your browser with offline-friendly PWA support.",
  manifest: "/manifest.json",
  applicationName: "SpanLedger Steel",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpanLedger",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#08162b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeInitScript />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <PwaBootstrap />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
