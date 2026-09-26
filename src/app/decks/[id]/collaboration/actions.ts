"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

async function access(deckId:string,write=false){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:deck}=await supabase.from("decks").select("id,name,description,visibility,workspace_id,owner_id,settings").eq("id",deckId).maybeSingle();
 if(!deck)redirect("/decks");
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",deck.workspace_id).eq("user_id",user.id).maybeSingle();
 const role=String(member?.role||"");
 if(write&&!["owner","admin","editor"].includes(role))redirect("/decks/"+deckId+"/collaboration?error=You+do+not+have+permission.");
 if(!write&&!role)redirect("/decks/"+deckId+"/collaboration?error=Workspace+access+required.");
 return {supabase,user,deck,role};
}

async function logActivity(supabase:any,workspaceId:string,userId:string,eventType:string,entityType:string,entityId:string|null,metadata:any={}){
 await supabase.from("activity_feed").insert({workspace_id:workspaceId,actor_id:userId,event_type:eventType,entity_type:entityType,entity_id:entityId,metadata});
}

export async function createComment(deckId:string,formData:FormData){
 const {supabase,user,deck}=await access(deckId,true);
 const body=String(formData.get("body")||"").trim().slice(0,4000);
 if(!body)redirect("/decks/"+deckId+"/collaboration?error=Comment+cannot+be+empty.");
 const cardId=String(formData.get("card_id")||"").trim()||null;
 const parentId=String(formData.get("parent_id")||"").trim()||null;
 const {data:comment,error}=await supabase.from("comments").insert({workspace_id:deck.workspace_id,deck_id:deckId,card_id:cardId,author_id:user.id,parent_id:parentId,body}).select("id").single();
 if(error)redirect("/decks/"+deckId+"/collaboration?error="+encodeURIComponent(error.message));

 const mentions=[...new Set(Array.from(body.matchAll(/@([a-zA-Z0-9_.-]{2,40})/g)).map(match=>match[1].toLowerCase()))];
 if(mentions.length){
  const {data:profiles}=await supabase.from("profiles").select("id,username").in("username",mentions);
  const rows=(profiles??[]).filter((profile:any)=>profile.id!==user.id).map((profile:any)=>({comment_id:comment.id,mentioned_user_id:profile.id}));
  if(rows.length){
   await supabase.from("comment_mentions").upsert(rows,{onConflict:"comment_id,mentioned_user_id"});
   for(const row of rows){
    await supabase.rpc("create_notification",{target_user:row.mentioned_user_id,notification_kind:"comment_mention",notification_title:"You were mentioned in a deck comment",notification_body:String(body).slice(0,300),notification_href:"/decks/"+deckId+"/collaboration",source_comment_id:comment.id});
   }
  }
 }
 await logActivity(supabase,deck.workspace_id,user.id,"comment.created","comment",comment.id,{cardId,parentId});
 revalidatePath("/decks/"+deckId+"/collaboration");
 redirect("/decks/"+deckId+"/collaboration?saved=comment");
}

export async function setCommentResolved(deckId:string,commentId:string,resolved:boolean){
 const {supabase,user,deck}=await access(deckId,true);
 const {error}=await supabase.from("comments").update({resolved,updated_at:new Date().toISOString()}).eq("id",commentId).eq("deck_id",deckId);
 if(error)redirect("/decks/"+deckId+"/collaboration?error="+encodeURIComponent(error.message));
 await logActivity(supabase,deck.workspace_id,user.id,resolved?"comment.resolved":"comment.reopened","comment",commentId,{resolved});
 revalidatePath("/decks/"+deckId+"/collaboration");
 redirect("/decks/"+deckId+"/collaboration");
}

export async function deleteComment(deckId:string,commentId:string){
 const {supabase,user,deck}=await access(deckId,true);
 const {error}=await supabase.from("comments").delete().eq("id",commentId).eq("author_id",user.id);
 if(error)redirect("/decks/"+deckId+"/collaboration?error="+encodeURIComponent(error.message));
 await logActivity(supabase,deck.workspace_id,user.id,"comment.deleted","comment",commentId);
 revalidatePath("/decks/"+deckId+"/collaboration");
 redirect("/decks/"+deckId+"/collaboration");
}

export async function createDeckVersion(deckId:string,formData:FormData){
 const {supabase,user,deck}=await access(deckId,true);
 const label=String(formData.get("label")||"Snapshot").trim().slice(0,120)||"Snapshot";
 const reason=String(formData.get("reason")||"").trim().slice(0,500)||null;
 const [{data:cards},{data:lastVersion}]=await Promise.all([
  supabase.from("cards").select("id,kind,content,template_id,sort_order,is_suspended,is_marked,created_at,updated_at").eq("deck_id",deckId).order("sort_order"),
  supabase.from("deck_versions").select("version_number").eq("deck_id",deckId).order("version_number",{ascending:false}).limit(1).maybeSingle()
 ]);
 const versionNumber=Number(lastVersion?.version_number||0)+1;
 const snapshot={deck:{id:deck.id,name:deck.name,description:deck.description,visibility:deck.visibility,settings:deck.settings},cards:cards??[]};
 const {error}=await supabase.from("deck_versions").insert({deck_id:deckId,workspace_id:deck.workspace_id,created_by:user.id,version_number:versionNumber,label,reason,snapshot});
 if(error)redirect("/decks/"+deckId+"/collaboration?error="+encodeURIComponent(error.message));
 await logActivity(supabase,deck.workspace_id,user.id,"deck.version.created","deck",deckId,{versionNumber,label,reason});
 revalidatePath("/decks/"+deckId+"/collaboration");
 redirect("/decks/"+deckId+"/collaboration?saved=version");
}

export async function restoreDeckVersion(deckId:string,versionId:string){
 const {supabase,user,deck}=await access(deckId,true);
 const {data:version}=await supabase.from("deck_versions").select("id,version_number,snapshot").eq("id",versionId).eq("deck_id",deckId).maybeSingle();
 if(!version)redirect("/decks/"+deckId+"/collaboration?error=Version+not+found.");
 const snapshot=(version.snapshot||{}) as any;
 const snapshotDeck=snapshot.deck||{};
 const {error:deckError}=await supabase.from("decks").update({name:String(snapshotDeck.name||deck.name),description:String(snapshotDeck.description||""),visibility:String(snapshotDeck.visibility||"private"),settings:snapshotDeck.settings&&typeof snapshotDeck.settings==="object"?snapshotDeck.settings:{}}).eq("id",deckId);
 if(deckError)redirect("/decks/"+deckId+"/collaboration?error="+encodeURIComponent(deckError.message));
 for(const card of Array.isArray(snapshot.cards)?snapshot.cards:[]){
  await supabase.from("cards").update({
   kind:String(card.kind||"basic"),
   content:card.content&&typeof card.content==="object"?card.content:{},
   template_id:card.template_id?String(card.template_id):null,
   sort_order:Number(card.sort_order||0),
   is_suspended:Boolean(card.is_suspended),
   is_marked:Boolean(card.is_marked)
  }).eq("id",String(card.id)).eq("deck_id",deckId);
 }
 await logActivity(supabase,deck.workspace_id,user.id,"deck.version.restored","deck",deckId,{versionNumber:version.version_number});
 revalidatePath("/decks/"+deckId);revalidatePath("/decks/"+deckId+"/collaboration");redirect("/decks/"+deckId+"/collaboration?saved=restore");
}
