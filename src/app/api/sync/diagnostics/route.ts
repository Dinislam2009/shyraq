import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const [{data:devices},{data:events},{data:changes},{data:conflicts}]=await Promise.all([
  supabase.from("review_devices").select("id,name,last_seen_at,created_at").eq("user_id",user.id).order("last_seen_at",{ascending:false}).limit(50),
  supabase.from("review_events").select("event_key,card_id,device_id,client_sequence,reviewed_at,rating,elapsed_ms,metadata").eq("user_id",user.id).order("reviewed_at",{ascending:false}).limit(500),
  supabase.from("sync_changes").select("cursor,event_key,entity_type,entity_id,operation,occurred_at").eq("user_id",user.id).order("cursor",{ascending:false}).limit(500),
  supabase.from("sync_conflicts").select("id,card_id,event_key,detected_at,resolution,resolved_at").eq("user_id",user.id).order("detected_at",{ascending:false}).limit(100)
 ]);
 const payload={exportedAt:new Date().toISOString(),userId:user.id,devices:devices??[],recentReviewEvents:events??[],recentSyncChanges:changes??[],conflicts:conflicts??[]};
 return new NextResponse(JSON.stringify(payload,null,2),{headers:{
  "Content-Type":"application/json; charset=utf-8",
  "Content-Disposition":"attachment; filename=\"shyraq-sync-diagnostics.json\""
 }});
}