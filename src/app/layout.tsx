import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";

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
  appleWebApp: {
    capable: true,
    title: "ReelMind",
  },
};

export const viewport: Viewport = {
  themeColor: "#eef1f8",
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
        <ThemeScript />
      </head>
      <body className="min-h-full bg-paper text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
