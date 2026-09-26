"use server";
import {redirect} from "next/navigation";
import {createHash,randomBytes} from "crypto";
import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";
import {canAdminWorkspace,canChangeWorkspaceMemberRole,canDeleteWorkspaceMember} from "@/lib/workspace/permissions";

function hashToken(token:string){return createHash("sha256").update(token).digest("hex");}
async function requireAdmin(supabase:any,userId:string,workspaceId:string){
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",workspaceId).eq("user_id",userId).maybeSingle();
 return member&&canAdminWorkspace(member.role)?member.role:null;
}
export async function createWorkspaceInvite(formData:FormData):Promise<{ok?:boolean;link?:string;error?:string}>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return {error:"Authentication required."};
 const workspaceId=String(formData.get("workspace_id")||"").trim();
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("id",workspaceId).maybeSingle();
 if(!workspace)return {error:"Workspace not found."};
 if(!await requireAdmin(supabase,user.id,workspace.id))return {error:"Only workspace admins can create invites."};
 const role=String(formData.get("role")||"reviewer");
 if(!["admin","editor","reviewer","viewer"].includes(role))return {error:"Invalid role."};
 const email=String(formData.get("email")||"").trim().toLowerCase()||null;
 const token=randomBytes(32).toString("hex");
 const expiresAt=new Date(Date.now()+7*24*60*60*1000).toISOString();
 const {error}=await supabase.from("workspace_invitations").insert({workspace_id:workspace.id,invited_by:user.id,email,role,token_hash:hashToken(token),expires_at:expiresAt});
 if(error)return {error:error.message};
 revalidatePath("/settings/workspace");
 return {ok:true,link:"/invite/"+token};
}
export async function createTeamWorkspace(formData:FormData):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user){redirect("/login");return;}
 const name=String(formData.get("name")||"").trim().slice(0,80);
 const slug=String(formData.get("slug")||name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")).trim().slice(0,60);
 if(!name||!slug)return;
 const {data:workspace,error}=await supabase.from("workspaces").insert({owner_id:user.id,kind:"team",name,slug,description:String(formData.get("description")||"").trim()}).select("id").single();
 if(error||!workspace)return;
 const {error:memberError}=await supabase.from("workspace_members").insert({workspace_id:workspace.id,user_id:user.id,role:"owner"});
 if(memberError){
  await supabase.from("workspaces").delete().eq("id",workspace.id).eq("owner_id",user.id);
  return;
 }
 const {error:auditError}=await supabase.from("workspace_audit_logs").insert({workspace_id:workspace.id,actor_id:user.id,event_type:"workspace.created",metadata:{name,slug}});
 if(auditError){
  await supabase.from("workspace_members").delete().eq("workspace_id",workspace.id).eq("user_id",user.id);
  await supabase.from("workspaces").delete().eq("id",workspace.id).eq("owner_id",user.id);
  return;
 }
 revalidatePath("/settings/workspace");redirect("/settings/workspace");
}
export async function updateMemberRole(workspaceId:string,userId:string,role:"admin"|"editor"|"reviewer"|"viewer"):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const actorRole=await requireAdmin(supabase,user.id,workspaceId);
 if(!actorRole)redirect("/settings/workspace?error=Only+workspace+admins+can+change+roles");
 const {data:target}=await supabase.from("workspace_members").select("role").eq("workspace_id",workspaceId).eq("user_id",userId).maybeSingle();
 if(!target||!canChangeWorkspaceMemberRole(actorRole as any,target.role as any))redirect("/settings/workspace?error=This+member+cannot+be+changed+by+your+role");
 const {error}=await supabase.from("workspace_members").update({role}).eq("workspace_id",workspaceId).eq("user_id",userId);
 if(error)redirect("/settings/workspace?error="+encodeURIComponent(error.message));
 revalidatePath("/settings/workspace");redirect("/settings/workspace");
}
export async function removeMember(workspaceId:string,userId:string):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const actorRole=await requireAdmin(supabase,user.id,workspaceId);
 if(!actorRole)redirect("/settings/workspace?error=Only+workspace+admins+can+remove+members");
 const {data:target}=await supabase.from("workspace_members").select("role").eq("workspace_id",workspaceId).eq("user_id",userId).maybeSingle();
 if(!target||target.role==="owner"||(actorRole==="admin"&&target.role==="admin"))redirect("/settings/workspace?error=This+member+cannot+be+removed+by+your+role");
 const {error}=await supabase.from("workspace_members").delete().eq("workspace_id",workspaceId).eq("user_id",userId);
 if(error)redirect("/settings/workspace?error="+encodeURIComponent(error.message));
 revalidatePath("/settings/workspace");redirect("/settings/workspace");
}


export async function updateWorkspaceSettings(workspaceId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 if(!await requireAdmin(supabase,user.id,workspaceId))redirect("/settings/workspace?error=Only+workspace+admins+can+edit+workspace+settings");
 const name=String(formData.get("name")||"").trim().slice(0,80);const description=String(formData.get("description")||"").trim().slice(0,500);const slug=String(formData.get("slug")||"").trim().slice(0,60);
 if(!name||!slug)redirect("/settings/workspace?error=Name+and+slug+are+required");
 const {error}=await supabase.from("workspaces").update({name,description,slug}).eq("id",workspaceId);
 if(error)redirect("/settings/workspace?error="+encodeURIComponent(error.message));
 await supabase.from("workspace_audit_logs").insert({workspace_id:workspaceId,actor_id:user.id,event_type:"workspace.settings.updated",metadata:{name,slug}});
 revalidatePath("/settings/workspace");revalidatePath("/dashboard");revalidatePath("/decks");redirect("/settings/workspace?workspace="+encodeURIComponent(workspaceId)+"&saved=1");
}

export async function selectWorkspace(workspaceId:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:member}=await supabase.from("workspace_members").select("workspace_id").eq("workspace_id",workspaceId).eq("user_id",user.id).maybeSingle();
 if(!member)redirect("/settings/workspace?error=Workspace+access+denied");
 const {error}=await supabase.from("profiles").update({selected_workspace_id:workspaceId}).eq("id",user.id);
 if(error)redirect("/settings/workspace?error="+encodeURIComponent(error.message));
 revalidatePath("/dashboard");revalidatePath("/decks");revalidatePath("/settings/workspace");redirect("/dashboard");
}

export async function cancelWorkspaceInvite(inviteId:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:invite}=await supabase.from("workspace_invitations").select("id,workspace_id").eq("id",inviteId).maybeSingle();
 if(!invite||!await requireAdmin(supabase,user.id,invite.workspace_id))redirect("/settings/workspace?error=Invite+access+denied");
 await supabase.from("workspace_invitations").delete().eq("id",inviteId);
 await supabase.from("workspace_audit_logs").insert({workspace_id:invite.workspace_id,actor_id:user.id,event_type:"workspace.invite.cancelled",metadata:{inviteId}});
 revalidatePath("/settings/workspace");redirect("/settings/workspace?workspace="+encodeURIComponent(invite.workspace_id));
}
