import {createClient} from "@/lib/supabase/server";
type NotificationKind="sync_conflict"|"deck_update"|"workspace_invite"|"collaboration"|"moderation"|"backup"|"system"|"comment_mention";
export async function createNotification(input:{userId:string;kind:NotificationKind;title:string;body?:string;href?:string|null;sourceCommentId?:string|null}){
 const supabase:any=await createClient();
 return supabase.rpc("create_notification",{
  target_user:input.userId,
  notification_kind:input.kind,
  notification_title:input.title,
  notification_body:input.body??"",
  notification_href:input.href??null,
  source_comment_id:input.sourceCommentId??null
 });
}
