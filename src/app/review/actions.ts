"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createEmptyCard, fsrs, Rating, type Card as FsrsCard } from "ts-fsrs";

const scheduler=fsrs({request_retention:0.9,maximum_interval:36500,enable_fuzz:true,enable_short_term:true,learning_steps:["1m","10m"],relearning_steps:["10m"]});
const ratingMap={again:Rating.Again,hard:Rating.Hard,good:Rating.Good,easy:Rating.Easy} as const;

function revive(value:any):FsrsCard{
 if(!value)return createEmptyCard(new Date());
 return {...value,due:new Date(value.due),last_review:value.last_review?new Date(value.last_review):undefined} as FsrsCard;
}
export async function submitReview(cardId:string,rating:keyof typeof ratingMap,elapsedMs:number){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return {error:"Authentication required."};
 const {data:existing}=await supabase.from("review_states").select("*").eq("user_id",user.id).eq("card_id",cardId).maybeSingle();
 const previous=revive(existing?.state_data); const result=scheduler.next(previous,new Date(),ratingMap[rating]); const next=result.card; const eventKey=crypto.randomUUID();
 const {error:eventError}=await supabase.from("review_events").insert({event_key:eventKey,user_id:user.id,card_id:cardId,device_id:crypto.randomUUID(),reviewed_at:new Date().toISOString(),rating,elapsed_ms:elapsedMs,previous_state:previous,next_state:next,metadata:{scheduler:"fsrs",version:"5.4.2"}});
 if(eventError)return {error:eventError.message};
 const {error:stateError}=await supabase.from("review_states").upsert({user_id:user.id,card_id:cardId,queue:next.state===0?"learning":next.state===1?"learning":next.state===2?"review":"relearning",state_data:next,due_at:next.due.toISOString(),last_reviewed_at:new Date().toISOString(),reps:next.reps,lapses:next.lapses,stability:next.stability,difficulty:next.difficulty,scheduled_days:next.scheduled_days});
 if(stateError)return {error:stateError.message};
 revalidatePath("/review"); revalidatePath("/dashboard"); revalidatePath("/statistics"); return {ok:true};
}