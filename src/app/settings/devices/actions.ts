"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
export async function renameReviewDevice(id:string,formData:FormData){const supabase:any=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return;const name=String(formData.get("name")||"Device").trim().slice(0,60)||"Device";await supabase.from("review_devices").update({name,last_seen_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);revalidatePath("/settings/devices");}
export async function revokeReviewDevice(id:string){const supabase:any=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return;await supabase.from("review_devices").delete().eq("id",id).eq("user_id",user.id);revalidatePath("/settings/devices");}
