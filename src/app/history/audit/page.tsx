import {AppShell} from "@/components/app-shell";
import Link from "next/link";
import {createClient} from "@/lib/supabase/server";

export default async function HistoryAuditPage(){
 const supabase:any=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <AppShell><div className="mx-auto max-w-5xl px-5 py-10">Sign in to inspect the audit log.</div></AppShell>;
 const [{data:events},{data:devices},{data:conflicts}]=await Promise.all([
  supabase.from("review_events").select("id,event_key,card_id,reviewed_at,rating,elapsed_ms,device_id,client_sequence,metadata,previous_state,next_state").eq("user_id",user.id).order("reviewed_at",{ascending:false}).limit(1000),
  supabase.from("review_devices").select("id,name,last_seen_at,created_at").eq("user_id",user.id).order("last_seen_at",{ascending:false}),
  supabase.from("sync_conflicts").select("id,card_id,event_key,detected_at,resolution,resolved_at,current_reviewed_at,incoming_reviewed_at").eq("user_id",user.id).order("detected_at",{ascending:false}).limit(200)
 ]);
 const list=events??[];
 const invalidElapsed=list.filter((e:any)=>Number(e.elapsed_ms||0)<0);
 const missingNextState=list.filter((e:any)=>!e.next_state||typeof e.next_state!=="object");
 const deviceMap=new Map<string,number>();
 const kindMap=new Map<string,number>();
 for(const e of list){deviceMap.set(String(e.device_id),(deviceMap.get(String(e.device_id))||0)+1);const kind=String(e.metadata?.event_kind||"review");kindMap.set(kind,(kindMap.get(kind)||0)+1);}
 return <AppShell><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-400">Audit / Debug</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Review audit</h1><p className="mt-2 text-sm text-slate-500">Inspect event integrity, device activity and preserved sync conflicts.</p></div><div className="flex gap-2"><Link href="/history" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">History</Link><a href="/api/export/history" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Export all</a></div></div>
  <div className="mt-7 grid gap-4 md:grid-cols-4"><Metric label="Events inspected" value={String(list.length)}/><Metric label="Devices" value={String(deviceMap.size)}/><Metric label="Conflicts" value={String((conflicts??[]).length)}/><Metric label="Integrity flags" value={String(invalidElapsed.length+missingNextState.length)}/></div>
  <div className="mt-6 grid gap-5 lg:grid-cols-2">
   <Panel title="Event kinds">{[...kindMap.entries()].sort((a,b)=>b[1]-a[1]).map(([k,v])=><Row key={k} label={k} value={String(v)}/>)}</Panel>
   <Panel title="Devices">{(devices??[]).map((d:any)=><Row key={d.id} label={d.name||d.id.slice(0,8)} value={new Date(d.last_seen_at).toLocaleString()}/>)}</Panel>
   <Panel title="Integrity checks"><Row label="Negative elapsed time" value={String(invalidElapsed.length)}/><Row label="Missing next state" value={String(missingNextState.length)}/><Row label="Events inspected" value={String(list.length)}/></Panel>
   <Panel title="Sync conflicts">{(conflicts??[]).slice(0,20).map((c:any)=><Row key={c.id} label={c.card_id.slice(0,8)+"…"} value={c.resolved_at?"Resolved":"Open"}/>)}</Panel>
  </div>
  <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
   <div className="border-b border-black/[0.06] p-5"><h2 className="font-semibold">Recent events</h2></div>
   {list.slice(0,100).map((e:any)=><div key={e.id} className="border-b border-black/[0.05] p-4 last:border-0"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">{e.rating} · {String(e.metadata?.event_kind||"review")}</p><p className="mt-1 text-xs text-slate-400">{new Date(e.reviewed_at).toLocaleString()} · {e.card_id.slice(0,8)}…</p></div><p className="text-xs text-slate-400">{String(e.event_key).slice(0,8)}… · seq {e.client_sequence??"—"}</p></div><details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Inspect payload</summary><pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-100">{JSON.stringify({metadata:e.metadata,previous_state:e.previous_state,next_state:e.next_state},null,2)}</pre></details></div>)}
  </div>
 </div></AppShell>;
}
function Panel({title,children}:{title:string;children:React.ReactNode}){return <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><h2 className="font-semibold">{title}</h2><div className="mt-4 divide-y divide-slate-100">{children}</div></div>}
function Row({label,value}:{label:string;value:string}){return <div className="flex items-center justify-between gap-3 py-2 text-sm"><span className="text-slate-500">{label}</span><span className="font-semibold text-slate-900">{value}</span></div>}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-black/[0.06] bg-white p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>}
