import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ChevronRightIcon, ClockIcon, FlameIcon, PlayIcon } from "@/components/icons";
import { demoDecks } from "@/lib/demo-data";

export default function DashboardPage() {
  const due = demoDecks.reduce((sum, deck) => sum + deck.due, 0);
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-400">Wednesday, September 24</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Good evening, Dinis.</h1>
            <p className="mt-2 text-sm text-slate-500">Your study queue is ready.</p>
          </div>
          <Link href="/review" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"><PlayIcon size={16} />Start review</Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm text-slate-500">Due today</span><ClockIcon size={18} /></div><div className="text-3xl font-semibold">{due}</div><p className="mt-1 text-xs text-slate-400">cards waiting for review</p></div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm text-slate-500">Study streak</span><FlameIcon size={18} /></div><div className="text-3xl font-semibold">12</div><p className="mt-1 text-xs text-slate-400">days in a row</p></div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm text-slate-500">This week</span><span className="text-xs font-medium text-emerald-600">+18%</span></div><div className="text-3xl font-semibold">4h 32m</div><p className="mt-1 text-xs text-slate-400">active study time</p></div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Your decks</h2><Link href="/decks" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900">View all <ChevronRightIcon size={15} /></Link></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {demoDecks.map((deck) => (
              <Link href={`/decks/${deck.id}`} key={deck.id} className="group rounded-2xl border border-black/[0.06] bg-white p-5 transition hover:-translate-y-0.5 hover:border-black/10 hover:shadow-sm">
                <div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${deck.color}`}>S</div>
                <h3 className="font-semibold">{deck.name}</h3>
                <p className="mt-1 line-clamp-1 text-xs text-slate-400">{deck.description}</p>
                <div className="mt-6 flex items-center justify-between text-xs"><span className="text-slate-500">{deck.cards} cards</span><span className="font-medium text-slate-900">{deck.due} due</span></div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}