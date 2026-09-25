"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {resolveDeckRole} from "@/lib/workspace/permissions";

function fail(path:string,message:string):never{redirect(path+"?error="+encodeURIComponent(message));}
async function personalWorkspace(supabase:any,userId:string){const {data}=await supabase.from("workspaces").select("id").eq("owner_id",userId).eq("kind","personal").limit(1).maybeSingle();return data;}
async function collectionForUser(supabase:any,userId:string,id:string){
 const {data}=await supabase.from("collections").select("id,name,kind,workspace_id,owner_id,is_public").eq("id",id).maybeSingle();
 if(!data)return null;
 const [{data:member},{data:override}]=await Promise.all([
  supabase.from("workspace_members").select("role").eq("workspace_id",data.workspace_id).eq("user_id",userId).maybeSingle(),
  supabase.from("collection_members").select("role").eq("collection_id",id).eq("user_id",userId).maybeSingle()
 ]);
 const effective=resolveDeckRole(String(member?.role||"") as any,String(override?.role||"") as any);
 return ["owner","admin","editor"].includes(String(member?.role||"")) || effective==="editor"?data:null;
}
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
 const {data:card}=await supabase.from("cards").select("id").eq("id",cardId).maybeSingle();if(!card)fail("/decks/"+deckId,"Card not found.");
 try{
  const collection=await favoritesCollection(supabase,user.id,workspace.id);
  const {data:existing}=await supabase.from("collection_cards").select("collection_id").eq("collection_id",collection.id).eq("card_id",cardId).maybeSingle();
  if(existing)await supabase.from("collection_cards").delete().eq("collection_id",collection.id).eq("card_id",cardId);
  else await supabase.from("collection_cards").insert({collection_id:collection.id,card_id:cardId});
 }catch(error){fail("/decks/"+deckId,error instanceof Error?error.message:"Unable to update favorite.");}
 revalidatePath("/decks/"+deckId);revalidatePath("/collections");redirect("/decks/"+deckId);
}
export async function createSmartCollection(formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const workspace=await personalWorkspace(supabase,user.id);if(!workspace)fail("/collections","Personal workspace not found.");
 const name=String(formData.get("name")||"").trim().slice(0,80);if(!name)fail("/collections","Smart collection name is required.");
 const kind=String(formData.get("rule_kind")||"marked");const value=String(formData.get("rule_value")||"").trim().slice(0,80);
 const allowed={tag:kind==="tag"?value:"",marked:kind==="marked",suspended:kind==="suspended",kind:["basic","reverse","cloze","multiple_choice","image","custom"].includes(value)?value:""};
 const {error}=await supabase.from("collections").insert({workspace_id:workspace.id,owner_id:user.id,name,kind:"smart",rule:allowed,sort_mode:"manual"});if(error)fail("/collections",error.message);
 revalidatePath("/collections");redirect("/collections");
}
export async function updateCollectionSort(id:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const collection=await collectionForUser(supabase,user.id,id);if(!collection)fail("/collections","Collection not found.");
 const mode=["manual","name","recent","size"].includes(String(formData.get("sort_mode"))) ? String(formData.get("sort_mode")) : "manual";
 const {error}=await supabase.from("collections").update({sort_mode:mode}).eq("id",id).eq("owner_id",user.id);if(error)fail("/collections/"+id,error.message);
 revalidatePath("/collections");revalidatePath("/collections/"+id);redirect("/collections/"+id);
}
export async function createCollection(formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const workspace=await personalWorkspace(supabase,user.id);if(!workspace)fail("/collections","Personal workspace not found.");
 const name=String(formData.get("name")||"").trim().slice(0,80);if(!name)fail("/collections","Collection name is required.");
 const {error}=await supabase.from("collections").insert({workspace_id:workspace.id,owner_id:user.id,name,kind:"custom"});if(error)fail("/collections",error.message);
 revalidatePath("/collections");redirect("/collections");
}
export async function updateCollection(id:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const collection=await collectionForUser(supabase,user.id,id);if(!collection)fail("/collections","Collection not found.");
 if(collection.kind==="favorites")fail("/collections/"+id,"Favorites cannot be renamed.");
 const name=String(formData.get("name")||"").trim().slice(0,80);if(!name)fail("/collections/"+id,"Collection name is required.");
 const patch:any={name};
 if(collection.kind==="smart"){const kind=String(formData.get("rule_kind")||"marked");const value=String(formData.get("rule_value")||"").trim().slice(0,80);patch.rule={tag:kind==="tag"?value:"",marked:kind==="marked",suspended:kind==="suspended",kind:["basic","reverse","cloze","multiple_choice","image","custom"].includes(value)?value:""};}
 patch.is_public=formData.get("is_public")==="on";
 const {error}=await supabase.from("collections").update(patch).eq("id",id).eq("owner_id",user.id);if(error)fail("/collections/"+id,error.message);
 revalidatePath("/collections");revalidatePath("/collections/"+id);redirect("/collections/"+id);
}
export async function deleteCollection(id:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const collection=await collectionForUser(supabase,user.id,id);if(!collection)fail("/collections","Collection not found.");
 if(collection.kind==="favorites")fail("/collections/"+id,"Favorites cannot be deleted.");
 const {error}=await supabase.from("collections").delete().eq("id",id).eq("owner_id",user.id);if(error)fail("/collections/"+id,error.message);
 revalidatePath("/collections");redirect("/collections");
}
export async function removeCardFromCollection(collectionId:string,cardId:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const collection=await collectionForUser(supabase,user.id,collectionId);if(!collection)fail("/collections","Collection not found.");
 const {error}=await supabase.from("collection_cards").delete().eq("collection_id",collectionId).eq("card_id",cardId);if(error)fail("/collections/"+collectionId,error.message);
 revalidatePath("/collections/"+collectionId);revalidatePath("/collections");redirect("/collections/"+collectionId);
}
export async function addCardToCollection(collectionId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const collection=await collectionForUser(supabase,user.id,collectionId);if(!collection)fail("/collections","Collection not found.");
 const cardId=String(formData.get("card_id")||"").trim();if(!cardId)fail("/collections/"+collectionId,"Card ID is required.");
 const {data:card}=await supabase.from("cards").select("id,owner_id,deck_id").eq("id",cardId).maybeSingle();if(!card)fail("/collections/"+collectionId,"Card not found.");
 const {data:deck}=await supabase.from("decks").select("workspace_id").eq("id",card.deck_id).maybeSingle();if(!deck||deck.workspace_id!==collection.workspace_id)fail("/collections/"+collectionId,"Card belongs to another workspace.");
 const {error}=await supabase.from("collection_cards").upsert({collection_id:collectionId,card_id:cardId});if(error)fail("/collections/"+collectionId,error.message);
 revalidatePath("/collections/"+collectionId);redirect("/collections/"+collectionId);
}
export async function toggleFeaturedCollection(collectionId:string,featured:boolean):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:isModerator}=await supabase.rpc("is_platform_moderator");if(!isModerator)fail("/collections","Platform moderation access required.");
 const {error}=await supabase.from("collections").update({is_featured:featured}).eq("id",collectionId).eq("is_public",true);if(error)fail("/collections",error.message);
 revalidatePath("/collections");revalidatePath("/collections/public/"+collectionId);revalidatePath("/explore");redirect("/collections/public/"+collectionId);
}