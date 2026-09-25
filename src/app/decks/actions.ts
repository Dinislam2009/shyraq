"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fail(path:string,message:string):never{redirect(path+"?error="+encodeURIComponent(message));}

export async function createDeck(formData:FormData):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const name=String(formData.get("name")||"").trim();
 const description=String(formData.get("description")||"").trim();
 const settings={category:String(formData.get("category")||"").trim().slice(0,60),subject:String(formData.get("subject")||"").trim().slice(0,80),language:String(formData.get("language")||"").trim().slice(0,20),difficulty:String(formData.get("difficulty")||"").trim().slice(0,30)};
 if(!name)fail("/decks/new","Deck name is required.");
 const requestedWorkspace=String(formData.get("workspace_id")||"").trim();
 const {data:workspace}=requestedWorkspace
  ? await supabase.from("workspaces").select("id").eq("id",requestedWorkspace).maybeSingle()
  : await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 if(!workspace)fail("/decks/new","Workspace not found.");
 const {data,error}=await supabase.from("decks").insert({workspace_id:workspace.id,owner_id:user.id,name,description,settings}).select("id").single();
 if(error||!data)fail("/decks/new",error?.message||"Unable to create deck.");
 const {error:templateError}=await supabase.from("card_templates").insert({
   deck_id:data.id,
   name:"Basic",
   front_template:"{{front}}",
   back_template:"{{back}}",
   css:"",
   field_schema:[{name:"front",type:"text"},{name:"back",type:"text"}]
 });
 if(templateError)fail("/decks/new",templateError.message);
 revalidatePath("/dashboard");revalidatePath("/decks");redirect("/decks/"+data.id);
}
export async function updateDeck(id:string,formData:FormData):Promise<void>{
 const supabase=await createClient();
 const metadata={category:String(formData.get("category")||"").trim().slice(0,60),subject:String(formData.get("subject")||"").trim().slice(0,80),language:String(formData.get("language")||"").trim().slice(0,20),difficulty:String(formData.get("difficulty")||"").trim().slice(0,30)};
 const {data:existing}=await supabase.from("decks").select("settings").eq("id",id).maybeSingle();
 const settings={...(existing?.settings||{}),...metadata};
 const {error}=await supabase.from("decks").update({name:String(formData.get("name")||"").trim(),description:String(formData.get("description")||"").trim(),visibility:String(formData.get("visibility")||"private"),settings}).eq("id",id);
 if(error)fail("/decks/"+id,error.message);
 revalidatePath("/decks");revalidatePath("/decks/"+id);redirect("/decks/"+id);
}
export async function deleteDeck(id:string):Promise<void>{
 const supabase=await createClient();const {error}=await supabase.from("decks").delete().eq("id",id);
 if(error)fail("/decks/"+id,error.message);
 revalidatePath("/dashboard");revalidatePath("/decks");redirect("/decks");
}

export async function reorderDecks(workspaceId:string,deckIds:string[]):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",workspaceId).eq("user_id",user.id).maybeSingle();
 if(!member||!["owner","admin","editor"].includes(String(member.role)))fail("/decks","You do not have permission to reorder decks.");
 const {data:decks}=await supabase.from("decks").select("id").eq("workspace_id",workspaceId).is("deleted_at",null).in("id",deckIds);
 const valid=new Set((decks??[]).map((deck:any)=>String(deck.id)));
 const ordered=deckIds.filter(id=>valid.has(id));
 for(let index=0;index<ordered.length;index++)await supabase.from("decks").update({sort_order:index}).eq("id",ordered[index]).eq("workspace_id",workspaceId);
 revalidatePath("/decks");revalidatePath("/dashboard");
}
