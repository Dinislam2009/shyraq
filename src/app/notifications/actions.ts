"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
export async function markNotificationRead(id:string){const supabase:any=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return;await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);revalidatePath("/notifications");}
export async function markAllNotificationsRead(){const supabase:any=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return;await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("user_id",user.id).is("read_at",null);revalidatePath("/notifications");}
