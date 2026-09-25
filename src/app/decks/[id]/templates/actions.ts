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
export async function duplicateTemplate(deckId:string,templateId:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:source}=await supabase.from("card_templates").select("name,front_template,back_template,css,field_schema").eq("id",templateId).maybeSingle();
 if(!source)fail(deckId,"Template not found.");
 const {error}=await supabase.from("card_templates").insert({deck_id:deckId,name:String(source.name||"Template")+" Copy",front_template:source.front_template,back_template:source.back_template,css:source.css||"",field_schema:Array.isArray(source.field_schema)?source.field_schema:[]});
 if(error)fail(deckId,error.message);revalidatePath("/decks/"+deckId+"/templates");redirect("/decks/"+deckId+"/templates");
}

export async function importTemplates(deckId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const file=formData.get("file");if(!(file instanceof File))fail(deckId,"Choose a JSON template file.");
 let parsed:any;
 try{parsed=JSON.parse(await file.text());}catch{fail(deckId,"Invalid template JSON.");}
 const items=Array.isArray(parsed)?parsed:Array.isArray(parsed.templates)?parsed.templates:[parsed];
 const rows=items.slice(0,100).map((item:any)=>({deck_id:deckId,name:String(item.name||"Imported template").slice(0,80),front_template:String(item.front_template||"{{front}}"),back_template:String(item.back_template||"{{back}}"),css:String(item.css||""),field_schema:Array.isArray(item.field_schema)?item.field_schema:[]}));
 if(!rows.length)fail(deckId,"No templates found.");
 const {error}=await supabase.from("card_templates").insert(rows);if(error)fail(deckId,error.message);
 revalidatePath("/decks/"+deckId+"/templates");redirect("/decks/"+deckId+"/templates?imported="+rows.length);
}

export async function deleteTemplate(deckId:string,templateId:string):Promise<void>{
 const supabase=await createClient();const {error}=await supabase.from("card_templates").delete().eq("id",templateId);if(error)fail(deckId,error.message);revalidatePath("/decks/"+deckId+"/templates");redirect("/decks/"+deckId+"/templates");
}