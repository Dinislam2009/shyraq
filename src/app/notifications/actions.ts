"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export async function markNotificationRead(id:string){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return;
 const {error}=await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);
 if(error)redirect("/notifications?error="+encodeURIComponent(error.message));
 revalidatePath("/notifications");
}
export async function markAllNotificationsRead(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return;
 const {error}=await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("user_id",user.id).is("read_at",null);
 if(error)redirect("/notifications?error="+encodeURIComponent(error.message));
 revalidatePath("/notifications");
}
export async function saveNotificationPreferences(formData:FormData){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const fields=["sync_conflicts","author_updates","workspace_invites","collaboration","moderation","backup","offline_state","in_app"] as const;
 const patch:any={user_id:user.id};
 for(const field of fields)patch[field]=formData.get(field)==="on";
 const {error}=await supabase.from("notification_preferences").upsert(patch,{onConflict:"user_id"});
 if(error)redirect("/notifications?error="+encodeURIComponent(error.message));
 revalidatePath("/notifications");redirect("/notifications?saved=1");
}
