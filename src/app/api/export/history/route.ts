import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET(request:NextRequest){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return new Response("Unauthorized",{status:401});
 const params=request.nextUrl.searchParams;
 let query=supabase.from("review_events").select("id,event_key,card_id,reviewed_at,rating,elapsed_ms,device_id,client_sequence,metadata,previous_state,next_state").eq("user_id",user.id).order("reviewed_at",{ascending:true}).limit(10000);
 if(["again","hard","good","easy"].includes(String(params.get("rating")||"")))query=query.eq("rating",String(params.get("rating")));
 if(params.get("deck"))query=query.eq("cards.deck_id",String(params.get("deck")));
 if(params.get("card"))query=query.eq("card_id",String(params.get("card")));
 if(params.get("event"))query=query.eq("metadata->>event_kind",String(params.get("event")));
 const from=params.get("from"),to=params.get("to");
 if(from&&/^\d{4}-\d{2}-\d{2}$/.test(from))query=query.gte("reviewed_at",new Date(from).toISOString());
 if(to&&/^\d{4}-\d{2}-\d{2}$/.test(to))query=query.lt("reviewed_at",new Date(new Date(to).getTime()+86400000).toISOString());
 const {data,error}=await query;
 if(error)return NextResponse.json({error:error.message},{status:500});
 return new Response(JSON.stringify({format:"shyraq-review-history-v1",exportedAt:new Date().toISOString(),userId:user.id,eventCount:(data??[]).length,events:data??[]},null,2),{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":'attachment; filename="shyraq-review-history.json"'}});
}
