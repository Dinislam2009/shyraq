"use client";
import {useState} from "react";
import {createEmptyCard,fsrs,Rating} from "ts-fsrs";
import {queueReview,syncReviews} from "@/lib/sync/client";
import {useRouter} from "next/navigation";

const scheduler=fsrs({request_retention:0.9,maximum_interval:36500,enable_fuzz:true,enable_short_term:true,learning_steps:["1m","10m"],relearning_steps:["10m"]});
const ratings={again:Rating.Again,hard:Rating.Hard,good:Rating.Good,easy:Rating.Easy} as const;

export function ReviewRunner({userId,card,stateData}:{userId:string;card:{id:string;content:Record<string,string>;kind:string};stateData:any}){
 const [revealed,setRevealed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [saved,setSaved]=useState(false);
 const router=useRouter();

 async function answer(rating:keyof typeof ratings){
   setBusy(true);
   const previous=stateData?{...stateData,due:new Date(stateData.due),last_review:stateData.last_review?new Date(stateData.last_review):undefined}:createEmptyCard(new Date());
   const result=scheduler.next(previous,new Date(),ratings[rating]);
   await queueReview({
     id:crypto.randomUUID(),
     userId,
     cardId:card.id,
     deviceId:crypto.randomUUID(),
     sequence:Date.now(),
     rating,
     reviewedAt:new Date().toISOString(),
     previousState:previous as Record<string,unknown>,
     nextState:result.card as unknown as Record<string,unknown>,
     status:"pending"
   });
   try{await syncReviews();}catch{}
   setSaved(true);setBusy(false);router.refresh();
 }

 if(saved)return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><h2 className="text-2xl font-semibold">Review saved</h2><p className="mt-3 text-sm text-slate-500">Your review is stored locally and will sync when a connection is available.</p></div>;

 return <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-4xl flex-col px-5 py-8 sm:px-8"><div className="mb-6"><p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{card.kind}</p><p className="mt-1 text-sm text-slate-500">Offline-first review</p></div><div className="flex flex-1 items-center"><div className="w-full rounded-3xl border border-black/[0.06] bg-white p-8 text-center shadow-sm sm:p-12"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Front</p><h1 className="mx-auto mt-6 max-w-2xl whitespace-pre-wrap text-3xl font-semibold">{card.content?.front||""}</h1>{revealed?<div className="mt-10 border-t border-slate-100 pt-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Back</p><p className="mx-auto mt-5 max-w-2xl whitespace-pre-wrap text-lg leading-8 text-slate-600">{card.content?.back||""}</p></div>:<button onClick={()=>setRevealed(true)} className="mt-12 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50">Show answer</button>}</div></div>{revealed&&<div className="mt-5 grid grid-cols-4 gap-2">{(["again","hard","good","easy"] as const).map(r=><button key={r} disabled={busy} onClick={()=>answer(r)} className="rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold capitalize hover:bg-slate-50 disabled:opacity-50">{r}</button>)}</div>}</div>;
}