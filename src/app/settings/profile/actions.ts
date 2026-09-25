"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fail(message:string):never{redirect("/settings/profile?error="+encodeURIComponent(message));}
export async function updateProfile(formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const displayName=String(formData.get("display_name")||"").trim().slice(0,80);
 const username=String(formData.get("username")||"").trim().toLowerCase();
 const bio=String(formData.get("bio")||"").trim().slice(0,280);
 const avatarUrl=String(formData.get("avatar_url")||"").trim().slice(0,500);
 if(username&&!/^[a-z0-9_]{3,30}$/.test(username))fail("Username must be 3–30 characters and use only letters, numbers and underscores.");
 const {error}=await supabase.from("profiles").update({display_name:displayName||null,username:username||null,bio:bio||null,avatar_url:avatarUrl||null}).eq("id",user.id);
 if(error)fail(error.message);
 revalidatePath("/settings/profile");revalidatePath("/u/"+username);revalidatePath("/dashboard");redirect("/settings/profile?saved=1");
}