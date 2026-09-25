"use client";
import Link from "next/link";
import {signOut} from "@/app/signout/actions";
import {AccountDangerZone} from "@/components/account-danger-zone";
import {useTheme} from "@/components/theme-provider";

export default function SettingsPage(){
 const {theme,setTheme}=useTheme();
 return <div className="min-h-screen"><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><p className="text-sm text-slate-400">Account</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1><p className="mt-2 text-sm text-slate-500">Account, review, sync and data controls.</p>
  <section className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/10 dark:bg-slate-900"><p className="font-semibold">Appearance</p><p className="mt-1 text-sm text-slate-400">Choose light, dark, or system theme.</p><div className="mt-4 flex flex-wrap gap-2">{(["system","light","dark"] as const).map(mode=><button key={mode} onClick={()=>setTheme(mode)} aria-pressed={theme===mode} className={"rounded-xl px-4 py-2.5 text-sm font-semibold "+(theme===mode?"bg-slate-950 text-white dark:bg-white dark:text-slate-950":"border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200")}>{mode[0].toUpperCase()+mode.slice(1)}</button>)}</div></section>
  <div className="mt-6 space-y-3"><Setting title="Account" text="Email and profile"/><Setting title="Review" text="FSRS scheduler defaults and review behavior"/><Setting title="Sync" text="Offline changes and device synchronization"/><Link href="/export" className="block rounded-2xl border border-black/[0.06] bg-white p-5 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:hover:bg-slate-800"><p className="font-semibold">Data portability</p><p className="mt-1 text-sm text-slate-400">Import, export and backups</p></Link></div>
  <AccountDangerZone/><form action={signOut} className="mt-8"><button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold dark:border-white/10 dark:bg-slate-900">Sign out</button></form>
 </div></div>;
}
function Setting({title,text}:{title:string;text:string}){return <div className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/10 dark:bg-slate-900"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-slate-400">{text}</p></div>}
