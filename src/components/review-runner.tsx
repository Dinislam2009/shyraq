"use client";
import Image from "next/image";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {createSchedulerCard,scheduleReview,type SchedulerEngine} from "@/lib/scheduler";
import {queueReview,syncReviews} from "@/lib/sync/client";
import {undoReview} from "@/app/review/actions";
import {getDeviceId,cacheReviewSession,upsertOfflineReviewState} from "@/lib/offline/store";
import {useRouter} from "next/navigation";
import {RichContent} from "@/components/rich-content";
import {AnkiTemplateContent} from "@/components/anki-template-content";
import {OccludedImage} from "@/components/image-occlusion";
import {DEFAULT_RATING_ORDER,sanitizePerCardPreferences,sanitizeRatingOrder,sanitizeStyles} from "@/lib/review/config";
import {renderAnkiTemplate} from "@/lib/anki/template-engine";

type Preferences={scheduler_engine?:SchedulerEngine;desired_retention:number;maximum_interval:number;learning_steps:string[];relearning_steps:string[];enable_fuzz:boolean;enable_short_term:boolean;rating_labels?:Record<string,string>;rating_order?:string[];show_keyboard_hints?:boolean;swipe_enabled?:boolean;rating_styles?:Record<string,{background?:string;text?:string}>;accessibility?:{scale?:number;highContrast?:boolean;reducedMotion?:boolean;focusRing?:boolean};session_defaults?:{batchSize?:number;shuffle?:boolean;autoRevealSeconds?:number};};
type CardContent={front?:string;back?:string;tags?:string[];fields?:Record<string,string>;options?:string[];answer?:number;imageUrl?:string;clozeIndex?:number;occlusions?:Array<{x:number;y:number;w:number;h:number}>;mediaUrl?:string;mediaType?:string;mediaItems?:Array<{name:string;path:string;mime_type:string;url?:string}>;reviewPreferences?:Record<string,unknown>;anki?:{rawFields?:Record<string,string>;deckName?:string;modelName?:string;ord?:number;flags?:number;queue?:number;type?:number}};
function templateOne(template:QueueItem["card"]["card_templates"]){if(Array.isArray(template))return template[0]||null;return template||null;}
type QueueItem={card:{id:string;content:CardContent;kind:string;template_id?:string;card_templates?:{id:string;name:string;front_template:string;back_template:string;css?:string|null}|{id:string;name:string;front_template:string;back_template:string;css?:string|null}[]};stateData:any;isNew:boolean};

type CompletedReview={cardId:string;rating:"again"|"hard"|"good"|"easy";elapsedMs:number;previousState:any;nextState:any;hadPreviousState:boolean;queueIndex:number};
function ReviewImage({src}:{src:string}){const optimized=String(src).includes("supabase.co");return <Image src={src} alt="" width={960} height={540} unoptimized={!optimized} className="mx-auto mt-8 max-h-72 w-auto rounded-2xl object-contain"/>}

export function ReviewRunner({userId,queue,preferences}:{userId:string;queue:QueueItem[];preferences:Preferences}){
 const router=useRouter();
 const [index,setIndex]=useState(0);
 const [revealed,setRevealed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [done,setDone]=useState(false);
 const [paused,setPaused]=useState(false);
 const [selectedOption,setSelectedOption]=useState<number|null>(null);
 const [completed,setCompleted]=useState<CompletedReview[]>([]);
 const [elapsedSeconds,setElapsedSeconds]=useState(0);
 const shellRef=useRef<HTMLDivElement>(null);
 const startedAt=useRef(Date.now());
 const swipeStartX=useRef<number|null>(null);
 const current=queue[index];
 const card=current.card;
 const cardReviewPreferences=useMemo(()=>sanitizePerCardPreferences(card.content?.reviewPreferences),[card.content?.reviewPreferences]);
 const ratingOrder=useMemo(()=>sanitizeRatingOrder(cardReviewPreferences.ratingOrder??preferences.rating_order??DEFAULT_RATING_ORDER),[cardReviewPreferences.ratingOrder,preferences.rating_order]);
 const ratingStyles=useMemo(()=>sanitizeStyles(preferences.rating_styles),[preferences.rating_styles]);
 const accessibility=preferences.accessibility||{};
 const effectiveAutoReveal=cardReviewPreferences.autoRevealSeconds ?? Number(preferences.session_defaults?.autoRevealSeconds||0);
 const effectiveSwipe=cardReviewPreferences.swipeEnabled ?? preferences.swipe_enabled !== false;
 const showTimer=cardReviewPreferences.showTimer !== false;

 useEffect(()=>{
   shellRef.current?.focus();
   startedAt.current=Date.now();
   setElapsedSeconds(0);
   setRevealed(false);
   setSelectedOption(null);
   if(effectiveAutoReveal>0){
     const timer=window.setTimeout(()=>setRevealed(true),effectiveAutoReveal*1000);
     return()=>window.clearTimeout(timer);
   }
 },[effectiveAutoReveal,index]);

 useEffect(()=>{
   if(paused||done||!showTimer)return;
   const timer=window.setInterval(()=>setElapsedSeconds(value=>value+1),1000);
   return()=>window.clearInterval(timer);
 },[done,paused,showTimer]);

 const answer=useCallback(async(rating:"again"|"hard"|"good"|"easy")=>{
   if(busy||paused||!revealed)return;
   setBusy(true);
   const previous=current.stateData?{...current.stateData}:createSchedulerCard(preferences.scheduler_engine==="sm2"?"sm2":"fsrs");
   const result=scheduleReview(previous,rating,{
    engine:preferences.scheduler_engine||"fsrs",
    desiredRetention:preferences.desired_retention,
    maximumInterval:preferences.maximum_interval,
    enableFuzz:preferences.enable_fuzz,
    enableShortTerm:preferences.enable_short_term,
    learningSteps:preferences.learning_steps,
    relearningSteps:preferences.relearning_steps
   });
   const elapsedMs=Math.max(0,Date.now()-startedAt.current);
   const localDue=result.card.due instanceof Date?result.card.due:(result.card.due?new Date(String(result.card.due)):null);
   await upsertOfflineReviewState({
    id:userId+":"+card.id,
    userId,
    cardId:card.id,
    queue:String(result.card.state??"review"),
    stateData:result.card as Record<string,unknown>,
    dueAt:localDue?localDue.toISOString():null,
    lastReviewedAt:new Date().toISOString(),
    reps:Number(result.card.reps??0),
    lapses:Number(result.card.lapses??0),
    stability:result.card.stability===undefined?null:Number(result.card.stability),
    difficulty:result.card.difficulty===undefined?null:Number(result.card.difficulty),
    scheduledDays:Number(result.card.scheduled_days??0)
   });
   await queueReview({
     id:crypto.randomUUID(),userId,cardId:card.id,deviceId:getDeviceId(),sequence:Date.now(),rating,
     elapsedMs,reviewedAt:new Date().toISOString(),previousState:previous as unknown as Record<string,unknown>,
     nextState:result.card as Record<string,unknown>,status:"pending",
     metadata:{event_kind:current.isNew?"new-card":"review",scheduler:result.scheduler}
   });
   const entry={cardId:card.id,rating,elapsedMs,previousState:previous,nextState:result.card,hadPreviousState:Boolean(current.stateData),queueIndex:index};
   setCompleted(items=>[...items,entry]);
   try{await cacheReviewSession(userId,queue.slice(index+1),preferences);}catch{}
   try{
     const syncResult=await syncReviews();
     if(syncResult.conflicts?.length){router.push("/settings/sync");return;}
   }catch{}
   if(index>=queue.length-1)setDone(true);else setIndex(v=>v+1);
   setBusy(false);
 },[busy,card.id,current,index,paused,preferences,queue,revealed,router,userId]);

 const undo=useCallback(async()=>{
   if(busy||completed.length===0)return;
   const last=completed[completed.length-1];
   try{
     const {offlineStore}=await import("@/lib/offline/store");
     const pending=await offlineStore.reviews.toArray();
     const candidates=pending.filter((event:any)=>event.cardId===last.cardId&&event.status!=="synced").sort((a:any,b:any)=>b.sequence-a.sequence);
     if(candidates[0]){
       await offlineStore.reviews.delete(candidates[0].id);
     }else if(typeof navigator!=="undefined"&&navigator.onLine){
       const result=await undoReview(last.cardId,last.previousState,last.hadPreviousState,last.rating);
       if(result.error)throw new Error(result.error);
     }else{
       return;
     }
     setCompleted(items=>items.slice(0,-1));
     setIndex(last.queueIndex);
     setDone(false);
     setPaused(false);
     setRevealed(true);
     startedAt.current=Date.now();
   }catch{}
 },[busy,completed]);

 useEffect(()=>{
   const onKeyDown=(event:KeyboardEvent)=>{
     if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLSelectElement)return;
     if(event.code==="Space"){event.preventDefault();if(paused)return;if(!revealed)setRevealed(true);return;}
     if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="z"){event.preventDefault();void undo();return;}
     if(event.key.toLowerCase()==="p"){setPaused(value=>!value);return;}
     if(!revealed||busy||paused)return;
     const order=ratingOrder.slice(0,4);
     const map:Record<string,"again"|"hard"|"good"|"easy">={};order.forEach((rating,i)=>{map["Digit"+(i+1)]=rating;});
     const rating=map[event.code];if(rating)void answer(rating);
   };
   window.addEventListener("keydown",onKeyDown);return()=>window.removeEventListener("keydown",onKeyDown);
 },[answer,busy,paused,ratingOrder,revealed,undo]);

 const {front,back,templateCss,usesAnkiTemplate}=useMemo(()=>{
   const rawFront=card.content?.front||"",rawBack=card.content?.back||"";
   const sourceFront=card.kind==="reverse"?rawBack:rawFront,sourceBack=card.kind==="reverse"?rawFront:rawBack;
   const template=templateOne(card.card_templates);
   const clozeIndex=Number(card.content?.clozeIndex||1);
   if(template){
    const mediaItems=Array.isArray(card.content?.mediaItems)?card.content.mediaItems:[];
    const resolveMedia=(value:string)=>String(value||"").replace(/__SHYRAQ_MEDIA__([^\s<"\x27\x60]+)/g,(_,encoded:string)=>{
     const name=decodeURIComponent(encoded);
     const item=mediaItems.find(entry=>entry.name===name);
     return item?.url||item?.path||name;
    });
    const rawFields=card.content?.anki?.rawFields||{};
    const templateFields:Record<string,string>={front:sourceFront,back:sourceBack,...(card.content?.fields||{})};
    for(const [key,value] of Object.entries(rawFields))templateFields[key]=resolveMedia(value);
    const tags=(card.content?.tags||[]).join(" ");
    const deckName=String(card.content?.anki?.deckName||"");
    const subdeck=deckName.includes("::")?deckName.split("::").at(-1)||deckName:deckName;
    const specialFields:Record<string,string>={Tags:tags,Type:String(card.content?.anki?.modelName||card.kind||""),Deck:deckName,Subdeck:subdeck,Card:template.name,CardFlag:String(card.content?.anki?.flags||0),CardSuspended:card.content?.isSuspended?"1":"0"};
    const resolvedFields={...templateFields,front:resolveMedia(templateFields.front||sourceFront),back:resolveMedia(templateFields.back||sourceBack)};
    const frontRendered=renderAnkiTemplate(resolveMedia(template.front_template),resolvedFields,{side:"front",clozeIndex,revealCloze:false,specialFields});
    const backRendered=renderAnkiTemplate(resolveMedia(template.back_template),resolvedFields,{side:"back",frontSide:frontRendered,clozeIndex,revealCloze:true,specialFields});
    return {front:frontRendered,back:backRendered,templateCss:template.css||"",usesAnkiTemplate:true};
   }
   const maskedFront=card.kind==="cloze"?sourceFront.replace(/\{\{c\d+::([^}]+)\}\}/g,"••••"):sourceFront;
   const revealedFront=card.kind==="cloze"?sourceFront.replace(/\{\{c\d+::([^}]+)\}\}/g,"$1"):sourceFront;
   const clozeBack=card.kind==="cloze"?[revealedFront,sourceBack].filter(Boolean).join("\n\n"):sourceBack;
   return {front:maskedFront,back:clozeBack,templateCss:"",usesAnkiTemplate:false};
 },[card]);

 if(done){
  const total=completed.length,again=completed.filter(x=>x.rating==="again").length,minutes=Math.round(completed.reduce((sum,x)=>sum+x.elapsedMs,0)/60000);
  return <div className="mx-auto max-w-2xl px-5 py-20 text-center">
   <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">✓</div>
   <h1 className="mt-6 text-3xl font-semibold">Session complete</h1>
   <p className="mt-3 text-sm leading-6 text-slate-500">{total} reviews · {minutes} min · {again} Again</p>
   <div className="mt-8 grid grid-cols-3 gap-3 text-left">
    <SummaryMetric label="Reviewed" value={String(total)}/><SummaryMetric label="Again" value={String(again)}/><SummaryMetric label="Study time" value={minutes+"m"}/>
   </div>
   <div className="mt-7 flex justify-center gap-2"><button onClick={()=>router.refresh()} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Load more</button><button onClick={()=>router.push("/history")} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold">History</button><button onClick={()=>router.push("/statistics")} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold">Statistics</button></div>
  </div>;
 }

 

 const onPointerDown=(event:React.PointerEvent<HTMLDivElement>)=>{if(event.pointerType==="mouse"&&event.button!==0)return;swipeStartX.current=event.clientX;};
 const onPointerUp=(event:React.PointerEvent<HTMLDivElement>)=>{const start=swipeStartX.current;swipeStartX.current=null;if(start===null||!revealed||busy||paused||!effectiveSwipe)return;const delta=event.clientX-start;if(Math.abs(delta)<90)return;void answer(delta<0?"again":"easy");};

 return <div ref={shellRef} tabIndex={0} onPointerDown={onPointerDown} onPointerUp={onPointerUp} className="shyraq-review-content outline-none mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-4xl flex-col px-5 py-8 sm:px-8">
  <style>{`.shyraq-review-content { transform: scale(${Math.min(1.4,Math.max(0.9,Number(accessibility.scale||1)))}); transform-origin: top center; } .shyraq-focus:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; } ${accessibility.highContrast?" .shyraq-review-surface { border-width: 2px; border-color: currentColor; box-shadow: none; } ":""} ${accessibility.reducedMotion?" * { scroll-behavior: auto !important; transition: none !important; } ":""}`}</style>
  <div className="mb-6 flex items-center justify-between">
   <div><p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{card.kind}</p><p className="mt-1 text-sm text-slate-500">{current.isNew?"New card":"Scheduled review"} · {(preferences.scheduler_engine||"fsrs").toUpperCase()} · {index+1}/{queue.length}{showTimer?" · "+elapsedSeconds+"s":""}</p></div>
   <div className="flex items-center gap-2">
    <button onClick={()=>setPaused(v=>!v)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">{paused?"Resume":"Pause"} <span className="ml-1 text-[10px] text-slate-400">P</span></button>
    <button disabled={!completed.length||busy} onClick={()=>void undo()} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-40">Undo <span className="ml-1 text-[10px] text-slate-400">⌘Z</span></button>
    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-900" style={{width:((index+1)/queue.length*100)+"%"}}/></div>
   </div>
  </div>
  {paused?<div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><p className="font-semibold">Session paused</p><p className="mt-1 text-amber-800">Your queue stays local. Resume when ready.</p></div>:null}
  <div className="flex flex-1 items-center">
   <div className={"shyraq-review-surface w-full rounded-3xl border border-black/[0.06] bg-white p-8 text-center shadow-sm sm:p-12 "+(paused?"opacity-60":"")}>
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Front</p>
    {usesAnkiTemplate?<AnkiTemplateContent html={front} css={templateCss} className="mx-auto mt-6 max-w-2xl text-3xl font-semibold" />:<RichContent content={front} clozeIndex={card.kind==="cloze"?Number(card.content.clozeIndex):undefined} revealCloze={revealed} className="mx-auto mt-6 max-w-2xl text-3xl font-semibold" />}
    {card.kind==="image"&&card.content.imageUrl&&((card.content.occlusions?.length??0)>0?<div className="mx-auto mt-8"><OccludedImage src={card.content.imageUrl} rects={card.content.occlusions??[]} revealed={revealed}/></div>:<ReviewImage src={card.content.imageUrl}/> )}
    {card.content.mediaUrl&&card.content.mediaType?.startsWith("image/")&&((card.content.occlusions?.length??0)>0?<div className="mx-auto mt-8"><OccludedImage src={card.content.mediaUrl} rects={card.content.occlusions??[]} revealed={revealed}/></div>:<ReviewImage src={card.content.mediaUrl}/> )}
    {card.content.mediaUrl&&card.content.mediaType?.startsWith("audio/")&&<audio controls src={card.content.mediaUrl} className="mx-auto mt-8 w-full max-w-xl"/>}
    {card.content.mediaUrl&&card.content.mediaType?.startsWith("video/")&&<video controls src={card.content.mediaUrl} className="mx-auto mt-8 max-h-72 w-full rounded-2xl"/>}
    {card.content.mediaItems?.map((item,i)=><div key={item.path+i} className="mt-8">{item.mime_type.startsWith("image/")&&item.url&&<img src={item.url} alt="" className="mx-auto max-h-72 rounded-2xl object-contain"/>}{item.mime_type.startsWith("audio/")&&item.url&&<audio controls src={item.url} className="mx-auto w-full max-w-xl"/>}{item.mime_type.startsWith("video/")&&item.url&&<video controls src={item.url} className="mx-auto max-h-72 w-full rounded-2xl"/>}</div>)}
    {card.kind==="multiple_choice"&&<div className="mx-auto mt-8 max-w-xl space-y-2 text-left">{(card.content.options??[]).map((option,i)=>{const correct=i===(card.content.answer??0),selected=i===selectedOption;return <button type="button" key={option+i} disabled={revealed||busy||paused} onClick={()=>{if(!revealed&&!busy&&!paused){setSelectedOption(i);setRevealed(true)}}} className={"w-full rounded-xl border px-4 py-3 text-left text-sm transition "+(revealed&&correct?"border-emerald-300 bg-emerald-50":revealed&&selected&&!correct?"border-red-300 bg-red-50":"border-slate-200 bg-white hover:bg-slate-50 disabled:hover:bg-white")}><RichContent content={option}/><span className="mt-1 block text-[11px] font-medium text-slate-400">{revealed&&correct?"Correct":revealed&&selected&&!correct?"Your choice":"Choose this answer"}</span></button>})}</div>}
    {revealed?<div className="mt-10 border-t border-slate-100 pt-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Back</p>{card.kind==="multiple_choice"&&<p className="mt-5 text-sm font-semibold text-slate-900">Correct option: {(card.content.options??[])[card.content.answer??0]||"—"}</p>}{usesAnkiTemplate?<AnkiTemplateContent html={back} css={templateCss} className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600"/>:<RichContent content={back} clozeIndex={card.kind==="cloze"?Number(card.content.clozeIndex):undefined} revealCloze={true} className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600"/>}</div>:card.kind!=="multiple_choice"&&<button disabled={paused} onClick={()=>setRevealed(true)} className="mt-12 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">Show answer {preferences.show_keyboard_hints!==false&&<span className="ml-2 text-xs text-slate-400">Space</span>}</button>}
   </div>
  </div>
  {revealed&&<div className="mt-5 grid grid-cols-4 gap-2">{ratingOrder.slice(0,4).map((r,i)=>{const style=ratingStyles[r];return <button key={r} disabled={busy||paused} onClick={()=>void answer(r)} style={{backgroundColor:style.background,color:style.text}} className="shyraq-focus rounded-xl border border-transparent py-3 text-sm font-semibold capitalize disabled:opacity-50" aria-label={preferences.rating_labels?.[r]||r}>{preferences.rating_labels?.[r]||r}<span className="ml-2 text-xs opacity-70">{preferences.show_keyboard_hints===false?"":i+1}</span></button>})}</div>}
 </div>;
}
function SummaryMetric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-black/[0.06] bg-white p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>}
