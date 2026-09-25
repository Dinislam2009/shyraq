import {createClient} from "@/lib/supabase/server";
import {resolveDeckRole,type DeckRole,type WorkspaceRole} from "@/lib/workspace/permissions";

export async function getEffectiveCollectionRole(collectionId:string){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return {user:null,collection:null,workspaceRole:"" as WorkspaceRole,collectionRole:"none" as DeckRole};
 const {data:collection}=await supabase.from("collections").select("id,name,kind,workspace_id,owner_id,is_public").eq("id",collectionId).maybeSingle();
 if(!collection)return {user,collection:null,workspaceRole:"" as WorkspaceRole,collectionRole:"none" as DeckRole};
 const [{data:member},{data:override}]=await Promise.all([
  supabase.from("workspace_members").select("role").eq("workspace_id",collection.workspace_id).eq("user_id",user.id).maybeSingle(),
  supabase.from("collection_members").select("role").eq("collection_id",collectionId).eq("user_id",user.id).maybeSingle()
 ]);
 const workspaceRole=String(member?.role||"") as WorkspaceRole;
 const collectionRole=resolveDeckRole(workspaceRole,String(override?.role||"") as DeckRole|"");
 return {user,collection,workspaceRole,collectionRole};
}
