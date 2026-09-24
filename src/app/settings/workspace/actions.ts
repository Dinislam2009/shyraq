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