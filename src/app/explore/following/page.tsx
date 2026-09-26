import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {unfollowDeck} from "@/app/explore/[id]/actions";

export default async function FollowingPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return <AppShell><div className="mx-auto max-w-5xl px-5 py-10">Sign in to manage followed decks.</div></AppShell>;
 const {data:follows}=await supabase.from("public_deck_follows").select("deck_id,created_at,decks!inner(id,name,description,updated_at,owner_id,visibility)").eq("user_id",user.id).eq("decks.visibility","public").order("created_at",{ascending:false});
 const creatorIds=(follows??[]).map((f:any)=>f.decks?.owner_id).filter(Boolean);
 const {data:creatorRelations}=creatorIds.length?await supabase.from("creator_relations").select("creator_id,relation").eq("user_id",user.id).in("relation",["mute","block"]).in("creator_id",[...new Set(creatorIds)]):{data:[]};
 const hiddenCreators=new Set((creatorRelations??[]).map((row:any)=>String(row.creator_id)));
 const visibleFollows=(follows??[]).filter((f:any)=>!hiddenCreators.has(String(f.decks?.owner_id)));
 const visibleCreatorIds=visibleFollows.map((f:any)=>f.decks?.owner_id).filter(Boolean);\n const {data:profiles}=visibleCreatorIds.length?await supabase.from("profiles").select("id,username,display_name").in("id",[...new Set(visibleCreatorIds)]):{data:[]};
 const profileMap=new Map((profiles??[]).map((p:any)=>[p.id,p]));
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><div className="flex items-end justify-between gap-3"><div><p className="text-sm text-slate-400">Community</p><h1 className="mt-1 text-3xl font-semibold">Following</h1><p className="mt-2 text-sm text-slate-500">Public decks you follow.</p></div><Link href="/explore" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Explore public decks</Link></div>
 <div className="mt-8 space-y-3">{visibleFollows.map((follow:any)=>{const deck=follow.decks;const profile=profileMap.get(deck?.owner_id);return <div key={deck.id} className="flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><Link href={"/explore/"+deck.id} className="font-semibold hover:underline">{deck.name}</Link><p className="mt-1 text-sm text-slate-500">{deck.description||"No description"}</p><p className="mt-1 text-xs text-slate-400">{profile?.username?"@"+profile.username:(profile?.display_name||"Creator")} · followed {new Date(follow.created_at).toLocaleDateString()}</p></div><form action={unfollowDeck.bind(null,deck.id)}><button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Unfollow</button></form></div>})}</div>
 {!visibleFollows.length?<div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">You are not following any public decks yet.</div>:null}
 </div></AppShell>;
}
