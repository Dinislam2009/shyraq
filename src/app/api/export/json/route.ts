import {createClient} from "@/lib/supabase/server";
import {buildJsonBackup} from "@/lib/backup/json";

export async function GET(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return new Response("Unauthorized",{status:401});
 const payload=await buildJsonBackup(supabase,user);
 return new Response(JSON.stringify(payload,null,2),{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":'attachment; filename="shyraq-backup.json"'}});
}
