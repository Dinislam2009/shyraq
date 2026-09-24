"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fail(path:string,message:string):never{redirect(path+"?error="+encodeURIComponent(message));}
async function personalWorkspace(supabase:any,userId:string){const {data}=await supabase.from("workspaces").select("id").eq("owner_id",userId).eq("kind","personal").limit(1).maybeSingle();return data;}
async function favoritesCollection(supabase:any,userId:string,workspaceId:string){
 const {data:existing}=await supabase.from("collections").select("id").eq("owner_id",userId).eq("workspace_id",workspaceId).eq("kind","favorites").limit(1).maybeSingle();
 if(existing)return existing;
 const {data,error}=await supabase.from("collections").insert({workspace_id:workspaceId,owner_id:userId,name:"Favorites",kind:"favorites"}).select("id").single();
 if(error||!data)throw new Error(error?.message||"Unable to create Favorites.");
 return data;
}
export async function toggleFavorite(cardId:string,deckId:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const workspace=await personalWorkspace(supabase,user.id);if(!workspace)fail("/decks/"+deckId,"Personal workspace not found.");
 try{
  const collection=await favoritesCollection(supabase,user.id,workspace.id);
  const {data:existing}=await supabase.from("collection_cards").select("collection_id").eq("collection_id",collection.id).eq("card_id",cardId).maybeSingle();
  if(existing)await supabase.from("collection_cards").delete().eq("collection_id",collection.id).eq("card_id",cardId);
  else await supabase.from("collection_cards").insert({collection_id:collection.id,card_id:cardId});
 }catch(error){fail("/decks/"+deckId,error instanceof Error?error.message:"Unable to update favorite.");}
 revalidatePath("/decks/"+deckId);revalidatePath("/collections");redirect("/decks/"+deckId);
}
export async function createCollection(formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const workspace=await personalWorkspace(supabase,user.id);if(!workspace)fail("/collections","Personal workspace not found.");
 const name=String(formData.get("name")||"").trim().slice(0,80);if(!name)fail("/collections","Collection name is required.");
 const {error}=await supabase.from("collections").insert({workspace_id:workspace.id,owner_id:user.id,name,kind:"custom"});if(error)fail("/collections",error.message);
 revalidatePath("/collections");redirect("/collections");
}