import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {resolveSyncConflict} from "@/app/settings/sync/actions";
import {OfflineSyncPanel} from "@/components/offline-sync-panel";

export default async function SyncSettingsPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const [{data:conflicts},{data:devices}]=await Promise.all([
  supabase.from("sync_conflicts").select("id,card_id,detected_at,incoming_state,current_state,incoming_reviewed_at,current_reviewed_at").eq("user_id",user.id).is("resolved_at",null).order("detected_at",{ascending:false}),
  supabase.from("review_devices").select("id,name,last_seen_at,created_at").eq("user_id",user.id).order("last_seen_at",{ascending:false}).limit(50)
 ]);
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
  <p className="text-sm text-slate-400">Sync</p>
  <h1 className="mt-1 text-3xl font-semibold tracking-tight">Sync center</h1>
  <p className="mt-2 text-sm text-slate-500">Offline changes, local storage, device history and conflict resolution.</p>
  <HealthCard />
  <OfflineSyncPanel userId={user.id} devices={devices??[]}/>
  <section className="mt-8">
   <h2 className="text-xl font-semibold">Conflicts</h2>
   <p className="mt-1 text-sm text-slate-500">Review conflicting offline states without losing either event.</p>
   {!(conflicts??[]).length?<div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No unresolved conflicts.</div>:<div className="mt-5 space-y-5">{(conflicts??[]).map((c:any)=><div key={c.id} className="rounded-2xl border border-black/[0.06] bg-white p-6">
    <div className="flex items-center justify-between"><h2 className="font-semibold">Card {String(c.card_id).slice(0,8)}…</h2><span className="text-xs text-slate-400">{new Date(c.detected_at).toLocaleString()}</span></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2"><State title="Current remote state" state={c.current_state} at={c.current_reviewed_at}/><State title="Incoming offline state" state={c.incoming_state} at={c.incoming_reviewed_at}/></div>
    <div className="mt-5 flex justify-end gap-2">
     <form action={resolveSyncConflict.bind(null,c.id,"keep_remote")}><button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Keep current</button></form>
     <form action={resolveSyncConflict.bind(null,c.id,"apply_incoming")}><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Apply incoming</button></form>
    </div>
   </div>)}</div>}
  </section>
 </div></AppShell>;
}
function State({title,state,at}:{title:string;state:any;at:string|null}){return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{title}</p><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-700">{JSON.stringify(state??{},null,2)}</pre>{at&&<p className="mt-3 text-[11px] text-slate-400">{new Date(at).toLocaleString()}</p>}</div>}

async function HealthCard(){
 const supabase=await createClient();
 const started=Date.now();
 const {error}=await supabase.from("profiles").select("id",{head:true,count:"exact"});
 const ok=!error;
 return <section className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-5"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">Service health</p><p className="mt-1 text-sm text-slate-500">Live application database check.</p></div><span className={"rounded-full px-3 py-1 text-xs font-semibold "+(ok?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700")}>{ok?"Healthy":"Degraded"}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3 text-sm"><p className="text-xs text-slate-400">Database</p><p className="mt-1 font-semibold">{ok?"Connected":"Unavailable"}</p></div><div className="rounded-xl bg-slate-50 p-3 text-sm"><p className="text-xs text-slate-400">Latency</p><p className="mt-1 font-semibold">{Date.now()-started} ms</p></div></div></section>;
}
