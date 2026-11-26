import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { preconnect } from "react-dom";

import "./globals.css";
import { DisableLinkDrag } from "@/components/disable-link-drag";
import { OfflineBanner } from "@/app/offline-banner";
import { PwaRegister } from "@/components/pwa-register";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toast";
import { getRootMetadata } from "@/lib/seo/pages";
import { mediaOrigin } from "@/lib/media/origin";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = getRootMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efeff4" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const r2Origin = mediaOrigin();
  if (r2Origin) {
    preconnect(r2Origin, { crossOrigin: "anonymous" });
  }

  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>
        <ThemeProvider>
          <DisableLinkDrag />
          <OfflineBanner />
          {children}
          <SonnerToaster />
          <Toaster />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
