"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function payload(formData:FormData){return {kind:String(formData.get("kind")||"basic"),content:{front:String(formData.get("front")||""),back:String(formData.get("back")||"")}};}
export async function createCard(deckId:string,formData:FormData){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return {error:"You must be signed in."};
 const p=payload(formData); const {data:last}=await supabase.from("cards").select("sort_order").eq("deck_id",deckId).order("sort_order",{ascending:false}).limit(1).maybeSingle();
 const {error}=await supabase.from("cards").insert({deck_id:deckId,owner_id:user.id,kind:p.kind,content:p.content,sort_order:(last?.sort_order??-1)+1});
 if(error)return {error:error.message}; revalidatePath("/decks/"+deckId); return {ok:true};
}
export async function updateCard(deckId:string,cardId:string,formData:FormData){
 const supabase=await createClient(); const {error}=await supabase.from("cards").update(payload(formData)).eq("id",cardId); if(error)return {error:error.message}; revalidatePath("/decks/"+deckId); return {ok:true};
}
export async function deleteCard(deckId:string,cardId:string){
 const supabase=await createClient(); const {error}=await supabase.from("cards").delete().eq("id",cardId); if(error)return {error:error.message}; revalidatePath("/decks/"+deckId); return {ok:true};
}