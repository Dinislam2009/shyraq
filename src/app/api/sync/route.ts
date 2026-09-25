import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET(request:NextRequest){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const since=Number(request.nextUrl.searchParams.get("since")||0);
 const {data,error}=await supabase.from("sync_changes").select("cursor,event_key,entity_type,entity_id,operation,payload,occurred_at").eq("user_id",user.id).gt("cursor",since).order("cursor",{ascending:true}).limit(500);
 if(error)return NextResponse.json({error:error.message},{status:500});
 const {data:conflicts}=await supabase.from("sync_conflicts").select("id,card_id,event_key,detected_at,resolution,resolved_at,incoming_state,current_state,incoming_reviewed_at,current_reviewed_at").eq("user_id",user.id).is("resolved_at",null).order("detected_at",{ascending:false}).limit(100);
 return NextResponse.json({changes:data??[],cursor:data?.at(-1)?.cursor??since,conflicts:conflicts??[]});
}

export async function POST(request:NextRequest){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await request.json();
 const events=Array.isArray(body.events)?body.events:[];
 const batch=events.slice(0,500);
 const conflicts:string[]=[];

 if(batch.length>0){
  const rows=batch.map((e:any)=>({
    event_key:e.event_key??e.eventKey??crypto.randomUUID(),
    user_id:user.id,
    card_id:e.card_id??e.cardId,
    device_id:e.device_id??e.deviceId,
    client_sequence:e.client_sequence??e.clientSequence,
    reviewed_at:e.reviewed_at??e.reviewedAt,
    rating:e.rating,
    elapsed_ms:e.elapsed_ms??e.elapsedMs,
    previous_state:e.previous_state??e.previousState??{},
    next_state:e.next_state??e.nextState??{},
    metadata:e.metadata??{}
  }));

  const eventKeys=rows.map((row:any)=>row.event_key);
  const {data:existingEvents}=await supabase.from("review_events").select("event_key").eq("user_id",user.id).in("event_key",eventKeys);
  const existingKeys=new Set((existingEvents??[]).map((row:any)=>row.event_key));
  const newRows=rows.filter((row:any)=>!existingKeys.has(row.event_key));
  const {error:eventError}=await supabase.from("review_events").upsert(newRows,{onConflict:"event_key",ignoreDuplicates:true});
  if(eventError)return NextResponse.json({error:eventError.message},{status:400});

  for(const e of newRows){
   const incoming=e.next_state as any;
   if(!incoming?.due)continue;

   const {data:existing}=await supabase.from("review_states").select("state_data,last_reviewed_at").eq("user_id",user.id).eq("card_id",e.card_id).maybeSingle();
   const currentReviewedAt=existing?.last_reviewed_at?new Date(existing.last_reviewed_at).getTime():0;
   const incomingReviewedAt=new Date(e.reviewed_at).getTime();

   if(currentReviewedAt>incomingReviewedAt){
     await supabase.from("sync_conflicts").insert({
       user_id:user.id,
       card_id:e.card_id,
       event_key:e.event_key,
       incoming_state:incoming,
       current_state:existing?.state_data??{},
       incoming_reviewed_at:e.reviewed_at,
       current_reviewed_at:existing?.last_reviewed_at??null
     });
     conflicts.push(e.event_key);
     continue;
   }

   await supabase.from("review_states").upsert({
     user_id:user.id,
     card_id:e.card_id,
     queue:incoming.state===2?"review":incoming.state===3?"relearning":"learning",
     state_data:incoming,
     due_at:new Date(incoming.due).toISOString(),
     last_reviewed_at:e.reviewed_at,
     reps:incoming.reps??0,
     lapses:incoming.lapses??0,
     stability:incoming.stability??null,
     difficulty:incoming.difficulty??null,
     scheduled_days:incoming.scheduled_days??0
   });
  }
 }

 return NextResponse.json({accepted:Math.max(0,newRows.length-conflicts.length),conflicts});
}