import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";

export default async function DeckUpdatesPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();if(!user)return <AppShell><div className="mx-auto max-w-4xl px-5 py-10">Sign in to view deck updates.</div></AppShell>;
 const {data:copy}=await supabase.from("deck_copies").select("source_deck_id,copied_deck_id,last_synced_source_updated_at,source_updated_at,update_policy").eq("user_id",user.id).eq("copied_deck_id",id).maybeSingle();
 if(!copy)notFound();
 const [{data:source},{data:target},{data:history}]=await Promise.all([
  supabase.from("decks").select("id,name,updated_at,cards(id,kind,content,sort_order,updated_at)").eq("id",copy.source_deck_id).eq("visibility","public").maybeSingle(),
  supabase.from("decks").select("id,name,updated_at,cards(id,kind,content,sort_order,updated_at)").eq("id",id).eq("owner_id",user.id).maybeSingle(),
  supabase.from("deck_copy_update_history").select("id,source_updated_at,accepted_at,card_changes").eq("user_id",user.id).eq("copied_deck_id",id).order("accepted_at",{ascending:false}).limit(50)
 ]);
 if(!source||!target)notFound();
 const sourceCards=source.cards??[];const targetBySourceId=new Map((target.cards??[]).filter((c:any)=>c.content?._sourceCardId).map((c:any)=>[String(c.content._sourceCardId),c]));
 const sourceIds=new Set(sourceCards.map((c:any)=>String(c.id)));
 const changes=sourceCards.map((c:any)=>{const local=targetBySourceId.get(String(c.id));if(!local)return {...c,status:"added"};const same=JSON.stringify({kind:c.kind,content:c.content,sort_order:c.sort_order})===JSON.stringify({kind:local.kind,content:local.content,sort_order:local.sort_order});return {...c,status:same?"unchanged":"changed",local};}).filter((c:any)=>c.status!=="unchanged");
 const removed=(target.cards??[]).filter((c:any)=>{const sourceId=c.content?._sourceCardId;return sourceId&&!sourceIds.has(String(sourceId));});
 return <AppShell><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><Link href={"/decks/"+id} className="text-sm text-slate-400">← Deck</Link><div className="mt-5 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Author updates</p><h1 className="mt-2 text-3xl font-semibold">Visual update diff</h1><p className="mt-2 text-sm text-slate-500">{source.name} → {target.name} · source updated {new Date(source.updated_at).toLocaleString()}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{changes.length+removed.length} changes</span></div>
  <div className="mt-7 space-y-4">{changes.map((change:any)=><div key={change.id} className="rounded-2xl border border-black/[0.06] bg-white p-6"><div className="flex items-center justify-between gap-3"><span className={"rounded-full px-3 py-1 text-xs font-semibold "+(change.status==="added"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-800")}>{change.status}</span><span className="text-xs text-slate-400">{change.kind}</span></div><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Author version</p><p className="mt-2 whitespace-pre-wrap text-sm">{change.content?.front||""}</p><p className="mt-3 whitespace-pre-wrap text-sm text-slate-500">{change.content?.back||""}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Your copy</p><p className="mt-2 whitespace-pre-wrap text-sm">{change.local?.content?.front||"(new card)"}</p><p className="mt-3 whitespace-pre-wrap text-sm text-slate-500">{change.local?.content?.back||""}</p></div></div></div>)}</div>
  {removed.length?<div className="mt-4 space-y-3">{removed.map((card:any)=><div key={card.id} className="rounded-2xl border border-red-200 bg-red-50 p-5"><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700">removed by author</span><p className="mt-3 text-sm font-semibold">{card.content?.front||"Untitled card"}</p></div>)}</div>:null}
  <section className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Update history</h2><div className="mt-4 space-y-2">{(history??[]).map((entry:any)=><div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs"><span>{new Date(entry.accepted_at).toLocaleString()}</span><span className="text-slate-500">changed {entry.card_changes?.changed??0} · added {entry.card_changes?.added??0} · removed {entry.card_changes?.removed??0}</span></div>)}</div>{!(history??[]).length?<p className="mt-3 text-sm text-slate-400">No accepted author updates yet.</p>:null}</section>
 </div></AppShell>;
}
