import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {restoreDeck} from "@/app/decks/[id]/settings/actions";

export default async function TrashPage({searchParams}:{searchParams?:Promise<{error?:string;saved?:string}>}){
 const params=searchParams?await searchParams:{};
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <AppShell><div className="mx-auto max-w-4xl px-5 py-10">Sign in to view deck trash.</div></AppShell>;
 const {data:decks}=await supabase.from("decks").select("id,name,description,workspace_id,owner_id,deleted_at,cards(count)").eq("owner_id",user.id).not("deleted_at","is",null).order("deleted_at",{ascending:false});
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><Link href="/decks" className="text-sm text-slate-400">← Decks</Link><div className="mt-5"><h1 className="text-3xl font-semibold tracking-tight">Trash</h1><p className="mt-2 text-sm text-slate-500">Trashed decks can be restored before permanent deletion.</p></div>{params.error?<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error}</div>:null}{params.saved?<div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Deck restored.</div>:null}<div className="mt-8 space-y-3">{(decks??[]).map((deck:any)=><div key={deck.id} className="flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">{deck.name}</h2><p className="mt-1 text-sm text-slate-500">{deck.description||"No description"}</p><p className="mt-2 text-xs text-slate-400">{deck.cards?.[0]?.count??0} cards · trashed {new Date(deck.deleted_at).toLocaleString()}</p></div><form action={restoreDeck.bind(null,deck.id)}><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Restore</button></form></div>)}{!(decks??[]).length?<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400">Trash is empty.</div>:null}</div></div></AppShell>;
}
