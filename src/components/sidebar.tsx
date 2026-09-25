"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {mainNavigation,secondaryNavigation} from "@/lib/navigation";
import {ChartIcon,HomeIcon,LayersIcon,PlayIcon,SettingsIcon} from "@/components/icons";
import {useI18n} from "@/components/i18n-provider";

const icons={home:HomeIcon,layers:LayersIcon,play:PlayIcon,"bar-chart":ChartIcon,settings:SettingsIcon};
const labelKeys={
 "Dashboard":"dashboard","My decks":"myDecks","Review":"review","Statistics":"statistics",
 "Public decks":"publicDecks","Collections":"collections","Tags":"tags","Markers":"markers","Review history":"history","Notifications":"notifications",
 "Import":"import","Export":"export","Profile":"profile","Review settings":"reviewSettings","Sync":"sync",
 "Review devices":"devices","Media library":"mediaLibrary","Health":"health","Moderation":"moderation","Workspace":"workspaceSettings","Settings":"settings",
} as const;
export function Sidebar(){
 const pathname=usePathname();const {t}=useI18n();
 return <aside className="hidden w-64 shrink-0 border-r border-black/[0.06] bg-white lg:flex lg:flex-col">
  <div className="flex h-18 items-center px-7"><Link href="/dashboard" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">S</span><span className="text-lg font-semibold tracking-tight">Shyraq</span></Link></div>
  <nav className="flex-1 overflow-y-auto px-3 py-5">
   <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{t("workspace")}</p>
   <div className="space-y-1">{mainNavigation.map(item=>{const Icon=icons[item.icon];const active=pathname===item.href||pathname.startsWith(item.href+"/");return <Link key={item.href} href={item.href} className={"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition "+(active?"bg-slate-100 text-slate-950":"text-slate-500 hover:bg-slate-50 hover:text-slate-900")}><Icon size={18}/>{t(labelKeys[item.label as keyof typeof labelKeys])}</Link>})}</div>
   <p className="px-3 pb-2 pt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{t("account")}</p>
   <div className="space-y-1">{secondaryNavigation.map(item=>{const Icon=icons[item.icon];const active=pathname===item.href||pathname.startsWith(item.href+"/");return <Link key={item.href} href={item.href} className={"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition "+(active?"bg-slate-100 text-slate-950":"text-slate-500 hover:bg-slate-50 hover:text-slate-900")}><Icon size={18}/>{t(labelKeys[item.label as keyof typeof labelKeys])}</Link>})}</div>
  </nav>
  <div className="border-t border-black/[0.06] p-4"><div className="rounded-2xl bg-slate-50 p-4"><div className="mb-2 text-xs font-semibold text-slate-900">{t("dailyReview")}</div><p className="text-xs leading-5 text-slate-500">{t("dailyReviewText")}</p></div></div>
 </aside>;
}