"use server";
import {createHash} from "crypto";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
function hashToken(token:string){return createHash("sha256").update(token).digest("hex");}
export async function acceptInvite(token:string){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:invite,error}=await supabase.from("workspace_invitations").select("id,workspace_id,role,expires_at,accepted_at,email").eq("token_hash",hashToken(token)).maybeSingle();
 if(error||!invite)return {error:"Invite not found."};
 if(invite.accepted_at||new Date(invite.expires_at).getTime()<Date.now())return {error:"Invite is expired or already used."};
 if(invite.email&&invite.email!==String(user.email||"").toLowerCase())return {error:"This invite was created for a different email address."};
 const {error:memberError}=await supabase.from("workspace_members").upsert({workspace_id:invite.workspace_id,user_id:user.id,role:invite.role});
 if(memberError)return {error:memberError.message};
 const {error:updateError}=await supabase.from("workspace_invitations").update({accepted_at:new Date().toISOString()}).eq("id",invite.id);
 if(updateError)return {error:updateError.message};
 redirect("/dashboard");
}