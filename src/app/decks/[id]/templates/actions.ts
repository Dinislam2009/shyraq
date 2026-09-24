"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
function fail(deckId:string,message:string):never{redirect("/decks/"+deckId+"/templates?error="+encodeURIComponent(message));}
export async function createTemplate(deckId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:deck}=await supabase.from("decks").select("id").eq("id",deckId).maybeSingle();if(!deck)fail(deckId,"Deck not found.");
 const name=String(formData.get("name")||"").trim().slice(0,80);if(!name)fail(deckId,"Template name is required.");
 const {error}=await supabase.from("card_templates").insert({deck_id:deckId,name,front_template:String(formData.get("front_template")||"{{front}}"),back_template:String(formData.get("back_template")||"{{back}}"),css:String(formData.get("css")||"")});
 if(error)fail(deckId,error.message);revalidatePath("/decks/"+deckId+"/templates");redirect("/decks/"+deckId+"/templates");
}
export async function updateTemplate(deckId:string,templateId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {error}=await supabase.from("card_templates").update({name:String(formData.get("name")||"").trim(),front_template:String(formData.get("front_template")||"{{front}}"),back_template:String(formData.get("back_template")||"{{back}}"),css:String(formData.get("css")||"")}).eq("id",templateId);
 if(error)fail(deckId,error.message);revalidatePath("/decks/"+deckId+"/templates");redirect("/decks/"+deckId+"/templates");
}
export async function deleteTemplate(deckId:string,templateId:string):Promise<void>{
 const supabase=await createClient();const {error}=await supabase.from("card_templates").delete().eq("id",templateId);if(error)fail(deckId,error.message);revalidatePath("/decks/"+deckId+"/templates");redirect("/decks/"+deckId+"/templates");
}