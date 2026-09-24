"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export async function createDeck(formData:FormData){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/login");
 const name=String(formData.get("name")||"").trim();
 const description=String(formData.get("description")||"").trim();
 if(!name)return {error:"Deck name is required."};
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 if(!workspace)return {error:"Personal workspace not found."};
 const {data,error}=await supabase.from("decks").insert({workspace_id:workspace.id,owner_id:user.id,name,description}).select("id").single();
 if(error)return {error:error.message};
 revalidatePath("/dashboard"); revalidatePath("/decks"); redirect("/decks/"+data.id);
}
export async function updateDeck(id:string,formData:FormData){
 const supabase=await createClient();
 const {data,error}=await supabase.from("decks").update({name:String(formData.get("name")||"").trim(),description:String(formData.get("description")||"").trim(),visibility:String(formData.get("visibility")||"private")}).eq("id",id).select("id").single();
 if(error)return {error:error.message};
 revalidatePath("/decks"); revalidatePath("/decks/"+id); return {ok:true};
}
export async function deleteDeck(id:string){
 const supabase=await createClient();
 const {error}=await supabase.from("decks").delete().eq("id",id);
 if(error)return {error:error.message};
 revalidatePath("/dashboard"); revalidatePath("/decks"); redirect("/decks");
}