import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET(request:NextRequest){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const since=Number(request.nextUrl.searchParams.get("since")||0);
 const {data,error}=await supabase.from("sync_changes").select("cursor,event_key,entity_type,entity_id,operation,payload,occurred_at").eq("user_id",user.id).gt("cursor",since).order("cursor",{ascending:true}).limit(500);
 if(error)return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({changes:data??[],cursor:data?.at(-1)?.cursor??since});
}
export async function POST(request:NextRequest){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await request.json(); const events=Array.isArray(body.events)?body.events:[];
 if(events.length>0){const rows=events.slice(0,500).map((e:any)=>({event_key:e.event_key??e.eventKey,user_id:user.id,card_id:e.card_id??e.cardId,device_id:e.device_id??e.deviceId,client_sequence:e.client_sequence??e.clientSequence,reviewed_at:e.reviewed_at??e.reviewedAt,rating:e.rating,elapsed_ms:e.elapsed_ms??e.elapsedMs,previous_state:e.previous_state??e.previousState??{},next_state:e.next_state??e.nextState??{},metadata:e.metadata??{}}));
  const {error}=await supabase.from("review_events").upsert(rows,{onConflict:"event_key",ignoreDuplicates:true});if(error)return NextResponse.json({error:error.message},{status:400});
  for(const e of rows){const n=e.next_state as any;if(n?.due){await supabase.from("review_states").upsert({user_id:user.id,card_id:e.card_id,queue:n.state===2?"review":n.state===3?"relearning":"learning",state_data:n,due_at:new Date(n.due).toISOString(),last_reviewed_at:e.reviewed_at,reps:n.reps??0,lapses:n.lapses??0,stability:n.stability??null,difficulty:n.difficulty??null,scheduled_days:n.scheduled_days??0});}}
 }
 return NextResponse.json({accepted:events.length});
}