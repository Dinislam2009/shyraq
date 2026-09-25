"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteCard, setCardFlag, updateCard, bulkDeleteCards, bulkSetCardFlag } from "@/app/decks/[id]/cards/actions";
import { toggleFavorite } from "@/app/collections/actions";

type CardRow = {
  id: string;
  kind: string;
  content: {
    front?: string;
    back?: string;
    tags?: string[];
  };
  is_suspended?: boolean;
  is_marked?: boolean;
};

export function CardManager({ deckId, cards, favoriteIds, canEdit = true }: { deckId: string; cards: CardRow[]; favoriteIds: string[]; canEdit?: boolean }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

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
        (status === "active" && !card.is_suspended);
      return matchesQuery && matchesKind && matchesStatus;
    });
  }, [cards, kind, query, status]);

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
    if (action === "delete" && !window.confirm("Delete the selected cards permanently?")) return;
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
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {canEdit&&<div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2">
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
            <div key={card.id} className={"p-6 " + (index ? "border-t border-black/[0.05]" : "")}>
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
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {canEdit&&<Link href={"/decks/"+deckId+"/cards/"+card.id+"/edit"} className="text-xs font-semibold text-slate-500">Edit</Link>}
                  <form action={toggleFavorite.bind(null, card.id, deckId)}>
                    <button className={"text-xs font-semibold " + (favoriteSet.has(card.id) ? "text-amber-600" : "text-slate-400")}>
                      {favoriteSet.has(card.id) ? "★ Favorite" : "☆ Favorite"}
                    </button>
                  </form>
                  {canEdit&&<form action={setCardFlag.bind(null, deckId, card.id, "is_marked", !card.is_marked)}>
                    <button className="text-xs font-semibold text-slate-500">{card.is_marked ? "Unmark" : "Mark"}</button>
                  </form>}
                  {canEdit&&<form action={setCardFlag.bind(null, deckId, card.id, "is_suspended", !card.is_suspended)}>
                    <button className="text-xs font-semibold text-slate-500">{card.is_suspended ? "Unsuspend" : "Suspend"}</button>
                  </form>}
                  {canEdit&&<form action={deleteCard.bind(null, deckId, card.id)}>
                    <button className="text-xs font-medium text-slate-400 hover:text-red-600">Delete</button>
                  </form>}
                </div>
              </div>

              {canEdit&&<form action={updateCard.bind(null, deckId, card.id)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <textarea name="front" defaultValue={card.content?.front || ""} className="min-h-28 rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-slate-400" />
                  <textarea name="back" defaultValue={card.content?.back || ""} className="min-h-28 rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-slate-400" />
                </div>
                <input type="hidden" name="kind" value={card.kind} />
                <label className="mt-3 block">
                  <span className="text-xs font-medium text-slate-500">Tags</span>
                  <input name="tags" defaultValue={Array.isArray(card.content?.tags) ? card.content.tags.join(", ") : ""} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs" />
                </label>
                <div className="mt-3 flex justify-end">
                  <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">Save changes</button>
                </div>
              </form>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
