"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {parseAnkiPackage} from "@/lib/import/anki";
import {revalidatePath} from "next/cache";
import {createEmptyCard,fsrs,Rating} from "ts-fsrs";

const ratingMap:Record<number,"again"|"hard"|"good"|"easy">={1:"again",2:"hard",3:"good",4:"easy"};
function fail(message:string):never{redirect("/import/anki?error="+encodeURIComponent(message));}

async function uploadImportedMedia(supabase:any,userId:string,workspaceId:string,mediaFiles:Record<string,Uint8Array>){
 const paths=new Map<string,{path:string;mime_type:string}>();
 for(const [name,bytes] of Object.entries(mediaFiles)){
   const safe=name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-120);
   const path=userId+"/anki/"+crypto.randomUUID()+"-"+safe;
   const mime=name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()==="mp3"?"audio/mpeg":
     name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()==="wav"?"audio/wav":
     name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()==="mp4"?"video/mp4":
     name.match(/\.(png|jpg|jpeg|gif|webp)$/i)?.[0]?"image/"+(name.split(".").pop()?.toLowerCase()==="jpg"?"jpeg":name.split(".").pop()?.toLowerCase()):"application/octet-stream";
   const {error:uploadError}=await supabase.storage.from("user-media").upload(path,bytes,{contentType:mime,upsert:false});
   if(uploadError)throw new Error("Media upload failed for "+name+": "+uploadError.message);
   const {error}=await supabase.from("media").insert({workspace_id:workspaceId,owner_id:userId,storage_path:path,mime_type:mime,byte_size:bytes.byteLength});
   if(error)throw new Error(error.message);
   paths.set(name,{path,mime_type:mime});
 }
 return paths;
}

export async function importAnki(formData:FormData):Promise<void>{
 const file=formData.get("file");if(!(file instanceof File))fail("Choose an .apkg file.");if(!file.name.toLowerCase().endsWith(".apkg"))fail("Only .apkg files are accepted here.");
 let parsed;try{parsed=await parseAnkiPackage(new Uint8Array(await file.arrayBuffer()));}catch(error){fail(error instanceof Error?error.message:"Unable to read APKG.");}
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();if(!workspace)fail("Personal workspace not found.");

 let mediaPaths=new Map<string,{path:string;mime_type:string}>();
 try{mediaPaths=await uploadImportedMedia(supabase,user.id,workspace.id,parsed.mediaFiles);}catch(error){fail(error instanceof Error?error.message:"Unable to import media.");}

 const sourceToImported=new Map<number,string>();let imported=0;
 for(const sourceDeck of parsed.decks){
  const {data:deck,error}=await supabase.from("decks").insert({workspace_id:workspace.id,owner_id:user.id,name:sourceDeck.name,description:sourceDeck.description,visibility:"private",settings:{source:"anki",ankiDeckId:sourceDeck.id}}).select("id").single();
  if(error||!deck)fail(error?.message||"Unable to create imported deck.");
  const {error:templateError}=await supabase.from("card_templates").insert({deck_id:deck.id,name:"Basic",front_template:"{{front}}",back_template:"{{back}}",css:"",field_schema:[{name:"front",type:"text"},{name:"back",type:"text"}]});
  if(templateError)fail(templateError.message);
  const rows=sourceDeck.cards.map((card,index)=>{
    let front=card.front;
    let back=card.back;
    for(const name of card.mediaNames){
      const token="__SHYRAQ_MEDIA__"+encodeURIComponent(name);
      front=front.replaceAll(token,"");
      back=back.replaceAll(token,"");
    }
    const mediaItems=card.mediaNames
      .map(name=>mediaPaths.get(name)?{name,path:mediaPaths.get(name)!.path,mime_type:mediaPaths.get(name)!.mime_type}:null)
      .filter(Boolean);
    return {deck_id:deck.id,owner_id:user.id,kind:card.kind,content:{front,back,tags:card.tags,mediaItems},sort_order:index};
  });
  if(rows.length){
    const {data:created,error:cardsError}=await supabase.from("cards").insert(rows).select("id");
    if(cardsError)fail(cardsError.message);
    for(let index=0;index<sourceDeck.cards.length;index++){const sourceId=sourceDeck.cards[index].sourceCardId;const importedId=created?.[index]?.id;if(importedId)sourceToImported.set(sourceId,importedId);}
    imported+=rows.length;
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
   user_id:user.id,
   card_id:importedCardId,
   queue,
   state_data:stateJson,
   due_at:new Date(state.due).toISOString(),
   last_reviewed_at:new Date(lastTimestamp).toISOString(),
   reps:Number(state.reps)||0,
   lapses:Number(state.lapses)||0,
   stability:Number(state.stability)||null,
   difficulty:Number(state.difficulty)||null,
   scheduled_days:Number(state.scheduled_days)||0
  });
 }
 if(reviewStateRows.length){
  const {error}=await supabase.from("review_states").upsert(reviewStateRows,{onConflict:"user_id,card_id"});
  if(error)fail(error.message);
 }

 const reviewRows=parsed.reviews.flatMap(review=>{
   const importedCardId=sourceToImported.get(review.cardId);if(!importedCardId)return[];
   return [{event_key:crypto.randomUUID(),user_id:user.id,card_id:importedCardId,device_id:crypto.randomUUID(),reviewed_at:new Date(review.timestamp).toISOString(),rating:ratingMap[review.rating],elapsed_ms:review.timeMs,previous_state:{source:"anki",interval:review.lastInterval},next_state:{source:"anki",interval:review.interval,factor:review.factor,type:review.type},metadata:{source:"anki",sourceCardId:review.cardId,event_kind:"review"}}];
 });
 if(reviewRows.length){const {error}=await supabase.from("review_events").insert(reviewRows);if(error)fail(error.message);}
 revalidatePath("/decks");revalidatePath("/statistics");redirect("/decks?imported="+imported);
}