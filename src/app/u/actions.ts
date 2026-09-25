"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

async function targetByUsername(supabase:any,username:string){
 const {data}=await supabase.from("profiles").select("id,username,display_name").eq("username",username.toLowerCase()).maybeSingle();
 return data;
}
export async function setCreatorRelation(targetUsername:string,relation:"mute"|"block",enabled:boolean){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const target=await targetByUsername(supabase,targetUsername);if(!target||target.id===user.id)redirect("/u/"+targetUsername);
 if(enabled)await supabase.from("creator_relations").upsert({user_id:user.id,creator_id:target.id,relation},{onConflict:"user_id,creator_id,relation"});
 else await supabase.from("creator_relations").delete().eq("user_id",user.id).eq("creator_id",target.id).eq("relation",relation);
 revalidatePath("/u/"+targetUsername);revalidatePath("/explore");redirect("/u/"+targetUsername);
}
export async function unblockCreator(targetUsername:string){return setCreatorRelation(targetUsername,"block",false);}
export async function unmuteCreator(targetUsername:string){return setCreatorRelation(targetUsername,"mute",false);}
