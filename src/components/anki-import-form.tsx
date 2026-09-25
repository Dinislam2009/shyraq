"use client";
import {useState} from "react";
import {useFormStatus} from "react-dom";
import {importAnki} from "@/app/import/anki/actions";

type Preview={fileName:string;size:number;decks:{id:string;name:string;cards:number;cloze:number;existingName:boolean}[];decksCount:number;cardsCount:number;reviewsCount:number;mediaCount:number;templates:{id:string;name:string;fields:string[];cloze:boolean;hasCss:boolean}[];warnings:string[]};

export function AnkiImportForm(){
 const [file,setFile]=useState<File|null>(null);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);

 const inspect=async(next:File|null)=>{
  setFile(next);setPreview(null);setError("");
  if(!next)return;
  setLoading(true);
  try{
   const body=new FormData();body.set("file",next);
   const response=await fetch("/api/import/anki/preview",{method:"POST",body});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Unable to inspect APKG.");
   setPreview(data);
  }catch(error){setError(error instanceof Error?error.message:"Unable to inspect APKG.");}
  finally{setLoading(false);}
 };

 return <div className="space-y-5">
  <form action={importAnki} className="rounded-2xl border border-black/[0.06] bg-white p-6">
   <label className="block"><span className="text-sm font-semibold">Choose .apkg</span><input required type="file" name="file" accept=".apkg,application/octet-stream" onChange={event=>void inspect(event.target.files?.[0]||null)} className="mt-3 block w-full rounded-xl border border-slate-200 p-3 text-sm"/></label>
   {loading?<div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Running Anki compatibility preflight…</div>:null}
   {error?<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>:null}
   {preview?<div className="mt-5 space-y-4">
    <div className="grid gap-3 sm:grid-cols-4"><Metric label="Decks" value={String(preview.decksCount)}/><Metric label="Cards" value={String(preview.cardsCount)}/><Metric label="Reviews" value={String(preview.reviewsCount)}/><Metric label="Media" value={String(preview.mediaCount)}/></div>
    {preview.decks.some(deck=>deck.existingName)?<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">One or more imported deck names already exist. Import creates separate private decks and does not overwrite existing decks.</div>:null}
    <div className="rounded-2xl border border-slate-200 p-4"><p className="text-sm font-semibold">Compatibility report</p><div className="mt-3 space-y-2">{preview.templates.map(template=><div key={template.id} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-medium">{template.name}</p><p className="mt-1 text-xs text-slate-500">{template.fields.length} fields · {template.cloze?"Cloze":"Standard"} · {template.hasCss?"Custom CSS":"No custom CSS"}</p></div>)}</div>{preview.warnings.length?<div className="mt-4 space-y-2">{preview.warnings.map((warning,index)=><div key={index} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{warning}</div>)}</div>:<p className="mt-4 text-xs text-emerald-700">No compatibility warnings detected in the preflight pass.</p>}</div>
    <div className="rounded-2xl border border-slate-200 p-4"><p className="text-sm font-semibold">Deck diff</p><div className="mt-3 space-y-2">{preview.decks.map(deck=><div key={deck.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-sm">{deck.name}</span><span className="text-xs text-slate-500">{deck.cards} cards · {deck.cloze} cloze{deck.existingName?" · name exists":""}</span></div>)}</div></div>
   </div>:null}
   <ImportButton disabled={!file||loading}/>
  </form>
 </div>;
}

function ImportButton({disabled}:{disabled:boolean}){const {pending}=useFormStatus();return <button disabled={disabled||pending} className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{pending?"Importing and reconstructing history…":"Import .apkg"}</button>}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-black/[0.06] bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>}
