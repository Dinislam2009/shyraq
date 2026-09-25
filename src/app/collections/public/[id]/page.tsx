import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {toggleFeaturedCollection} from "@/app/collections/actions";

export default async function PublicCollectionPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 const isModerator=user?(await supabase.rpc("is_platform_moderator")).data===true:false;
 const {data:collection}=await supabase.from("collections").select("id,name,description,kind,is_public,is_featured,owner_id,collection_cards(card_id)").eq("id",id).eq("is_public",true).maybeSingle();
 if(!collection)notFound();
 const ids=(collection.collection_cards??[]).map((row:any)=>String(row.card_id));
 const {data:cards}=ids.length?await supabase.from("cards").select("id,deck_id,kind,content").in("id",ids).limit(200):{data:[]};
 const {data:profile}=await supabase.from("profiles").select("id,username,display_name,bio,avatar_url").eq("id",collection.owner_id).maybeSingle();
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><Link href="/collections" className="text-sm text-slate-400">← Collections</Link><div className="mt-6 rounded-3xl border border-black/[0.06] bg-white p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Public collection</p><h1 className="mt-2 text-3xl font-semibold">{collection.name}</h1><p className="mt-2 text-sm text-slate-500">{cards?.length??0} visible cards · {collection.kind}</p></div>{profile?.username?<Link href={"/u/"+profile.username} className="text-sm font-semibold text-slate-600">@{profile.username}</Link>:null}</div><p className="mt-5 text-sm leading-6 text-slate-600">Only cards whose underlying deck is public are shown here.</p>{isModerator?<form action={toggleFeaturedCollection.bind(null,id,!collection.is_featured)} className="mt-4"><button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">{collection.is_featured?"Remove from featured":"Feature collection"}</button></form>:null}</div><div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white">{(cards??[]).map((card:any,i:number)=><div key={card.id} className={"grid gap-5 p-5 md:grid-cols-2 "+(i?"border-t border-black/[0.05]":"")}><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Front</p><p className="mt-2 whitespace-pre-wrap text-sm">{card.content?.front||""}</p></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Back</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{card.content?.back||""}</p></div></div>)}{!(cards??[]).length?<div className="p-10 text-center text-sm text-slate-500">No public cards are available in this collection.</div>:null}</div></div></AppShell>;
}
