"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fail(path:string,message:string):never{redirect(path+"?error="+encodeURIComponent(message));}
export async function followDeck(deckId:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next="+encodeURIComponent("/explore/"+deckId));
 const {error}=await supabase.from("public_deck_follows").upsert({user_id:user.id,deck_id:deckId});if(error)fail("/explore/"+deckId,error.message);
 revalidatePath("/explore/"+deckId);redirect("/explore/"+deckId);
}
export async function copyDeck(deckId:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next="+encodeURIComponent("/explore/"+deckId));
 const {data:source}=await supabase.from("decks").select("name,description,settings,cards(*)").eq("id",deckId).eq("visibility","public").maybeSingle();if(!source)fail("/explore/"+deckId,"Public deck not found.");
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();if(!workspace)fail("/explore/"+deckId,"Personal workspace not found.");
 const {data:deck,error}=await supabase.from("decks").insert({workspace_id:workspace.id,owner_id:user.id,name:source.name+" (copy)",description:source.description,visibility:"private",settings:source.settings}).select("id").single();if(error||!deck)fail("/explore/"+deckId,error?.message||"Unable to copy deck.");
 const rows=(source.cards??[]).map((c:any)=>({deck_id:deck.id,owner_id:user.id,kind:c.kind,content:c.content,sort_order:c.sort_order,is_suspended:false,is_marked:false}));
 if(rows.length){const {error:cardsError}=await supabase.from("cards").insert(rows);if(cardsError)fail("/explore/"+deckId,cardsError.message);}
 await supabase.from("deck_copies").insert({user_id:user.id,source_deck_id:deckId,copied_deck_id:deck.id});
 revalidatePath("/decks");redirect("/decks/"+deck.id);
}