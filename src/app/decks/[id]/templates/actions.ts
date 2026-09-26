"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fail(deckId:string,message:string):never{redirect("/decks/"+deckId+"/templates?error="+encodeURIComponent(message));}

async function requireTemplateEditor(supabase:any,userId:string,deckId:string){
 const {data:deck}=await supabase.from("decks").select("id,workspace_id").eq("id",deckId).maybeSingle();
 if(!deck)fail(deckId,"Deck not found.");
 const [{data:member},{data:override}]=await Promise.all([
  supabase.from("workspace_members").select("role").eq("workspace_id",deck.workspace_id).eq("user_id",userId).maybeSingle(),
  supabase.from("deck_members").select("role").eq("deck_id",deckId).eq("user_id",userId).maybeSingle()
 ]);
 if(!["owner","admin","editor"].includes(String(member?.role||""))&&String(override?.role||"")!=="editor")fail(deckId,"You do not have permission to edit this deck.");
 return deck;
}

export async function createTemplate(deckId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 await requireTemplateEditor(supabase,user.id,deckId);
 const name=String(formData.get("name")||"").trim().slice(0,80);if(!name)fail(deckId,"Template name is required.");
 const {error}=await supabase.from("card_templates").insert({deck_id:deckId,name,front_template:String(formData.get("front_template")||"{{front}}").slice(0,50000),back_template:String(formData.get("back_template")||"{{back}}").slice(0,50000),css:String(formData.get("css")||"").slice(0,50000)});
 if(error)fail(deckId,error.message);revalidatePath("/decks/"+deckId+"/templates");redirect("/decks/"+deckId+"/templates");
}

export async function updateTemplate(deckId:string,templateId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 await requireTemplateEditor(supabase,user.id,deckId);
 const {data:template}=await supabase.from("card_templates").select("id").eq("id",templateId).eq("deck_id",deckId).maybeSingle();if(!template)fail(deckId,"Template not found.");
 const {error}=await supabase.from("card_templates").update({name:String(formData.get("name")||"").trim().slice(0,80),front_template:String(formData.get("front_template")||"{{front}}").slice(0,50000),back_template:String(formData.get("back_template")||"{{back}}").slice(0,50000),css:String(formData.get("css")||"").slice(0,50000)}).eq("id",templateId).eq("deck_id",deckId);
 if(error)fail(deckId,error.message);revalidatePath("/decks/"+deckId+"/templates");redirect("/decks/"+deckId+"/templates");
}

export async function duplicateTemplate(deckId:string,templateId:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 await requireTemplateEditor(supabase,user.id,deckId);
 const {data:source}=await supabase.from("card_templates").select("name,front_template,back_template,css,field_schema").eq("id",templateId).eq("deck_id",deckId).maybeSingle();
 if(!source)fail(deckId,"Template not found.");
 const {error}=await supabase.from("card_templates").insert({deck_id:deckId,name:String(source.name||"Template").slice(0,70)+" Copy",front_template:source.front_template,back_template:source.back_template,css:source.css||"",field_schema:Array.isArray(source.field_schema)?source.field_schema:[]});
 if(error)fail(deckId,error.message);revalidatePath("/decks/"+deckId+"/templates");redirect("/decks/"+deckId+"/templates");
}

export async function importTemplates(deckId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 await requireTemplateEditor(supabase,user.id,deckId);
 const file=formData.get("file");if(!(file instanceof File))fail(deckId,"Choose a JSON template file.");
 if(file.size>2*1024*1024)fail(deckId,"Template file is too large.");
 let parsed:any;try{parsed=JSON.parse(await file.text());}catch{fail(deckId,"Invalid template JSON.");}
 const items=Array.isArray(parsed)?parsed:Array.isArray(parsed.templates)?parsed.templates:[parsed];
 const rows=items.slice(0,100).map((item:any)=>({deck_id:deckId,name:String(item.name||"Imported template").slice(0,80),front_template:String(item.front_template||"{{front}}").slice(0,50000),back_template:String(item.back_template||"{{back}}").slice(0,50000),css:String(item.css||"").slice(0,50000),field_schema:Array.isArray(item.field_schema)?item.field_schema:[]}));
 if(!rows.length)fail(deckId,"No templates found.");
 const {error}=await supabase.from("card_templates").insert(rows);if(error)fail(deckId,error.message);
 revalidatePath("/decks/"+deckId+"/templates");redirect("/decks/"+deckId+"/templates?imported="+rows.length);
}

export async function deleteTemplate(deckId:string,templateId:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 await requireTemplateEditor(supabase,user.id,deckId);
 const {error}=await supabase.from("card_templates").delete().eq("id",templateId).eq("deck_id",deckId);if(error)fail(deckId,error.message);
 revalidatePath("/decks/"+deckId+"/templates");redirect("/decks/"+deckId+"/templates");
}