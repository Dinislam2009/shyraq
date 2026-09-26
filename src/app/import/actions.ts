"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { unzipSync } from "fflate";
import { verifyArchiveChecksums } from "@/lib/backup/integrity";
import { parseStandardText, validateImportRows, duplicateKey, type ImportRow } from "@/lib/import/standard";

function fail(message:string):never{ redirect("/import?error="+encodeURIComponent(message)); }
function safeCollectionKind(value:string){
 return value==="favorites"||value==="smart"?value:"custom";
}
function safeKind(value:string){
 const allowed=["basic","reverse","cloze","multiple_choice","image","custom"];
 return allowed.includes(value)?value:"basic";
}
function replaceMediaRefs(value:any,map:Map<string,string>):any{
 if(typeof value==="string")return map.get(value)||value;
 if(Array.isArray(value))return value.map(item=>replaceMediaRefs(item,map));
 if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,replaceMediaRefs(item,map)]));
 return value;
}
async function getWorkspace(supabase:any,userId:string){
 const {data}=await supabase.from("workspaces").select("id").eq("owner_id",userId).eq("kind","personal").limit(1).maybeSingle();
 return data;
}
async function createDeckWithTemplate(supabase:any,userId:string,workspaceId:string,sourceDeck:any,deckMap:Map<string,string>){
 const visibility=["private","workspace","public"].includes(String(sourceDeck.visibility))?String(sourceDeck.visibility):"private";
 const settings={...(sourceDeck.settings||{}),backup_source_deck_id:sourceDeck.id};
 const {data:deck,error}=await supabase.from("decks").insert({workspace_id:workspaceId,owner_id:userId,name:String(sourceDeck.name||"Imported deck"),description:String(sourceDeck.description||""),visibility,settings}).select("id").single();
 if(error||!deck)throw new Error(error?.message||"Unable to restore deck.");
 deckMap.set(String(sourceDeck.id),deck.id);
 return deck.id;
}
async function cleanupRestore(supabase:any,deckIds:string[],collectionIds:string[],mediaPaths:string[]){
 const uniqueDecks=[...new Set(deckIds.filter(Boolean))];
 const uniqueCollections=[...new Set(collectionIds.filter(Boolean))];
 const uniqueMedia=[...new Set(mediaPaths.filter(Boolean))];
 if(uniqueCollections.length)await supabase.from("collections").delete().in("id",uniqueCollections);
 if(uniqueDecks.length)await supabase.from("decks").delete().in("id",uniqueDecks);
 if(uniqueMedia.length){
  await supabase.from("media").delete().in("storage_path",uniqueMedia);
  await supabase.storage.from("user-media").remove(uniqueMedia);
 }
}

export async function restoreBackup(supabase:any,userId:string,workspaceId:string,payload:any,archive?:Record<string,Uint8Array>,selectedDeckIds?:Set<string>,conflictMode:"duplicate"|"skip"="duplicate"){
 if(payload?.format!=="shyraq-backup-v2")throw new Error("Unsupported Shyraq backup format.");
 const deckMap=new Map<string,string>();
 const templateMap=new Map<string,string>();
 const tagMap=new Map<string,string>();
 const cardMap=new Map<string,string>();
 const collectionMap=new Map<string,string>();
 const mediaMap=new Map<string,string>();
 const createdDeckIds:string[]=[];
 const createdCollectionIds:string[]=[];
 const uploadedMediaPaths:string[]=[];
 let restoredMedia=0;

 try{
  const media=Array.isArray(payload.media)?payload.media:[];
  for(const item of media){
  const oldPath=String(item.storage_path||"");
  if(!oldPath||!archive)continue;
  const exactKey="media/"+oldPath.replace(/^\/+/, "");
  const basename=oldPath.split("/").pop()||oldPath;
  const fallbackKey="media/"+basename;
  const bytes=archive[exactKey]||archive[fallbackKey];
  if(!bytes)continue;
  const safe=basename.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-120);
  const newPath=userId+"/restore/"+crypto.randomUUID()+"-"+safe;
  const {error:uploadError}=await supabase.storage.from("user-media").upload(newPath,bytes,{contentType:String(item.mime_type||"application/octet-stream"),upsert:false});
  if(uploadError)throw new Error(uploadError.message);
   uploadedMediaPaths.push(newPath);
  const {error:metaError}=await supabase.from("media").insert({workspace_id:workspaceId,owner_id:userId,storage_path:newPath,mime_type:String(item.mime_type||"application/octet-stream"),byte_size:bytes.byteLength});
  if(metaError)throw new Error(metaError.message);
  mediaMap.set(oldPath,newPath); restoredMedia++;
 }

 const allSourceDecks=Array.isArray(payload.decks)?payload.decks:[];
 const selectedSourceDecks=selectedDeckIds&&selectedDeckIds.size?allSourceDecks.filter((deck:any)=>selectedDeckIds.has(String(deck.id))):allSourceDecks;
 const names=selectedSourceDecks.map((deck:any)=>String(deck.name||"Imported deck")).filter(Boolean);
 const {data:existingDecks}=await supabase.from("decks").select("name").eq("owner_id",userId).eq("workspace_id",workspaceId).in("name",names.length?names:["__none__"]);
 const conflictNames=new Set((existingDecks??[]).map((deck:any)=>String(deck.name||"")));
 const conflicts=selectedSourceDecks.filter((deck:any)=>conflictNames.has(String(deck.name||""))).length;
 const sourceDecks=conflictMode==="skip"?selectedSourceDecks.filter((deck:any)=>!conflictNames.has(String(deck.name||""))):selectedSourceDecks;
 for(const deck of sourceDecks){
   const deckId=await createDeckWithTemplate(supabase,userId,workspaceId,deck,deckMap);
   createdDeckIds.push(deckId);
  }

 const templates=Array.isArray(payload.templates)?payload.templates:[];
 const restoredTemplateDecks=new Set<string>();
 for(const template of templates){
  const deckId=deckMap.get(String(template.deck_id)); if(!deckId)continue;
  const {data,error}=await supabase.from("card_templates").insert({deck_id:deckId,name:String(template.name||"Template"),front_template:String(template.front_template||"{{front}}"),back_template:String(template.back_template||"{{back}}"),css:String(template.css||""),field_schema:Array.isArray(template.field_schema)?template.field_schema:[]}).select("id").single();
  if(error)throw new Error(error.message);
  if(data){templateMap.set(String(template.id),data.id);restoredTemplateDecks.add(String(template.deck_id));}
 }

 for(const sourceDeck of sourceDecks){
  const sourceId=String(sourceDeck.id);
  const deckId=deckMap.get(sourceId);
  if(deckId&&!restoredTemplateDecks.has(sourceId)){
   const {error}=await supabase.from("card_templates").insert({deck_id:deckId,name:"Basic",front_template:"{{front}}",back_template:"{{back}}",css:"",field_schema:[{name:"front",type:"text"},{name:"back",type:"text"}]});
   if(error)throw new Error(error.message);
  }
 }

 const tags=Array.isArray(payload.tags)?payload.tags:[];
 for(const tag of tags){
  const name=String(tag.name||"").trim(); if(!name)continue;
  const {data,error}=await supabase.from("tags").upsert({workspace_id:workspaceId,name},{onConflict:"workspace_id,name"}).select("id").single();
  if(error)throw new Error(error.message);
  if(data&&tag.id)tagMap.set(String(tag.id),data.id);
 }

 const cards=Array.isArray(payload.cards)?payload.cards:[];
 let restoredCards=0;
 for(const source of cards){
  const deckId=deckMap.get(String(source.deck_id)); if(!deckId)continue;
  let content=replaceMediaRefs(source.content||{},mediaMap);
  if(!archive&&content&&typeof content==="object"){const copy={...content};delete copy.mediaPath;delete copy.mediaType;delete copy.mediaItems;content=copy;}
  const templateId=source.template_id?templateMap.get(String(source.template_id)):null;
  const {data,error}=await supabase.from("cards").insert({deck_id:deckId,owner_id:userId,kind:safeKind(String(source.kind||"basic")),content,template_id:templateId||null,sort_order:Number(source.sort_order)||0,is_suspended:Boolean(source.is_suspended),is_marked:Boolean(source.is_marked)}).select("id").single();
  if(error)throw new Error(error.message);
  if(data){cardMap.set(String(source.id),data.id);restoredCards++;}
 }

 const cardTags=Array.isArray(payload.cardTags)?payload.cardTags:[];
 for(const relation of cardTags){
  const cardId=cardMap.get(String(relation.card_id)); const tagId=tagMap.get(String(relation.tag_id));
  if(!cardId||!tagId)continue;
  const {error}=await supabase.from("card_tags").upsert({card_id:cardId,tag_id:tagId},{onConflict:"card_id,tag_id"});
  if(error)throw new Error(error.message);
 }

 const collections=Array.isArray(payload.collections)?payload.collections:[];
 for(const collection of collections){
  const {data,error}=await supabase.from("collections").insert({
    workspace_id:workspaceId,
    owner_id:userId,
    name:String(collection.name||"Imported collection"),
    description:String(collection.description||"").slice(0,5000),
    kind:safeCollectionKind(String(collection.kind||"custom")),
    rule:collection.rule&&typeof collection.rule==="object"&&!Array.isArray(collection.rule)?collection.rule:{},
    sort_mode:String(collection.sort_mode||"manual").slice(0,40),
    is_public:Boolean(collection.is_public),
    is_featured:Boolean(collection.is_featured)
   }).select("id").single();
   if(error)throw new Error(error.message);
   if(data){
    createdCollectionIds.push(data.id);
    if(collection.id)collectionMap.set(String(collection.id),data.id);
   }
 }

 const collectionCards=Array.isArray(payload.collectionCards)?payload.collectionCards:[];
 for(const relation of collectionCards){
  const collectionId=collectionMap.get(String(relation.collection_id)); const cardId=cardMap.get(String(relation.card_id));
  if(!collectionId||!cardId)continue;
  const {error}=await supabase.from("collection_cards").upsert({collection_id:collectionId,card_id:cardId},{onConflict:"collection_id,card_id"});
  if(error)throw new Error(error.message);
 }

 const states=Array.isArray(payload.reviewStates)?payload.reviewStates:[];
 const stateRows=states.map((state:any)=>{
  const cardId=cardMap.get(String(state.card_id)); if(!cardId)return null;
  return {user_id:userId,card_id:cardId,queue:state.queue,state_data:replaceMediaRefs(state.state_data||{},mediaMap),due_at:state.due_at,last_reviewed_at:state.last_reviewed_at,reps:Number(state.reps)||0,lapses:Number(state.lapses)||0,stability:state.stability,difficulty:state.difficulty,scheduled_days:Number(state.scheduled_days)||0};
 }).filter(Boolean);
 if(stateRows.length){const {error}=await supabase.from("review_states").upsert(stateRows,{onConflict:"user_id,card_id"});if(error)throw new Error(error.message);}

 const events=Array.isArray(payload.reviewEvents)?payload.reviewEvents:[];
 const eventRows=events.map((event:any)=>{
  const cardId=cardMap.get(String(event.card_id)); if(!cardId)return null;
  return {event_key:crypto.randomUUID(),user_id:userId,card_id:cardId,device_id:event.device_id||crypto.randomUUID(),client_sequence:Number(event.client_sequence)||Date.now(),reviewed_at:event.reviewed_at,rating:event.rating,elapsed_ms:Number(event.elapsed_ms)||0,previous_state:event.previous_state||{},next_state:event.next_state||{},metadata:{...(event.metadata||{}),restored_from_backup:true}};
 }).filter(Boolean);
 if(eventRows.length){const {error}=await supabase.from("review_events").insert(eventRows);if(error)throw new Error(error.message);}

 const preferences=payload.reviewPreferences;
 if(preferences){
  const {error}=await supabase.from("review_preferences").upsert({user_id:userId,desired_retention:Number(preferences.desired_retention)||0.9,maximum_interval:Number(preferences.maximum_interval)||36500,learning_steps:Array.isArray(preferences.learning_steps)?preferences.learning_steps:["1m","10m"],relearning_steps:Array.isArray(preferences.relearning_steps)?preferences.relearning_steps:["10m"],new_cards_per_day:Number(preferences.new_cards_per_day)||20,reviews_per_day:Number(preferences.reviews_per_day)||9999,enable_fuzz:preferences.enable_fuzz!==false,enable_short_term:preferences.enable_short_term!==false,rating_labels:preferences.rating_labels??null,rating_order:Array.isArray(preferences.rating_order)?preferences.rating_order:null,show_keyboard_hints:preferences.show_keyboard_hints!==false,swipe_enabled:preferences.swipe_enabled!==false});
  if(error)throw new Error(error.message);
 }

 const deckCopies=Array.isArray(payload.deckCopies)?payload.deckCopies:[];
 for(const copy of deckCopies){
  const sourceDeckId=deckMap.get(String(copy.source_deck_id));
  const copiedDeckId=deckMap.get(String(copy.copied_deck_id));
  if(!sourceDeckId||!copiedDeckId)continue;
  const {error}=await supabase.from("deck_copies").upsert({
   user_id:userId,
   source_deck_id:sourceDeckId,
   copied_deck_id:copiedDeckId,
   source_updated_at:copy.source_updated_at??null,
   last_synced_source_updated_at:copy.last_synced_source_updated_at??null,
   update_policy:copy.update_policy==="accept_all"?"accept_all":"ask"
  },{onConflict:"user_id,source_deck_id,copied_deck_id"});
  if(error)throw new Error(error.message);
 }

 const follows=Array.isArray(payload.publicDeckFollows)?payload.publicDeckFollows:[];
 for(const follow of follows){
  const deckId=deckMap.get(String(follow.deck_id)); if(!deckId)continue;
  const {error}=await supabase.from("public_deck_follows").upsert({user_id:userId,deck_id:deckId},{onConflict:"user_id,deck_id"});
  if(error)throw new Error(error.message);
 }

 return {restoredCards,restoredMedia,conflicts};
 }catch(error){
  await cleanupRestore(supabase,createdDeckIds,createdCollectionIds,uploadedMediaPaths);
  throw error;
 }
}

async function importStandardRows(supabase:any,userId:string,workspaceId:string,rows:ImportRow[],mode:"create"|"skip"|"replace"){
 const issues=validateImportRows(rows);
 if(issues.length)throw new Error("Validation failed: "+issues.slice(0,8).map(issue=>"row "+issue.row+" "+issue.message).join("; "));
 const {data:existing,error:existingError}=await supabase.from("cards").select("id,deck_id,kind,content,is_suspended,is_marked").eq("owner_id",userId).limit(50000);
 if(existingError)throw new Error(existingError.message);
 const byKey=new Map<string,any>((existing??[]).map((card:any)=>[duplicateKey({front:String(card.content?.front||""),back:String(card.content?.back||"")}),card]));
 const deckName="Imported "+new Date().toLocaleDateString("en-GB");
 const {data:deck,error:deckError}=await supabase.from("decks").insert({workspace_id:workspaceId,owner_id:userId,name:deckName,description:"Imported into Shyraq",visibility:"private"}).select("id").single();
 if(deckError||!deck)throw new Error(deckError?.message||"Unable to create import deck.");
 const {error:templateError}=await supabase.from("card_templates").insert({deck_id:deck.id,name:"Basic",front_template:"{{front}}",back_template:"{{back}}",css:"",field_schema:[{name:"front",type:"text"},{name:"back",type:"text"}]});
 if(templateError)throw new Error(templateError.message);
 const inserted:string[]=[];
 const updated:Array<{id:string;patch:any}>= [];
 let skipped=0, replaced=0, created=0;
 try{
  let sortOrder=0;
  for(const row of rows){
   const key=duplicateKey(row);
   const duplicate=byKey.get(key);
   const payload={front:row.front,back:row.back,tags:row.tags,options:row.options,answer:row.answer,imageUrl:row.imageUrl,fields:row.fields};
   if(duplicate&&mode==="skip"){skipped++;continue;}
   if(duplicate&&mode==="replace"){
    updated.push({id:duplicate.id,patch:{kind:duplicate.kind,content:duplicate.content,is_suspended:duplicate.is_suspended,is_marked:duplicate.is_marked}});
    const {error}=await supabase.from("cards").update({kind:row.kind,content:payload}).eq("id",duplicate.id);
    if(error)throw new Error(error.message);
    replaced++;
    continue;
   }
   const {data:card,error}=await supabase.from("cards").insert({deck_id:deck.id,owner_id:userId,kind:row.kind,content:payload,sort_order:sortOrder++}).select("id").single();
   if(error||!card)throw new Error(error?.message||"Unable to insert imported card.");
   inserted.push(card.id);
   created++;
  }
  return {deckId:deck.id,created,replaced,skipped};
 }catch(error){
  for(const original of updated){await supabase.from("cards").update(original.patch).eq("id",original.id);}
  if(inserted.length)await supabase.from("cards").delete().in("id",inserted);
  await supabase.from("card_templates").delete().eq("deck_id",deck.id);
  await supabase.from("decks").delete().eq("id",deck.id);
  throw error;
 }
}

export async function importCards(formData:FormData):Promise<void>{
 const file=formData.get("file");
 if(!(file instanceof File)||file.size===0)fail("Choose a file.");
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const workspace=await getWorkspace(supabase,user.id);
 if(!workspace)fail("Personal workspace not found.");

 try{
  const filename=file.name.toLowerCase();
  if(filename.endsWith(".zip")){
   const archive=unzipSync(new Uint8Array(await file.arrayBuffer()));
   verifyArchiveChecksums(archive);
   const backup=archive["shyraq-backup.json"];
   if(!backup)throw new Error("This ZIP does not contain shyraq-backup.json.");
   const payload=JSON.parse(new TextDecoder().decode(backup));
   const result=await restoreBackup(supabase,user.id,workspace.id,payload,archive);
   revalidatePath("/decks");revalidatePath("/statistics");
   redirect("/decks?restored="+result.restoredCards+"&media="+result.restoredMedia+"&conflicts="+result.conflicts);
  }

  const text=await file.text();
  const previewConfirmed=String(formData.get("preview_confirmed")||"") === "1";
  const rawDuplicateMode=String(formData.get("duplicate_mode")||"skip");
  const duplicateMode: "create"|"skip"|"replace" = rawDuplicateMode==="create"||rawDuplicateMode==="replace"||rawDuplicateMode==="skip" ? rawDuplicateMode : "skip";
  if(file.size>200*1024*1024)throw new Error("Import file is larger than 200 MB.");
  if(!previewConfirmed)throw new Error("Run the import preview and validation before importing.");

  if(filename.endsWith(".json")){
   const data=JSON.parse(text);
   if(data?.format==="shyraq-backup-v2"){
    let selectedDeckIds:Set<string>|undefined;
    try{const raw=String(formData.get("restore_decks")||"");const parsed=raw?JSON.parse(raw):[];if(Array.isArray(parsed)&&parsed.length)selectedDeckIds=new Set(parsed.map(value=>String(value)));}catch{}
    const rawConflictMode=String(formData.get("conflict_mode")||"duplicate");
    const conflictMode: "duplicate"|"skip" = rawConflictMode==="skip" ? "skip" : "duplicate";
    const result=await restoreBackup(supabase,user.id,workspace.id,data,undefined,selectedDeckIds,conflictMode);
    revalidatePath("/decks");revalidatePath("/statistics");
    redirect("/decks?restored="+result.restoredCards+"&media="+result.restoredMedia);
   }
  }

  const rows=parseStandardText(text,file.name);
  const result=await importStandardRows(supabase,user.id,workspace.id,rows,duplicateMode);
  revalidatePath("/decks");revalidatePath("/statistics");
  redirect("/decks?imported="+result.created+"&replaced="+result.replaced+"&skipped="+result.skipped);
 }catch(error){
  if(error instanceof Error&&error.message.startsWith("NEXT_REDIRECT"))throw error;
  fail(error instanceof Error?error.message:"Unable to import file.");
 }
}