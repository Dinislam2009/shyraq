"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {parseAnkiPackage} from "@/lib/import/anki";
import {revalidatePath} from "next/cache";

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
  const rows=sourceDeck.cards.map((card,index)=>{
    let front=card.front;
    let back=card.back;
    for(const [name,path] of mediaPaths.entries()){
      const token="__SHYRAQ_MEDIA__"+encodeURIComponent(name);
      front=front.replaceAll(token,path);
      back=back.replaceAll(token,path);
    }
    return {deck_id:deck.id,owner_id:user.id,kind:"basic" as const,content:{front,back,tags:card.tags},sort_order:index};
  });
  if(rows.length){
    const {data:created,error:cardsError}=await supabase.from("cards").insert(rows).select("id");
    if(cardsError)fail(cardsError.message);
    for(let index=0;index<sourceDeck.cards.length;index++){const sourceId=sourceDeck.cards[index].sourceCardId;const importedId=created?.[index]?.id;if(importedId)sourceToImported.set(sourceId,importedId);}
    imported+=rows.length;
  }
 }

 const reviewRows=parsed.reviews.flatMap(review=>{
   const importedCardId=sourceToImported.get(review.cardId);if(!importedCardId)return[];
   return [{event_key:crypto.randomUUID(),user_id:user.id,card_id:importedCardId,device_id:crypto.randomUUID(),reviewed_at:new Date(review.timestamp).toISOString(),rating:ratingMap[review.rating],elapsed_ms:review.timeMs,previous_state:{source:"anki",interval:review.lastInterval},next_state:{source:"anki",interval:review.interval,factor:review.factor,type:review.type},metadata:{source:"anki",sourceCardId:review.cardId,event_kind:"review"}}];
 });
 if(reviewRows.length){const {error}=await supabase.from("review_events").insert(reviewRows);if(error)fail(error.message);}
 revalidatePath("/decks");revalidatePath("/statistics");redirect("/decks?imported="+imported);
}