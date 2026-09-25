import {createClient} from "@/lib/supabase/server";

export async function GET(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return new Response("Unauthorized",{status:401});
  const {data:prefs}=await supabase.from("review_preferences").select("scheduler_profiles").eq("user_id",user.id).maybeSingle();
  const profiles=Array.isArray(prefs?.scheduler_profiles)?prefs.scheduler_profiles:[];
  return new Response(JSON.stringify({format:"shyraq-fsrs-profiles-v1",exportedAt:new Date().toISOString(),profiles},null,2),{
    headers:{
      "Content-Type":"application/json;charset=utf-8",
      "Content-Disposition":'attachment; filename="shyraq-fsrs-profiles.json"'
    }
  });
}
