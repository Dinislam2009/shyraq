import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";

export default async function HealthPage(){
 const supabase=await createClient();
 const started=Date.now();
 const {data:{user}}=await supabase.auth.getUser();
 const {error}=await supabase.from("public_profiles").select("id",{head:true,count:"exact"});
 const latency=Date.now()-started;
 return <AppShell><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><p className="text-sm text-slate-400">System</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Health</h1><p className="mt-2 text-sm text-slate-500">Application and database status for recovery and support diagnostics.</p><div className="mt-8 grid gap-4 md:grid-cols-3"><Metric label="Application" value="Online"/><Metric label="Database" value={error?"Degraded":"Healthy"}/><Metric label="Query latency" value={latency+" ms"}/></div><div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Session</h2><p className="mt-2 text-sm text-slate-500">{user?"Authenticated session is available.":"No authenticated session."}</p><p className="mt-4 text-xs text-slate-400">{error?error.message:"Database connectivity check passed."}</p></div></div></AppShell>;
}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>}
