import { AppShell } from "@/components/app-shell";
import { ClockIcon, FlameIcon, PlayIcon, LayersIcon } from "@/components/icons";
import Link from "next/link";

export default function DashboardPage() {
  const stats=[["Due today","0","cards waiting for review"],["Study streak","0","days in a row"],["This week","0m","study time"]];
  return <AppShell><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm text-slate-400">Your workspace</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome to Shyraq.</h1><p className="mt-2 text-sm text-slate-500">Build your first deck and start learning.</p></div><Link href="/review" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"><PlayIcon size={16}/>Start review</Link></div>
    <section className="grid gap-4 sm:grid-cols-3">{stats.map(([label,value,sub],i)=>{const Icon=i===0?ClockIcon:i===1?FlameIcon:LayersIcon;return <div key={label} className="rounded-2xl border border-black/[0.06] bg-white p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><Icon size={18}/></div><div className="text-3xl font-semibold">{value}</div><p className="mt-1 text-xs text-slate-400">{sub}</p></div>})}</section>
    <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100"><LayersIcon size={20}/></div><h2 className="mt-4 text-lg font-semibold">No decks yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Your personal workspace is ready. Create a deck, add cards, and Shyraq will build your review schedule.</p><Link href="/decks" className="mt-5 inline-flex h-10 items-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">Open decks</Link></section>
  </div></AppShell>;
}