"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState} from "react";
import {ChartIcon,HomeIcon,LayersIcon,PlayIcon,SettingsIcon} from "@/components/icons";
import {mainNavigation} from "@/lib/navigation";
import {useI18n} from "@/components/i18n-provider";

const icons={home:HomeIcon,layers:LayersIcon,play:PlayIcon,"bar-chart":ChartIcon} as const;
const labelKeys={Dashboard:"dashboard","My decks":"myDecks",Review:"review",Statistics:"statistics"} as const;

export function MobileNav(){
 const pathname=usePathname();
 const {t}=useI18n();
 const [open,setOpen]=useState(false);
 const quick=mainNavigation.slice(0,4);
 const extras=[
  ["/search","Search"],
  ["/notifications","Notifications"],
  ["/import","Import"],
  ["/export","Export"],
  ["/settings","Settings"],
  ["/settings/health","Health"],
  ["/legal/privacy","Privacy"],
  ["/legal/terms","Terms"]
 ] as const;
 return <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 lg:hidden">
  {open?<div className="mb-2 rounded-2xl border border-black/[0.06] bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-900"><div className="grid grid-cols-2 gap-2">{extras.map(([href,label])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={"rounded-xl px-3 py-3 text-sm font-semibold "+(pathname===href||pathname.startsWith(href+"/")?"bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white":"text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800")}>{label}</Link>)}</div></div>:null}
  <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
   {quick.map(item=>{const Icon=icons[item.icon as keyof typeof icons];if(!Icon)return null;const active=pathname===item.href||pathname.startsWith(item.href+"/");return <Link key={item.href} href={item.href} className={"flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium "+(active?"bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white":"text-slate-500")}><Icon size={18}/>{t(labelKeys[item.label as keyof typeof labelKeys])}</Link>})}
   <button type="button" aria-expanded={open} onClick={()=>setOpen(value=>!value)} className={"flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium "+(open?"bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white":"text-slate-500")}><SettingsIcon size={18}/>More</button>
  </div>
 </nav>;
}
