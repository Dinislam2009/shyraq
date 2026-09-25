import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";

export default async function HistoryPage({searchParams}:{searchParams:Promise<{deck?:string;rating?:string;from?:string;to?:string}>}){
 const params=await searchParams;
 const supabase:any=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <AppShell><div className="mx-auto max-w-5xl px-5 py-10">Sign in to view review history.</div></AppShell>;
 let query=supabase.from("review_events").select("id,event_key,card_id,reviewed_at,rating,elapsed_ms,device_id,metadata,cards!inner(id,deck_id,content,decks(id,name))").eq("user_id",user.id).order("reviewed_at",{ascending:false}).limit(300);
 if(params.rating&&["again","hard","good","easy"].includes(params.rating))query=query.eq("rating",params.rating);
 if(params.from)query=query.gte("reviewed_at",new Date(params.from).toISOString());
 if(params.to)query=query.lt("reviewed_at",new Date(new Date(params.to).getTime()+86400000).toISOString());
 if(params.deck)query=query.eq("cards.deck_id",params.deck);
 const {data,error}=await query;
 const events=data??[];
 const {data:decks}=await supabase.from("decks").select("id,name").order("name");
 return <AppShell><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-400">Audit</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Review history</h1><p className="mt-2 text-sm text-slate-500">Append-only review events preserved across devices and sync conflicts.</p></div><Link href="/review" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Review now</Link></div>
  <form className="mt-7 grid gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 md:grid-cols-5">
   <select name="deck" defaultValue={params.deck||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">All decks</option>{(decks??[]).map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
   <select name="rating" defaultValue={params.rating||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">All ratings</option>{["again","hard","good","easy"].map(x=><option key={x} value={x}>{x}</option>)}</select>
   <input type="date" name="from" defaultValue={params.from||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"/>
   <input type="date" name="to" defaultValue={params.to||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"/>
   <button className="rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-800">Filter</button>
  </form>
  {error?<div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</div>:null}
  <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
   {(events.length?events:[]).map((event:any,index:number)=>{const card=Array.isArray(event.cards)?event.cards[0]:event.cards;const deck=Array.isArray(card?.decks)?card.decks[0]:card?.decks;return <div key={event.id} className={"grid gap-3 p-4 sm:grid-cols-[110px_1fr_140px_110px] sm:items-center "+(index?"border-t border-black/[0.05]":"")}><div><p className="text-xs font-semibold capitalize">{event.rating}</p><p className="mt-1 text-[11px] text-slate-400">{new Date(event.reviewed_at).toLocaleString()}</p></div><div><p className="truncate text-sm font-medium">{card?.content?.front||"Untitled card"}</p><p className="mt-1 text-xs text-slate-400">{deck?.name||"Unknown deck"} · {event.card_id.slice(0,8)}…</p></div><div className="text-xs text-slate-500">{Number(event.elapsed_ms||0)?Math.round(Number(event.elapsed_ms)/100)/10+"s":"—"} · {String(event.device_id).slice(0,8)}…</div><div className="text-right"><Link href={"/decks/"+(card?.deck_id||"")} className="text-xs font-semibold text-slate-700 hover:text-slate-950">Open deck</Link></div></div>})}
   {!events.length?<div className="p-10 text-center text-sm text-slate-500">No review events match these filters.</div>:null}
  </div>
 </div></AppShell>;
}