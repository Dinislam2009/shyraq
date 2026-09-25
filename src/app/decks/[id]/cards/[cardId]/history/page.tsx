import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";

export default async function CardHistoryPage({params}:{params:Promise<{id:string;cardId:string}>}){
 const {id,cardId}=await params;const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const [{data:card},{data:events}]=await Promise.all([
  supabase.from("cards").select("id,deck_id,kind,content,updated_at").eq("id",cardId).eq("deck_id",id).eq("owner_id",user.id).maybeSingle(),
  supabase.from("review_events").select("id,rating,reviewed_at,elapsed_ms,metadata,previous_state,next_state").eq("card_id",cardId).eq("user_id",user.id).neq("metadata->>event_kind","review-undo").order("reviewed_at",{ascending:false}).limit(500)
 ]);
 if(!card)notFound();
 return <AppShell><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><Link href={"/decks/"+id} className="text-sm text-slate-400">← Deck</Link><div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">{card.kind}</p><h1 className="mt-2 text-2xl font-semibold">{card.content?.front||"Untitled card"}</h1><p className="mt-2 text-sm text-slate-500">{card.content?.back||"No answer"}</p></div><div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white"><div className="border-b border-black/[0.05] px-6 py-4"><h2 className="font-semibold">Review history</h2><p className="mt-1 text-xs text-slate-400">{events?.length??0} recorded reviews</p></div>{(events??[]).map((event:any)=><div key={event.id} className="grid gap-3 border-b border-black/[0.05] px-6 py-4 sm:grid-cols-[90px_1fr_100px] sm:items-center"><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-center text-xs font-semibold capitalize">{event.rating}</span><div><p className="text-sm font-medium">{new Date(event.reviewed_at).toLocaleString()}</p><p className="mt-1 text-xs text-slate-400">{Math.round(Number(event.elapsed_ms||0)/100)/10}s · {event.metadata?.event_kind||"review"}</p></div><details><summary className="cursor-pointer text-xs font-semibold text-slate-500">State</summary><pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-50 p-2 text-[10px]">{JSON.stringify(event.next_state||{},null,2)}</pre></details></div>)}{!(events??[]).length?<div className="p-10 text-center text-sm text-slate-500">No reviews recorded for this card yet.</div>:null}</div></div></AppShell>;
}
