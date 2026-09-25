"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export async function updateReportStatus(reportId:string,status:"reviewing"|"resolved"|"dismissed"|"escalated"):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:report}=await supabase.from("deck_reports").select("id,deck_id").eq("id",reportId).maybeSingle();
 if(!report)redirect("/settings/moderation?error=Report+not+found");
 const {data:deck}=await supabase.from("decks").select("owner_id").eq("id",report.deck_id).maybeSingle();
 if(!deck||deck.owner_id!==user.id)redirect("/settings/moderation?error=Not+allowed");
 const {error}=await supabase.from("deck_reports").update({status,resolved_at:status==="resolved"||status==="dismissed"?new Date().toISOString():null}).eq("id",reportId);
 if(error)redirect("/settings/moderation?error="+encodeURIComponent(error.message));
 await supabase.from("moderation_actions").insert({report_id:reportId,moderator_id:user.id,action:status,note:"Creator moderation status update"});
 revalidatePath("/settings/moderation");redirect("/settings/moderation");
}