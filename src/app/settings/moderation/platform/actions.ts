"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

async function requireModeratorAdmin(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data}=await supabase.from("moderators").select("role,enabled").eq("user_id",user.id).eq("enabled",true).maybeSingle();
 if(data?.role!=="admin")redirect("/settings/moderation/platform?error=Moderator+admin+access+required");
 return {supabase,user};
}
export async function upsertModerator(formData:FormData){
 const {supabase,user}=await requireModeratorAdmin();
 const userId=String(formData.get("user_id")||"").trim();
 const role=String(formData.get("role")||"moderator");
 if(!userId||!["moderator","admin"].includes(role))redirect("/settings/moderation/platform?error=Valid+user+id+and+role+required");
 await supabase.from("moderators").upsert({user_id:userId,role,enabled:true},{onConflict:"user_id"});
 revalidatePath("/settings/moderation/platform");redirect("/settings/moderation/platform");
}
export async function setModeratorEnabled(userId:string,enabled:boolean){
 const {supabase,user}=await requireModeratorAdmin();
 await supabase.from("moderators").update({enabled}).eq("user_id",userId);
 revalidatePath("/settings/moderation/platform");redirect("/settings/moderation/platform");
}
