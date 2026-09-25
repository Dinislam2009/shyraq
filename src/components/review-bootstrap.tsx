"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cacheReviewSession, getCachedReviewSession } from "@/lib/offline/store";
import { syncReviews } from "@/lib/sync/client";
import { ReviewRunner } from "@/components/review-runner";

const defaults={desired_retention:0.9,maximum_interval:36500,learning_steps:["1m","10m"],relearning_steps:["10m"],enable_fuzz:true,enable_short_term:true};

export function ReviewBootstrap({
 userId,
 initialQueue,
 initialPreferences
}:{userId:string|null;initialQueue:any[];initialPreferences:any}){
 const [resolvedUserId,setResolvedUserId]=useState(userId);
 const [queue,setQueue]=useState<any[]>(initialQueue);
 const [preferences,setPreferences]=useState<any>(initialPreferences||defaults);
 const [ready,setReady]=useState(Boolean(initialQueue.length&&userId));

 useEffect(()=>{
  let active=true;

  async function boot(){
   try{ await syncReviews(); }catch{}

   if(initialQueue.length&&userId){
    await cacheReviewSession(userId,initialQueue,initialPreferences||defaults);
    if(active)setReady(true);
    return;
   }

   try{
    const supabase=createClient();
    const {data}=await supabase.auth.getSession();
    const browserUserId=data.session?.user?.id||userId||null;
    const cached=await getCachedReviewSession(browserUserId||undefined);
    if(!active)return;

    if(cached&&cached.queue.length){
     setResolvedUserId(browserUserId||cached.userId);
     setQueue(cached.queue);
     setPreferences({...defaults,...(cached.preferences&&typeof cached.preferences==="object"?cached.preferences:{})});
     setReady(true);
    }else{
     setResolvedUserId(browserUserId);
     setReady(true);
    }
   }catch{
    if(active)setReady(true);
   }
  }

  void boot();

  const onOnline=()=>{void syncReviews().catch(()=>undefined);};
  window.addEventListener("online",onOnline);
  return()=>{active=false;window.removeEventListener("online",onOnline);};
 },[initialQueue,initialPreferences,userId]);

 if(!ready||!resolvedUserId){
  return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-semibold">Preparing review session</h1><p className="mt-3 text-sm text-slate-500">Loading your local study data…</p></div>;
 }

 if(!queue.length){
  return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-semibold">Review queue is empty</h1><p className="mt-3 text-sm leading-6 text-slate-500">Create some cards first or connect once to refresh your queue.</p></div>;
 }

 return <ReviewRunner userId={resolvedUserId} queue={queue} preferences={preferences}/>;
}
