import {createClient} from "@/lib/supabase/server";
export async function createNotification(input:{userId:string;kind:"sync_conflict"|"deck_update"|"workspace_invite"|"collaboration"|"moderation"|"backup"|"system";title:string;body?:string;href?:string|null}){
 const supabase:any=await createClient();
 return supabase.from("notifications").insert({user_id:input.userId,kind:input.kind,title:input.title,body:input.body??"",href:input.href??null});
}
