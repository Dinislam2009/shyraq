"use server";
import {createHash} from "crypto";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
function fail(token:string,message:string):never{redirect("/invite/"+token+"?error="+encodeURIComponent(message));}
function hashToken(token:string){return createHash("sha256").update(token).digest("hex");}
export async function acceptInvite(token:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next="+encodeURIComponent("/invite/"+token));
 const {data:invite,error}=await supabase.from("workspace_invitations").select("id,workspace_id,role,expires_at,accepted_at,email").eq("token_hash",hashToken(token)).maybeSingle();if(error||!invite)fail(token,"Invite not found.");
 if(invite.accepted_at||new Date(invite.expires_at).getTime()<Date.now())fail(token,"Invite is expired or already used.");
 if(invite.email&&invite.email!==String(user.email||"").toLowerCase())fail(token,"This invite was created for a different email address.");
 const {error:memberError}=await supabase.from("workspace_members").upsert({workspace_id:invite.workspace_id,user_id:user.id,role:invite.role});if(memberError)fail(token,memberError.message);
 const {error:updateError}=await supabase.from("workspace_invitations").update({accepted_at:new Date().toISOString()}).eq("id",invite.id);if(updateError)fail(token,updateError.message);
 redirect("/dashboard");
}