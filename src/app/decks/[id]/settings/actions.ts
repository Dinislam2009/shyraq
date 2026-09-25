"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {canDeleteDeck} from "@/lib/workspace/permissions";
import {getEffectiveDeckRole} from "@/lib/workspace/deck-permissions";

async function requireAccess(id:string,write:boolean){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:deck}=await supabase.from("decks").select("id,name,owner_id,workspace_id,settings").eq("id",id).maybeSingle();if(!deck)redirect("/decks");
 const permission=await getEffectiveDeckRole(id);
 if(write&&permission.deckRole!=="editor")redirect("/decks/"+id+"?error=You+do+not+have+permission+to+edit+this+deck.");
 if(!write&&!canDeleteDeck(permission.workspaceRole as any))redirect("/decks/"+id+"?error=Only+an+owner+or+admin+can+perform+this+action.");
 return {supabase,user,deck,role:permission.workspaceRole};
}

export async function updateDeckSettings(id:string,formData:FormData){
 const {supabase,user,deck}=await requireAccess(id,true);
 const current=(deck.settings||{}) as Record<string,any>;
 const next={...current,
  category:String(formData.get("category")||"").trim().slice(0,60),
  subject:String(formData.get("subject")||"").trim().slice(0,80),
  language:String(formData.get("language")||"").trim().slice(0,20),
  difficulty:String(formData.get("difficulty")||"").trim().slice(0,30),
  color:String(formData.get("color")||"").trim().slice(0,20),
  icon:String(formData.get("icon")||"").trim().slice(0,8),
  coverUrl:String(formData.get("cover_url")||"").trim().slice(0,1000),
  archived:formData.get("archived")==="on"
 };
 const {error}=await supabase.from("decks").update({name:String(formData.get("name")||deck.name).trim().slice(0,120),description:String(formData.get("description")||"").trim().slice(0,2000),visibility:String(formData.get("visibility")||"private"),settings:next}).eq("id",id);
 if(error)redirect("/decks/"+id+"/settings?error="+encodeURIComponent(error.message));
 await supabase.from("activity_feed").insert({workspace_id:deck.workspace_id,actor_id:user.id,entity_type:"deck",entity_id:id,event_type:"deck.settings.updated",metadata:{name:String(formData.get("name")||deck.name).trim().slice(0,120)}});
 revalidatePath("/decks");revalidatePath("/decks/"+id);revalidatePath("/decks/"+id+"/settings");redirect("/decks/"+id+"/settings?saved=1");
}

export async function restoreDeck(id:string){
 const {supabase,deck}=await requireAccess(id,false);
 const {error}=await supabase.from("decks").update({deleted_at:null}).eq("id",id);
 if(error)redirect("/decks/trash?error="+encodeURIComponent(error.message));
 await supabase.from("activity_feed").insert({workspace_id:deck.workspace_id,actor_id:(await supabase.auth.getUser()).data.user?.id,event_type:"deck.restored",entity_type:"deck",entity_id:id,metadata:{}});
 revalidatePath("/decks");revalidatePath("/decks/trash");revalidatePath("/decks/"+id);redirect("/decks/trash?saved=restored");
}

export async function deleteDeck(id:string,formData:FormData){
 const confirm=String(formData.get("confirm")||"").trim();
 if(confirm!=="DELETE")redirect("/decks/"+id+"/settings?error=Type+DELETE+to+confirm+permanent+deletion.");
 const {supabase,deck}=await requireAccess(id,false);
 const {error}=await supabase.from("decks").update({deleted_at:new Date().toISOString()}).eq("id",id);
 if(error)redirect("/decks/"+id+"/settings?error="+encodeURIComponent(error.message));
 await supabase.from("activity_feed").insert({workspace_id:deck.workspace_id,actor_id:(await supabase.auth.getUser()).data.user?.id,event_type:"deck.trashed",entity_type:"deck",entity_id:id,metadata:{}});
 revalidatePath("/decks");revalidatePath("/decks/trash");redirect("/decks");
}
