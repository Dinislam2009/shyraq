import {strToU8,zipSync} from "fflate";
import {createClient} from "@/lib/supabase/server";

export const runtime="nodejs";

export async function GET(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return new Response("Unauthorized",{status:401});

 const {data:workspace}=await supabase.from("workspaces").select("*").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 const deckResult=await supabase.from("decks").select("*").eq("owner_id",user.id);
 const decks=deckResult.data??[];
 const deckIds=decks.map(d=>d.id);
 const cardResult=deckIds.length?await supabase.from("cards").select("*").in("deck_id",deckIds):{data:[]};
 const cards=cardResult.data??[];
 const templateResult=deckIds.length?await supabase.from("card_templates").select("*").in("deck_id",deckIds):{data:[]};
 const templates=templateResult.data??[];
 const [tagsResult,collectionsResult,eventsResult,statesResult,prefsResult,mediaResult,copiesResult,followsResult]=await Promise.all([
   workspace?supabase.from("tags").select("*").eq("workspace_id",workspace.id):Promise.resolve({data:[]}),
   workspace?supabase.from("collections").select("*").eq("workspace_id",workspace.id):Promise.resolve({data:[]}),
   supabase.from("review_events").select("*").eq("user_id",user.id).order("reviewed_at",{ascending:true}),
   supabase.from("review_states").select("*").eq("user_id",user.id),
   supabase.from("review_preferences").select("*").eq("user_id",user.id).maybeSingle(),
   workspace?supabase.from("media").select("*").eq("workspace_id",workspace.id):Promise.resolve({data:[]}),
   supabase.from("deck_copies").select("*").eq("user_id",user.id),
   supabase.from("public_deck_follows").select("*").eq("user_id",user.id)
 ]);
 const tags=tagsResult.data??[];
 const collections=collectionsResult.data??[];
 const collectionIds=collections.map(c=>c.id);
 const [cardTagsResult,collectionCardsResult]=await Promise.all([
   cards.length?supabase.from("card_tags").select("*").in("card_id",cards.map(c=>c.id)):Promise.resolve({data:[]}),
   collectionIds.length?supabase.from("collection_cards").select("*").in("collection_id",collectionIds):Promise.resolve({data:[]})
 ]);
 const media=mediaResult.data??[];
 const payload={
  format:"shyraq-backup-v2",
  exportedAt:new Date().toISOString(),
  user:{id:user.id,email:user.email},
  workspace,
  decks,cards,templates,tags,cardTags:cardTagsResult.data??[],
  collections,collectionCards:collectionCardsResult.data??[],
  reviewEvents:eventsResult.data??[],
  reviewStates:statesResult.data??[],
  reviewPreferences:prefsResult.data??null,
  media,deckCopies:copiesResult.data??[],publicDeckFollows:followsResult.data??[]
 };

 const archive:Record<string,Uint8Array>={"shyraq-backup.json":strToU8(JSON.stringify(payload,null,2))};
 let totalBytes=archive["shyraq-backup.json"].byteLength;

 for(const item of media){
   if(totalBytes>200*1024*1024)break;
   const {data,error}=await supabase.storage.from("user-media").download(item.storage_path);
   if(error||!data)continue;
   const bytes=new Uint8Array(await data.arrayBuffer());
   totalBytes+=bytes.byteLength;
   archive["media/"+item.storage_path.replace(/^.*\//,"")]=bytes;
 }
 const zipped=zipSync(archive,{level:6});
 return new Response(zipped,{headers:{"Content-Type":"application/zip","Content-Disposition":'attachment; filename="shyraq-backup.zip"'}});
}