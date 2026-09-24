import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getDeck } from "@/lib/supabase/queries";
import { deleteDeck } from "@/app/decks/actions";
import { updateCard, deleteCard } from "@/app/decks/[id]/cards/actions";

export default async function DeckPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params; const deck:any=await getDeck(id); if(!deck)notFound(); const cards=deck.cards??[];
 return <AppShell><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
  <Link href="/decks" className="text-sm text-slate-400 hover:text-slate-700">← Back to decks</Link>
  <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold">S</div><h1 className="text-3xl font-semibold tracking-tight">{deck.name}</h1><p className="mt-2 text-sm text-slate-500">{deck.description||"No description"}</p></div><div className="flex gap-2"><Link href={"/decks/"+id+"/cards/new"} className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">Add card</Link><Link href="/review" className="inline-flex h-11 items-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white">Study</Link></div></div>
  <div className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Cards" value={String(cards.length)}/><Metric label="Visibility" value={deck.visibility}/><Metric label="Status" value="Active"/></div>
  <div className="mt-8 rounded-2xl border border-black/[0.06] bg-white"><div className="flex items-center justify-between border-b border-black/[0.05] px-6 py-4"><div><h2 className="font-semibold">Cards</h2><p className="mt-1 text-xs text-slate-400">Inline editing is the fastest path for building a deck.</p></div></div>
  {cards.length===0?<div className="p-12 text-center"><p className="font-semibold">No cards yet</p><Link href={"/decks/"+id+"/cards/new"} className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Add your first card</Link></div>:<div>{cards.map((card:any,index:number)=><div key={card.id} className={"p-6 "+(index?"border-t border-black/[0.05]":"")}><div className="mb-4 flex items-center justify-between"><span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{card.kind}</span><form action={deleteCard.bind(null,id,card.id)}><button className="text-xs font-medium text-slate-400 hover:text-red-600">Delete</button></form></div><form action={updateCard.bind(null,id,card.id)}><div className="grid gap-4 md:grid-cols-2"><textarea name="front" defaultValue={card.content?.front||""} className="min-h-28 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"/><textarea name="back" defaultValue={card.content?.back||""} className="min-h-28 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"/></div><input type="hidden" name="kind" value={card.kind}/><div className="mt-3 flex justify-end"><button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">Save changes</button></div></form></div>)}</div>}
  </div>
 </div></AppShell>;
}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>}