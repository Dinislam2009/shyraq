"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function followDeck(deckId:string){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return {error:"Authentication required."};
 const {error}=await supabase.from("public_deck_follows").upsert({user_id:user.id,deck_id:deckId});if(error)return {error:error.message};revalidatePath("/explore/"+deckId);return {ok:true};
}
export async function copyDeck(deckId:string){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return {error:"Authentication required."};
 const {data:source}=await supabase.from("decks").select("name,description,settings,cards(*)").eq("id",deckId).eq("visibility","public").maybeSingle();if(!source)return {error:"Public deck not found."};
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();if(!workspace)return {error:"Personal workspace not found."};
 const {data:deck,error}=await supabase.from("decks").insert({workspace_id:workspace.id,owner_id:user.id,name:source.name+" (copy)",description:source.description,visibility:"private",settings:source.settings}).select("id").single();if(error)return {error:error.message};
 const rows=(source.cards??[]).map((c:any)=>({deck_id:deck.id,owner_id:user.id,kind:c.kind,content:c.content,sort_order:c.sort_order,is_suspended:false,is_marked:false}));
 if(rows.length){const {error:cardsError}=await supabase.from("cards").insert(rows);if(cardsError)return {error:cardsError.message};}
 await supabase.from("deck_copies").insert({user_id:user.id,source_deck_id:deckId,copied_deck_id:deck.id});
 revalidatePath("/decks");return {ok:true,deckId:deck.id};
}