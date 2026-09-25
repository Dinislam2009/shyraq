"use client";
import {useTheme} from "@/components/theme-provider";

export function ThemeSettings(){
 const {theme,setTheme}=useTheme();
 return <section className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/10 dark:bg-slate-900"><p className="font-semibold">Appearance</p><p className="mt-1 text-sm text-slate-400">Choose light, dark, or system theme.</p><div className="mt-4 flex flex-wrap gap-2">{(["system","light","dark"] as const).map(mode=><button key={mode} onClick={()=>setTheme(mode)} aria-pressed={theme===mode} className={"rounded-xl px-4 py-2.5 text-sm font-semibold "+(theme===mode?"bg-slate-950 text-white dark:bg-white dark:text-slate-950":"border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200")}>{mode[0].toUpperCase()+mode.slice(1)}</button>)}</div></section>;
}
