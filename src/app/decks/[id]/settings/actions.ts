"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

async function requireAccess(id:string,write:boolean){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:deck}=await supabase.from("decks").select("id,name,owner_id,workspace_id,settings").eq("id",id).maybeSingle();if(!deck)redirect("/decks");
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",deck.workspace_id).eq("user_id",user.id).maybeSingle();
 const role=String(member?.role||"");
 if(write&&!["owner","admin","editor"].includes(role))redirect("/decks/"+id+"?error=You+do+not+have+permission+to+edit+this+deck.");
 if(!write&&!["owner","admin"].includes(role))redirect("/decks/"+id+"?error=Only+an+owner+or+admin+can+perform+this+action.");
 return {supabase,user,deck,role};
}

export async function updateDeckSettings(id:string,formData:FormData){
 const {supabase,deck}=await requireAccess(id,true);
 const current=(deck.settings||{}) as Record<string,any>;
 const next={...current,
  category:String(formData.get("category")||"").trim().slice(0,60),
  subject:String(formData.get("subject")||"").trim().slice(0,80),
  language:String(formData.get("language")||"").trim().slice(0,20),
  difficulty:String(formData.get("difficulty")||"").trim().slice(0,30),
  color:String(formData.get("color")||"").trim().slice(0,20),
  icon:String(formData.get("icon")||"").trim().slice(0,8),
  archived:formData.get("archived")==="on"
 };
 const {error}=await supabase.from("decks").update({name:String(formData.get("name")||deck.name).trim().slice(0,120),description:String(formData.get("description")||"").trim().slice(0,2000),visibility:String(formData.get("visibility")||"private"),settings:next}).eq("id",id);
 if(error)redirect("/decks/"+id+"/settings?error="+encodeURIComponent(error.message));
 revalidatePath("/decks");revalidatePath("/decks/"+id);revalidatePath("/decks/"+id+"/settings");redirect("/decks/"+id+"/settings?saved=1");
}

export async function deleteDeck(id:string,formData:FormData){
 const confirm=String(formData.get("confirm")||"").trim();
 if(confirm!=="DELETE")redirect("/decks/"+id+"/settings?error=Type+DELETE+to+confirm+permanent+deletion.");
 const {supabase}=await requireAccess(id,false);
 const {error}=await supabase.from("decks").delete().eq("id",id);
 if(error)redirect("/decks/"+id+"/settings?error="+encodeURIComponent(error.message));
 revalidatePath("/decks");redirect("/decks");
}
