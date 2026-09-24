import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlusIcon, SearchIcon } from "@/components/icons";
import { getDecks } from "@/lib/supabase/queries";

export default async function DecksPage() {
  const decks = await getDecks();
  return <AppShell><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-400">Library</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">My decks</h1><p className="mt-2 text-sm text-slate-500">{decks.length} deck{decks.length===1?"":"s"} in your workspace.</p></div><Link href="/decks/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"><PlusIcon size={16}/>New deck</Link></div>
    <div className="my-7 flex h-11 max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400"><SearchIcon size={17}/><input placeholder="Search your decks..." className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></div>
    {decks.length===0?<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><div className="font-semibold">Your deck library is empty</div><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Create a deck to start building your knowledge base.</p></div>:<div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">{decks.map((deck:any,index:number)=><Link href={"/decks/"+deck.id} key={deck.id} className={"flex items-center gap-4 p-5 transition hover:bg-slate-50 "+(index?"border-t border-black/[0.05]":"")}><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold">S</div><div className="min-w-0 flex-1"><h2 className="font-semibold">{deck.name}</h2><p className="mt-1 truncate text-xs text-slate-400">{deck.description||"No description"}</p></div><div className="w-20 text-right"><p className="text-sm font-semibold">{deck.cards?.[0]?.count??0}</p><p className="text-xs text-slate-400">cards</p></div></Link>)}</div>}
  </div></AppShell>;
}