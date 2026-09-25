import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {applySchedulerProfile,importSchedulerProfile} from "@/app/settings/review/diagnostics/actions";

export default async function ReviewDiagnosticsPage({searchParams}:{searchParams:Promise<{error?:string;imported?:string}>}){
  const params=await searchParams;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;

  const [{data:prefs},{data:states},{data:events}]=await Promise.all([
    supabase.from("review_preferences").select("scheduler_profiles,desired_retention,maximum_interval,learning_steps,relearning_steps,enable_fuzz,enable_short_term").eq("user_id",user.id).maybeSingle(),
    supabase.from("review_states").select("queue,due_at,stability,difficulty,scheduled_days,last_reviewed_at").eq("user_id",user.id).limit(50000),
    supabase.from("review_events").select("rating,reviewed_at,elapsed_ms,metadata").eq("user_id",user.id).order("reviewed_at",{ascending:false}).limit(50000)
  ]);

  const list=states??[];
  const queueCount=new Map<string,number>();
  for(const state of list)queueCount.set(String(state.queue||"unknown"),(queueCount.get(String(state.queue||"unknown"))||0)+1);
  const stability=list.filter((state:any)=>Number.isFinite(Number(state.stability))).map((state:any)=>Number(state.stability));
  const difficulty=list.filter((state:any)=>Number.isFinite(Number(state.difficulty))).map((state:any)=>Number(state.difficulty));
  const avg=(values:number[])=>values.length?Math.round(values.reduce((sum,value)=>sum+value,0)/values.length*100)/100:null;
  const now=Date.now();
  const buckets={today:0,next7:0,next30:0,later:0};
  for(const state of list){
    const due=new Date(state.due_at).getTime()-now;
    if(due<=86400000)buckets.today++;
    else if(due<=7*86400000)buckets.next7++;
    else if(due<=30*86400000)buckets.next30++;
    else buckets.later++;
  }
  const ratings={again:0,hard:0,good:0,easy:0};
  for(const event of events??[]){if(event.rating in ratings)ratings[event.rating as keyof typeof ratings]++;}
  const totalReviews=(events??[]).length;
  const studySeconds=Math.round((events??[]).reduce((sum,event)=>sum+Number(event.elapsed_ms||0),0)/1000);
  const profiles=Array.isArray(prefs?.scheduler_profiles)?prefs.scheduler_profiles:[];

  return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <Link href="/settings/review" className="text-sm text-slate-400 hover:text-slate-700">← Review settings</Link>
    <h1 className="mt-6 text-3xl font-semibold tracking-tight">FSRS diagnostics</h1>
    <p className="mt-2 text-sm text-slate-500">Read-only scheduler diagnostics. No review state is changed here.</p>
    {params.error&&<div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error}</div>}
    {params.imported&&<div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Scheduler profile imported.</div>}

    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Tracked cards" value={String(list.length)}/>
      <Metric label="Average stability" value={avg(stability)?.toString()||"—"}/>
      <Metric label="Average difficulty" value={avg(difficulty)?.toString()||"—"}/>
      <Metric label="Review events" value={String(totalReviews)}/>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-black/[0.06] bg-white p-6">
        <h2 className="font-semibold">Queue distribution</h2>
        <div className="mt-4 space-y-2">{[...queueCount.entries()].map(([queue,count])=><div key={queue} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span>{queue}</span><span className="font-semibold">{count}</span></div>)}</div>
      </section>
      <section className="rounded-2xl border border-black/[0.06] bg-white p-6">
        <h2 className="font-semibold">Due horizon</h2>
        <div className="mt-4 space-y-2">{Object.entries(buckets).map(([bucket,count])=><div key={bucket} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="capitalize">{bucket.replace("next7","next 7 days").replace("next30","next 30 days")}</span><span className="font-semibold">{count}</span></div>)}</div>
      </section>
    </div>

    <section className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6">
      <h2 className="font-semibold">Current FSRS configuration</h2>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><span className="text-slate-400">Retention</span><p className="font-medium">{String(prefs?.desired_retention??0.9)}</p></div>
        <div><span className="text-slate-400">Maximum interval</span><p className="font-medium">{String(prefs?.maximum_interval??36500)} days</p></div>
        <div><span className="text-slate-400">Learning steps</span><p className="font-medium">{Array.isArray(prefs?.learning_steps)?prefs.learning_steps.join(", "):"1m, 10m"}</p></div>
        <div><span className="text-slate-400">Relearning steps</span><p className="font-medium">{Array.isArray(prefs?.relearning_steps)?prefs.relearning_steps.join(", "):"10m"}</p></div>
      </div>
    </section>

    <section className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6">
      <h2 className="font-semibold">Review event diagnostics</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">{Object.entries(ratings).map(([rating,count])=><Metric key={rating} label={rating} value={String(count)}/>)}</div>
      <p className="mt-4 text-xs text-slate-400">Recorded study time: {Math.floor(studySeconds/60)}m {studySeconds%60}s. State/history remain append-only through the existing review-event pipeline.</p>
    </section>

    <section className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6">
      <h2 className="font-semibold">Scheduler profiles</h2>
      <p className="mt-1 text-sm text-slate-500">Apply an existing FSRS profile or migrate one as JSON.</p>
      <form action={applySchedulerProfile} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <select name="profile_id" required className="h-11 flex-1 rounded-xl border px-3 text-sm">{profiles.map((profile:any)=><option key={String(profile.id)} value={String(profile.id)}>{String(profile.name||"FSRS profile")} · retention {String(profile.desired_retention||"—")}</option>)}</select>
        <button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Apply profile</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2"><a href="/api/review/profiles/export" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Export profiles JSON</a><a href="/settings/review" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Edit scheduler settings</a></div>
      <form action={importSchedulerProfile} className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium">Import one FSRS profile JSON<input name="file" required type="file" accept="application/json,.json" className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm"/></label>
        <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Import profile</button>
      </form>
    </section>
  </div></AppShell>;
}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>}
