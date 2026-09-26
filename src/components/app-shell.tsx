import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { MobileNav } from "@/components/mobile-nav";
import Link from "next/link";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-950">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-slate-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">Skip to content</a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main-content" tabIndex={-1} className="flex-1 pb-20 outline-none lg:pb-0">{children}</main>
        <MobileNav />
        <footer className="border-t border-black/[0.06] bg-white px-5 py-4 text-center text-xs text-slate-400 dark:border-white/10 dark:bg-slate-950"><div className="flex flex-wrap justify-center gap-x-4 gap-y-2"><Link href="/legal/privacy" className="hover:text-slate-700 dark:hover:text-slate-200">Privacy</Link><Link href="/legal/terms" className="hover:text-slate-700 dark:hover:text-slate-200">Terms</Link><Link href="/legal/community" className="hover:text-slate-700 dark:hover:text-slate-200">Community</Link><Link href="/legal/data-retention" className="hover:text-slate-700 dark:hover:text-slate-200">Data retention</Link></div></footer>
      </div>
    </div>
  );
}
