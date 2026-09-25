import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {setCreatorRelation} from "@/app/u/actions";

export default async function CreatorPage({params}:{params:Promise<{username:string}>}){
 const {username}=await params;
 const supabase=await createClient();
 const {data:profile}=await supabase.from("profiles").select("id,username,display_name,bio,avatar_url,created_at,show_activity,show_followers").eq("username",username.toLowerCase()).maybeSingle();
 if(!profile)notFound();

 let avatarSrc=String(profile.avatar_url||"");
 if(avatarSrc&&!avatarSrc.startsWith("http")){
  const signed=await supabase.storage.from("user-media").createSignedUrl(avatarSrc,3600);
  avatarSrc=signed.data?.signedUrl||"";
 }

 const {data:{user}}=await supabase.auth.getUser();
 const {data:relations}=user?await supabase.from("creator_relations").select("relation").eq("user_id",user.id).eq("creator_id",profile.id):{data:[]};
 const relationSet=new Set((relations??[]).map((row:any)=>String(row.relation)));

 const {data:decksRaw}=await supabase.from("decks").select("id,name,description,updated_at,owner_id,settings,cards(count)").eq("owner_id",profile.id).eq("visibility","public").is("deleted_at",null).order("updated_at",{ascending:false});
 const decks:any[]=decksRaw??[];
 const publicDeckIds=decks.map((deck:any)=>deck.id);

 const [{data:followRows},{data:copyRows},{data:publicCollections},{data:activities}]=await Promise.all([
  publicDeckIds.length?supabase.from("public_deck_follows").select("deck_id").in("deck_id",publicDeckIds):Promise.resolve({data:[]}),
  publicDeckIds.length?supabase.from("deck_copies").select("source_deck_id").in("source_deck_id",publicDeckIds):Promise.resolve({data:[]}),
  supabase.from("collections").select("id,name,kind,is_public,collection_cards(card_id)").eq("owner_id",profile.id).eq("is_public",true).order("created_at",{ascending:false}).limit(20),
  publicDeckIds.length&&profile.show_activity!==false?supabase.from("activity_feed").select("id,entity_id,event_type,created_at").eq("actor_id",profile.id).eq("entity_type","deck").in("entity_id",publicDeckIds).order("created_at",{ascending:false}).limit(30):Promise.resolve({data:[]})
 ]);
 const followers=followRows?.length??0;
 const copies=copyRows?.length??0;
 const totalCards=decks.reduce((sum:number,deck:any)=>sum+Number(deck.cards?.[0]?.count||0),0);
 const deckMap=new Map(decks.map((deck:any)=>[deck.id,deck]));
 const publicActivity=(activities??[]).filter((entry:any)=>deckMap.has(entry.entity_id)).slice(0,10);

 return <AppShell><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
  <Link href="/explore" className="text-sm text-slate-400">← Public decks</Link>
  <div className="mt-6 rounded-3xl border border-black/[0.06] bg-white p-8">
   <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
    {avatarSrc?<img src={avatarSrc} alt="" className="h-16 w-16 rounded-2xl object-cover"/>:<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold">{String(profile.display_name||profile.username||"S").slice(0,1).toUpperCase()}</div>}
    <div className="min-w-0"><h1 className="text-3xl font-semibold">{profile.display_name||profile.username}</h1><p className="mt-1 text-sm text-slate-400">@{profile.username}</p><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{profile.bio||"Shyraq creator"}</p></div>
   </div>
   <div className="mt-7 grid gap-3 sm:grid-cols-3"><Metric label="Public decks" value={String(decks.length)}/><Metric label="Cards published" value={String(totalCards)}/>{profile.show_followers!==false?<Metric label="Followers" value={String(followers)}/>:<Metric label="Followers" value="Hidden" />}</div>
   <div className="mt-5 flex flex-wrap gap-2">
    {user&&user.id!==profile.id?<><form action={setCreatorRelation.bind(null,String(profile.username),"mute",!relationSet.has("mute"))}><button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">{relationSet.has("mute")?"Unmute creator":"Mute creator"}</button></form><form action={setCreatorRelation.bind(null,String(profile.username),"block",!relationSet.has("block"))}><button className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700">{relationSet.has("block")?"Unblock creator":"Block creator"}</button></form></>:null}
   </div>
   <p className="mt-5 text-xs text-slate-400">{profile.show_activity!==false?"Creator activity is public.":"Creator activity is limited."} · Creator since {new Date(profile.created_at).toLocaleDateString()} · {copies} tracked copies</p>
  </div>

  <section className="mt-8"><h2 className="text-lg font-semibold">Public decks</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{decks.map((deck:any)=><Link href={"/explore/"+deck.id} key={deck.id} className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white hover:shadow-sm">{deck.settings?.coverUrl?<img src={String(deck.settings.coverUrl)} alt="" className="h-28 w-full object-cover"/>:null}<div className="p-6"><h3 className="font-semibold">{deck.name}</h3><p className="mt-2 line-clamp-2 text-sm text-slate-500">{deck.description||"No description"}</p><div className="mt-5 flex flex-wrap gap-1">{[deck.settings?.category,deck.settings?.subject,deck.settings?.language,deck.settings?.difficulty].filter(Boolean).map((value:any)=><span key={String(value)} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-500">{String(value)}</span>)}</div><p className="mt-5 text-xs text-slate-400">{deck.cards?.[0]?.count??0} cards</p></div></Link>)}</div>{!decks.length?<p className="mt-4 text-sm text-slate-400">No public decks yet.</p>:null}</section>

  <section className="mt-10"><h2 className="text-lg font-semibold">Creator collections</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(publicCollections??[]).map((collection:any)=><Link key={collection.id} href={"/collections/public/"+collection.id} className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:shadow-sm"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">{collection.kind}</p><h3 className="mt-2 font-semibold">{collection.name}</h3><p className="mt-2 text-sm text-slate-500">{collection.collection_cards?.length??0} cards</p></Link>)}</div>{!(publicCollections??[]).length?<p className="mt-3 text-sm text-slate-400">No public collections yet.</p>:null}</section>

  {profile.show_activity!==false?<section className="mt-10"><h2 className="text-lg font-semibold">Recent public activity</h2><div className="mt-4 space-y-2">{publicActivity.map((entry:any)=><div key={entry.id} className="rounded-xl border border-black/[0.06] bg-white p-4"><p className="text-sm font-medium">{String(entry.event_type).replaceAll("."," ")} · {deckMap.get(entry.entity_id)?.name||"Deck"}</p><p className="mt-1 text-xs text-slate-400">{new Date(entry.created_at).toLocaleString()}</p></div>)}{!publicActivity.length?<p className="mt-3 text-sm text-slate-400">No recent public activity.</p>:null}</div></section>:null}
 </div></AppShell>;
}

function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-black/[0.06] bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>}
