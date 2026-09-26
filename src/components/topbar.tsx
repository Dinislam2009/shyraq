import Link from "next/link";
import {getCurrentUser} from "@/lib/supabase/queries";
import {signOut} from "@/app/signout/actions";
import {LanguageSwitcher} from "@/components/language-switcher";
import {GlobalSearch} from "@/components/global-search";
import {createClient} from "@/lib/supabase/server";
import {getServerI18n} from "@/lib/i18n-server";

export async function Topbar(){
 const {t}=await getServerI18n();
 const user=await getCurrentUser();
 const name=String(user?.user_metadata?.display_name||user?.email?.split("@")[0]||"Student");
 let unread=0;
 if(user){
  const supabase=await createClient();
  const {count}=await supabase.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",user.id).is("read_at",null);
  unread=count??0;
 }
 return <header className="flex h-18 items-center justify-between border-b border-black/[0.06] bg-white/90 px-5 backdrop-blur sm:px-8">
  <div className="flex items-center gap-3 lg:hidden"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">S</span><span className="font-semibold">Shyraq</span></div>
  <GlobalSearch/>
  <div className="ml-auto flex items-center gap-3">
   <LanguageSwitcher/>
   <Link href="/history" className="hidden rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 sm:inline-flex">{t("history")}</Link>
   <Link href="/notifications" aria-label={unread?unread+" unread notifications":t("notifications")} className="relative rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">{t("notifications")}{unread>0?<span className="ml-1 inline-flex min-w-5 justify-center rounded-full bg-slate-950 px-1 text-[10px] text-white">{unread>99?"99+":unread}</span>:null}</Link>
   <div className="hidden text-right sm:block"><p className="text-sm font-medium text-slate-900">{name}</p><p className="text-xs text-slate-400">{user?.email||"Student"}</p></div>
   <details className="relative"><summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">{name.slice(0,1).toUpperCase()}</summary><div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"><Link href="/settings/devices" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">{t("devices")}</Link><Link href="/settings/profile" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">{t("profile")}</Link><form action={signOut}><button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">{t("signOut")}</button></form></div></details>
  </div>
 </header>;
}