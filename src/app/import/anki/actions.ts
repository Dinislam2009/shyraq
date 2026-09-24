"use server";
import {createClient} from "@/lib/supabase/server";
import {parseAnkiPackage} from "@/lib/import/anki";
import {revalidatePath} from "next/cache";

const ratingMap:Record<number,"again"|"hard"|"good"|"easy">={1:"again",2:"hard",3:"good",4:"easy"};

export async function importAnki(formData:FormData){
 const file=formData.get("file");
 if(!(file instanceof File))return {error:"Choose an .apkg file."};
 if(!file.name.toLowerCase().endsWith(".apkg"))return {error:"Only .apkg files are accepted here."};
 const parsed=await parseAnkiPackage(new Uint8Array(await file.arrayBuffer()));
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return {error:"Authentication required."};
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 if(!workspace)return {error:"Personal workspace not found."};

 const sourceToImported=new Map<number,string>();
 let imported=0;

 for(const sourceDeck of parsed.decks){
   const {data:deck,error}=await supabase.from("decks").insert({
     workspace_id:workspace.id,
     owner_id:user.id,
     name:sourceDeck.name,
     description:sourceDeck.description,
     visibility:"private",
     settings:{source:"anki",ankiDeckId:sourceDeck.id}
   }).select("id").single();
   if(error)return {error:error.message};

   const rows=sourceDeck.cards.map((card,index)=>({
     deck_id:deck.id,
     owner_id:user.id,
     kind:"basic" as const,
     content:{front:card.front,back:card.back,tags:card.tags},
     sort_order:index
   }));

   if(rows.length){
     const {data:created,error:cardsError}=await supabase.from("cards").insert(rows).select("id");
     if(cardsError)return {error:cardsError.message};
     for(let index=0;index<sourceDeck.cards.length;index++){
       const sourceId=sourceDeck.cards[index].sourceCardId;
       const importedId=created?.[index]?.id;
       if(importedId)sourceToImported.set(sourceId,importedId);
     }
     imported+=rows.length;
   }
 }

 const reviewRows=parsed.reviews.flatMap(review=>{
   const importedCardId=sourceToImported.get(review.cardId);
   if(!importedCardId)return [];
   return [{
     event_key:crypto.randomUUID(),
     user_id:user.id,
     card_id:importedCardId,
     device_id:crypto.randomUUID(),
     reviewed_at:new Date(review.timestamp).toISOString(),
     rating:ratingMap[review.rating],
     elapsed_ms:review.timeMs,
     previous_state:{source:"anki",interval:review.lastInterval},
     next_state:{source:"anki",interval:review.interval,factor:review.factor,type:review.type},
     metadata:{source:"anki",sourceCardId:review.cardId}
   }];
 });

 if(reviewRows.length){
   const {error}=await supabase.from("review_events").insert(reviewRows);
   if(error)return {error:error.message};
 }

 revalidatePath("/decks");
 revalidatePath("/import");
 revalidatePath("/statistics");
 return {ok:true,count:imported,reviews:reviewRows.length,media:Object.keys(parsed.media).length};
}