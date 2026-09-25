import {createClient} from "@/lib/supabase/server";
import {getReviewStats} from "@/lib/supabase/queries";

export async function GET(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return new Response("Unauthorized",{status:401});
 const stats=await getReviewStats();
 return new Response(JSON.stringify({format:"shyraq-analytics-v1",exportedAt:new Date().toISOString(),userId:user.id,stats},null,2),{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":'attachment; filename="shyraq-analytics.json"'}});
}
