"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {diffCopiedCards} from "@/lib/decks/copy-diff";

function fail(path:string,message:string):never{redirect(path+"?error="+encodeURIComponent(message));}

export async function followDeck(deckId:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next="+encodeURIComponent("/explore/"+deckId));
 const {data:deck}=await supabase.from("decks").select("owner_id,visibility").eq("id",deckId).maybeSingle();
 if(!deck||deck.visibility!=="public")fail("/explore/"+deckId,"Public deck not found.");
 const {data:relation}=await supabase.from("creator_relations").select("relation").eq("user_id",user.id).eq("creator_id",deck.owner_id).in("relation",["mute","block"]).limit(1).maybeSingle();
 if(relation)fail("/explore/"+deckId,"You cannot follow this creator while they are muted or blocked.");
 const {error}=await supabase.from("public_deck_follows").upsert({user_id:user.id,deck_id:deckId});if(error)fail("/explore/"+deckId,error.message);
 revalidatePath("/explore/"+deckId);redirect("/explore/"+deckId);
}

export async function copyDeckWithOptions(deckId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login?next="+encodeURIComponent("/explore/"+deckId));
 const requestedName=String(formData.get("name")||"").trim().slice(0,120);
 const updatePolicy=String(formData.get("update_policy")||"ask")==="accept_all"?"accept_all":"ask";
 const {data:source}=await supabase.from("decks").select("id,name,description,settings,updated_at,cards(*)").eq("id",deckId).eq("visibility","public").maybeSingle();
 if(!source)fail("/explore/"+deckId,"Public deck not found.");
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 if(!workspace)fail("/explore/"+deckId,"Personal workspace not found.");
 const copyName=requestedName||String(source.name)+" (copy)";
 const {data:deck,error}=await supabase.from("decks").insert({workspace_id:workspace.id,owner_id:user.id,name:copyName,description:source.description,visibility:"private",settings:source.settings}).select("id").single();
 if(error||!deck)fail("/explore/"+deckId,error?.message||"Unable to copy deck.");
 const rows=(source.cards??[]).map((card:any)=>({deck_id:deck.id,owner_id:user.id,kind:card.kind,content:{...card.content,_sourceCardId:card.id},sort_order:card.sort_order,is_suspended:false,is_marked:false}));
 if(rows.length){const {error:cardsError}=await supabase.from("cards").insert(rows);if(cardsError)fail("/explore/"+deckId,cardsError.message);}
 const {error:copyError}=await supabase.from("deck_copies").insert({user_id:user.id,source_deck_id:deckId,copied_deck_id:deck.id,source_updated_at:source.updated_at,last_synced_source_updated_at:source.updated_at,update_policy:updatePolicy});
 if(copyError)fail("/explore/"+deckId,copyError.message);
 revalidatePath("/decks");
 redirect("/decks/"+deck.id);
}

export async function copyDeck(deckId:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next="+encodeURIComponent("/explore/"+deckId));
 const {data:source}=await supabase.from("decks").select("id,name,description,settings,updated_at,cards(*)").eq("id",deckId).eq("visibility","public").maybeSingle();if(!source)fail("/explore/"+deckId,"Public deck not found.");
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();if(!workspace)fail("/explore/"+deckId,"Personal workspace not found.");
 const {data:deck,error}=await supabase.from("decks").insert({workspace_id:workspace.id,owner_id:user.id,name:source.name+" (copy)",description:source.description,visibility:"private",settings:source.settings}).select("id").single();if(error||!deck)fail("/explore/"+deckId,error?.message||"Unable to copy deck.");
 const rows=(source.cards??[]).map((c:any)=>({deck_id:deck.id,owner_id:user.id,kind:c.kind,content:{...c.content,_sourceCardId:c.id},sort_order:c.sort_order,is_suspended:false,is_marked:false}));
 if(rows.length){const {error:cardsError}=await supabase.from("cards").insert(rows);if(cardsError)fail("/explore/"+deckId,cardsError.message);}
 const {error:copyError}=await supabase.from("deck_copies").insert({user_id:user.id,source_deck_id:deckId,copied_deck_id:deck.id,source_updated_at:source.updated_at,last_synced_source_updated_at:source.updated_at,update_policy:"ask"});
 if(copyError)fail("/explore/"+deckId,copyError.message);
 revalidatePath("/decks");redirect("/decks/"+deck.id);
}

export async function acceptDeckUpdate(copiedDeckId:string):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:copy}=await supabase.from("deck_copies").select("source_deck_id,copied_deck_id,last_synced_source_updated_at").eq("user_id",user.id).eq("copied_deck_id",copiedDeckId).maybeSingle();
 if(!copy)fail("/decks/"+copiedDeckId,"Source relationship not found.");
 const {data:source}=await supabase.from("decks").select("id,name,description,settings,updated_at,cards(*)").eq("id",copy.source_deck_id).eq("visibility","public").maybeSingle();
 const {data:target}=await supabase.from("decks").select("id,name,description,settings,updated_at,cards(*)").eq("id",copiedDeckId).eq("owner_id",user.id).maybeSingle();
 if(!source||!target)fail("/decks/"+copiedDeckId,"Source or copied deck not found.");
 if(!copy.last_synced_source_updated_at||new Date(source.updated_at)<=new Date(copy.last_synced_source_updated_at)){redirect("/decks/"+copiedDeckId);}
 if(new Date(target.updated_at)>new Date(copy.last_synced_source_updated_at))fail("/decks/"+copiedDeckId,"Conflict detected: this copied deck has local changes. Resolve them before accepting the author update.");

 const sourceCards=source.cards??[];
 const targetCards=target.cards??[];
 const diff=diffCopiedCards(sourceCards,targetCards);
 const sourceById=new Map(sourceCards.map((card:any)=>[String(card.id),card]));
 const targetBySourceId=new Map(targetCards.filter((card:any)=>card.content?._sourceCardId).map((card:any)=>[String(card.content._sourceCardId),card]));

 for(const sourceCard of sourceCards){
  const local=targetBySourceId.get(String(sourceCard.id));
  const payload={kind:sourceCard.kind,content:{...sourceCard.content,_sourceCardId:sourceCard.id},sort_order:sourceCard.sort_order,is_suspended:sourceCard.is_suspended,is_marked:sourceCard.is_marked};
  if(local)await supabase.from("cards").update(payload).eq("id",local.id);
  else await supabase.from("cards").insert({...payload,deck_id:target.id,owner_id:user.id});
 }

 for(const local of targetCards){
  const sourceId=local.content?._sourceCardId;
  if(sourceId&&!sourceById.has(String(sourceId)))await supabase.from("cards").delete().eq("id",local.id);
 }

 const {error:deckError}=await supabase.from("decks").update({name:source.name+" (copy)",description:source.description,settings:source.settings}).eq("id",target.id);
 if(deckError)fail("/decks/"+copiedDeckId,deckError.message);

 await supabase.from("deck_copies").update({source_updated_at:source.updated_at,last_synced_source_updated_at:source.updated_at}).eq("user_id",user.id).eq("copied_deck_id",copiedDeckId);
 await supabase.from("deck_copy_update_history").insert({user_id:user.id,source_deck_id:copy.source_deck_id,copied_deck_id:copiedDeckId,source_updated_at:source.updated_at,card_changes:diff});
 revalidatePath("/decks/"+copiedDeckId);
 redirect("/decks/"+copiedDeckId);
}

export async function setDeckUpdatePolicy(copiedDeckId:string,policy:"ask"|"accept_all"):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {error}=await supabase.from("deck_copies").update({update_policy:policy}).eq("user_id",user.id).eq("copied_deck_id",copiedDeckId);
 if(error)fail("/decks/"+copiedDeckId,error.message);
 revalidatePath("/decks/"+copiedDeckId);redirect("/decks/"+copiedDeckId);
}
export async function reportDeck(deckId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login?next="+encodeURIComponent("/explore/"+deckId));
 const reason=String(formData.get("reason")||"").trim();
 const details=String(formData.get("details")||"").trim().slice(0,1000);
 if(!reason)fail("/explore/"+deckId,"Choose a report reason.");
 const {count:recentReports}=await supabase.from("deck_reports").select("id",{count:"exact",head:true}).eq("reporter_id",user.id).gte("created_at",new Date(Date.now()-60*60*1000).toISOString());
 if((recentReports??0)>=5)fail("/explore/"+deckId,"Report rate limit reached. Try again later.");
 const {data:duplicate}=await supabase.from("deck_reports").select("id").eq("deck_id",deckId).eq("reporter_id",user.id).is("resolved_at",null).limit(1).maybeSingle();
 if(duplicate)fail("/explore/"+deckId,"You already have an open report for this deck.");
 const {error}=await supabase.from("deck_reports").insert({deck_id:deckId,reporter_id:user.id,reason,details});
 if(error)fail("/explore/"+deckId,error.message);
 revalidatePath("/explore/"+deckId);redirect("/explore/"+deckId+"?reported=1");
}


export async function unfollowDeck(deckId:string):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {error}=await supabase.from("public_deck_follows").delete().eq("user_id",user.id).eq("deck_id",deckId);
 if(error)fail("/explore/"+deckId,error.message);
 revalidatePath("/explore");revalidatePath("/explore/"+deckId);revalidatePath("/explore/following");redirect("/explore/following");
}
