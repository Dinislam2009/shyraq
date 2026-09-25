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
 const avatarFile=formData.get("avatar_file");
 let storedAvatarUrl=avatarUrl;
 if(avatarFile instanceof File&&avatarFile.size>0){
  if(avatarFile.size>2*1024*1024)fail("Avatar image must be 2 MB or smaller.");
  if(!avatarFile.type.startsWith("image/"))fail("Avatar file must be an image.");
  const safe=avatarFile.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-80);
  const path=user.id+"/avatar/"+crypto.randomUUID()+"-"+safe;
  const {error:uploadError}=await supabase.storage.from("user-media").upload(path,avatarFile,{contentType:avatarFile.type,upsert:false});
  if(uploadError)fail(uploadError.message);
  storedAvatarUrl=path;
 }
 const showActivity=formData.get("show_activity")==="on";
 const showFollowers=formData.get("show_followers")==="on";
 if(username&&!/^[a-z0-9_]{3,30}$/.test(username))fail("Username must be 3–30 characters and use only letters, numbers and underscores.");
 const {error}=await supabase.from("profiles").update({display_name:displayName||null,username:username||null,bio:bio||null,avatar_url:storedAvatarUrl||null,show_activity:showActivity,show_followers:showFollowers}).eq("id",user.id);
 if(error){if(storedAvatarUrl&&!storedAvatarUrl.startsWith("http")&&storedAvatarUrl!==avatarUrl)await supabase.storage.from("user-media").remove([storedAvatarUrl]);fail(error.message);}
 if(avatarFile instanceof File&&avatarFile.size>0&&avatarUrl&&avatarUrl.startsWith(user.id+"/avatar/"))await supabase.storage.from("user-media").remove([avatarUrl]);
 revalidatePath("/settings/profile");revalidatePath("/u/"+username);revalidatePath("/dashboard");redirect("/settings/profile?saved=1");
}