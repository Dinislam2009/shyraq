import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {deleteMarker,renameMarker} from "@/app/markers/actions";
import Link from "next/link";

export default async function MarkersPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const {data:cards}=await supabase.from("cards").select("id,content,deck_id").eq("owner_id",user.id).limit(50000);
 const counts=new Map<string,number>();
 for(const card of cards??[]){for(const marker of Array.isArray(card.content?.markers)?card.content.markers:[]){const name=String(marker);counts.set(name,(counts.get(name)||0)+1);}}
 const markers=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><div><p className="text-sm text-slate-400">Organization</p><h1 className="mt-1 text-3xl font-semibold">Marker manager</h1><p className="mt-2 text-sm text-slate-500">Custom card markers for difficult, exam, revise and other personal workflows.</p></div>
  <div className="mt-8 overflow-hidden rounded-2xl border border-black/[0.06] bg-white">{markers.map(([name,count],index)=><div key={name} className={"flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between "+(index?"border-t border-black/[0.05]":"")}><div><div className="flex items-center gap-2"><span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{name}</span><span className="text-xs text-slate-400">{count} cards</span></div></div><div className="flex flex-wrap gap-2"><form action={renameMarker.bind(null,name)} className="flex gap-1"><input name="name" defaultValue={name} className="h-9 w-40 rounded-lg border border-slate-200 px-2 text-xs"/><button className="rounded-lg border border-slate-200 px-3 text-xs font-semibold">Rename</button></form><a href={"/decks?marker="+encodeURIComponent(name)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Filter decks</a><form action={deleteMarker.bind(null,name)}><button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Delete</button></form></div></div>)}{!markers.length?<div className="p-12 text-center text-sm text-slate-500">No custom markers yet.</div>:null}</div>
  <div className="mt-6"><Link href="/decks" className="text-sm font-semibold text-slate-700">Back to decks</Link></div>
 </div></AppShell>;
}
