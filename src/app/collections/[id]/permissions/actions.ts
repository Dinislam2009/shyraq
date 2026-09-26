"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {canAdminWorkspace} from "@/lib/workspace/permissions";

async function requireCollectionAdmin(collectionId:string){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:collection}=await supabase.from("collections").select("id,name,workspace_id,owner_id").eq("id",collectionId).maybeSingle();
 if(!collection)redirect("/collections");
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",collection.workspace_id).eq("user_id",user.id).maybeSingle();
 if(!member||!canAdminWorkspace(String(member.role) as any))redirect("/collections/"+collectionId+"/permissions?error=Only+workspace+owners/admins+can+manage+permissions.");
 return {supabase,user,collection};
}
async function resolveUser(supabase:any,username:string){
 const normalized=username.trim().replace(/^@/,"").toLowerCase();
 if(!normalized)return null;
 return (await supabase.from("public_profiles").select("id,username,display_name").eq("username",normalized).maybeSingle()).data;
}
export async function setCollectionMemberRole(collectionId:string,formData:FormData){
 const {supabase,user,collection}=await requireCollectionAdmin(collectionId);
 const target=await resolveUser(supabase,String(formData.get("username")||""));
 const role=String(formData.get("role")||"viewer");
 if(!target)redirect("/collections/"+collectionId+"/permissions?error=User+not+found.");
 if(!["editor","commenter","viewer"].includes(role))redirect("/collections/"+collectionId+"/permissions?error=Invalid+role.");
 if(target.id===collection.owner_id)redirect("/collections/"+collectionId+"/permissions?error=The+collection+owner+already+has+full+access.");
 const {data:workspaceMember}=await supabase.from("workspace_members").select("user_id").eq("workspace_id",collection.workspace_id).eq("user_id",target.id).maybeSingle();
 if(!workspaceMember)redirect("/collections/"+collectionId+"/permissions?error=User+must+belong+to+the+workspace.");
 const {error}=await supabase.from("collection_members").upsert({collection_id:collectionId,workspace_id:collection.workspace_id,user_id:target.id,role},{onConflict:"collection_id,user_id"});
 if(error)redirect("/collections/"+collectionId+"/permissions?error="+encodeURIComponent(error.message));
 await supabase.from("activity_feed").insert({workspace_id:collection.workspace_id,actor_id:user.id,entity_type:"collection",entity_id:collectionId,event_type:"collection.permission.updated",metadata:{username:target.username,role}});
 revalidatePath("/collections/"+collectionId);revalidatePath("/collections/"+collectionId+"/permissions");redirect("/collections/"+collectionId+"/permissions?saved=1");
}
export async function removeCollectionMemberRole(collectionId:string,userId:string){
 const {supabase,user,collection}=await requireCollectionAdmin(collectionId);
 await supabase.from("collection_members").delete().eq("collection_id",collectionId).eq("user_id",userId);
 await supabase.from("activity_feed").insert({workspace_id:collection.workspace_id,actor_id:user.id,entity_type:"collection",entity_id:collectionId,event_type:"collection.permission.reset",metadata:{targetUserId:userId}});
 revalidatePath("/collections/"+collectionId);revalidatePath("/collections/"+collectionId+"/permissions");redirect("/collections/"+collectionId+"/permissions");
}
