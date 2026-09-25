import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { GlobalTranslator } from "@/components/global-translator";
import { OfflineBootstrap } from "@/components/offline-bootstrap";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shyraq — Learn with spaced repetition",
  description: "A modern, local-first flashcard and spaced-repetition workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#f8fafc] text-slate-950 antialiased">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <I18nProvider><GlobalTranslator /><OfflineBootstrap />{children}</I18nProvider>
      </body>
    </html>
  );
}
