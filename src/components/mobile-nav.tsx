"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavigation } from "@/lib/navigation";
import { ChartIcon, HomeIcon, LayersIcon, PlayIcon } from "@/components/icons";
import { useI18n } from "@/components/i18n-provider";

const icons={home:HomeIcon,layers:LayersIcon,play:PlayIcon,"bar-chart":ChartIcon} as const;
const labelKeys={Dashboard:"dashboard","My decks":"myDecks",Review:"review",Statistics:"statistics"} as const;

export function MobileNav(){
 const pathname=usePathname();
 const {t}=useI18n();
 return <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
  <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
   {mainNavigation.slice(0,4).map(item=>{const Icon=icons[item.icon as keyof typeof icons];if(!Icon)return null;const active=pathname===item.href||pathname.startsWith(item.href+"/");return <Link key={item.href} href={item.href} className={"flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium "+(active?"bg-slate-100 text-slate-950":"text-slate-500")}><Icon size={18}/>{t(labelKeys[item.label as keyof typeof labelKeys])}</Link>})}
  </div>
 </nav>
}