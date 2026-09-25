import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {addCardToCollection,deleteCollection,removeCardFromCollection,updateCollection} from "@/app/collections/actions";

export default async function CollectionPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return <AppShell><div className="mx-auto max-w-5xl px-5 py-10">Sign in to manage collections.</div></AppShell>;
 const {data:collection}=await supabase.from("collections").select("id,name,kind,owner_id,collection_cards(card_id)").eq("id",id).eq("owner_id",user.id).maybeSingle();if(!collection)notFound();
 const ids=(collection.collection_cards??[]).map((x:any)=>x.card_id);
 const {data:cards}=ids.length?await supabase.from("cards").select("id,deck_id,kind,content").in("id",ids):{data:[]};
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
  <Link href="/collections" className="text-sm text-slate-400">← Collections</Link>
  <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
   <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{collection.kind}</p><h1 className="mt-2 text-3xl font-semibold">{collection.name}</h1><p className="mt-2 text-sm text-slate-500">{cards?.length??0} cards</p></div>
   {collection.kind!=="favorites"?<form action={deleteCollection.bind(null,id)}><button className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600">Delete collection</button></form>:null}
  </div>
  <div className="mt-6 grid gap-4 md:grid-cols-[1fr_280px]">
   <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
    {(cards??[]).map((c:any,i:number)=><div key={c.id} className={"flex items-start gap-4 p-5 "+(i?"border-t border-black/[0.05]":"")}><Link href={"/decks/"+c.deck_id} className="min-w-0 flex-1 hover:text-slate-600"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{c.kind}</p><p className="mt-2 truncate font-medium">{c.content?.front||"Untitled card"}</p><p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.content?.back||""}</p></Link><form action={removeCardFromCollection.bind(null,id,c.id)}><button className="text-xs font-semibold text-slate-500 hover:text-red-600">Remove</button></form></div>)}
    {!(cards??[]).length?<div className="p-10 text-center text-sm text-slate-500">No cards in this collection.</div>:null}
   </div>
   <div className="space-y-4">
    {collection.kind!=="favorites"?<form action={updateCollection.bind(null,id)} className="rounded-2xl border border-black/[0.06] bg-white p-5"><h2 className="text-sm font-semibold">Rename</h2><input name="name" defaultValue={collection.name} className="mt-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/><button className="mt-3 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Save name</button></form>:null}
    <form action={addCardToCollection.bind(null,id)} className="rounded-2xl border border-black/[0.06] bg-white p-5"><h2 className="text-sm font-semibold">Add card</h2><p className="mt-1 text-xs leading-5 text-slate-500">Paste an existing card ID from the card editor URL.</p><input required name="card_id" placeholder="Card ID" className="mt-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/><button className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Add card</button></form>
   </div>
  </div>
 </div></AppShell>;
}