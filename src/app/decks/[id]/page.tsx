import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { demoDecks } from "@/lib/demo-data";

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = demoDecks.find((item) => item.id === id);
  if (!deck) notFound();

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <Link href="/decks" className="text-sm text-slate-400 hover:text-slate-700">← Back to decks</Link>
        <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold ${deck.color}`}>S</div>
            <h1 className="text-3xl font-semibold tracking-tight">{deck.name}</h1>
            <p className="mt-2 text-sm text-slate-500">{deck.description}</p>
          </div>
          <Link href="/review" className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800">Study deck</Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><p className="text-sm text-slate-400">Total cards</p><p className="mt-2 text-2xl font-semibold">{deck.cards}</p></div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><p className="text-sm text-slate-400">Due today</p><p className="mt-2 text-2xl font-semibold">{deck.due}</p></div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><p className="text-sm text-slate-400">New</p><p className="mt-2 text-2xl font-semibold">{deck.newCards}</p></div>
        </div>

        <div className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6">
          <h2 className="font-semibold">Deck overview</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">The full deck editor, card browser, tags, templates, scheduling controls and import/export tools will connect to this workspace once the data layer is added.</p>
        </div>
      </div>
    </AppShell>
  );
}
