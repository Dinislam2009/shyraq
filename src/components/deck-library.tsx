"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { reorderDecks } from "@/app/decks/actions";

type SavedFilter={name:string;query:string;sort:string};

export function DeckLibrary({ decks }: { decks: any[] }) {
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState("custom");
  const [dragged,setDragged]=useState<string|null>(null);
  const [savedFilters,setSavedFilters]=useState<SavedFilter[]>([]);
  const [filterName,setFilterName]=useState("");
  const [isPending,startTransition]=useTransition();
  const [scrollTop,setScrollTop]=useState(0);
  const workspaceId=String(decks[0]?.workspace_id||"");

  useEffect(()=>{
    try{setSavedFilters(JSON.parse(localStorage.getItem("shyraq:deck-filters")||"[]"));}catch{}
  },[]);

  const filtered=useMemo(()=>{
    const needle=query.trim().toLowerCase();
    const result=decks.filter(deck=>
      (!needle||String(deck.name||"").toLowerCase().includes(needle)||String(deck.description||"").toLowerCase().includes(needle))
    );
    if(sort==="name")result.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
    else if(sort==="cards")result.sort((a,b)=>Number(b.cards?.[0]?.count||0)-Number(a.cards?.[0]?.count||0));
    else if(sort==="recent")result.sort((a,b)=>new Date(String(b.updated_at)).getTime()-new Date(String(a.updated_at)).getTime());
    else result.sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    return result;
  },[decks,query,sort]);

  const DECK_ROW_HEIGHT=84;
  const DECK_VIEWPORT_HEIGHT=640;
  const shouldVirtualize=filtered.length>120;
  const virtualStart=shouldVirtualize?Math.max(0,Math.floor(scrollTop/DECK_ROW_HEIGHT)-6):0;
  const virtualCount=shouldVirtualize?Math.ceil(DECK_VIEWPORT_HEIGHT/DECK_ROW_HEIGHT)+12:filtered.length;
  const visibleDecks=shouldVirtualize?filtered.slice(virtualStart,virtualStart+virtualCount):filtered;
  const virtualTopHeight=virtualStart*DECK_ROW_HEIGHT;
  const virtualBottomHeight=shouldVirtualize?Math.max(0,(filtered.length-(virtualStart+visibleDecks.length))*DECK_ROW_HEIGHT):0;

  function saveFilter(){
    const name=filterName.trim();if(!name)return;
    const next=[...savedFilters.filter(item=>item.name!==name),{name,query,sort}];
    setSavedFilters(next);localStorage.setItem("shyraq:deck-filters",JSON.stringify(next));setFilterName("");
  }
  function applyFilter(filter:SavedFilter){setQuery(filter.query);setSort(filter.sort);}
  function moveDeck(fromId:string,toId:string){
    const order=filtered.map(deck=>String(deck.id));
    const from=order.indexOf(fromId),to=order.indexOf(toId);
    if(from<0||to<0||from===to)return;
    const [moved]=order.splice(from,1);order.splice(to,0,moved);
    startTransition(()=>{void reorderDecks(workspaceId,order);});
  }

  return <>
    <div className="my-7 flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex h-11 max-w-md flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400">
        <SearchIcon size={17}/>
        <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search your decks..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label="Search decks"/>
      </div>
      <select value={sort} onChange={event=>setSort(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" aria-label="Sort decks">
        <option value="custom">Custom order</option><option value="name">Name A–Z</option><option value="cards">Most cards</option><option value="recent">Recently updated</option>
      </select>
    </div>
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2">
      <input value={filterName} onChange={event=>setFilterName(event.target.value)} placeholder="Saved filter name" className="h-9 w-40 rounded-lg border border-slate-200 bg-white px-2 text-xs"/>
      <button type="button" onClick={saveFilter} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">Save filter</button>
      {savedFilters.map(filter=><button key={filter.name} type="button" onClick={()=>applyFilter(filter)} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold">{filter.name}</button>)}
      {sort==="custom"?<span className="ml-auto text-[11px] text-slate-400">{isPending?"Saving order…":"Drag a deck onto another to reorder"}</span>:null}
    </div>
    {filtered.length===0 ? (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="font-semibold">{decks.length ? "No matching decks" : "Your deck library is empty"}</div>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{decks.length ? "Try a different search." : "Create a deck to start building your knowledge base."}</p>
      </div>
    ) : (
      <div className="max-h-[70vh] overflow-auto rounded-2xl border border-black/[0.06] bg-white" onScroll={event=>setScrollTop(event.currentTarget.scrollTop)}>
        {shouldVirtualize&&<div aria-hidden="true" style={{height:virtualTopHeight}}/>}
        {visibleDecks.map((deck:any,index:number)=>(
          <div
            key={deck.id}
            draggable={sort==="custom"}
            onDragStart={()=>setDragged(String(deck.id))}
            onDragOver={event=>{if(sort==="custom")event.preventDefault();}}
            onDrop={()=>{if(dragged)moveDeck(dragged,String(deck.id));setDragged(null);}}
            className={"flex items-center gap-4 p-5 transition hover:bg-slate-50 "+(index?"border-t border-black/[0.05]":"")}
          >
            {deck.settings?.coverUrl?<img src={String(deck.settings.coverUrl)} alt="" className="h-11 w-16 shrink-0 rounded-xl object-cover"/>:<div className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold "+(sort==="custom"?"cursor-grab":"")}>{index+1}</div>}
            <Link href={"/decks/"+deck.id} className="min-w-0 flex-1">
              <h2 className="font-semibold">{deck.name}</h2>
              <p className="mt-1 truncate text-xs text-slate-400">{deck.description||"No description"}</p>
            </Link>
            <div className="w-20 text-right"><p className="text-sm font-semibold">{deck.cards?.[0]?.count??0}</p><p className="text-xs text-slate-400">cards</p></div>
          </div>
        ))}
        {shouldVirtualize&&<div aria-hidden="true" style={{height:virtualBottomHeight}}/>}
      </div>
    )}
  </>;
}
