import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
export default async function CollectionPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const supabase=await createClient();const {data:collection}=await supabase.from("collections").select("id,name,kind,collection_cards(card_id)").eq("id",id).maybeSingle();if(!collection)notFound();
 const ids=(collection.collection_cards??[]).map((x:any)=>x.card_id);const {data:cards}=ids.length?await supabase.from("cards").select("id,deck_id,kind,content").in("id",ids):{data:[]};
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><Link href="/collections" className="text-sm text-slate-400">← Collections</Link><p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{collection.kind}</p><h1 className="mt-2 text-3xl font-semibold">{collection.name}</h1><p className="mt-2 text-sm text-slate-500">{cards?.length??0} cards</p><div className="mt-8 overflow-hidden rounded-2xl border border-black/[0.06] bg-white">{(cards??[]).map((c:any,i:number)=><Link href={"/decks/"+c.deck_id} key={c.id} className={"block p-5 hover:bg-slate-50 "+(i?"border-t border-black/[0.05]":"")}><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{c.kind}</p><p className="mt-2 font-medium">{c.content?.front||"Untitled card"}</p><p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.content?.back||""}</p></Link>)}</div></div></AppShell>;
}