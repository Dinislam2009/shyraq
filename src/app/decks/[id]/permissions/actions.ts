"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {canAdminWorkspace} from "@/lib/workspace/permissions";

async function requireDeckAdmin(deckId:string){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:deck}=await supabase.from("decks").select("id,name,workspace_id,owner_id").eq("id",deckId).maybeSingle();
 if(!deck)redirect("/decks");
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",deck.workspace_id).eq("user_id",user.id).maybeSingle();
 if(!member||!canAdminWorkspace(String(member.role) as any))redirect("/decks/"+deckId+"/permissions?error=Only+workspace+admins+can+manage+deck+permissions.");
 return {supabase,user,deck};
}

async function resolveUser(supabase:any,username:string){
 const normalized=username.trim().replace(/^@/,"").toLowerCase();
 if(!normalized)return null;
 const {data}=await supabase.from("public_profiles").select("id,username,display_name").eq("username",normalized).maybeSingle();
 return data;
}

export async function setDeckMemberRole(deckId:string,formData:FormData){
 const {supabase,user,deck}=await requireDeckAdmin(deckId);
 const username=String(formData.get("username")||"");
 const role=String(formData.get("role")||"viewer");
 if(!["editor","commenter","viewer"].includes(role))redirect("/decks/"+deckId+"/permissions?error=Invalid+deck+role.");
 const target=await resolveUser(supabase,username);
 if(!target)redirect("/decks/"+deckId+"/permissions?error=User+not+found.+Use+their+username.");
 if(target.id===deck.owner_id)redirect("/decks/"+deckId+"/permissions?error=The+deck+owner+already+has+full+access.");
 const {data:workspaceMember}=await supabase.from("workspace_members").select("user_id").eq("workspace_id",deck.workspace_id).eq("user_id",target.id).maybeSingle();
 if(!workspaceMember)redirect("/decks/"+deckId+"/permissions?error=That+user+must+belong+to+the+workspace+first.");
 const {error}=await supabase.from("deck_members").upsert({deck_id:deckId,workspace_id:deck.workspace_id,user_id:target.id,role},{onConflict:"deck_id,user_id"});
 if(error)redirect("/decks/"+deckId+"/permissions?error="+encodeURIComponent(error.message));
 await supabase.from("activity_feed").insert({workspace_id:deck.workspace_id,actor_id:user.id,entity_type:"deck",entity_id:deckId,event_type:"deck.permission.updated",metadata:{username:target.username,role}});
 revalidatePath("/decks/"+deckId);revalidatePath("/decks/"+deckId+"/permissions");redirect("/decks/"+deckId+"/permissions?saved=1");
}

export async function removeDeckMemberRole(deckId:string,userId:string){
 const {supabase,user,deck}=await requireDeckAdmin(deckId);
 await supabase.from("deck_members").delete().eq("deck_id",deckId).eq("user_id",userId);
 await supabase.from("activity_feed").insert({workspace_id:deck.workspace_id,actor_id:user.id,entity_type:"deck",entity_id:deckId,event_type:"deck.permission.reset",metadata:{targetUserId:userId}});
 revalidatePath("/decks/"+deckId);revalidatePath("/decks/"+deckId+"/permissions");redirect("/decks/"+deckId+"/permissions");
}
