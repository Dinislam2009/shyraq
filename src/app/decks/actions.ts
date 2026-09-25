"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fail(path:string,message:string):never{redirect(path+"?error="+encodeURIComponent(message));}

async function requireWritableWorkspace(supabase:any,userId:string,workspaceId:string){
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",workspaceId).eq("user_id",userId).maybeSingle();
 const role=String(member?.role||"");
 if(!["owner","admin","editor"].includes(role))throw new Error("You do not have permission to edit this workspace.");
 return member;
}

export async function createDeck(formData:FormData):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const name=String(formData.get("name")||"").trim().slice(0,120);
 const description=String(formData.get("description")||"").trim().slice(0,2000);
 const settings={category:String(formData.get("category")||"").trim().slice(0,60),subject:String(formData.get("subject")||"").trim().slice(0,80),language:String(formData.get("language")||"").trim().slice(0,20),difficulty:String(formData.get("difficulty")||"").trim().slice(0,30)};
 if(!name)fail("/decks/new","Deck name is required.");
 const requestedWorkspace=String(formData.get("workspace_id")||"").trim();
 const {data:workspace}=requestedWorkspace
  ? await supabase.from("workspaces").select("id").eq("id",requestedWorkspace).maybeSingle()
  : await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 if(!workspace)fail("/decks/new","Workspace not found.");
 try{await requireWritableWorkspace(supabase,user.id,workspace.id);}catch(error){fail("/decks/new",error instanceof Error?error.message:"Workspace access denied.");}
 const {data,error}=await supabase.from("decks").insert({workspace_id:workspace.id,owner_id:user.id,name,description,settings}).select("id").single();
 if(error||!data)fail("/decks/new",error?.message||"Unable to create deck.");
 const {error:templateError}=await supabase.from("card_templates").insert({deck_id:data.id,name:"Basic",front_template:"{{front}}",back_template:"{{back}}",css:"",field_schema:[{name:"front",type:"text"},{name:"back",type:"text"}]});
 if(templateError){await supabase.from("decks").delete().eq("id",data.id);fail("/decks/new",templateError.message);}
 revalidatePath("/dashboard");revalidatePath("/decks");redirect("/decks/"+data.id);
}

export async function updateDeck(id:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const name=String(formData.get("name")||"").trim().slice(0,120);if(!name)fail("/decks/"+id,"Deck name is required.");
 const {data:existing}=await supabase.from("decks").select("id,workspace_id,settings").eq("id",id).maybeSingle();if(!existing)fail("/decks/"+id,"Deck not found.");
 try{await requireWritableWorkspace(supabase,user.id,existing.workspace_id);}catch(error){fail("/decks/"+id,error instanceof Error?error.message:"Workspace access denied.");}
 const metadata={category:String(formData.get("category")||"").trim().slice(0,60),subject:String(formData.get("subject")||"").trim().slice(0,80),language:String(formData.get("language")||"").trim().slice(0,20),difficulty:String(formData.get("difficulty")||"").trim().slice(0,30)};
 const settings={...(existing.settings||{}),...metadata};
 const visibility=["private","workspace","public"].includes(String(formData.get("visibility"))) ? String(formData.get("visibility")) : "private";
 const {error}=await supabase.from("decks").update({name,description:String(formData.get("description")||"").trim().slice(0,2000),visibility,settings}).eq("id",id).eq("workspace_id",existing.workspace_id);
 if(error)fail("/decks/"+id,error.message);
 revalidatePath("/decks");revalidatePath("/decks/"+id);redirect("/decks/"+id);
}

export async function deleteDeck(id:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:existing}=await supabase.from("decks").select("id,workspace_id").eq("id",id).maybeSingle();if(!existing)fail("/decks","Deck not found.");
 try{await requireWritableWorkspace(supabase,user.id,existing.workspace_id);}catch(error){fail("/decks/"+id,error instanceof Error?error.message:"Workspace access denied.");}
 const {error}=await supabase.from("decks").delete().eq("id",id).eq("workspace_id",existing.workspace_id);
 if(error)fail("/decks/"+id,error.message);
 revalidatePath("/dashboard");revalidatePath("/decks");redirect("/decks");
}

export async function reorderDecks(workspaceId:string,deckIds:string[]):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 try{await requireWritableWorkspace(supabase,user.id,workspaceId);}catch(error){fail("/decks",error instanceof Error?error.message:"Workspace access denied.");}
 const unique=[...new Set(deckIds)].filter(Boolean).slice(0,500);
 const {data:decks}=await supabase.from("decks").select("id").eq("workspace_id",workspaceId).is("deleted_at",null).in("id",unique);
 const valid=new Set((decks??[]).map((deck:any)=>String(deck.id)));
 const ordered=unique.filter(id=>valid.has(id));
 for(let index=0;index<ordered.length;index++){
  const {error}=await supabase.from("decks").update({sort_order:index}).eq("id",ordered[index]).eq("workspace_id",workspaceId);
  if(error)fail("/decks",error.message);
 }
 revalidatePath("/decks");revalidatePath("/dashboard");
}
