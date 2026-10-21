import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";

import { IosInstallHint } from "@/components/IosInstallHint";
import { PwaRegister } from "@/components/PwaRegister";
import { ThemeScript } from "@/components/ThemeScript";
import { ToastProvider } from "@/components/Toast";

import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ReelMind",
  description: "Ссылки из Instagram, YouTube и любых сайтов, автоматически разложенные по категориям",
  applicationName: "ReelMind",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "ReelMind",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c12" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${onest.variable} ${unbounded.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Explicit iOS PWA tags — Next metadata can omit these under cacheComponents. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="ReelMind" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-paper text-ink">
        <PwaRegister />
        <ToastProvider>
          {children}
          <IosInstallHint />
        </ToastProvider>
      </body>
    </html>
  );
}
