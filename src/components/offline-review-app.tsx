"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import {scheduleReview,type SchedulerEngine} from "@/lib/scheduler";
import {getDeviceId,cacheReviewSession,getCachedReviewPreferences,offlineStore,getOfflineReviewQueue,upsertOfflineReviewState} from "@/lib/offline/store";
import {queueReview,syncReviews} from "@/lib/sync/client";
import {RichContent} from "@/components/rich-content";

type QueueItem=Awaited<ReturnType<typeof getOfflineReviewQueue>>[number];
type Preferences={scheduler_engine?:SchedulerEngine;desired_retention?:number;maximum_interval?:number;enable_fuzz?:boolean;enable_short_term?:boolean;learning_steps?:string[];relearning_steps?:string[]};

export function OfflineReviewApp(){
 const [userId,setUserId]=useState("");
 const [queue,setQueue]=useState<QueueItem[]>([]);
 const [decks,setDecks]=useState<Array<{id:string;name:string}>>([]);
 const [deckId,setDeckId]=useState("");
 const [preferences,setPreferences]=useState<Preferences>({});
 const [index,setIndex]=useState(0);
 const [revealed,setRevealed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [message,setMessage]=useState("");

 const load=useCallback(async(selectedDeckId=deckId,uid=userId)=>{
  const resolvedUser=uid||localStorage.getItem("shyraq:last-user-id")||"";
  if(!resolvedUser){setLoading(false);return;}
  setUserId(resolvedUser);
  const [rows,cachedPrefs,deckRows]=await Promise.all([getOfflineReviewQueue(resolvedUser,selectedDeckId||undefined,50),getCachedReviewPreferences(resolvedUser),offlineStore.decks.where("userId").equals(resolvedUser).sortBy("name")]);
  setQueue(rows);
  setPreferences((cachedPrefs&&typeof cachedPrefs==="object"?cachedPrefs:{}) as Preferences);
  setDecks(deckRows.map(deck=>({id:deck.id,name:deck.name})));
  setIndex(0);
  setRevealed(false);
  setLoading(false);
 },[deckId,userId]);

 useEffect(()=>{void load();},[load]);

 const current=queue[index];
 const content=(current?.card.content||{}) as {front?:string;back?:string;tags?:string[];fields?:Record<string,string>};
 const template=Array.isArray(current?.card.card_templates)?current?.card.card_templates.find(item=>item.id===current.template_id)||current?.card.card_templates[0]:current?.card.card_templates;
 const front=useMemo(()=>renderTemplate(template?.front_template||"{{front}}",content.front||"",content.back||"",content.fields||{}),[template,content.front,content.back,content.fields]);
 const back=useMemo(()=>renderTemplate(template?.back_template||"{{back}}",content.front||"",content.back||"",content.fields||{}),[template,content.front,content.back,content.fields]);

 const answer=useCallback(async(rating:"again"|"hard"|"good"|"easy")=>{
  if(!current||busy||!userId)return;
  setBusy(true);
  const previous=current.stateData&&typeof current.stateData==="object"?current.stateData:{};
  const result=scheduleReview(previous,rating,{engine:preferences.scheduler_engine||"fsrs",desiredRetention:Number(preferences.desired_retention||0.9),maximumInterval:Number(preferences.maximum_interval||36500),enableFuzz:preferences.enable_fuzz!==false,enableShortTerm:preferences.enable_short_term!==false,learningSteps:preferences.learning_steps,relearningSteps:preferences.relearning_steps});
  const due=result.card.due instanceof Date?result.card.due:new Date(String(result.card.due||new Date().toISOString()));
  await upsertOfflineReviewState({id:userId+":"+current.card.id,userId,cardId:current.card.id,queue:String(result.card.state??"review"),stateData:result.card as Record<string,unknown>,dueAt:due.toISOString(),lastReviewedAt:new Date().toISOString(),reps:Number(result.card.reps??0),lapses:Number(result.card.lapses??0),stability:result.card.stability===undefined?null:Number(result.card.stability),difficulty:result.card.difficulty===undefined?null:Number(result.card.difficulty),scheduledDays:Number(result.card.scheduled_days??0)});
  await queueReview({id:crypto.randomUUID(),userId,cardId:current.card.id,deviceId:getDeviceId(),sequence:Date.now(),rating,elapsedMs:0,reviewedAt:new Date().toISOString(),previousState:previous as Record<string,unknown>,nextState:result.card as Record<string,unknown>,status:"pending",metadata:{event_kind:current.isNew?"new-card":"review",scheduler:result.scheduler,offline:true}});
  const nextIndex=index+1;
  try{await cacheReviewSession(userId,queue.slice(nextIndex),preferences);}catch{}
  try{await syncReviews();setMessage("Review saved locally and synced when available.");}catch{setMessage("Review saved locally. It will sync when you reconnect.");}
  if(nextIndex>=queue.length){await load(deckId,userId);setMessage("Queue complete. More cards will appear when they become due.");}else{setIndex(nextIndex);setRevealed(false);}
  setBusy(false);
 },[busy,current,deckId,index,load,preferences,queue,userId]);

 if(loading)return <main className="flex min-h-screen items-center justify-center"><p className="text-sm text-slate-500">Loading local review data…</p></main>;
 if(!userId)return <main className="flex min-h-screen items-center justify-center px-5"><div className="max-w-md rounded-3xl border border-black/[0.06] bg-white p-8 text-center"><h1 className="text-2xl font-semibold">Offline data is not available</h1><p className="mt-3 text-sm leading-6 text-slate-500">Open Shyraq while connected once so the local mirror can be created for this device.</p><a href="/login" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Reconnect</a></div></main>;

 return <main className="min-h-screen bg-[#f8fafc] px-5 py-8 text-slate-950">
  <div className="mx-auto max-w-4xl">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Offline review</p><h1 className="mt-1 text-2xl font-semibold">Local study session</h1></div><select value={deckId} onChange={event=>{setDeckId(event.target.value);void load(event.target.value,userId);}} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">All cached decks</option>{decks.map(deck=><option key={deck.id} value={deck.id}>{deck.name}</option>)}</select></div>
   {message?<div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">{message}</div>:null}
   {!current?<div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="text-xl font-semibold">No cards due offline</h2><p className="mt-3 text-sm text-slate-500">Your local mirror is up to date. Reconnect to pull newly due cards from other devices.</p></div>:<div className="mt-8"><div className="mb-4 flex items-center justify-between text-xs text-slate-400"><span>{index+1} / {queue.length}</span><span>{String(current.card.kind).toUpperCase()} · {(preferences.scheduler_engine||"fsrs").toUpperCase()}</span></div><section className="rounded-3xl border border-black/[0.06] bg-white p-8 text-center shadow-sm sm:p-12"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Front</p><RichContent content={front} className="mx-auto mt-6 max-w-2xl text-3xl font-semibold"/>{!revealed?<button type="button" onClick={()=>setRevealed(true)} className="mt-12 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold">Show answer</button>:<div className="mt-10 border-t border-slate-100 pt-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Back</p><RichContent content={back} className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600"/></div>}</section>{revealed?<div className="mt-4 grid grid-cols-4 gap-2">{(["again","hard","good","easy"] as const).map(rating=><button key={rating} disabled={busy} type="button" onClick={()=>void answer(rating)} className="rounded-xl bg-slate-950 px-3 py-3 text-sm font-semibold text-white disabled:opacity-40">{rating}</button>)}</div>:null}</div>}
   <p className="mt-8 text-center text-xs text-slate-400">Cards, review states and pending events are stored locally and remain available without a network connection.</p>
  </div>
 </main>;
}

function renderTemplate(template:string,front:string,back:string,fields:Record<string,string>){
 const values={front,back,...fields};
 return String(template||"").replace(/\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(_,key:string,body:string)=>values[String(key).trim()]?body:"").replace(/\{\{\^([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(_,key:string,body:string)=>values[String(key).trim()]?"":body).replace(/\{\{\s*([^}]+?)\s*\}\}/g,(_,key:string)=>values[String(key).trim()]??"");
}