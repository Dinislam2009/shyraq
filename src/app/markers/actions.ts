"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export async function renameMarker(oldName:string,formData:FormData){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const next=String(formData.get("name")||"").trim().slice(0,60);if(!next)redirect("/markers?error=Marker+name+is+required.");
 const {data:cards}=await supabase.from("cards").select("id,content").eq("owner_id",user.id).limit(50000);
 for(const card of cards??[]){
  const markers=Array.isArray(card.content?.markers)?card.content.markers.map((x:any)=>String(x)):[];if(!markers.includes(oldName))continue;
  const updated=[...new Set(markers.map((marker:string)=>marker===oldName?next:marker))];
  await supabase.from("cards").update({content:{...(card.content||{}),markers:updated}}).eq("id",card.id);
 }
 revalidatePath("/markers");revalidatePath("/decks");redirect("/markers");
}
export async function deleteMarker(name:string){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:cards}=await supabase.from("cards").select("id,content").eq("owner_id",user.id).limit(50000);
 for(const card of cards??[]){
  const markers=Array.isArray(card.content?.markers)?card.content.markers.map((x:any)=>String(x)):[];if(!markers.includes(name))continue;
  await supabase.from("cards").update({content:{...(card.content||{}),markers:markers.filter((marker:string)=>marker!==name)}}).eq("id",card.id);
 }
 revalidatePath("/markers");revalidatePath("/decks");redirect("/markers");
}
