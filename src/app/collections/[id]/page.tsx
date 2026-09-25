import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {addCardToCollection,deleteCollection,removeCardFromCollection,updateCollection,updateCollectionSort} from "@/app/collections/actions";

export default async function CollectionPage({params,searchParams}:{params:Promise<{id:string}>;searchParams?:Promise<{sort?:string}>}){
 const {id}=await params;const query=searchParams?await searchParams:{};
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <AppShell><div className="mx-auto max-w-5xl px-5 py-10">Sign in to manage collections.</div></AppShell>;
 const {data:collection}=await supabase.from("collections").select("id,name,kind,owner_id,sort_mode,rule,collection_cards(card_id)").eq("id",id).eq("owner_id",user.id).maybeSingle();
 if(!collection)notFound();

 let cards:any[]=[];
 if(collection.kind==="smart"){
  const rule=collection.rule||{};
  let source:any[]= (await supabase.from("cards").select("id,deck_id,kind,content,updated_at,created_at").eq("owner_id",user.id).limit(50000)).data??[];
  if(rule.marked)source=source.filter((card:any)=>Boolean(card.is_marked));
  if(rule.suspended)source=source.filter((card:any)=>Boolean(card.is_suspended));
  if(rule.kind)source=source.filter((card:any)=>String(card.kind)===String(rule.kind));
  if(rule.tag){
   const {data:tag}=await supabase.from("tags").select("id").eq("workspace_id",(await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle()).data?.id).eq("name",String(rule.tag)).maybeSingle();
   const ids=tag?(await supabase.from("card_tags").select("card_id").eq("tag_id",tag.id)).data??[]:[];
   const allowed=new Set(ids.map((x:any)=>x.card_id));source=source.filter((card:any)=>allowed.has(card.id));
  }
  cards=source;
 }else{
  const ids=(collection.collection_cards??[]).map((x:any)=>x.card_id);
  cards=ids.length?(await supabase.from("cards").select("id,deck_id,kind,content,updated_at,created_at").in("id",ids)).data??[]:[];
 }
 const sortMode=query.sort||collection.sort_mode||"manual";
 if(sortMode==="name")cards.sort((a,b)=>String(a.content?.front||"").localeCompare(String(b.content?.front||"")));
 if(sortMode==="recent")cards.sort((a,b)=>new Date(String(b.updated_at)).getTime()-new Date(String(a.updated_at)).getTime());
 if(sortMode==="size")cards.sort((a,b)=>String(b.content?.front||"").length-String(a.content?.front||"").length);

 return <AppShell><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
  <Link href="/collections" className="text-sm text-slate-400">← Collections</Link>
  <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{collection.kind}</p><h1 className="mt-2 text-3xl font-semibold">{collection.name}</h1><p className="mt-2 text-sm text-slate-500">{cards.length} cards</p></div>{collection.kind!=="favorites"?<form action={deleteCollection.bind(null,id)}><button className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600">Delete collection</button></form>:null}</div>
  <div className="mt-6 grid gap-4 md:grid-cols-[1fr_300px]">
   <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
    {cards.map((c:any,i:number)=><div key={c.id} className={"flex items-start gap-4 p-5 "+(i?"border-t border-black/[0.05]":"")}><Link href={"/decks/"+c.deck_id} className="min-w-0 flex-1 hover:text-slate-600"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{c.kind}</p><p className="mt-2 truncate font-medium">{c.content?.front||"Untitled card"}</p><p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.content?.back||""}</p></Link>{collection.kind!=="smart"?<form action={removeCardFromCollection.bind(null,id,c.id)}><button className="text-xs font-semibold text-slate-500 hover:text-red-600">Remove</button></form>:null}</div>)}
    {!cards.length?<div className="p-10 text-center text-sm text-slate-500">No cards match this collection.</div>:null}
   </div>
   <div className="space-y-4">
    {collection.kind!=="favorites"?<form action={updateCollection.bind(null,id)} className="rounded-2xl border border-black/[0.06] bg-white p-5"><h2 className="text-sm font-semibold">{collection.kind==="smart"?"Edit smart collection":"Rename"}</h2><input name="name" defaultValue={collection.name} className="mt-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/>{collection.kind==="smart"?<div className="mt-3 grid gap-2"><select name="rule_kind" className="h-10 rounded-xl border border-slate-200 px-2 text-sm"><option value="kind">Card kind</option><option value="marked">Marked</option><option value="suspended">Suspended</option><option value="tag">Tag</option></select><input name="rule_value" defaultValue={String(collection.rule?.tag||collection.rule?.kind||"")} placeholder="kind or tag name" className="h-10 rounded-xl border border-slate-200 px-3 text-sm"/></div>:null}<button className="mt-3 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Save</button></form>:null}
    <form action={updateCollectionSort.bind(null,id)} className="rounded-2xl border border-black/[0.06] bg-white p-5"><h2 className="text-sm font-semibold">Sorting</h2><select name="sort_mode" defaultValue={sortMode} className="mt-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="manual">Manual</option><option value="name">Front A–Z</option><option value="recent">Recently updated</option><option value="size">Longest front</option></select><button className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Save sorting</button></form>
    {collection.kind!=="smart"?<form action={addCardToCollection.bind(null,id)} className="rounded-2xl border border-black/[0.06] bg-white p-5"><h2 className="text-sm font-semibold">Add card</h2><input required name="card_id" placeholder="Card ID" className="mt-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/><button className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Add card</button></form>:null}
   </div>
  </div>
 </div></AppShell>;
}
