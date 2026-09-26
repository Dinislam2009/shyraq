"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {parseAnkiPackage,type AnkiTemplate} from "@/lib/import/anki";
import {revalidatePath} from "next/cache";
import {createEmptyCard,fsrs,Rating} from "ts-fsrs";

const ratingMap:Record<number,"again"|"hard"|"good"|"easy">={1:"again",2:"hard",3:"good",4:"easy"};
function fail(message:string):never{redirect("/import/anki?error="+encodeURIComponent(message));}

async function cleanupImport(supabase:any,deckIds:string[],mediaPaths:string[]){
 if(deckIds.length)await supabase.from("decks").delete().in("id",deckIds);
 if(mediaPaths.length){
  await supabase.from("media").delete().in("storage_path",mediaPaths);
  await supabase.storage.from("user-media").remove(mediaPaths);
 }
}

async function uploadImportedMedia(supabase:any,userId:string,workspaceId:string,mediaFiles:Record<string,Uint8Array>,uploadedPaths:string[]){
 const paths=new Map<string,{path:string;mime_type:string}>();
 for(const [name,bytes] of Object.entries(mediaFiles)){
  const safe=name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-120);
  const path=userId+"/anki/"+crypto.randomUUID()+"-"+safe;
  const ext=name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const mime=ext==="mp3"?"audio/mpeg":ext==="wav"?"audio/wav":ext==="mp4"?"video/mp4":/^(png|jpg|jpeg|gif|webp)$/.test(ext||"")?"image/"+(ext==="jpg"?"jpeg":ext):"application/octet-stream";
  const {error:uploadError}=await supabase.storage.from("user-media").upload(path,bytes,{contentType:mime,upsert:false});
  if(uploadError)throw new Error("Media upload failed for "+name+": "+uploadError.message);
  uploadedPaths.push(path);
  const {error}=await supabase.from("media").insert({workspace_id:workspaceId,owner_id:userId,storage_path:path,mime_type:mime,byte_size:bytes.byteLength});
  if(error)throw new Error(error.message);
  paths.set(name,{path,mime_type:mime});
 }
 return paths;
}

function cleanMediaTokens(value:string,mediaNames:string[]){
 let result=String(value||"");
 for(const name of mediaNames)result=result.replaceAll("__SHYRAQ_MEDIA__"+encodeURIComponent(name),"");
 return result;
}

function templateRecord(source:AnkiTemplate,deckId:string){
 return {
  deck_id:deckId,
  name:source.name,
  front_template:source.frontTemplate||"{{front}}",
  back_template:source.backTemplate||"{{back}}",
  css:source.css||"",
  field_schema:source.fields.map(name=>({name,type:"text"}))
 };
}

export async function importAnki(formData:FormData):Promise<void>{
 const file=formData.get("file");
 if(!(file instanceof File))fail("Choose an .apkg file.");
 if(!file.name.toLowerCase().endsWith(".apkg"))fail("Only .apkg files are accepted here.");
 if(file.size>512*1024*1024)fail("This .apkg is larger than 512 MB. Split the export into smaller packages before importing.");

 let parsed;
 try{parsed=await parseAnkiPackage(new Uint8Array(await file.arrayBuffer()));}
 catch(error){fail(error instanceof Error?error.message:"Unable to read APKG.");}

 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");

 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 if(!workspace)fail("Personal workspace not found.");

 const createdDeckIds:string[]=[];
 const uploadedPaths:string[]=[];

 try{
  const mediaPaths=await uploadImportedMedia(supabase,user.id,workspace.id,parsed.mediaFiles,uploadedPaths);
  const sourceToImported=new Map<number,string>();
  const templateIdsByKey=new Map<string,string>();
  let imported=0;

  for(const sourceDeck of parsed.decks){
   const {data:deck,error:deckError}=await supabase.from("decks").insert({
    workspace_id:workspace.id,owner_id:user.id,name:sourceDeck.name,description:sourceDeck.description,visibility:"private",
    settings:{source:"anki",ankiDeckId:sourceDeck.id,compatibilityWarnings:parsed.warnings}
   }).select("id").single();
   if(deckError||!deck)throw new Error(deckError?.message||"Unable to create imported deck.");
   createdDeckIds.push(deck.id);

   const modelIds=[...new Set(sourceDeck.cards.map(card=>String(card.modelId)))];
   const relevantTemplates=parsed.templates.filter(template=>modelIds.includes(String(template.sourceModelId)));
   for(const sourceTemplate of relevantTemplates){
    const {data:template,error:templateError}=await supabase.from("card_templates").insert(templateRecord(sourceTemplate,deck.id)).select("id").single();
    if(templateError||!template)throw new Error(templateError?.message||"Unable to create imported card template.");
    templateIdsByKey.set(deck.id+":"+String(sourceTemplate.sourceModelId)+":"+String(sourceTemplate.ord),template.id);
   }

   const rows=sourceDeck.cards.map((card,index)=>{
    const mediaItems=card.mediaNames.map(name=>{
     const item=mediaPaths.get(name);return item?{name,path:item.path,mime_type:item.mime_type}:null;
    }).filter(Boolean);
    const fields={...card.fields};
    for(const key of Object.keys(fields))fields[key]=cleanMediaTokens(fields[key],card.mediaNames);
    const rawFields={...card.rawFields};
    const front=cleanMediaTokens(card.front,card.mediaNames);
    const back=cleanMediaTokens(card.back,card.mediaNames);
    fields.front=front;
    fields.back=back;
    return {
     deck_id:deck.id,owner_id:user.id,kind:card.kind,
     content:{front,back,tags:card.tags,fields,mediaItems,clozeIndex:card.kind==="cloze"?card.ord+1:undefined,anki:{sourceCardId:card.sourceCardId,sourceModelId:card.modelId,ord:card.ord,due:card.due,interval:card.interval,reps:card.reps,lapses:card.lapses,factor:card.factor,queue:card.queue,type:card.type,flags:card.flags,deckName:card.deckName,modelName:card.modelName,rawFields}},
     template_id:templateIdsByKey.get(deck.id+":"+String(card.modelId)+":"+String(card.ord))||templateIdsByKey.get(deck.id+":"+String(card.modelId)+":0")||null,
     sort_order:index,
     is_suspended:card.queue===-1,
     is_marked:card.flags>0
    };
   });

   for(let offset=0;offset<rows.length;offset+=500){
    const chunk=rows.slice(offset,offset+500);
    if(!chunk.length)continue;
    const {data:created,error:cardsError}=await supabase.from("cards").insert(chunk).select("id");
    if(cardsError)throw new Error(cardsError.message);
    for(let index=0;index<sourceDeck.cards.slice(offset,offset+chunk.length).length;index++){
     const sourceId=sourceDeck.cards[offset+index].sourceCardId;
     const importedId=created?.[index]?.id;
     if(importedId)sourceToImported.set(sourceId,importedId);
    }
    imported+=chunk.length;
   }
  }

  const scheduler=fsrs({request_retention:0.9,maximum_interval:36500,enable_fuzz:true,enable_short_term:true,learning_steps:["1m","10m"],relearning_steps:["10m"]});
  const ratingValues={again:Rating.Again,hard:Rating.Hard,good:Rating.Good,easy:Rating.Easy} as const;
  const reviewsByCard=new Map<number,any[]>();
  for(const review of parsed.reviews){
   const bucket=reviewsByCard.get(review.cardId)||[];
   bucket.push(review);
   reviewsByCard.set(review.cardId,bucket);
  }

  const reviewStateRows:any[]=[];
  for(const [sourceCardId,history] of reviewsByCard.entries()){
   const importedCardId=sourceToImported.get(sourceCardId);
   if(!importedCardId||!history.length)continue;
   history.sort((a,b)=>Number(a.timestamp)-Number(b.timestamp));
   let state=createEmptyCard(new Date(history[0].timestamp));
   let lastTimestamp=history[0].timestamp;
   for(const review of history){
    const mapped=ratingMap[review.rating];
    if(!mapped)continue;
    const result=scheduler.next(state,new Date(review.timestamp),ratingValues[mapped]);
    state=result.card;
    lastTimestamp=review.timestamp;
   }
   const stateJson=JSON.parse(JSON.stringify(state));
   const queue=state.state===2?"review":state.state===3?"relearning":"learning";
   reviewStateRows.push({
    user_id:user.id,card_id:importedCardId,queue,state_data:stateJson,due_at:new Date(state.due).toISOString(),
    last_reviewed_at:new Date(lastTimestamp).toISOString(),reps:Number(state.reps)||0,lapses:Number(state.lapses)||0,
    stability:Number(state.stability)||null,difficulty:Number(state.difficulty)||null,scheduled_days:Number(state.scheduled_days)||0
   });
  }

  if(reviewStateRows.length){
   for(let offset=0;offset<reviewStateRows.length;offset+=500){
    const {error}=await supabase.from("review_states").upsert(reviewStateRows.slice(offset,offset+500),{onConflict:"user_id,card_id"});
    if(error)throw new Error(error.message);
   }
  }

  const reviewRows=parsed.reviews.flatMap(review=>{
   const importedCardId=sourceToImported.get(review.cardId);
   if(!importedCardId)return[];
   return [{event_key:crypto.randomUUID(),user_id:user.id,card_id:importedCardId,device_id:crypto.randomUUID(),
    reviewed_at:new Date(review.timestamp).toISOString(),rating:ratingMap[review.rating],elapsed_ms:review.timeMs,
    previous_state:{source:"anki",interval:review.lastInterval},next_state:{source:"anki",interval:review.interval,factor:review.factor,type:review.type},
    metadata:{source:"anki",sourceCardId:review.cardId,event_kind:"review"}
   }];
  });
  for(let offset=0;offset<reviewRows.length;offset+=500){
   const chunk=reviewRows.slice(offset,offset+500);
   if(!chunk.length)continue;
   const {error}=await supabase.from("review_events").insert(chunk);
   if(error)throw new Error(error.message);
  }

  revalidatePath("/decks");
  revalidatePath("/statistics");
  revalidatePath("/history");
  redirect("/decks?imported="+imported);
 }catch(error){
  await cleanupImport(supabase,createdDeckIds,uploadedPaths);
  fail(error instanceof Error?error.message:"Unable to complete Anki import.");
 }
}
