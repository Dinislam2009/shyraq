"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fail(message:string):never{redirect("/settings/sync?error="+encodeURIComponent(message));}

export async function resolveSyncConflict(conflictId:string,resolution:"keep_remote"|"apply_incoming"):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:conflict,error}=await supabase.from("sync_conflicts").select("id,card_id,incoming_state,incoming_reviewed_at").eq("id",conflictId).eq("user_id",user.id).maybeSingle();
 if(error||!conflict)fail("Conflict not found.");
 if(resolution==="apply_incoming"){
  const incoming:any=conflict.incoming_state??{};
  const {error:stateError}=await supabase.from("review_states").upsert({
   user_id:user.id,card_id:conflict.card_id,
   queue:incoming.state===2?"review":incoming.state===3?"relearning":"learning",
   state_data:incoming,
   due_at:incoming.due?new Date(incoming.due).toISOString():null,
   last_reviewed_at:conflict.incoming_reviewed_at,
   reps:incoming.reps??0,lapses:incoming.lapses??0,
   stability:incoming.stability??null,difficulty:incoming.difficulty??null,
   scheduled_days:incoming.scheduled_days??0
  });
  if(stateError)fail(stateError.message);
 }
 const {error:updateError}=await supabase.from("sync_conflicts").update({resolution,resolved_at:new Date().toISOString()}).eq("id",conflictId).eq("user_id",user.id);
 if(updateError)fail(updateError.message);
 revalidatePath("/settings/sync");revalidatePath("/review");redirect("/settings/sync");
}