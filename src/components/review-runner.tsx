"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {createEmptyCard,fsrs,Rating} from "ts-fsrs";
import {queueReview,syncReviews} from "@/lib/sync/client";
import {getDeviceId} from "@/lib/offline/store";
import {useRouter} from "next/navigation";
import {RichContent} from "@/components/rich-content";
import {OccludedImage} from "@/components/image-occlusion";

type Preferences={desired_retention:number;maximum_interval:number;learning_steps:string[];relearning_steps:string[];enable_fuzz:boolean;enable_short_term:boolean};
type CardContent={front?:string;back?:string;options?:string[];answer?:number;imageUrl?:string;occlusions?:Array<{x:number;y:number;w:number;h:number}>;mediaUrl?:string;mediaType?:string;mediaItems?:Array<{name:string;path:string;mime_type:string;url?:string}>};
type QueueItem={card:{id:string;content:CardContent;kind:string};stateData:any;isNew:boolean};

export function ReviewRunner({userId,queue,preferences}:{userId:string;queue:QueueItem[];preferences:Preferences}){
 const router=useRouter();
 const [index,setIndex]=useState(0);
 const [revealed,setRevealed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [done,setDone]=useState(false);
 const shellRef=useRef<HTMLDivElement>(null);
 const startedAt=useRef(Date.now());
 const swipeStartX=useRef<number|null>(null);
 const current=queue[index];
 const card=current.card;

 useEffect(()=>{shellRef.current?.focus();startedAt.current=Date.now();setRevealed(false);},[index]);
 const answer=useCallback(async(rating:"again"|"hard"|"good"|"easy")=>{
   if(busy||!revealed)return;
   setBusy(true);
   const scheduler=fsrs({
     request_retention:preferences.desired_retention,
     maximum_interval:preferences.maximum_interval,
     enable_fuzz:preferences.enable_fuzz,
     enable_short_term:preferences.enable_short_term,
     learning_steps:preferences.learning_steps as any,
     relearning_steps:preferences.relearning_steps as any
   });
   const previous=current.stateData?{...current.stateData,due:new Date(current.stateData.due),last_review:current.stateData.last_review?new Date(current.stateData.last_review):undefined}:createEmptyCard(new Date());
   const result=scheduler.next(previous,new Date(),({again:Rating.Again,hard:Rating.Hard,good:Rating.Good,easy:Rating.Easy} as const)[rating]);
   await queueReview({
     id:crypto.randomUUID(),
     userId,
     cardId:card.id,
     deviceId:getDeviceId(),
     sequence:Date.now(),
     rating,
     elapsedMs:Math.max(0,Date.now()-startedAt.current),
     reviewedAt:new Date().toISOString(),
     previousState:previous as unknown as Record<string,unknown>,
     nextState:result.card as unknown as Record<string,unknown>,
     status:"pending",
     metadata:{event_kind:current.isNew?"new-card":"review"}
   });
   try{
     const syncResult=await syncReviews();
     if(syncResult.conflicts?.length){router.push("/settings/sync");return;}
   }catch{}
   if(index>=queue.length-1)setDone(true);
   else setIndex(v=>v+1);
   setBusy(false);
 },[busy,card.id,current,index,preferences,revealed,router,userId]);

 useEffect(()=>{
   const onKeyDown=(event:KeyboardEvent)=>{
     if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLSelectElement)return;
     if(event.code==="Space"){event.preventDefault();if(!revealed)setRevealed(true);return;}
     if(!revealed||busy)return;
     const map:{[key:string]:"again"|"hard"|"good"|"easy"}={Digit1:"again",Digit2:"hard",Digit3:"good",Digit4:"easy"};
     const rating=map[event.code];
     if(rating)void answer(rating);
   };
   window.addEventListener("keydown",onKeyDown);return()=>window.removeEventListener("keydown",onKeyDown);
 },[answer,busy,revealed]);

 const {front,back}=useMemo(()=>{
   const rawFront=card.content?.front||"";
   const rawBack=card.content?.back||"";
   return {
     front:card.kind==="cloze"?rawFront.replace(/\{\{c\d+::([^}]+)\}\}/g,"••••"):rawFront,
     back:card.kind==="cloze"?rawFront.replace(/\{\{c\d+::([^}]+)\}\}/g,"$1")||rawBack:rawBack
   };
 },[card]);

 if(done)return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">✓</div><h1 className="mt-6 text-3xl font-semibold">Session complete</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your review events are stored locally and will sync when a connection is available.</p><div className="mt-6 flex justify-center gap-2"><button onClick={()=>router.refresh()} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Load more</button><button onClick={()=>router.push("/statistics")} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold">View statistics</button></div></div>;

 const onPointerDown=(event:React.PointerEvent<HTMLDivElement>)=>{if(event.pointerType==="mouse"&&event.button!==0)return;swipeStartX.current=event.clientX;};
 const onPointerUp=(event:React.PointerEvent<HTMLDivElement>)=>{
   const start=swipeStartX.current;swipeStartX.current=null;
   if(start===null||!revealed||busy)return;
   const delta=event.clientX-start;
   if(Math.abs(delta)<90)return;
   void answer(delta<0?"again":"easy");
 };
 return <div ref={shellRef} tabIndex={0} onPointerDown={onPointerDown} onPointerUp={onPointerUp} className="outline-none mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-4xl flex-col px-5 py-8 sm:px-8">
  <div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{card.kind}</p><p className="mt-1 text-sm text-slate-500">{current.isNew?"New card":"Scheduled review"} · {index+1}/{queue.length} · swipe ← again / → easy</p></div><div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-900" style={{width:((index+1)/queue.length*100)+"%"}}/></div></div>
  <div className="flex flex-1 items-center">
   <div className="w-full rounded-3xl border border-black/[0.06] bg-white p-8 text-center shadow-sm sm:p-12">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Front</p>
    <RichContent content={front} className="mx-auto mt-6 max-w-2xl text-3xl font-semibold" />
    {card.kind==="image"&&card.content.imageUrl&&((card.content.occlusions?.length??0)>0?<div className="mx-auto mt-8"><OccludedImage src={card.content.imageUrl} rects={card.content.occlusions??[]} revealed={revealed}/></div>:<img src={card.content.imageUrl} alt="" className="mx-auto mt-8 max-h-72 rounded-2xl object-contain"/>)}
    {card.content.mediaUrl&&card.content.mediaType?.startsWith("image/")&&((card.content.occlusions?.length??0)>0?<div className="mx-auto mt-8"><OccludedImage src={card.content.mediaUrl} rects={card.content.occlusions??[]} revealed={revealed}/></div>:<img src={card.content.mediaUrl} alt="" className="mx-auto mt-8 max-h-72 rounded-2xl object-contain"/>)}
    {card.content.mediaUrl&&card.content.mediaType?.startsWith("audio/")&&<audio controls src={card.content.mediaUrl} className="mx-auto mt-8 w-full max-w-xl"/>}
    {card.content.mediaUrl&&card.content.mediaType?.startsWith("video/")&&<video controls src={card.content.mediaUrl} className="mx-auto mt-8 max-h-72 w-full rounded-2xl"/>}
    {card.content.mediaItems?.map((item,i)=><div key={item.path+i} className="mt-8">{item.mime_type.startsWith("image/")&&item.url&&<img src={item.url} alt="" className="mx-auto max-h-72 rounded-2xl object-contain"/>}{item.mime_type.startsWith("audio/")&&item.url&&<audio controls src={item.url} className="mx-auto w-full max-w-xl"/>}{item.mime_type.startsWith("video/")&&item.url&&<video controls src={item.url} className="mx-auto max-h-72 w-full rounded-2xl"/>}</div>)}
    {card.kind==="multiple_choice"&&<div className="mx-auto mt-8 max-w-xl space-y-2 text-left">{(card.content.options??[]).map((option,i)=><div key={option+i} className="rounded-xl border border-slate-200 px-4 py-3 text-sm"><RichContent content={option} /></div>)}</div>}
    {revealed?<div className="mt-10 border-t border-slate-100 pt-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Back</p>{card.kind==="multiple_choice"&&<p className="mt-5 text-sm font-semibold text-slate-900">Correct option: {(card.content.options??[])[card.content.answer??0]||"—"}</p>}<RichContent content={back} className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600" /></div>:<button onClick={()=>setRevealed(true)} className="mt-12 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50">Show answer <span className="ml-2 text-xs text-slate-400">Space</span></button>}
   </div>
  </div>
  {revealed&&<div className="mt-5 grid grid-cols-4 gap-2">{(["again","hard","good","easy"] as const).map(r=><button key={r} disabled={busy} onClick={()=>void answer(r)} className="rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold capitalize hover:bg-slate-50 disabled:opacity-50">{r}<span className="ml-2 text-xs text-slate-400">{["again","hard","good","easy"].indexOf(r)+1}</span></button>)}</div>}
 </div>;
}