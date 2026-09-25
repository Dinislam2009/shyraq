import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";

export default async function CreatorPage({params}:{params:Promise<{username:string}>}){
 const {username}=await params;const supabase=await createClient();
 const {data:profile}=await supabase.from("profiles").select("id,username,display_name,bio,avatar_url,created_at").eq("username",username.toLowerCase()).maybeSingle();
 if(!profile)notFound();
 const {data:decks}=await supabase.from("decks").select("id,name,description,updated_at,cards(count),settings").eq("owner_id",profile.id).eq("visibility","public").order("updated_at",{ascending:false});
 const publicDeckIds=(decks??[]).map((deck:any)=>deck.id);
 const {data:publicCollections}=await supabase.from("collections").select("id,name,kind,is_public,collection_cards(card_id)").eq("owner_id",profile.id).eq("is_public",true).order("created_at",{ascending:false}).limit(20);
 const [{data:followRows},{data:copyRows}]=await Promise.all([
  publicDeckIds.length?supabase.from("public_deck_follows").select("deck_id").in("deck_id",publicDeckIds):Promise.resolve({data:[]}),
  publicDeckIds.length?supabase.from("deck_copies").select("source_deck_id").in("source_deck_id",publicDeckIds):Promise.resolve({data:[]})
 ]);
 const followers=followRows?.length??0;
 const copies=copyRows?.length??0;
 const totalCards=(decks??[]).reduce((sum:number,deck:any)=>sum+Number(deck.cards?.[0]?.count||0),0);
 return <AppShell><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><Link href="/explore" className="text-sm text-slate-400">← Public decks</Link><div className="mt-6 rounded-3xl border border-black/[0.06] bg-white p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center">{profile.avatar_url?<img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover"/>:<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold">{String(profile.display_name||profile.username||"S").slice(0,1).toUpperCase()}</div>}<div><h1 className="text-3xl font-semibold">{profile.display_name||profile.username}</h1><p className="mt-1 text-sm text-slate-400">@{profile.username}</p><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{profile.bio||"Shyraq creator"}</p></div></div><div className="mt-7 grid gap-3 sm:grid-cols-3"><Metric label="Public decks" value={String(decks?.length??0)}/><Metric label="Cards published" value={String(totalCards)}/><Metric label="Followers" value={String(followers??0)}/></div><p className="mt-5 text-xs text-slate-400">Creator since {new Date(profile.created_at).toLocaleDateString()} · {copies??0} tracked copies</p></div><section className="mt-8"><h2 className="text-lg font-semibold">Public decks</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(decks??[]).map((d:any)=><Link href={"/explore/"+d.id} key={d.id} className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:shadow-sm"><h3 className="font-semibold">{d.name}</h3><p className="mt-2 line-clamp-2 text-sm text-slate-500">{d.description||"No description"}</p><div className="mt-5 flex flex-wrap gap-1">{[d.settings?.category,d.settings?.subject,d.settings?.language,d.settings?.difficulty].filter(Boolean).map((value:any)=><span key={String(value)} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-500">{String(value)}</span>)}</div><p className="mt-5 text-xs text-slate-400">{d.cards?.[0]?.count??0} cards</p></Link>)}</div></section></div></AppShell>;
}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-black/[0.06] bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>}
