import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {deleteSavedFilter,saveHistoryFilter} from "@/app/history/actions";

type Params={deck?:string;rating?:string;from?:string;to?:string;card?:string;event?:string};

export default async function HistoryPage({searchParams}:{searchParams:Promise<Params>}){
 const params=await searchParams;
 const supabase:any=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <AppShell><div className="mx-auto max-w-5xl px-5 py-10">Sign in to view review history.</div></AppShell>;

 let query=supabase.from("review_events").select("id,event_key,card_id,reviewed_at,rating,elapsed_ms,device_id,client_sequence,metadata,cards!inner(id,deck_id,content,decks(id,name))").eq("user_id",user.id).order("reviewed_at",{ascending:false}).limit(500);
 if(params.rating&&["again","hard","good","easy"].includes(params.rating))query=query.eq("rating",params.rating);
 if(params.from&&/^\d{4}-\d{2}-\d{2}$/.test(params.from))query=query.gte("reviewed_at",new Date(params.from).toISOString());
 if(params.to&&/^\d{4}-\d{2}-\d{2}$/.test(params.to))query=query.lt("reviewed_at",new Date(new Date(params.to).getTime()+86400000).toISOString());
 if(params.deck)query=query.eq("cards.deck_id",params.deck);
 if(params.card)query=query.eq("card_id",params.card);
 if(params.event)query=query.eq("metadata->>event_kind",params.event);
 const {data,error}=await query;
 const events=data??[];
 const [{data:decks},{data:savedFilters}]=await Promise.all([supabase.from("decks").select("id,name").eq("owner_id",user.id).order("name"),supabase.from("saved_filters").select("id,name,query,created_at").eq("user_id",user.id).eq("kind","review_history").order("created_at",{ascending:false}).limit(30)]);
 const eventKinds:string[]=Array.from(new Set<string>((events??[]).map((event:any)=>String(event.metadata?.event_kind||"review")))).sort();
 const exportQuery=new URLSearchParams();
 if(params.deck)exportQuery.set("deck",params.deck);if(params.card)exportQuery.set("card",params.card);if(params.rating)exportQuery.set("rating",params.rating);if(params.event)exportQuery.set("event",params.event);if(params.from)exportQuery.set("from",params.from);if(params.to)exportQuery.set("to",params.to);

 return <AppShell><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
   <div><p className="text-sm text-slate-400">Audit</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Review history</h1><p className="mt-2 text-sm text-slate-500">Append-only review events preserved across devices and sync conflicts.</p></div>
   <div className="flex flex-wrap gap-2"><Link href="/history/audit" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Audit debugger</Link><a href={"/api/export/history?"+exportQuery.toString()} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Export filtered history</a><Link href="/review" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Review now</Link></div>
  </div>
  <form className="mt-7 grid gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 md:grid-cols-7">
   <select name="deck" defaultValue={params.deck||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"><option value="">All decks</option>{(decks??[]).map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
   <input type="text" name="card" defaultValue={params.card||""} placeholder="Card ID" className="h-10 rounded-xl border border-slate-200 px-3 text-sm"/>
   <select name="rating" defaultValue={params.rating||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">All ratings</option>{["again","hard","good","easy"].map(x=><option key={x} value={x}>{x}</option>)}</select>
   <select name="event" defaultValue={params.event||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">All event kinds</option>{eventKinds.map(x=><option key={x} value={x}>{x}</option>)}</select>
   <input type="date" name="from" defaultValue={params.from||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"/>
   <div className="flex gap-2"><input type="date" name="to" defaultValue={params.to||""} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm"/><button className="rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-800">Filter</button></div>
  </form>
  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
   <div className="rounded-2xl border border-black/[0.06] bg-white p-4"><p className="text-sm font-semibold">Saved filters</p><div className="mt-3 space-y-2">{(savedFilters??[]).map((filter:any)=>{const query=filter.query||{};const url=new URLSearchParams(Object.entries(query).filter(([,value])=>Boolean(value)).map(([key,value])=>[key,String(value)]));return <div key={filter.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><a href={"/history?"+url.toString()} className="min-w-0 flex-1 truncate text-sm font-medium">{filter.name}</a><form action={deleteSavedFilter.bind(null,filter.id)}><button className="text-xs font-semibold text-red-600">Delete</button></form></div>})}{!(savedFilters??[]).length?<p className="text-xs text-slate-400">No saved filters yet.</p>:null}</div></div>
   <form action={saveHistoryFilter} className="rounded-2xl border border-black/[0.06] bg-white p-4"><p className="text-sm font-semibold">Save current filter</p><input name="name" required placeholder="e.g. Difficult cards" className="mt-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/><input type="hidden" name="query" value={JSON.stringify(Object.fromEntries(Object.entries(params).filter(([,value])=>Boolean(value))))}/><button className="mt-3 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Save filter</button></form>
  </div>
  {error?<div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</div>:null}
  <div className="mt-6 grid gap-4 md:grid-cols-4">
   <Metric label="Events" value={String(events.length)}/>
   <Metric label="Devices" value={String(new Set(events.map((event:any)=>event.device_id)).size)}/>
   <Metric label="Study time" value={Math.round(events.reduce((sum:number,event:any)=>sum+Number(event.elapsed_ms||0),0)/60000)+"m"}/>
   <Metric label="Again" value={String(events.filter((event:any)=>event.rating==="again").length)}/>
  </div>
  <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
   {events.map((event:any,index:number)=>{
    const card=Array.isArray(event.cards)?event.cards[0]:event.cards;
    const deck=Array.isArray(card?.decks)?card.decks[0]:card?.decks;
    const kind=String(event.metadata?.event_kind||"review");
    return <div key={event.id} className={"grid gap-3 p-4 sm:grid-cols-[120px_1fr_150px_130px] sm:items-center "+(index?"border-t border-black/[0.05]":"")}>
     <div><p className="text-xs font-semibold capitalize">{event.rating}</p><p className="mt-1 text-[11px] text-slate-400">{new Date(event.reviewed_at).toLocaleString()}</p></div>
     <div className="min-w-0"><p className="truncate text-sm font-medium">{card?.content?.front||"Untitled card"}</p><p className="mt-1 truncate text-xs text-slate-400">{deck?.name||"Unknown deck"} · {event.card_id.slice(0,8)}… · {kind}</p></div>
     <div className="text-xs text-slate-500">{Number(event.elapsed_ms||0)?Math.round(Number(event.elapsed_ms)/100)/10+"s":"—"} · {String(event.device_id).slice(0,8)}…</div>
     <div className="flex justify-end gap-2 text-xs font-semibold"><Link href={"/history?card="+event.card_id} className="text-slate-700 hover:text-slate-950">Card</Link><Link href={"/history?deck="+(card?.deck_id||"")} className="text-slate-700 hover:text-slate-950">Deck</Link></div>
    </div>;
   })}
   {!events.length?<div className="p-10 text-center text-sm text-slate-500">No review events match these filters.</div>:null}
  </div>
 </div></AppShell>;
}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-black/[0.06] bg-white p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>}
