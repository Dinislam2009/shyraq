"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export async function saveHistoryFilter(formData:FormData){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const name=String(formData.get("name")||"").trim().slice(0,80);if(!name)redirect("/history?error=Filter+name+is+required.");
 let query:any={};try{query=JSON.parse(String(formData.get("query")||"{}"));}catch{}
 const {error}=await supabase.from("saved_filters").insert({user_id:user.id,name,kind:"review_history",query});
 if(error)redirect("/history?error="+encodeURIComponent(error.message));
 revalidatePath("/history");redirect("/history?saved=1");
}
export async function deleteSavedFilter(id:string){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 await supabase.from("saved_filters").delete().eq("id",id).eq("user_id",user.id);
 revalidatePath("/history");redirect("/history");
}
