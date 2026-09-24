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

 const cardIdBySource:number[]=[];
 let imported=0;
 for(const sourceDeck of parsed.decks){
   const {data:deck,error}=await supabase.from("decks").insert({
     workspace_id:workspace.id,owner_id:user.id,name:sourceDeck.name,description:sourceDeck.description,
     visibility:"private",settings:{source:"anki",ankiDeckId:sourceDeck.id}
   }).select("id").single();
   if(error)return {error:error.message};
   const rows=sourceDeck.cards.map((card,index)=>({
     deck_id:deck.id,owner_id:user.id,kind:"basic",content:{front:card.front,back:card.back,tags:card.tags},
     sort_order:index
   }));
   if(rows.length){
     const {data:created,error:cardsError}=await supabase.from("cards").insert(rows).select("id");
     if(cardsError)return {error:cardsError.message};
     for(const row of created||[])cardIdBySource.push(Number(row.id));
     imported+=rows.length;
   }
 }

 const reviewCount=parsed.reviews.length;
 revalidatePath("/decks");
 revalidatePath("/import");
 return {ok:true,count:imported,reviews:reviewCount,media:Object.keys(parsed.media).length};
}