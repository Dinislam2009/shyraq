"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {normalizeCustomFields,normalizeMediaItems} from "@/lib/card-fields";
import {duplicateKey} from "@/lib/import/standard";
import {isStaleVersion} from "@/lib/concurrency";

function fail(path:string,message:string):never{redirect(path+"?error="+encodeURIComponent(message));}
function payload(formData:FormData){
 const rawFields=String(formData.get("fields")||"");
 const rawMediaItems=String(formData.get("media_items")||"");
 const rawReviewPreferences=String(formData.get("review_preferences")||"");
 const kind=String(formData.get("kind")||"basic");
 const content:any={front:String(formData.get("front")||""),back:String(formData.get("back")||"")};
 const templateId=String(formData.get("template_id")||"").trim();
 const tags=String(formData.get("tags")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,30);
 const markers=String(formData.get("markers")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,20);
 const status=String(formData.get("status")||"").trim().slice(0,60);
 const kindValue=["basic","reverse","cloze","multiple_choice","image","custom"].includes(String(formData.get("kind")||""))?String(formData.get("kind")):"basic";
 const templateId=String(formData.get("template_id")||"").trim();
 const options=String(formData.get("options")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,20);
 const answerRaw=String(formData.get("answer")||"").trim();
 const answer=Number.isFinite(Number(answerRaw))?Number(answerRaw):0;
 const imageUrl=String(formData.get("image_url")||"").trim().slice(0,2000);
 let fields:Record<string,unknown>={};
 let reviewPreferences:Record<string,unknown>={};
 try{const parsed=JSON.parse(String(formData.get("fields")||"{}"));if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))fields=parsed;}catch{}
 try{const parsed=JSON.parse(String(formData.get("review_preferences")||"{}"));if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))reviewPreferences=parsed;}catch{}
 if(tags.length)content.tags=tags;
 if(markers.length)content.markers=markers;
 if(status)content.status=status;
 if(kind==="multiple_choice"){
  content.options=String(formData.get("options")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,10);
  const requestedAnswer=Number(formData.get("answer")||0);
  content.answer=content.options.length?Math.max(0,Math.min(content.options.length-1,Number.isFinite(requestedAnswer)?Math.trunc(requestedAnswer):0)):0;
 }
 if(kind==="image"){
  const imageUrl=String(formData.get("image_url")||"").trim();
  if(imageUrl)content.imageUrl=imageUrl;
  const rawOcclusions=String(formData.get("occlusions")||"").trim();
  if(rawOcclusions){
   try{
    const parsed=JSON.parse(rawOcclusions);
    if(Array.isArray(parsed))content.occlusions=parsed.slice(0,100).map((row:any)=>({x:Number(row.x)||0,y:Number(row.y)||0,w:Number(row.w)||0,h:Number(row.h)||0})).filter((row:any)=>row.w>0&&row.h>0).map((row:any)=>({x:Math.max(0,Math.min(1,row.x)),y:Math.max(0,Math.min(1,row.y)),w:Math.max(0,Math.min(1,row.w)),h:Math.max(0,Math.min(1,row.h))}));
   }catch{}
  }
 }
 let fields:Record<string,string>={};
 try{fields=normalizeCustomFields(rawFields?JSON.parse(rawFields):{});}catch{}
 let mediaItems:Array<{path:string;mimeType?:string;name?:string}>=[];
 try{mediaItems=normalizeMediaItems(rawMediaItems?JSON.parse(rawMediaItems):[]);}catch{}
 if(Object.keys(fields).length)content.fields=fields;
 if(mediaItems.length)content.mediaItems=mediaItems;
 if(rawReviewPreferences){
  try{
   const parsed=JSON.parse(rawReviewPreferences);
   if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))content.reviewPreferences=parsed;
  }catch{}
 }
 return {kind,content,template_id:templateId||null};
}
function tagsFromForm(formData:FormData){return String(formData.get("tags")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,30);}
async function uploadMedia(supabase:any,userId:string,workspaceId:string,file:File){

 if(!file||file.size===0)return null;
 if(file.size>25*1024*1024)throw new Error("Media file is larger than 25 MB.");
 const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-120);
 const path=userId+"/"+crypto.randomUUID()+"-"+safe;
 let uploadError:any=null;
 for(let attempt=0;attempt<3;attempt++){
  const result=await supabase.storage.from("user-media").upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});
  uploadError=result.error;
  if(!uploadError)break;
  if(attempt<2)await new Promise(resolve=>setTimeout(resolve,250*(2**attempt)));
 }
 if(uploadError)throw new Error(uploadError.message);
 const {data,error}=await supabase.from("media").insert({workspace_id:workspaceId,owner_id:userId,storage_path:path,mime_type:file.type||"application/octet-stream",byte_size:file.size}).select("storage_path,mime_type").single();
 if(error){
  await supabase.storage.from("user-media").remove([path]);
  throw new Error(error.message);
 }
 return data;
}
async function validateLibraryMedia(supabase:any,userId:string,items:Array<{path:string;mimeType?:string;name?:string}>){
 if(!items.length)return [];
 const {data,error}=await supabase.from("media").select("storage_path,mime_type").eq("owner_id",userId).in("storage_path",items.map(item=>item.path));
 if(error)throw new Error(error.message);
 const allowed=new Map((data??[]).map((item:any)=>[String(item.storage_path),String(item.mime_type||"")]));
 return items.filter(item=>allowed.has(item.path)).map(item=>({...item,mimeType:item.mimeType||allowed.get(item.path)||""}));
}
async function cleanupMediaPaths(supabase:any,paths:string[]){
 const unique=[...new Set(paths.filter(Boolean))];
 if(!unique.length)return;
 await supabase.from("media").delete().in("storage_path",unique);
 await supabase.storage.from("user-media").remove(unique);
}
async function applyTags(supabase:any,cardId:string,workspaceId:string,names:string[]){
 if(!names.length){await supabase.from("card_tags").delete().eq("card_id",cardId);return;}
 const {data:tags,error:tagError}=await supabase.from("tags").upsert(names.map(name=>({workspace_id:workspaceId,name})),{onConflict:"workspace_id,name"}).select("id");
 if(tagError)throw new Error(tagError.message);
 const {error:clearError}=await supabase.from("card_tags").delete().eq("card_id",cardId);
 if(clearError)throw new Error(clearError.message);
 if(tags?.length){const {error}=await supabase.from("card_tags").insert(tags.map((tag:any)=>({card_id:cardId,tag_id:tag.id})));if(error)throw new Error(error.message);}
}
export async function createBulkCards(deckId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:deck}=await supabase.from("decks").select("workspace_id").eq("id",deckId).maybeSingle();
 if(!deck)fail("/decks/"+deckId,"Deck not found.");
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",deck.workspace_id).eq("user_id",user.id).maybeSingle();
 if(!["owner","admin","editor"].includes(String(member?.role||"")))fail("/decks/"+deckId,"You do not have permission to edit this deck.");
 const raw=String(formData.get("bulk")||"").replace(/\r\n/g,"\n");
 const lines=raw.split("\n");
 const rows=lines.map(line=>{
  const value=line.trim();
  if(!value)return null;
  const parts=value.includes("\t")?value.split("\t"):value.includes("||")?value.split("||"):value.split("|");
  return {front:String(parts[0]||"").trim(),back:String(parts.slice(1).join(value.includes("||")?"||":"|")||"").trim()};
 }).filter((row):row is {front:string;back:string}=>Boolean(row?.front||row?.back)).slice(0,500);
 if(!rows.length)fail("/decks/"+deckId+"/cards/bulk","Add at least one card.");
 const tagNames=String(formData.get("tags")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,30);
 const templateId=String(formData.get("template_id")||"").trim()||null;
 const duplicateMode=String(formData.get("duplicate_mode")||"skip");
 const selectedMedia=String(formData.get("media_path")||"").trim();
 if(selectedMedia){
  const {data:media}=await supabase.from("media").select("storage_path,mime_type").eq("owner_id",user.id).eq("storage_path",selectedMedia).maybeSingle();
  if(!media)fail("/decks/"+deckId+"/cards/bulk","Selected media is not available.");
 }
 const {data:existing}=await supabase.from("cards").select("id,content").eq("owner_id",user.id).limit(50000);
 const seen=new Set((existing??[]).map((card:any)=>duplicateKey({front:String(card.content?.front||""),back:String(card.content?.back||"")})));
 const inFile=new Set<string>();
 const toInsert=[];
 let skipped=0;
 for(const row of rows){
  const key=duplicateKey(row);
  if((duplicateMode==="skip"&&seen.has(key))||((duplicateMode!=="create")&&inFile.has(key))){skipped++;continue;}
  if(duplicateMode==="reject"&&seen.has(key))fail("/decks/"+deckId+"/cards/bulk","Duplicate found before creation.");
  if(duplicateMode!=="create")inFile.add(key);
  const content:any={front:row.front,back:row.back};
  if(tagNames.length)content.tags=tagNames;
  if(selectedMedia)content.mediaItems=[{path:selectedMedia,mimeType:"",name:selectedMedia.split("/").pop()||"media"}];
  toInsert.push({deck_id:deckId,owner_id:user.id,kind:"basic",content,template_id:templateId,sort_order:0});
 }
 const {data:last}=await supabase.from("cards").select("sort_order").eq("deck_id",deckId).order("sort_order",{ascending:false}).limit(1).maybeSingle();
 toInsert.forEach((row,index)=>{row.sort_order=(last?.sort_order??-1)+1+index;});
 if(toInsert.length){
  const {error}=await supabase.from("cards").insert(toInsert);
  if(error)fail("/decks/"+deckId+"/cards/bulk",error.message);
 }
 if(tagNames.length){
  const {data:created}=await supabase.from("cards").select("id").eq("deck_id",deckId).eq("owner_id",user.id).order("created_at",{ascending:false}).limit(toInsert.length||1);
  if(created?.length){
   const {data:tags,error}=await supabase.from("tags").upsert(tagNames.map(name=>({workspace_id:deck.workspace_id,name})),{onConflict:"workspace_id,name"}).select("id");
   if(error)fail("/decks/"+deckId+"/cards/bulk",error.message);
   const links=(created??[]).flatMap((card:any)=>(tags??[]).map((tag:any)=>({card_id:card.id,tag_id:tag.id})));
   if(links.length)await supabase.from("card_tags").upsert(links,{onConflict:"card_id,tag_id"});
  }
 }
 revalidatePath("/decks/"+deckId);
 redirect("/decks/"+deckId+"?bulk_created="+toInsert.length+"&bulk_skipped="+skipped);
}

export async function reorderCards(deckId:string,cardIds:string[]):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:deck}=await supabase.from("decks").select("workspace_id").eq("id",deckId).maybeSingle();
 if(!deck)fail("/decks/"+deckId,"Deck not found.");
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",deck.workspace_id).eq("user_id",user.id).maybeSingle();
 if(!["owner","admin","editor"].includes(String(member?.role||"")))fail("/decks/"+deckId,"You do not have permission to edit this deck.");
 const ordered=[...new Set(cardIds)].filter(Boolean).slice(0,500);
 for(let index=0;index<ordered.length;index++){
  const {error}=await supabase.from("cards").update({sort_order:index}).eq("id",ordered[index]).eq("deck_id",deckId);
  if(error)fail("/decks/"+deckId,error.message);
 }
 revalidatePath("/decks/"+deckId);
 redirect("/decks/"+deckId);
}

export async function bulkEditCards(deckId:string,cardIds:string[],formData:FormData):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:deck}=await supabase.from("decks").select("workspace_id").eq("id",deckId).maybeSingle();
 if(!deck)fail("/decks/"+deckId,"Deck not found.");
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",deck.workspace_id).eq("user_id",user.id).maybeSingle();
 if(!["owner","admin","editor"].includes(String(member?.role||"")))fail("/decks/"+deckId,"You do not have permission to edit this deck.");

 const ids=[...new Set(cardIds)].filter(Boolean).slice(0,500);
 if(!ids.length)fail("/decks/"+deckId,"Select at least one card.");

 const {data:cards}=await supabase.from("cards").select("id,content").eq("deck_id",deckId).in("id",ids);
 if(!cards?.length)fail("/decks/"+deckId,"Selected cards were not found.");

 const applyFront=formData.get("apply_front")==="on";
 const applyBack=formData.get("apply_back")==="on";
 const applyTags=formData.get("apply_tags")==="on";
 const applyMarkers=formData.get("apply_markers")==="on";
 const applyStatus=formData.get("apply_status")==="on";
 const applyKind=formData.get("apply_kind")==="on";
 const applyTemplate=formData.get("apply_template")==="on";
 const applyOptions=formData.get("apply_options")==="on";
 const applyAnswer=formData.get("apply_answer")==="on";
 const applyImage=formData.get("apply_image")==="on";
 const applyFields=formData.get("apply_fields")==="on";
 const applyReviewPreferences=formData.get("apply_review_preferences")==="on";
 const front=String(formData.get("front")||"").slice(0,20000);
 const back=String(formData.get("back")||"").slice(0,20000);
 const tags=String(formData.get("tags")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,30);
 const markers=String(formData.get("markers")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,20);
 const status=String(formData.get("status")||"").trim().slice(0,60);

 if(!applyFront&&!applyBack&&!applyTags&&!applyMarkers&&!applyStatus&&!applyKind&&!applyTemplate&&!applyOptions&&!applyAnswer&&!applyImage&&!applyFields&&!applyReviewPreferences)fail("/decks/"+deckId,"Choose at least one field to update.");

 for(const card of cards){
  const next={...(card.content&&typeof card.content==="object"?card.content:{})} as Record<string,unknown>;
  if(applyFront)next.front=front;
  if(applyBack)next.back=back;
  if(applyTags)next.tags=tags;
  if(applyMarkers)next.markers=markers;
  if(applyStatus){if(status)next.status=status;else delete next.status;}
  if(applyOptions)next.options=options;
  if(applyAnswer)next.answer=answer;
  if(applyImage){if(imageUrl)next.imageUrl=imageUrl;else delete next.imageUrl;}
  if(applyFields)next.fields=fields;
  if(applyReviewPreferences)next.reviewPreferences=reviewPreferences;
  const patch:any={content:next};
  if(applyKind)patch.kind=kindValue;
  if(applyTemplate)patch.template_id=templateId||null;
  const {error}=await supabase.from("cards").update(patch).eq("id",card.id).eq("deck_id",deckId);
  if(error)fail("/decks/"+deckId,error.message);
 }
 revalidatePath("/decks/"+deckId);
 redirect("/decks/"+deckId);
}

export async function createCard(deckId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:deck}=await supabase.from("decks").select("workspace_id").eq("id",deckId).maybeSingle();if(!deck)fail("/decks/"+deckId,"Deck not found.");
 const p=payload(formData);const mediaFile=formData.get("media_file");
 const libraryMedia=await validateLibraryMedia(supabase,user.id,p.content.mediaItems||[]); if(libraryMedia.length)p.content.mediaItems=libraryMedia; else delete p.content.mediaItems;
 if(mediaFile instanceof File&&mediaFile.size>0){try{const media=await uploadMedia(supabase,user.id,deck.workspace_id,mediaFile);if(media){p.content.mediaPath=media.storage_path;p.content.mediaType=media.mime_type;}}catch(error){fail("/decks/"+deckId+"/cards/new",error instanceof Error?error.message:"Unable to upload media.");}}
 const {data:last}=await supabase.from("cards").select("sort_order").eq("deck_id",deckId).order("sort_order",{ascending:false}).limit(1).maybeSingle();
 const {data:card,error}=await supabase.from("cards").insert({deck_id:deckId,owner_id:user.id,kind:p.kind,content:p.content,template_id:p.template_id,sort_order:(last?.sort_order??-1)+1}).select("id").single();
 if(error||!card){
  if(p.content.mediaPath)await cleanupMediaPaths(supabase,[p.content.mediaPath]);
  fail("/decks/"+deckId+"/cards/new",error?.message||"Unable to create card.");
 }
 try{await applyTags(supabase,card.id,deck.workspace_id,tagsFromForm(formData));}catch(error){
  await supabase.from("cards").delete().eq("id",card.id);
  if(p.content.mediaPath)await cleanupMediaPaths(supabase,[p.content.mediaPath]);
  fail("/decks/"+deckId+"/cards/new",error instanceof Error?error.message:"Unable to save tags.");
 }
 revalidatePath("/decks/"+deckId);redirect(formData.get("continue") === "1" ? "/decks/"+deckId+"/cards/new?created=1" : "/decks/"+deckId);
}
export async function updateCard(deckId:string,cardId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");const p=payload(formData);const mediaFile=formData.get("media_file");
 const libraryMedia=await validateLibraryMedia(supabase,user.id,p.content.mediaItems||[]); if(libraryMedia.length)p.content.mediaItems=libraryMedia; else delete p.content.mediaItems;
 const {data:existingCard}=await supabase.from("cards").select("content,updated_at,deck_id,owner_id").eq("id",cardId).eq("deck_id",deckId).maybeSingle();
 const expectedUpdatedAt=String(formData.get("expected_updated_at")||"").trim();
 if(isStaleVersion(expectedUpdatedAt,existingCard?.updated_at)){
  fail("/decks/"+deckId,"This card changed in another session. Reload it before saving.");
 }
 const oldMediaPath=existingCard?.content&&typeof existingCard.content==="object"?String((existingCard.content as any).mediaPath||""):"";
 if(existingCard?.content&&typeof existingCard.content==="object"){for(const key of ["mediaPath","mediaType","mediaItems"]){if((p.content as any)[key]===undefined&&(existingCard.content as any)[key]!==undefined)(p.content as any)[key]=(existingCard.content as any)[key];}}
 const submittedImageUrl=String(formData.get("image_url")||"").trim();
 if(p.kind==="image"&&submittedImageUrl){
  delete p.content.mediaPath;
  delete p.content.mediaType;
  p.content.occlusions=[];
 }
 const {data:deck}=await supabase.from("decks").select("workspace_id").eq("id",deckId).maybeSingle();
 if(!deck)fail("/decks/"+deckId,"Deck not found.");
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",deck.workspace_id).eq("user_id",user.id).maybeSingle();
 if(!["owner","admin","editor"].includes(String(member?.role||"")))fail("/decks/"+deckId,"You do not have permission to edit this deck.");
 if(mediaFile instanceof File&&mediaFile.size>0&&deck){try{const media=await uploadMedia(supabase,user.id,deck.workspace_id,mediaFile);if(media){p.content.mediaPath=media.storage_path;p.content.mediaType=media.mime_type;if(p.kind==="image")p.content.occlusions=[];}}catch(error){fail("/decks/"+deckId,error instanceof Error?error.message:"Unable to upload media.");}}
 const {error}=await supabase.from("cards").update(p).eq("id",cardId);
 if(error){
  if(mediaFile instanceof File&&mediaFile.size>0&&p.content.mediaPath&&p.content.mediaPath!==oldMediaPath)await cleanupMediaPaths(supabase,[p.content.mediaPath]);
  fail("/decks/"+deckId,error.message);
 }
 if(oldMediaPath&&oldMediaPath!==p.content.mediaPath)await cleanupMediaPaths(supabase,[oldMediaPath]);
 if(deck){try{await applyTags(supabase,cardId,deck.workspace_id,tagsFromForm(formData));}catch(error){fail("/decks/"+deckId,error instanceof Error?error.message:"Unable to save tags.");}}
 revalidatePath("/decks/"+deckId);redirect("/decks/"+deckId);
}
export async function deleteCard(deckId:string,cardId:string):Promise<void>{
 const supabase=await createClient();
 const {data:card}=await supabase.from("cards").select("content").eq("id",cardId).maybeSingle();
 const mediaPath=card?.content&&typeof card.content==="object"?String((card.content as any).mediaPath||""):"";
 const {error}=await supabase.from("cards").delete().eq("id",cardId);if(error)fail("/decks/"+deckId,error.message);
 if(mediaPath)await cleanupMediaPaths(supabase,[mediaPath]);
 revalidatePath("/decks/"+deckId);redirect("/decks/"+deckId);
}
export async function setCardFlag(deckId:string,cardId:string,field:"is_marked"|"is_suspended",value:boolean):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {error}=await supabase.from("cards").update({[field]:value}).eq("id",cardId);
 if(error)fail("/decks/"+deckId,error.message);
 revalidatePath("/decks/"+deckId);
 revalidatePath("/review");
 redirect("/decks/"+deckId);
}

export async function bulkSetCardFlag(deckId:string,cardIds:string[],field:"is_marked"|"is_suspended",value:boolean):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const ids=[...new Set(cardIds)].filter(Boolean).slice(0,500);
 if(!ids.length)redirect("/decks/"+deckId);
 const {error}=await supabase.from("cards").update({[field]:value}).eq("deck_id",deckId).in("id",ids);
 if(error)fail("/decks/"+deckId,error.message);
 revalidatePath("/decks/"+deckId);
 revalidatePath("/review");
 redirect("/decks/"+deckId);
}

export async function bulkDeleteCards(deckId:string,cardIds:string[]):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const ids=[...new Set(cardIds)].filter(Boolean).slice(0,500);
 if(!ids.length)redirect("/decks/"+deckId);
 const {data:cards}=await supabase.from("cards").select("content").eq("deck_id",deckId).in("id",ids);
 const mediaPaths=(cards??[]).map((card:any)=>card.content&&typeof card.content==="object"?String(card.content.mediaPath||""):"").filter(Boolean);
 const {error}=await supabase.from("cards").delete().eq("deck_id",deckId).in("id",ids);
 if(error)fail("/decks/"+deckId,error.message);
 if(mediaPaths.length)await cleanupMediaPaths(supabase,mediaPaths);
 revalidatePath("/decks/"+deckId);
 revalidatePath("/review");
 redirect("/decks/"+deckId);
}
