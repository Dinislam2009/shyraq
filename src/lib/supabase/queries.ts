import {createClient} from "@/lib/supabase/server";

export async function getCurrentUser(){
 const supabase=await createClient();
 const {data,error}=await supabase.auth.getUser();
 if(error||!data.user)return null;
 return data.user;
}
export async function getPersonalWorkspace(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const {data}=await supabase.from("workspaces").select("*").eq("owner_id",user.id).eq("kind","personal").order("created_at").limit(1).maybeSingle();
 return data;
}
export async function getDecks(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return [];
 const {data}=await supabase.from("decks").select("id,name,description,visibility,workspace_id,owner_id,updated_at,cards(count)").order("updated_at",{ascending:false});
 return data??[];
}
export async function getDeck(id:string){
 const supabase=await createClient();
 const {data}=await supabase.from("decks").select("id,name,description,visibility,workspace_id,owner_id,settings,created_at,updated_at,cards(id,content,kind,sort_order,is_suspended,is_marked,updated_at)").eq("id",id).maybeSingle();
 return data;
}