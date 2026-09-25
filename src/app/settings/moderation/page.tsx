import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {updateReportStatus} from "@/app/settings/moderation/actions";

export default async function ModerationPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const {data:decks}=await supabase.from("decks").select("id,name").eq("owner_id",user.id).eq("visibility","public");
 const deckIds=(decks??[]).map(d=>d.id);
 const {data:reports}=deckIds.length?await supabase.from("deck_reports").select("id,deck_id,reporter_id,reason,details,status,created_at").in("deck_id",deckIds).order("created_at",{ascending:false}):{data:[]};
 const deckName=new Map((decks??[]).map(d=>[d.id,d.name]));
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><p className="text-sm text-slate-400">Community</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Moderation</h1><p className="mt-2 text-sm text-slate-500">Reports submitted against your public decks.</p>{!(reports??[]).length?<div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No reports on your public decks.</div>:<div className="mt-8 space-y-4">{(reports??[]).map((r:any)=><div key={r.id} className="rounded-2xl border border-black/[0.06] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">{deckName.get(r.deck_id)||"Deck"}</h2><p className="mt-1 text-xs text-slate-400">{r.reason} · {new Date(r.created_at).toLocaleString()}</p></div><span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase">{r.status}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{r.details||"No details supplied."}</p><div className="mt-4 flex gap-2"><form action={updateReportStatus.bind(null,r.id,"reviewing")}><button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Reviewing</button></form><form action={updateReportStatus.bind(null,r.id,"resolved")}><button className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Resolve</button></form><form action={updateReportStatus.bind(null,r.id,"dismissed")}><button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Dismiss</button></form></div></div>)}</div>}</div></AppShell>;
}