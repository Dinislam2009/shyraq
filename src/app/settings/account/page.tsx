import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {deleteAccount,sendPasswordReset,signOutEverywhere} from "@/app/settings/account/actions";

export default async function AccountSettingsPage({searchParams}:{searchParams?:Promise<{error?:string;saved?:string}>}){
 const params=searchParams?await searchParams:{};
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <AppShell><div className="mx-auto max-w-3xl px-5 py-10">Sign in required.</div></AppShell>;
 const [{count:deckCount},{count:cardCount},{count:mediaCount},{count:reviewCount}]=await Promise.all([
  supabase.from("decks").select("id",{count:"exact",head:true}).eq("owner_id",user.id),
  supabase.from("cards").select("id",{count:"exact",head:true}).eq("owner_id",user.id),
  supabase.from("media").select("id",{count:"exact",head:true}).eq("owner_id",user.id),
  supabase.from("review_events").select("id",{count:"exact",head:true}).eq("user_id",user.id)
 ]);
 return <AppShell><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><p className="text-sm text-slate-400">Security</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Account</h1><p className="mt-2 text-sm text-slate-500">Security, data export and account lifecycle controls.</p>
  {params.error?<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error}</div>:null}
  {params.saved?<div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Password reset email requested.</div>:null}
  <section className="mt-7 rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Account summary</h2><p className="mt-2 text-sm text-slate-500">{user.email}</p><div className="mt-5 grid gap-3 sm:grid-cols-4"><Metric label="Decks" value={String(deckCount??0)}/><Metric label="Cards" value={String(cardCount??0)}/><Metric label="Media" value={String(mediaCount??0)}/><Metric label="Reviews" value={String(reviewCount??0)}/></div></section>
  <section className="mt-5 rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Security</h2><div className="mt-4 flex flex-wrap gap-2"><form action={sendPasswordReset}><button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Send password reset</button></form><form action={signOutEverywhere}><button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Sign out everywhere</button></form><Link href="/settings/devices" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Review devices</Link></div></section>
  <section className="mt-5 rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Your data</h2><p className="mt-2 text-sm leading-6 text-slate-500">Create a backup before deleting the account. The backup contains your learning data and supported media metadata.</p><div className="mt-4 flex flex-wrap gap-2"><a href="/api/export/backup" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Export full backup</a><a href="/api/export/statistics" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Export analytics</a></div></section>
  <section className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-semibold text-red-900">Delete account</h2><p className="mt-2 text-sm leading-6 text-red-800">This permanently removes the authenticated account and its owned application data after media cleanup. Export your backup first.</p><form action={deleteAccount} className="mt-4 flex flex-col gap-2 sm:flex-row"><input name="confirm" required placeholder="Type DELETE" className="h-11 flex-1 rounded-xl border border-red-200 bg-white px-3 text-sm"/><button className="rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white">Delete account</button></form></section>
 </div></AppShell>;
}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] uppercase tracking-[0.1em] text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>}
