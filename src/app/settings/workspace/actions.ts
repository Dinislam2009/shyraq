"use server";
import {createHash,randomBytes} from "crypto";
import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";

function hashToken(token:string){return createHash("sha256").update(token).digest("hex");}
export async function createWorkspaceInvite(formData:FormData){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser(); if(!user)return {error:"Authentication required."};
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 if(!workspace)return {error:"Workspace not found."};
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
 if(!user)redirect("/login");
 const name=String(formData.get("name")||"").trim().slice(0,80);
 const slug=String(formData.get("slug")||name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")).trim().slice(0,60);
 if(!name||!slug)return;
 const {data:workspace,error}=await supabase.from("workspaces").insert({owner_id:user.id,kind:"team",name,slug,description:String(formData.get("description")||"").trim()}).select("id").single();
 if(error||!workspace)return;
 await supabase.from("workspace_members").insert({workspace_id:workspace.id,user_id:user.id,role:"owner"});
 revalidatePath("/settings/workspace");redirect("/settings/workspace");
}

export async function updateMemberRole(workspaceId:string,userId:string,role:"admin"|"editor"|"reviewer"|"viewer"):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {error}=await supabase.from("workspace_members").update({role}).eq("workspace_id",workspaceId).eq("user_id",userId);
 if(error)redirect("/settings/workspace?error="+encodeURIComponent(error.message));
 revalidatePath("/settings/workspace");redirect("/settings/workspace");
}

export async function removeMember(workspaceId:string,userId:string):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {error}=await supabase.from("workspace_members").delete().eq("workspace_id",workspaceId).eq("user_id",userId);
 if(error)redirect("/settings/workspace?error="+encodeURIComponent(error.message));
 revalidatePath("/settings/workspace");redirect("/settings/workspace");
}
