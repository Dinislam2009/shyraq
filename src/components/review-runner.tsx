"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {createEmptyCard,fsrs,Rating} from "ts-fsrs";
import {queueReview,syncReviews} from "@/lib/sync/client";
import {getDeviceId,cacheReviewSession} from "@/lib/offline/store";
import {useRouter} from "next/navigation";
import {RichContent} from "@/components/rich-content";
import {OccludedImage} from "@/components/image-occlusion";

type Preferences={desired_retention:number;maximum_interval:number;learning_steps:string[];relearning_steps:string[];enable_fuzz:boolean;enable_short_term:boolean;rating_labels?:Record<string,string>;rating_order?:string[];show_keyboard_hints?:boolean;swipe_enabled?:boolean};
type CardContent={front?:string;back?:string;options?:string[];answer?:number;imageUrl?:string;occlusions?:Array<{x:number;y:number;w:number;h:number}>;mediaUrl?:string;mediaType?:string;mediaItems?:Array<{name:string;path:string;mime_type:string;url?:string}>};
function templateOne(template:QueueItem["card"]["card_templates"]){
 if(Array.isArray(template))return template[0]||null;
 return template||null;
}
function applyCardTemplate(source:string,fields:{front:string;back:string}){
 return String(source||"")
  .replace(/\{\{\s*front\s*\}\}/gi,fields.front)
  .replace(/\{\{\s*back\s*\}\}/gi,fields.back)
  .replace(/\{\{\s*FrontSide\s*\}\}/g,fields.front);
}

type QueueItem={card:{id:string;content:CardContent;kind:string;template_id?:string;card_templates?:{id:string;name:string;front_template:string;back_template:string;css?:string|null}|{id:string;name:string;front_template:string;back_template:string;css?:string|null}[]};stateData:any;isNew:boolean};

export function ReviewRunner({userId,queue,preferences}:{userId:string;queue:QueueItem[];preferences:Preferences}){
 const router=useRouter();
 const [index,setIndex]=useState(0);
 const [revealed,setRevealed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [done,setDone]=useState(false);
 const [selectedOption,setSelectedOption]=useState<number|null>(null);
 const shellRef=useRef<HTMLDivElement>(null);
 const startedAt=useRef(Date.now());
 const swipeStartX=useRef<number|null>(null);
 const current=queue[index];
 const card=current.card;

 useEffect(()=>{shellRef.current?.focus();startedAt.current=Date.now();setRevealed(false);setSelectedOption(null);},[index]);
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
   try{ await cacheReviewSession(userId,queue.slice(index+1),preferences); }catch{}
   try{
     const syncResult=await syncReviews();
     if(syncResult.conflicts?.length){router.push("/settings/sync");return;}
   }catch{}
   if(index>=queue.length-1)setDone(true);
   else setIndex(v=>v+1);
   setBusy(false);
 },[busy,card.id,current,index,preferences,queue,revealed,router,userId]);

 useEffect(()=>{
   const onKeyDown=(event:KeyboardEvent)=>{
     if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLSelectElement)return;
     if(event.code==="Space"){event.preventDefault();if(!revealed)setRevealed(true);return;}
     if(!revealed||busy)return;
     const order=(preferences.rating_order??["again","hard","good","easy"]).filter((x):x is "again"|"hard"|"good"|"easy"=>["again","hard","good","easy"].includes(x)).slice(0,4);
     const map:Record<string,"again"|"hard"|"good"|"easy">={};
     order.forEach((rating,i)=>{map["Digit"+(i+1)]=rating;});
     const rating=map[event.code];
     if(rating)void answer(rating);
   };
   window.addEventListener("keydown",onKeyDown);return()=>window.removeEventListener("keydown",onKeyDown);
 },[answer,busy,preferences,revealed]);

 const {front,back,templateCss}=useMemo(()=>{
   const rawFront=card.content?.front||"";
   const rawBack=card.content?.back||"";
   const sourceFront=card.kind==="reverse"?rawBack:rawFront;
   const sourceBack=card.kind==="reverse"?rawFront:rawBack;
   const maskedFront=card.kind==="cloze"?sourceFront.replace(/\{\{c\d+::([^}]+)\}\}/g,"••••"):sourceFront;
   const revealedFront=card.kind==="cloze"?sourceFront.replace(/\{\{c\d+::([^}]+)\}\}/g,"$1"):sourceFront;
   const template=templateOne(card.card_templates);
   return {
     front:template?applyCardTemplate(template.front_template,{front:maskedFront,back:sourceBack}):maskedFront,
     back:template?applyCardTemplate(template.back_template,{front:revealedFront,back:sourceBack}):(card.kind==="cloze"?revealedFront||sourceBack:sourceBack),
     templateCss:template?.css||""
   };
 },[card]);

 if(done)return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">✓</div><h1 className="mt-6 text-3xl font-semibold">Session complete</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your review events are stored locally and will sync when a connection is available.</p><div className="mt-6 flex justify-center gap-2"><button onClick={()=>router.refresh()} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Load more</button><button onClick={()=>router.push("/statistics")} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold">View statistics</button></div></div>;

 const onPointerDown=(event:React.PointerEvent<HTMLDivElement>)=>{if(event.pointerType==="mouse"&&event.button!==0)return;swipeStartX.current=event.clientX;};
 const onPointerUp=(event:React.PointerEvent<HTMLDivElement>)=>{
   const start=swipeStartX.current;swipeStartX.current=null;
   if(start===null||!revealed||busy||preferences.swipe_enabled===false)return;
   const delta=event.clientX-start;
   if(Math.abs(delta)<90)return;
   void answer(delta<0?"again":"easy");
 };
 return <div ref={shellRef} tabIndex={0} onPointerDown={onPointerDown} onPointerUp={onPointerUp} className="outline-none mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-4xl flex-col px-5 py-8 sm:px-8">{templateCss&&<style>{templateCss}</style>}
  <div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{card.kind}</p><p className="mt-1 text-sm text-slate-500">{current.isNew?"New card":"Scheduled review"} · {index+1}/{queue.length} {preferences.swipe_enabled===false?"":" · swipe ← again / → easy"}</p></div><div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-900" style={{width:((index+1)/queue.length*100)+"%"}}/></div></div>
  <div className="flex flex-1 items-center">
   <div className="w-full rounded-3xl border border-black/[0.06] bg-white p-8 text-center shadow-sm sm:p-12">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Front</p>
    <RichContent content={front} className="mx-auto mt-6 max-w-2xl text-3xl font-semibold" />
    {card.kind==="image"&&card.content.imageUrl&&((card.content.occlusions?.length??0)>0?<div className="mx-auto mt-8"><OccludedImage src={card.content.imageUrl} rects={card.content.occlusions??[]} revealed={revealed}/></div>:<img src={card.content.imageUrl} alt="" className="mx-auto mt-8 max-h-72 rounded-2xl object-contain"/>)}
    {card.content.mediaUrl&&card.content.mediaType?.startsWith("image/")&&((card.content.occlusions?.length??0)>0?<div className="mx-auto mt-8"><OccludedImage src={card.content.mediaUrl} rects={card.content.occlusions??[]} revealed={revealed}/></div>:<img src={card.content.mediaUrl} alt="" className="mx-auto mt-8 max-h-72 rounded-2xl object-contain"/>)}
    {card.content.mediaUrl&&card.content.mediaType?.startsWith("audio/")&&<audio controls src={card.content.mediaUrl} className="mx-auto mt-8 w-full max-w-xl"/>}
    {card.content.mediaUrl&&card.content.mediaType?.startsWith("video/")&&<video controls src={card.content.mediaUrl} className="mx-auto mt-8 max-h-72 w-full rounded-2xl"/>}
    {card.content.mediaItems?.map((item,i)=><div key={item.path+i} className="mt-8">{item.mime_type.startsWith("image/")&&item.url&&<img src={item.url} alt="" className="mx-auto max-h-72 rounded-2xl object-contain"/>}{item.mime_type.startsWith("audio/")&&item.url&&<audio controls src={item.url} className="mx-auto w-full max-w-xl"/>}{item.mime_type.startsWith("video/")&&item.url&&<video controls src={item.url} className="mx-auto max-h-72 w-full rounded-2xl"/>}</div>)}
    {card.kind==="multiple_choice"&&<div className="mx-auto mt-8 max-w-xl space-y-2 text-left">{(card.content.options??[]).map((option,i)=>{
      const correct=i===(card.content.answer??0);
      const selected=i===selectedOption;
      return <button type="button" key={option+i} disabled={revealed||busy} onClick={()=>{if(!revealed&&!busy){setSelectedOption(i);setRevealed(true);}}} className={"w-full rounded-xl border px-4 py-3 text-left text-sm transition "+(revealed&&correct?"border-emerald-300 bg-emerald-50":revealed&&selected&&!correct?"border-red-300 bg-red-50":"border-slate-200 bg-white hover:bg-slate-50 disabled:hover:bg-white")}><RichContent content={option} /><span className="mt-1 block text-[11px] font-medium text-slate-400">{revealed&&correct?"Correct":revealed&&selected&&!correct?"Your choice":"Choose this answer"}</span></button>;
    })}</div>}
    {revealed?<div className="mt-10 border-t border-slate-100 pt-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Back</p>{card.kind==="multiple_choice"&&<p className="mt-5 text-sm font-semibold text-slate-900">Correct option: {(card.content.options??[])[card.content.answer??0]||"—"}</p>}<RichContent content={back} className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600" /></div>:card.kind!=="multiple_choice"&&<button onClick={()=>setRevealed(true)} className="mt-12 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50">Show answer {preferences.show_keyboard_hints!==false&&<span className="ml-2 text-xs text-slate-400">Space</span>}</button>}
   </div>
  </div>
  {revealed&&<div className="mt-5 grid grid-cols-4 gap-2">{((preferences.rating_order??["again","hard","good","easy"]).filter((x):x is "again"|"hard"|"good"|"easy"=>["again","hard","good","easy"].includes(x)).slice(0,4) as ("again"|"hard"|"good"|"easy")[]).map((r,i)=><button key={r} disabled={busy} onClick={()=>void answer(r)} className="rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold capitalize hover:bg-slate-50 disabled:opacity-50">{preferences.rating_labels?.[r]||r}<span className="ml-2 text-xs text-slate-400">{preferences.show_keyboard_hints===false?"":i+1}</span></button>)}</div>}
 </div>;
}