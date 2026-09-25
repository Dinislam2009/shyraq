"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fail(message:string):never{redirect("/tags?error="+encodeURIComponent(message));}
async function workspace(supabase:any,userId:string){const {data}=await supabase.from("workspaces").select("id").eq("owner_id",userId).eq("kind","personal").limit(1).maybeSingle();return data;}
async function ownTag(supabase:any,userId:string,id:string){
 const ws=await workspace(supabase,userId);if(!ws)return null;
 const {data}=await supabase.from("tags").select("id,name,parent_id,workspace_id").eq("id",id).eq("workspace_id",ws.id).maybeSingle();return data;
}
async function cardIdsForTag(supabase:any,tagId:string){const {data}=await supabase.from("card_tags").select("card_id").eq("tag_id",tagId);return (data??[]).map((x:any)=>x.card_id);}
async function updateCardContentTag(supabase:any,userId:string,oldName:string,newName:string|null){
 const {data:cards}=await supabase.from("cards").select("id,content").eq("owner_id",userId).limit(50000);
 for(const card of cards??[]){
  const tags=Array.isArray(card.content?.tags)?card.content.tags.map((x:any)=>String(x)):[];if(!tags.includes(oldName))continue;
  const next=[...new Set(tags.flatMap((tag:string)=>tag===oldName?(newName?[newName]:[]):[tag]))];
  await supabase.from("cards").update({content:{...(card.content||{}),tags:next}}).eq("id",card.id);
 }
}
export async function createTag(formData:FormData){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const ws=await workspace(supabase,user.id);if(!ws)fail("Personal workspace not found.");
 const name=String(formData.get("name")||"").trim().slice(0,80);if(!name)fail("Tag name is required.");
 const parentId=String(formData.get("parent_id")||"").trim()||null;
 const {error}=await supabase.from("tags").upsert({workspace_id:ws.id,name,parent_id:parentId},{onConflict:"workspace_id,name"});
 if(error)fail(error.message);revalidatePath("/tags");redirect("/tags");
}
export async function renameTag(id:string,formData:FormData){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const tag=await ownTag(supabase,user.id,id);if(!tag)fail("Tag not found.");
 const name=String(formData.get("name")||"").trim().slice(0,80);if(!name)fail("Tag name is required.");
 const {error}=await supabase.from("tags").update({name}).eq("id",id);if(error)fail(error.message);
 await updateCardContentTag(supabase,user.id,String(tag.name),name);
 revalidatePath("/tags");revalidatePath("/history");redirect("/tags");
}
export async function moveTag(id:string,formData:FormData){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const tag=await ownTag(supabase,user.id,id);if(!tag)fail("Tag not found.");
 const parentId=String(formData.get("parent_id")||"").trim()||null;
 if(parentId===id)fail("A tag cannot be its own parent.");
 const {error}=await supabase.from("tags").update({parent_id:parentId}).eq("id",id);if(error)fail(error.message);
 revalidatePath("/tags");redirect("/tags");
}
export async function mergeTag(sourceId:string,formData:FormData){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const source=await ownTag(supabase,user.id,sourceId);const target=await ownTag(supabase,user.id,String(formData.get("target_id")||""));if(!source||!target||source.id===target.id)fail("Choose two different tags.");
 const sourceCards=await cardIdsForTag(supabase,source.id);
 const {data:existingTarget}=await supabase.from("card_tags").select("card_id").eq("tag_id",target.id);
 const targetSet=new Set((existingTarget??[]).map((x:any)=>x.card_id));
 const links=sourceCards.filter((id:string)=>!targetSet.has(id)).map((card_id:string)=>({card_id,tag_id:target.id}));
 if(links.length)await supabase.from("card_tags").insert(links);
 if(sourceCards.length)await supabase.from("card_tags").delete().eq("tag_id",source.id);
 await updateCardContentTag(supabase,user.id,String(source.name),String(target.name));
 await supabase.from("tags").delete().eq("id",source.id);
 revalidatePath("/tags");revalidatePath("/history");redirect("/tags");
}
export async function deleteTag(id:string){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const tag=await ownTag(supabase,user.id,id);if(!tag)fail("Tag not found.");
 await supabase.from("card_tags").delete().eq("tag_id",id);
 await updateCardContentTag(supabase,user.id,String(tag.name),null);
 await supabase.from("tags").delete().eq("id",id);
 revalidatePath("/tags");revalidatePath("/history");redirect("/tags");
}
