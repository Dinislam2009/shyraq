"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";

type Job={id:string;total_rows:number;processed_rows:number;created_rows:number;replaced_rows:number;skipped_rows:number;status:"queued"|"processing"|"completed"|"failed"|"cancelled";error?:string|null;source_name?:string};

const STORAGE_KEY="shyraq:import-job";

export function ImportJobProgress(){
 const router=useRouter();
 const [job,setJob]=useState<Job|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const busyRef=useRef(false);

 const clear=useCallback(()=>{
  if(typeof window!=="undefined")localStorage.removeItem(STORAGE_KEY);
  setJob(null);
 },[]);

 const pump=useCallback(async(id:string)=>{
  if(busyRef.current)return;
  busyRef.current=true;
  setBusy(true);
  setError("");
  try{
   while(true){
    const response=await fetch("/api/import/jobs/"+encodeURIComponent(id),{method:"POST",cache:"no-store"});
    if(!response.ok)throw new Error((await response.json().catch(()=>({})) as {error?:string}).error||"Import step failed.");
    const data=await response.json() as Job;
    setJob(data);
    if(data.status==="completed"){
     clear();
     router.push("/decks?imported="+data.created_rows+"&replaced="+data.replaced_rows+"&skipped="+data.skipped_rows);
     return;
    }
    if(data.status==="failed"||data.status==="cancelled"){
     setError(data.error||"Import job stopped.");
     return;
    }
    await new Promise(resolve=>setTimeout(resolve,350));
   }
  }catch(err){setError(err instanceof Error?err.message:"Import job failed.");}
  finally{busyRef.current=false;setBusy(false);}
 },[clear,router]);

 useEffect(()=>{
  let cancelled=false;
  const resume=(id:string)=>{
   if(cancelled)return;
   void pump(id).catch(err=>setError(err instanceof Error?err.message:"Unable to resume import."));
  };
  const saved=typeof window!=="undefined"?localStorage.getItem(STORAGE_KEY):null;
  if(saved)resume(saved);
  const onJob=(event:Event)=>{
   const id=(event as CustomEvent<string>).detail;
   if(typeof id==="string"&&id)resume(id);
  };
  window.addEventListener("shyraq:import-job",onJob);
  return()=>{
   cancelled=true;
   window.removeEventListener("shyraq:import-job",onJob);
  };
 },[pump]);

 if(!job&&!error)return null;
 const progress=job&&job.total_rows?Math.min(100,Math.round(job.processed_rows/job.total_rows*100)):0;
 return <div className="rounded-2xl border border-slate-200 bg-white p-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><p className="font-semibold">Server import job</p><p className="mt-1 text-xs text-slate-400">{job?.source_name||"Import"} · refresh-safe and resumable</p></div>
   <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold">{job?.status||"error"}</span>
  </div>
  {job?<><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-slate-950 transition-all" style={{width:progress+"%"}}/></div><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"><Info label="Processed" value={job.processed_rows+" / "+job.total_rows}/><Info label="Created" value={String(job.created_rows)}/><Info label="Replaced" value={String(job.replaced_rows)}/><Info label="Skipped" value={String(job.skipped_rows)}/></div></>:null}
  {error?<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>:null}
  {job&&(job.status==="queued"||job.status==="processing")?<div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={()=>void pump(job.id)} disabled={busy} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{busy?"Processing…":"Resume import"}</button><button type="button" onClick={clear} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Forget local job</button></div>:null}
 </div>;
}

function Info({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] uppercase tracking-[0.1em] text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>}
