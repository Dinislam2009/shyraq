"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteCard, setCardFlag, updateCard, bulkDeleteCards, bulkSetCardFlag } from "@/app/decks/[id]/cards/actions";
import { toggleFavorite } from "@/app/collections/actions";
import { useI18n } from "@/components/i18n-provider";

type CardRow = {
  id: string;
  kind: string;
  content: {
    front?: string;
    back?: string;
    tags?: string[];
    markers?: string[];
    status?: string;
  };
  is_suspended?: boolean;
  is_marked?: boolean;
  updated_at?: string;
};

export function CardManager({ deckId, cards, favoriteIds, canEdit = true }: { deckId: string; cards: CardRow[]; favoriteIds: string[]; canEdit?: boolean }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [markerFilter, setMarkerFilter] = useState("");
  const [markedOnly, setMarkedOnly] = useState(false);
  const [suspendedOnly, setSuspendedOnly] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [viewName, setViewName] = useState("");
  const [savedViews, setSavedViews] = useState<Array<{name:string;query:string;kind:string;status:string;tag:string;marker:string;markedOnly:boolean;suspendedOnly:boolean}>>([]);
  const { t } = useI18n();

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("shyraq-deck-" + deckId)
      .on("postgres_changes", { event: "*", schema: "public", table: "cards", filter: "deck_id=eq." + deckId }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "card_templates", filter: "deck_id=eq." + deckId }, () => router.refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [deckId, router]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return cards.filter(card => {
      const matchesQuery = !needle || [
        card.content?.front,
        card.content?.back,
        ...(Array.isArray(card.content?.tags) ? card.content.tags : [])
      ].join(" ").toLowerCase().includes(needle);
      const matchesKind = kind === "all" || card.kind === kind;
      const matchesStatus =
        status === "all" ||
        (status === "marked" && card.is_marked) ||
        (status === "suspended" && card.is_suspended) ||
        (status === "active" && !card.is_suspended) ||
        (status !== "all" && status !== "marked" && status !== "suspended" && status !== "active" && String(card.content?.status||"") === status);
      const tags=Array.isArray(card.content?.tags)?card.content.tags.map(String):[];
      const markers=Array.isArray(card.content?.markers)?card.content.markers.map(String):[];
      const matchesTag=!tagFilter||tags.some(value=>value.toLowerCase()===tagFilter.toLowerCase());
      const matchesMarker=!markerFilter||markers.some(value=>value.toLowerCase()===markerFilter.toLowerCase());
      const matchesMarked=!markedOnly||Boolean(card.is_marked);
      const matchesSuspended=!suspendedOnly||Boolean(card.is_suspended);
      return matchesQuery && matchesKind && matchesStatus && matchesTag && matchesMarker && matchesMarked && matchesSuspended;
    });
  }, [cards, kind, query, status, tagFilter, markerFilter, markedOnly, suspendedOnly]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.key.toLowerCase() === "j" || event.key.toLowerCase() === "k") {
        const current = document.activeElement?.getAttribute("data-card-index");
        const nextIndex = current === null ? 0 : Math.max(0, Math.min(filtered.length - 1, Number(current) + (event.key.toLowerCase()==="j"?1:-1)));
        document.querySelector('[data-card-index="'+nextIndex+'"]')?.scrollIntoView({behavior:"smooth",block:"center"});
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered.length]);

  function saveView(){
    const name=viewName.trim(); if(!name)return;
    const next=[...savedViews.filter(view=>view.name!==name),{name,query,kind,status,tag:tagFilter,marker:markerFilter,markedOnly,suspendedOnly}];
    setSavedViews(next); localStorage.setItem("shyraq:card-views:"+deckId,JSON.stringify(next)); setViewName("");
  }
  function applyView(view:{name:string;query:string;kind:string;status:string;tag?:string;marker?:string;markedOnly?:boolean;suspendedOnly?:boolean}){
    setQuery(view.query);setKind(view.kind);setStatus(view.status);setTagFilter(view.tag||"");setMarkerFilter(view.marker||"");setMarkedOnly(Boolean(view.markedOnly));setSuspendedOnly(Boolean(view.suspendedOnly));
  }

  const selectedVisible = filtered.filter(card => selected.includes(card.id));
  const allVisibleSelected = filtered.length > 0 && filtered.every(card => selected.includes(card.id));

  function toggle(id: string) {
    setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  }

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected(current => current.filter(id => !filtered.some(card => card.id === id)));
    } else {
      const ids = new Set(selected);
      filtered.forEach(card => ids.add(card.id));
      setSelected([...ids]);
    }
  }

  async function runBulk(action: "mark" | "unmark" | "suspend" | "unsuspend" | "delete") {
    if (!selected.length || busy) return;
    if (action === "delete" && !window.confirm(t("confirmBulkCardDelete"))) return;
    setBusy(true);
    try {
      if (action === "delete") await bulkDeleteCards(deckId, selected);
      else {
        const field = action === "mark" || action === "unmark" ? "is_marked" : "is_suspended";
        const value = action === "mark" || action === "suspend";
        await bulkSetCardFlag(deckId, selected, field, value);
      }
    } finally {
      setBusy(false);
    }
  }

  const kinds = [...new Set(cards.map(card => card.kind))];

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white">
      <div className="border-b border-black/[0.05] px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">Cards</h2>
            <p className="mt-1 text-xs text-slate-400">{filtered.length} visible of {cards.length}. Search, filter and edit without leaving the deck.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search cards..." className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none sm:w-56" />
            <select value={kind} onChange={event => setKind(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
              <option value="all">All types</option>
              {kinds.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={status} onChange={event => setStatus(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="marked">Marked</option>
              <option value="suspended">Suspended</option>{[...new Set(cards.map(card=>String(card.content?.status||"")).filter(Boolean))].map(value=><option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Advanced filters</span>
            <input value={tagFilter} onChange={event=>setTagFilter(event.target.value)} placeholder="Tag = exact" className="h-9 w-32 rounded-lg border border-slate-200 bg-white px-2 text-xs"/>
            <input value={markerFilter} onChange={event=>setMarkerFilter(event.target.value)} placeholder="Marker = exact" className="h-9 w-32 rounded-lg border border-slate-200 bg-white px-2 text-xs"/>
            <label className="flex items-center gap-2 rounded-lg bg-white px-2 py-2 text-xs"><input type="checkbox" checked={markedOnly} onChange={event=>setMarkedOnly(event.target.checked)} className="h-4 w-4"/>Marked</label>
            <label className="flex items-center gap-2 rounded-lg bg-white px-2 py-2 text-xs"><input type="checkbox" checked={suspendedOnly} onChange={event=>setSuspendedOnly(event.target.checked)} className="h-4 w-4"/>Suspended</label>
            <button type="button" onClick={()=>{setQuery("");setKind("all");setStatus("all");setTagFilter("");setMarkerFilter("");setMarkedOnly(false);setSuspendedOnly(false);}} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">Reset</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2">
          <input value={viewName} onChange={event=>setViewName(event.target.value)} placeholder="View name" className="h-9 w-36 rounded-lg border border-slate-200 bg-white px-2 text-xs"/>
          <button type="button" onClick={saveView} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">Save view</button>
          {savedViews.map(view=><button key={view.name} type="button" onClick={()=>applyView(view)} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold">{view.name}</button>)}
        </div>
        {canEdit&&<div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2">
          <label className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-600">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300" />
            Select visible
          </label>
          <span className="text-xs text-slate-400">{selected.length} selected</span>
          {selected.length > 0 && (
            <>
              <button type="button" disabled={busy} onClick={() => void runBulk("mark")} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold">Mark</button>
              <button type="button" disabled={busy} onClick={() => void runBulk("unmark")} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold">Unmark</button>
              <button type="button" disabled={busy} onClick={() => void runBulk("suspend")} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold">Suspend</button>
              <button type="button" disabled={busy} onClick={() => void runBulk("unsuspend")} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold">Unsuspend</button>
              <button type="button" disabled={busy} onClick={() => void runBulk("delete")} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Delete</button>
            </>
          )}
        </div>}
      </div>

      {cards.length === 0 ? (
        <div className="p-12 text-center">
          <p className="font-semibold">No cards yet</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center">
          <p className="font-semibold">No matching cards</p>
          <p className="mt-2 text-sm text-slate-500">Change the search or filters.</p>
        </div>
      ) : (
        <div>
          {filtered.map((card, index) => (
            <div key={card.id} data-card-index={index} tabIndex={0} className={"p-6 outline-none focus-visible:ring-2 focus-visible:ring-slate-500 " + (index ? "border-t border-black/[0.05]" : "")}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {canEdit&&<input type="checkbox" checked={selected.includes(card.id)} onChange={() => toggle(card.id)} className="mt-1 h-4 w-4 rounded border-slate-300" />}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{card.kind}</span>
                      {card.is_suspended && <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Suspended</span>}
                      {card.is_marked && <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Marked</span>}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-medium">{card.content?.front || "Untitled card"}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{card.content?.back || "No answer"}</p>
                    {Array.isArray(card.content?.tags) && card.content.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {card.content.tags.map(tag => <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-500">{tag}</span>)}
                      </div>
                    )}
                    {Array.isArray(card.content?.markers) && card.content.markers.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{card.content.markers.map(marker => <span key={marker} className="rounded-md bg-amber-50 px-2 py-1 text-[10px] text-amber-700">{marker}</span>)}</div>}{card.content?.status?<span className="mt-2 inline-flex rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">{card.content.status}</span>:null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {canEdit ? <><Link href={"/decks/"+deckId+"/cards/"+card.id+"/edit"} className="text-xs font-semibold text-slate-500">Edit</Link><Link href={"/decks/"+deckId+"/cards/"+card.id+"/history"} className="text-xs font-semibold text-slate-500">History</Link></> : null}
                  <form action={toggleFavorite.bind(null, card.id, deckId)}>
                    <button className={"text-xs font-semibold " + (favoriteSet.has(card.id) ? "text-amber-600" : "text-slate-400")}>
                      {favoriteSet.has(card.id) ? "★ Favorite" : "☆ Favorite"}
                    </button>
                  </form>
                  {canEdit ? <form action={setCardFlag.bind(null, deckId, card.id, "is_marked", !card.is_marked)}>
                    <button className="text-xs font-semibold text-slate-500">{card.is_marked ? "Unmark" : "Mark"}</button>
                  </form> : null}
                  {canEdit ? <form action={setCardFlag.bind(null, deckId, card.id, "is_suspended", !card.is_suspended)}>
                    <button className="text-xs font-semibold text-slate-500">{card.is_suspended ? "Unsuspend" : "Suspend"}</button>
                  </form> : null}
                  {canEdit ? <form action={deleteCard.bind(null, deckId, card.id)}>
                    <button className="text-xs font-medium text-slate-400 hover:text-red-600">Delete</button>
                  </form> : null}
                </div>
              </div>

              {canEdit ? <form action={updateCard.bind(null, deckId, card.id)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <textarea name="front" defaultValue={card.content?.front || ""} className="min-h-28 rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-slate-400" />
                  <textarea name="back" defaultValue={card.content?.back || ""} className="min-h-28 rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-slate-400" />
                </div>
                <input type="hidden" name="kind" value={card.kind} />
                <input type="hidden" name="expected_updated_at" value={card.updated_at||""} />
                <div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="block"><span className="text-xs font-medium text-slate-500">Tags</span><input name="tags" defaultValue={Array.isArray(card.content?.tags) ? card.content.tags.join(", ") : ""} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs" /></label><label className="block"><span className="text-xs font-medium text-slate-500">Markers</span><input name="markers" defaultValue={Array.isArray(card.content?.markers) ? card.content.markers.join(", ") : ""} placeholder="difficult, exam, revise" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs" /></label><label className="block"><span className="text-xs font-medium text-slate-500">Custom status</span><input name="status" defaultValue={String(card.content?.status||"")} maxLength={60} placeholder="draft, mastered, review-later" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs" /></label></div>
                <div className="mt-3 flex justify-end">
                  <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">Save changes</button>
                </div>
              </form> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
