"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function payload(formData:FormData){
 return {
  kind:String(formData.get("kind")||"basic"),
  content:{front:String(formData.get("front")||""),back:String(formData.get("back")||"")}
 };
}
function tagsFromForm(formData:FormData){
 return String(formData.get("tags")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,30);
}
async function applyTags(supabase:any,cardId:string,workspaceId:string,names:string[]){
 if(!names.length){await supabase.from("card_tags").delete().eq("card_id",cardId);return;}
 const {data:tags,error:tagError}=await supabase.from("tags").upsert(names.map(name=>({workspace_id:workspaceId,name})),{onConflict:"workspace_id,name"}).select("id");
 if(tagError)throw new Error(tagError.message);
 await supabase.from("card_tags").delete().eq("card_id",cardId);
 if(tags?.length)await supabase.from("card_tags").insert(tags.map((tag:any)=>({card_id:cardId,tag_id:tag.id})));
}
export async function createCard(deckId:string,formData:FormData){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return {error:"You must be signed in."};
 const {data:deck}=await supabase.from("decks").select("workspace_id").eq("id",deckId).maybeSingle();
 if(!deck)return {error:"Deck not found."};
 const p=payload(formData);
 const {data:last}=await supabase.from("cards").select("sort_order").eq("deck_id",deckId).order("sort_order",{ascending:false}).limit(1).maybeSingle();
 const {data:card,error}=await supabase.from("cards").insert({deck_id:deckId,owner_id:user.id,kind:p.kind,content:p.content,sort_order:(last?.sort_order??-1)+1}).select("id").single();
 if(error)return {error:error.message};
 try{await applyTags(supabase,card.id,deck.workspace_id,tagsFromForm(formData));}catch(error){return {error:error instanceof Error?error.message:"Unable to save tags."};}
 revalidatePath("/decks/"+deckId); return {ok:true};
}
export async function updateCard(deckId:string,cardId:string,formData:FormData){
 const supabase=await createClient();
 const {error}=await supabase.from("cards").update(payload(formData)).eq("id",cardId);
 if(error)return {error:error.message};
 const {data:deck}=await supabase.from("decks").select("workspace_id").eq("id",deckId).maybeSingle();
 if(deck){try{await applyTags(supabase,cardId,deck.workspace_id,tagsFromForm(formData));}catch(error){return {error:error instanceof Error?error.message:"Unable to save tags."};}}
 revalidatePath("/decks/"+deckId); return {ok:true};
}
export async function deleteCard(deckId:string,cardId:string){
 const supabase=await createClient();const {error}=await supabase.from("cards").delete().eq("id",cardId);
 if(error)return {error:error.message};revalidatePath("/decks/"+deckId);return {ok:true};
}