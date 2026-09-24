import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";

export default async function ExplorePage({searchParams}:{searchParams:Promise<{q?:string}>}){
 const {q}=await searchParams;const query=String(q||"").trim();const supabase=await createClient();
 let request=supabase.from("decks").select("id,name,description,updated_at,owner_id,cards(count)").eq("visibility","public").order("updated_at",{ascending:false}).limit(50);
 if(query)request=request.or("name.ilike.%"+query+"%,description.ilike.%"+query+"%");
 const {data:decks}=await request;
 const ownerIds=[...new Set((decks??[]).map((d:any)=>d.owner_id).filter(Boolean))];
 const {data:profiles}=ownerIds.length?await supabase.from("profiles").select("id,username,display_name").in("id",ownerIds):{data:[]};
 const profileById=new Map((profiles??[]).map((p:any)=>[p.id,p]));
 return <AppShell><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><p className="text-sm text-slate-400">Community</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Public decks</h1><p className="mt-2 text-sm text-slate-500">Browse decks shared by Shyraq creators.</p><form className="mt-6 max-w-xl"><input name="q" defaultValue={query} placeholder="Search decks..." className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"/></form><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(decks??[]).map((d:any)=>{const profile=profileById.get(d.owner_id);return <Link href={"/explore/"+d.id} key={d.id} className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:border-black/10 hover:shadow-sm"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold">S</div>{profile?.username?<span className="text-xs text-slate-400">@{profile.username}</span>:<span className="text-xs text-slate-400">{profile?.display_name||"Creator"}</span>}</div><h2 className="mt-5 font-semibold">{d.name}</h2><p className="mt-2 line-clamp-2 text-sm text-slate-500">{d.description||"No description"}</p><p className="mt-5 text-xs text-slate-400">{d.cards?.[0]?.count??0} cards</p></Link>})}</div>{!(decks??[]).length&&<div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No public decks match your search.</div>}</div></AppShell>;
}