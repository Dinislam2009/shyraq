"use client";

import {useI18n} from "@/components/i18n-provider";
import type {Locale} from "@/lib/i18n";

export function LanguageSettings(){
 const {locale,setLocale}=useI18n();
 const change=async(next:Locale)=>{
  setLocale(next);
  try{
   await fetch("/api/preferences/locale",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({locale:next}),keepalive:true});
  }catch{}
 };
 return <section className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/10 dark:bg-slate-900">
  <div><p className="font-semibold">Language</p><p className="mt-1 text-sm text-slate-400">Saved to your account and restored on your other devices.</p></div>
  <div className="mt-4 flex flex-wrap gap-2">
   <button type="button" onClick={()=>void change("kk")} aria-pressed={locale==="kk"} className={"rounded-xl border px-4 py-2.5 text-sm font-semibold "+(locale==="kk"?"border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950":"border-slate-200 bg-white dark:border-white/10 dark:bg-slate-800")}>Қазақша</button>
   <button type="button" onClick={()=>void change("ru")} aria-pressed={locale==="ru"} className={"rounded-xl border px-4 py-2.5 text-sm font-semibold "+(locale==="ru"?"border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950":"border-slate-200 bg-white dark:border-white/10 dark:bg-slate-800")}>Русский</button>
   <button type="button" onClick={()=>void change("en")} aria-pressed={locale==="en"} className={"rounded-xl border px-4 py-2.5 text-sm font-semibold "+(locale==="en"?"border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950":"border-slate-200 bg-white dark:border-white/10 dark:bg-slate-800")}>English</button>
  </div>
 </section>;
}
