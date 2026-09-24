import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser(){const supabase=await createClient();const {data,error}=await supabase.auth.getUser();return error||!data.user?null:data.user;}
export async function getPersonalWorkspace(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data}=await supabase.from("workspaces").select("*").eq("owner_id",user.id).eq("kind","personal").order("created_at").limit(1).maybeSingle();return data;}
export async function getDecks(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return [];const {data}=await supabase.from("decks").select("id,name,description,visibility,workspace_id,owner_id,updated_at,cards(count)").order("updated_at",{ascending:false});return data??[];}
export async function getDeck(id:string){const supabase=await createClient();const {data}=await supabase.from("decks").select("id,name,description,visibility,workspace_id,owner_id,settings,created_at,updated_at,cards(id,content,kind,sort_order,is_suspended,is_marked,updated_at)").eq("id",id).maybeSingle();return data;}
export async function getReviewCard(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return null;
 const now=new Date().toISOString();
 const {data:due}=await supabase.from("review_states").select("card_id,state_data,due_at").eq("user_id",user.id).lte("due_at",now).order("due_at",{ascending:true}).limit(1);
 if(due?.[0]){const {data:card}=await supabase.from("cards").select("id,deck_id,kind,content").eq("id",due[0].card_id).maybeSingle();if(card)return {card,stateData:due[0].state_data,isNew:false};}
 const {data:cards}=await supabase.from("cards").select("id,deck_id,kind,content").order("updated_at",{ascending:true}).limit(1);
 if(!cards?.[0])return null;
 return {card:cards[0],stateData:null,isNew:true};
}
export async function getReviewStats(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return {reviews:0,accuracy:null,studyMinutes:0};const {count:reviews}=await supabase.from("review_events").select("*",{count:"exact",head:true}).eq("user_id",user.id);const {data:events}=await supabase.from("review_events").select("rating").eq("user_id",user.id);const good=(events??[]).filter((e:any)=>e.rating!=="again").length;return {reviews:reviews??0,accuracy:events?.length?Math.round(good/events.length*100):null,studyMinutes:0};}