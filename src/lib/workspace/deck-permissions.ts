import {createClient} from "@/lib/supabase/server";
import {resolveDeckRole,type DeckRole,type WorkspaceRole} from "@/lib/workspace/permissions";

export async function getEffectiveDeckRole(deckId:string){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return {user:null,deck:null,workspaceRole:"" as WorkspaceRole,deckRole:"none" as DeckRole};
 const {data:deck}=await supabase.from("decks").select("id,name,description,visibility,workspace_id,owner_id,settings,deleted_at").eq("id",deckId).maybeSingle();
 if(!deck)return {user,deck:null,workspaceRole:"" as WorkspaceRole,deckRole:"none" as DeckRole};
 const [{data:member},{data:override}]=await Promise.all([
  supabase.from("workspace_members").select("role").eq("workspace_id",deck.workspace_id).eq("user_id",user.id).maybeSingle(),
  supabase.from("deck_members").select("role").eq("deck_id",deckId).eq("user_id",user.id).maybeSingle()
 ]);
 const workspaceRole=String(member?.role||"") as WorkspaceRole;
 const deckRole=resolveDeckRole(workspaceRole,String(override?.role||"") as DeckRole|"");
 return {user,deck,workspaceRole,deckRole};
}
export async function getDeckPermissionContext(deckId:string){
 return getEffectiveDeckRole(deckId);
}
