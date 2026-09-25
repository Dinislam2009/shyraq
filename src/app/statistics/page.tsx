import {AppShell} from "@/components/app-shell";
import {getReviewStats} from "@/lib/supabase/queries";

export default async function StatisticsPage(){
 const stats=await getReviewStats();
 const maxReviews=Math.max(1,...stats.daily.map((d:any)=>d.reviews));
 const ratingTotal=Object.values(stats.ratings||{}).reduce((sum:number,value:any)=>sum+Number(value||0),0);
 return <AppShell><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
  <p className="text-sm text-slate-400">Insights</p>
  <h1 className="mt-1 text-3xl font-semibold tracking-tight">Statistics</h1>
  <p className="mt-2 text-sm text-slate-500">Review history, answer distribution, timing and deck-level performance.</p>

  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
   {[
    ["Reviews",String(stats.reviews)],
    ["Accuracy",stats.accuracy===null?"—":stats.accuracy+"%"],
    ["Study time",stats.studyMinutes+"m"],
    ["Avg/card",stats.averageSeconds+"s"],
    ["Tracked days",String(stats.daily.filter((d:any)=>d.reviews>0).length)]
   ].map(([label,value])=><div key={label} className="rounded-2xl border border-black/[0.06] bg-white p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div>)}
  </div>

  <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
   <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
    <div className="flex items-end justify-between"><div><h2 className="font-semibold">Last 30 days</h2><p className="mt-1 text-xs text-slate-400">Reviews per day</p></div><span className="text-xs text-slate-400">0 → {maxReviews}</span></div>
    <div className="mt-8 flex h-48 items-end gap-1">{stats.daily.map((day:any)=><div key={day.date} className="flex h-full flex-1 flex-col justify-end" title={day.date+" · "+day.reviews+" reviews · "+Math.round(day.minutes*10)/10+"m"}><div className="w-full rounded-t-sm bg-slate-900" style={{height:(day.reviews/maxReviews*100)+"%"}}/></div>)}</div>
   </div>

   <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
    <h2 className="font-semibold">Answer distribution</h2>
    <p className="mt-1 text-xs text-slate-400">{ratingTotal} recorded responses</p>
    <div className="mt-6 space-y-4">{(["again","hard","good","easy"] as const).map(rating=>{
      const value=Number(stats.ratings?.[rating]||0);
      const percent=ratingTotal?Math.round(value/ratingTotal*100):0;
      return <div key={rating}><div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium capitalize">{rating}</span><span className="text-slate-400">{value} · {percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-900" style={{width:percent+"%"}}/></div></div>;
    })}</div>
   </div>
  </div>

  <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
   <div className="border-b border-black/[0.05] px-6 py-4"><h2 className="font-semibold">Deck performance</h2><p className="mt-1 text-xs text-slate-400">Top 20 decks by review activity.</p></div>
   {stats.deckBreakdown.length===0?<div className="p-10 text-center text-sm text-slate-500">No deck-level review data yet.</div>:<div className="divide-y divide-slate-100">
    {stats.deckBreakdown.map((deck:any)=><div key={deck.id} className="grid gap-3 px-6 py-4 text-sm md:grid-cols-[2fr_1fr_1fr_1fr] md:items-center"><div><p className="font-semibold">{deck.name}</p><p className="mt-1 text-xs text-slate-400">{deck.reviews} reviews</p></div><span className="text-slate-500">{deck.accuracy===null?"—":deck.accuracy+"% accuracy"}</span><span className="text-slate-500">{Math.round(deck.minutes*10)/10} min</span><span className="text-slate-500">{deck.again} again</span></div>)}
   </div>}
  </div>

  <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
   <div className="border-b border-black/[0.05] px-6 py-4"><h2 className="font-semibold">Daily detail</h2></div>
   <div className="divide-y divide-slate-100">{stats.daily.slice().reverse().slice(0,10).map((day:any)=><div key={day.date} className="flex items-center justify-between px-6 py-4 text-sm"><span>{day.date}</span><span className="text-slate-500">{day.reviews} reviews · {Math.round(day.minutes*10)/10} min · {day.again} again</span></div>)}</div>
  </div>
 </div></AppShell>;
}
