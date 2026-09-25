"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export async function saveSearch(formData:FormData){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const name=String(formData.get("name")||"").trim().slice(0,80);const query=String(formData.get("query")||"").trim();
 if(!name||!query)redirect("/search?q="+encodeURIComponent(query)+"&error=Search+name+and+query+are+required.");
 let filters:any={};try{filters=JSON.parse(String(formData.get("filters")||"{}"));}catch{}
 const {error}=await supabase.from("saved_searches").insert({user_id:user.id,name,query,filters});
 if(error)redirect("/search?q="+encodeURIComponent(query)+"&error="+encodeURIComponent(error.message));
 revalidatePath("/search");redirect("/search?q="+encodeURIComponent(query)+"&saved=1");
}
export async function deleteSearch(id:string){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 await supabase.from("saved_searches").delete().eq("id",id).eq("user_id",user.id);
 revalidatePath("/search");redirect("/search");
}
