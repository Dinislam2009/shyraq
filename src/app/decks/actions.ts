"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fail(path:string,message:string):never{redirect(path+"?error="+encodeURIComponent(message));}

export async function createDeck(formData:FormData):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const name=String(formData.get("name")||"").trim();
 const description=String(formData.get("description")||"").trim();
 if(!name)fail("/decks/new","Deck name is required.");
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 if(!workspace)fail("/decks/new","Personal workspace not found.");
 const {data,error}=await supabase.from("decks").insert({workspace_id:workspace.id,owner_id:user.id,name,description}).select("id").single();
 if(error||!data)fail("/decks/new",error?.message||"Unable to create deck.");
 const {error:templateError}=await supabase.from("card_templates").insert({
   deck_id:data.id,
   name:"Basic",
   front_template:"{{front}}",
   back_template:"{{back}}",
   css:"",
   field_schema:[{name:"front",type:"text"},{name:"back",type:"text"}]
 });
 if(templateError)fail("/decks/new",templateError.message);
 revalidatePath("/dashboard");revalidatePath("/decks");redirect("/decks/"+data.id);
}
export async function updateDeck(id:string,formData:FormData):Promise<void>{
 const supabase=await createClient();
 const {error}=await supabase.from("decks").update({name:String(formData.get("name")||"").trim(),description:String(formData.get("description")||"").trim(),visibility:String(formData.get("visibility")||"private")}).eq("id",id);
 if(error)fail("/decks/"+id,error.message);
 revalidatePath("/decks");revalidatePath("/decks/"+id);redirect("/decks/"+id);
}
export async function deleteDeck(id:string):Promise<void>{
 const supabase=await createClient();const {error}=await supabase.from("decks").delete().eq("id",id);
 if(error)fail("/decks/"+id,error.message);
 revalidatePath("/dashboard");revalidatePath("/decks");redirect("/decks");
}