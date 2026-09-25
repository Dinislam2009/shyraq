import {AppShell} from "@/components/app-shell";
import {getReviewStats} from "@/lib/supabase/queries";
import {createClient} from "@/lib/supabase/server";
import Link from "next/link";

export default async function StatisticsPage({searchParams}:{searchParams?:Promise<{workspace?:string}>}){
 const params=searchParams?await searchParams:{};
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 const {data:workspaces}=user?await supabase.from("workspaces").select("id,name,kind").order("kind").order("name"):{data:[]};
 const stats=await getReviewStats(params.workspace);
 const maxReviews=Math.max(1,...stats.daily.map((d:any)=>d.reviews));
 const maxDue=Math.max(1,...stats.dueForecast.map((d:any)=>d.due));
 const ratingTotal=Object.values(stats.ratings||{}).reduce((sum:number,value:any)=>sum+Number(value||0),0);
 return <AppShell><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-400">Insights</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Statistics</h1><p className="mt-2 text-sm text-slate-500">Review history, retention, workload forecast and granular performance diagnostics.</p></div><a href="/api/export/statistics" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Export analytics JSON</a></div>

  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[
   ["Reviews",String(stats.reviews)],["Accuracy",stats.accuracy===null?"—":stats.accuracy+"%"],["Study time",stats.studyMinutes+"m"],["Avg/card",stats.averageSeconds+"s"],["Tracked days",String(stats.daily.filter((d:any)=>d.reviews>0).length)]
  ].map(([label,value])=><div key={label} className="rounded-2xl border border-black/[0.06] bg-white p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div>)}</div>

  <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
   <Panel title="Last 30 days" subtitle={"Reviews per day · 0 → "+maxReviews}><div className="mt-8 flex h-48 items-end gap-1">{stats.daily.map((day:any)=><div key={day.date} className="flex h-full flex-1 flex-col justify-end" title={day.date+" · "+day.reviews+" reviews · "+Math.round(day.minutes*10)/10+"m"}><div className="w-full rounded-t-sm bg-slate-900" style={{height:(day.reviews/maxReviews*100)+"%"}}/></div>)}</div></Panel>
   <Panel title="Answer distribution" subtitle={ratingTotal+" recorded responses"}><div className="mt-6 space-y-4">{(["again","hard","good","easy"] as const).map(rating=>{const value=Number(stats.ratings?.[rating]||0);const percent=ratingTotal?Math.round(value/ratingTotal*100):0;return <div key={rating}><div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium capitalize">{rating}</span><span className="text-slate-400">{value} · {percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-900" style={{width:percent+"%"}}/></div></div>})}</div></Panel>
  </div>

  <div className="mt-6 grid gap-6 lg:grid-cols-2">
   <Panel title="14-day due forecast" subtitle="Scheduled workload"><div className="mt-6 flex h-40 items-end gap-1">{stats.dueForecast.map((day:any)=><div key={day.date} className="flex h-full flex-1 flex-col justify-end" title={day.date+" · "+day.due+" due"}><div className="w-full rounded-t-sm bg-slate-700" style={{height:(day.due/maxDue*100)+"%"}}/></div>)}</div></Panel>
   <Panel title="New vs review balance" subtitle="Last 30 days"><div className="mt-5 space-y-2">{stats.newReviewBalance.slice(-10).map((day:any)=><div key={day.date} className="grid grid-cols-[5rem_1fr_4rem] items-center gap-3 text-xs"><span>{day.date.slice(5)}</span><div className="flex h-2 overflow-hidden rounded-full bg-slate-100"><div className="bg-slate-900" style={{width:(day.reviews+day.newCards?day.reviews/(day.reviews+day.newCards)*100:0)+"%"}}/><div className="bg-slate-300" style={{width:(day.reviews+day.newCards?day.newCards/(day.reviews+day.newCards)*100:0)+"%"}}/></div><span className="text-right text-slate-400">{day.newCards} new</span></div>)}</div></Panel>
  </div>

  <div className="mt-6 grid gap-6 lg:grid-cols-3">
   <Panel title="Retention curve" subtitle="Success by scheduled interval"><div className="mt-4 space-y-3">{stats.retentionCurve.map((row:any)=><div key={row.label}><div className="flex justify-between text-xs"><span>{row.label}</span><span>{row.retention===null?"—":row.retention+"%"}</span></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-900" style={{width:(row.retention||0)+"%"}}/></div><p className="mt-1 text-[11px] text-slate-400">{row.reviews} reviews</p></div>)}</div></Panel>
   <Panel title="Difficulty" subtitle="Current scheduler state"><div className="mt-4 space-y-3">{stats.difficultyDistribution.map((row:any)=><div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><span className="capitalize">{row.label}</span><span className="font-semibold">{row.value}</span></div>)}<div className="mt-3 text-xs text-slate-400">Avg difficulty: {stats.scheduler.averageDifficulty??"—"} · Avg stability: {stats.scheduler.averageStability??"—"}</div></div></Panel>
   <Panel title="Learning breakdown" subtitle="Current queue"><div className="mt-4 space-y-3">{Object.entries(stats.learningBreakdown).map(([key,value])=><div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><span className="capitalize">{key}</span><span className="font-semibold">{String(value)}</span></div>)}<div className="mt-3 rounded-xl border border-slate-200 p-3 text-xs"><p>30-day reviews: {stats.historicalComparison.current}</p><p className="mt-1">Previous 30 days: {stats.historicalComparison.previous}</p><p className="mt-1">Accuracy: {stats.historicalComparison.currentAccuracy??"—"}% vs {stats.historicalComparison.previousAccuracy??"—"}%</p></div></div></Panel>
  </div>

  <Table title="Deck performance" columns={["Deck","Reviews","Accuracy","Minutes"]}>{stats.deckBreakdown.map((deck:any)=><div key={deck.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] px-6 py-3 text-sm"><span className="font-semibold">{deck.name}</span><span>{deck.reviews}</span><span>{deck.accuracy===null?"—":deck.accuracy+"%"}</span><span>{Math.round(deck.minutes*10)/10}</span></div>)}</Table>
  <Table title="Card performance" columns={["Card","Reviews","Accuracy","Again"]}>{stats.cardPerformance.map((card:any)=><div key={card.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] px-6 py-3 text-sm"><span className="truncate font-semibold">{card.name}</span><span>{card.reviews}</span><span>{card.accuracy===null?"—":card.accuracy+"%"}</span><span>{card.again}</span></div>)}</Table>
  <Table title="Tag performance" columns={["Tag","Reviews","Accuracy","Minutes"]}>{stats.tagPerformance.map((tag:any)=><div key={tag.name} className="grid grid-cols-[2fr_1fr_1fr_1fr] px-6 py-3 text-sm"><span className="font-semibold">{tag.name}</span><span>{tag.reviews}</span><span>{tag.accuracy===null?"—":tag.accuracy+"%"}</span><span>{Math.round(tag.minutes*10)/10}</span></div>)}</Table>
  <Table title="Collection performance" columns={["Collection","Reviews","Accuracy","Minutes"]}>{stats.collectionPerformance.map((row:any)=><div key={row.name} className="grid grid-cols-[2fr_1fr_1fr_1fr] px-6 py-3 text-sm"><span className="font-semibold">{row.name}</span><span>{row.reviews}</span><span>{row.accuracy===null?"—":row.accuracy+"%"}</span><span>{Math.round(row.minutes*10)/10}</span></div>)}</Table>
 </div></AppShell>;
}
function Panel({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}){return <div className="rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-xs text-slate-400">{subtitle}</p>{children}</div>}
function Table({title,columns,children}:{title:string;columns:string[];children:React.ReactNode}){return <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white"><div className="border-b border-black/[0.05] px-6 py-4"><h2 className="font-semibold">{title}</h2></div><div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-slate-100 px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-slate-400">{columns.map(column=><span key={column}>{column}</span>)}</div><div className="divide-y divide-slate-100">{children}</div></div>}
