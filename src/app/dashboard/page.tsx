import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ClockIcon, FlameIcon, LayersIcon, PlayIcon } from "@/components/icons";
import { getCurrentUser, getDashboardStats, getDecks } from "@/lib/supabase/queries";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const decks = await getDecks();
  const stats = await getDashboardStats();
  const displayName = String(user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Student");
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-sm text-slate-400">{stats.workspace?.name||"Learning workspace"}</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {displayName}.</h1><p className="mt-2 text-sm text-slate-500">Your learning workspace is ready.</p></div>
          <Link href="/review" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"><PlayIcon size={16}/>Start review</Link>
        </div>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat icon={<ClockIcon size={18}/>} label="Due" value={String(stats.dueToday)} sub="cards due or overdue"/>
          <Stat icon={<LayersIcon size={18}/>} label="New today" value={String(stats.newToday)} sub="new cards reviewed"/>
          <Stat icon={<PlayIcon size={18}/>} label="Reviews today" value={String(stats.reviewsToday)} sub="responses recorded"/>
          <Stat icon={<ClockIcon size={18}/>} label="Study time" value={String(stats.studyMinutesToday)+"m"} sub={stats.accuracyToday===null?"today":"today · "+stats.accuracyToday+"% accuracy"}/>
          <Stat icon={<FlameIcon size={18}/>} label="Study streak" value={String(stats.streak)} sub="days in a row"/>
        </section>
        <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]"><div className="rounded-2xl border border-black/[0.06] bg-white p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Today&apos;s plan</p><h2 className="mt-2 text-xl font-semibold">{stats.planning.targetReviews} reviews · about {stats.planning.estimatedMinutes} min</h2><p className="mt-2 text-sm text-slate-500">{stats.planning.dueToday} due today · {stats.planning.newToday} new</p></div><Link href="/review" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Start</Link></div></div><div className="rounded-2xl border border-black/[0.06] bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Learning insights</p><div className="mt-3 space-y-2">{stats.insights.map((insight:string)=><p key={insight} className="text-sm leading-6 text-slate-600">• {insight}</p>)}</div></div></section><section className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat icon={<LayersIcon size={18}/>} label="Decks" value={String(stats.workspaceOverview.decks)} sub={stats.workspaceOverview.members+" workspace members"}/>
          <Stat icon={<ClockIcon size={18}/>} label="30-day reviews" value="See statistics" sub="open detailed analytics"/>
          <Stat icon={<PlayIcon size={18}/>} label="Continue" value="Start review" sub="resume your queue"/>
        </section>
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Your decks</h2><Link href="/decks" className="text-sm font-medium text-slate-500 hover:text-slate-900">View all</Link></div>
          {decks.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-semibold">No decks yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Create your first deck and start adding cards.</p><Link href="/decks/new" className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Create deck</Link></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{decks.slice(0,8).map((deck:any)=><Link href={"/decks/"+deck.id} key={deck.id} className="rounded-2xl border border-black/[0.06] bg-white p-5 hover:border-black/10 hover:shadow-sm"><div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold">S</div><h3 className="font-semibold">{deck.name}</h3><p className="mt-1 line-clamp-2 text-xs text-slate-400">{deck.description||"No description"}</p><div className="mt-6 text-xs text-slate-500">{deck.cards?.[0]?.count??0} cards</div></Link>)}</div>}
        </section>
      </div>
    </AppShell>
  );
}
function Stat({icon,label,value,sub}:{icon:React.ReactNode;label:string;value:string;sub:string}){return <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span>{icon}</div><div className="text-3xl font-semibold">{value}</div><p className="mt-1 text-xs text-slate-400">{sub}</p></div>}