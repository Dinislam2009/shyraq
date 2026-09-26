"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {scheduleReview,createSchedulerCard,type SchedulerEngine} from "@/lib/scheduler";

const ratingNames=["again","hard","good","easy"] as const;
function revive(value:any){return value?{...value,due:value.due?new Date(value.due):new Date(),last_review:value.last_review?new Date(value.last_review):undefined}:createSchedulerCard("fsrs");}
export async function submitReview(cardId:string,rating:(typeof ratingNames)[number],elapsedMs:number){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return {error:"Authentication required."};
 const {data:existing}=await supabase.from("review_states").select("*").eq("user_id",user.id).eq("card_id",cardId).maybeSingle();
 const {data:prefs}=await supabase.from("review_preferences").select("desired_retention,maximum_interval,enable_fuzz,enable_short_term,learning_steps,relearning_steps,session_defaults").eq("user_id",user.id).maybeSingle();
 const sessionDefaults=prefs?.session_defaults&&typeof prefs.session_defaults==="object"&&!Array.isArray(prefs.session_defaults)?prefs.session_defaults as Record<string,unknown>:{};
 const engine:String=sessionDefaults.schedulerEngine==="sm2"?"sm2":"fsrs";
 const previous=revive(existing?.state_data);
 const result=scheduleReview(previous,rating,{engine:engine as SchedulerEngine,desiredRetention:Number(prefs?.desired_retention)||0.9,maximumInterval:Number(prefs?.maximum_interval)||36500,enableFuzz:prefs?.enable_fuzz!==false,enableShortTerm:prefs?.enable_short_term!==false,learningSteps:Array.isArray(prefs?.learning_steps)?prefs.learning_steps:["1m","10m"],relearningSteps:Array.isArray(prefs?.relearning_steps)?prefs.relearning_steps:["10m"]});
 const next=result.card; const eventKey=crypto.randomUUID();
 const {error:eventError}=await supabase.from("review_events").insert({event_key:eventKey,user_id:user.id,card_id:cardId,device_id:crypto.randomUUID(),reviewed_at:new Date().toISOString(),rating,elapsed_ms:elapsedMs,previous_state:previous,next_state:next,metadata:{scheduler:result.scheduler}});
 if(eventError)return {error:eventError.message};
 const {error:stateError}=await supabase.from("review_states").upsert({user_id:user.id,card_id:cardId,queue:Number(next.state||2)===2?"review":"learning",state_data:next,due_at:next.due.toISOString(),last_reviewed_at:new Date().toISOString(),reps:next.reps,lapses:next.lapses,stability:next.stability,difficulty:next.difficulty,scheduled_days:next.scheduled_days});
 if(stateError)return {error:stateError.message};
 revalidatePath("/review"); revalidatePath("/dashboard"); revalidatePath("/statistics"); return {ok:true};
}
export async function undoReview(cardId:string,previousState:any,hadPreviousState:boolean,originalRating:(typeof ratingNames)[number]){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return {error:"Authentication required."};

 const {data:current}=await supabase.from("review_states").select("*").eq("user_id",user.id).eq("card_id",cardId).maybeSingle();
 const eventKey=crypto.randomUUID();
 const {error:eventError}=await supabase.from("review_events").insert({
  event_key:eventKey,
  user_id:user.id,
  card_id:cardId,
  device_id:crypto.randomUUID(),
  reviewed_at:new Date().toISOString(),
  rating:originalRating,
  elapsed_ms:0,
  previous_state:current?.state_data??null,
  next_state:hadPreviousState?previousState:null,
  metadata:{scheduler:String(current?.state_data?.scheduler||"unknown"),event_kind:"review-undo",undo_of:originalRating}
 });
 if(eventError)return {error:eventError.message};

 if(hadPreviousState){
  const next=revive(previousState);
  const {error}=await supabase.from("review_states").upsert({
   user_id:user.id,
   card_id:cardId,
   queue:Number(next.state||2)===2?"review":"learning",
   state_data:next,
   due_at:next.due.toISOString(),
   last_reviewed_at:next.last_review?next.last_review.toISOString():null,
   reps:next.reps,
   lapses:next.lapses,
   stability:next.stability,
   difficulty:next.difficulty,
   scheduled_days:next.scheduled_days
  });
  if(error)return {error:error.message};
 }else{
  const {error}=await supabase.from("review_states").delete().eq("user_id",user.id).eq("card_id",cardId);
  if(error)return {error:error.message};
 }
 revalidatePath("/review"); revalidatePath("/dashboard"); revalidatePath("/statistics"); revalidatePath("/history");
 return {ok:true};
}
