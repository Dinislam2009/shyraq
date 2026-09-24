import { createClient } from "@/lib/supabase/server";
export async function GET(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 if(!user)return new Response("Unauthorized",{status:401});
 const {data:workspace}=await supabase.from("workspaces").select("*").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 const {data:decks}=await supabase.from("decks").select("*,cards(*),card_templates(*)").eq("owner_id",user.id);
 const {data:events}=await supabase.from("review_events").select("*").eq("user_id",user.id).order("reviewed_at",{ascending:true});
 const payload={format:"shyraq-json-v1",exportedAt:new Date().toISOString(),workspace,decks:decks??[],reviewEvents:events??[]};
 return new Response(JSON.stringify(payload,null,2),{headers:{"Content-Type":"application/json","Content-Disposition":'attachment; filename="shyraq-export.json"'}});
}