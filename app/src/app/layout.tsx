import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/ui";
import { AppProvider } from "@/stores/app";
import "./globals.css";

// Fontlar npm paketinden self-host ediliyor: build/render sırasında
// fonts.googleapis.com'a istek atılmaz (yavaş açılış + offline build hatası biter).
const fredoka = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/fredoka/files/fredoka-latin-wght-normal.woff2", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/fredoka/files/fredoka-latin-ext-wght-normal.woff2", style: "normal" },
  ],
  variable: "--font-fredoka",
  display: "swap",
});

const manrope = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-ext-wght-normal.woff2", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Parla — Dil Öğrenmenin En Güzel Hâli",
  description:
    "AI öğretmen, boss savaşları, ligler ve bilim destekli tekrar sistemiyle yeni bir dili oyun oynar gibi öğren. 24 dil, tek uygulama.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Parla" },
  icons: { icon: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0b100d" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${fredoka.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-bg font-body text-ink antialiased">
        {/* PWA: service worker kaydı (sw.js production build'inde üretilir;
            dev'de dosya yoksa sessizce yakalanır). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(){});});}',
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="light">
          <AppProvider>
            <ToastProvider>{children}</ToastProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
