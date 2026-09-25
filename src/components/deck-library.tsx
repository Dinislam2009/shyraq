"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";

export function DeckLibrary({ decks }: { decks: any[] }) {
  const [query,setQuery]=useState("");
  const filtered=useMemo(()=>{
    const needle=query.trim().toLowerCase();
    if(!needle)return decks;
    return decks.filter(deck=>
      String(deck.name||"").toLowerCase().includes(needle) ||
      String(deck.description||"").toLowerCase().includes(needle)
    );
  },[decks,query]);

  return (
    <>
      <div className="my-7 flex h-11 max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400">
        <SearchIcon size={17}/>
        <input
          value={query}
          onChange={event=>setQuery(event.target.value)}
          placeholder="Search your decks..."
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          aria-label="Search decks"
        />
      </div>

      {filtered.length===0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="font-semibold">{decks.length ? "No matching decks" : "Your deck library is empty"}</div>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {decks.length ? "Try a different search." : "Create a deck to start building your knowledge base."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
          {filtered.map((deck:any,index:number)=>(
            <Link
              href={"/decks/"+deck.id}
              key={deck.id}
              className={"flex items-center gap-4 p-5 transition hover:bg-slate-50 "+(index?"border-t border-black/[0.05]":"")}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold">S</div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{deck.name}</h2>
                <p className="mt-1 truncate text-xs text-slate-400">{deck.description||"No description"}</p>
              </div>
              <div className="w-20 text-right">
                <p className="text-sm font-semibold">{deck.cards?.[0]?.count??0}</p>
                <p className="text-xs text-slate-400">cards</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
