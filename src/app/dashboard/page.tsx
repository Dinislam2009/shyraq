import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ClockIcon, FlameIcon, LayersIcon, PlayIcon } from "@/components/icons";
import { getCurrentUser, getDashboardStats, getDecks } from "@/lib/supabase/queries";
import { getServerI18n } from "@/lib/i18n-server";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const decks = await getDecks();
  const stats = await getDashboardStats();
  const { t } = await getServerI18n();
  const displayName = String(user?.user_metadata?.display_name || user?.email?.split("@")[0] || t("student"));
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-sm text-slate-400">{stats.workspace?.name||"${t("Learning workspace")}"}</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("welcomeBack")}, {displayName}.</h1><p className="mt-2 text-sm text-slate-500">{t("Your learning workspace is ready.")}</p></div>
          <Link href="/review" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"><PlayIcon size={16}/>{t("Start review")}</Link>
        </div>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat icon={<ClockIcon size={18}/>} label={t("Due")} value={String(stats.dueToday)} sub={t("cards due or overdue")}/>
          <Stat icon={<LayersIcon size={18}/>} label={t("New today")} value={String(stats.newToday)} sub={t("new cards reviewed")}/>
          <Stat icon={<PlayIcon size={18}/>} label={t("Reviews today")} value={String(stats.reviewsToday)} sub={t("responses recorded")}/>
          <Stat icon={<ClockIcon size={18}/>} label={t("Study time")} value={String(stats.studyMinutesToday)+"m"} sub={stats.accuracyToday===null?t("Today"):`${t("Today")} · ${stats.accuracyToday}% ${t("accuracy")}`}/>
          <Stat icon={<FlameIcon size={18}/>} label={t("Study streak")} value={String(stats.streak)} sub={t("days in a row")}/>
        </section>
        <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]"><div className="rounded-2xl border border-black/[0.06] bg-white p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t("Today’s plan")}</p><h2 className="mt-2 text-xl font-semibold">{stats.planning.targetReviews} reviews · about {stats.planning.estimatedMinutes} min</h2><p className="mt-2 text-sm text-slate-500">{stats.planning.dueToday} due today · {stats.planning.newToday} new</p></div><Link href="/review" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">{t("Start")}</Link></div></div><div className="rounded-2xl border border-black/[0.06] bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t("Learning insights")}</p><div className="mt-3 space-y-2">{stats.insights.map((insight:string)=><p key={insight} className="text-sm leading-6 text-slate-600">• {insight}</p>)}</div></div></section><section className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat icon={<LayersIcon size={18}/>} label={t("Decks")} value={String(stats.workspaceOverview.decks)} sub={`${stats.workspaceOverview.members} ${t("workspace members")}`}/>
          <Stat icon={<ClockIcon size={18}/>} label="30-day reviews" value={t("See statistics")} sub={t("open detailed analytics")}/>
          <Stat icon={<PlayIcon size={18}/>} label={t("Continue")} value={t("Start review")} sub={t("resume your queue")}/>
        </section>
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{t("Your decks")}</h2><Link href="/decks" className="text-sm font-medium text-slate-500 hover:text-slate-900">{t("View all")}</Link></div>
          {decks.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-semibold">{t("No decks yet")}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{t("Create your first deck and start adding cards.")}</p><Link href="/decks/new" className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">{t("Create deck")}</Link></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{decks.slice(0,8).map((deck:any)=><Link href={"/decks/"+deck.id} key={deck.id} className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white hover:border-black/10 hover:shadow-sm">{deck.settings?.coverUrl?<img src={String(deck.settings.coverUrl)} alt="" className="h-28 w-full object-cover"/>:<div className="m-5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold">S</div>}<div className="p-5 pt-0"><h3 className="font-semibold">{deck.name}</h3><p className="mt-1 line-clamp-2 text-xs text-slate-400">{deck.description||"{t("No description")}"}</p><div className="mt-6 text-xs text-slate-500">{deck.cards?.[0]?.count??0} {t("cards")}</div></div></Link>)}</div>}
        </section>
      </div>
    </AppShell>
  );
}
function Stat({icon,label,value,sub}:{icon:React.ReactNode;label:string;value:string;sub:string}){return <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span>{icon}</div><div className="text-3xl font-semibold">{value}</div><p className="mt-1 text-xs text-slate-400">{sub}</p></div>}