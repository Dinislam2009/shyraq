import {strToU8,Zip,ZipDeflate,ZipPassThrough} from "fflate";
import {createHash} from "node:crypto";
import {createClient} from "@/lib/supabase/server";

export const runtime="nodejs";
const MAX_MEDIA_BYTES=200*1024*1024;

function pushText(zip:Zip,name:string,text:string,checksums:Record<string,string>){
 const bytes=strToU8(text);
 const hash=createHash("sha256").update(bytes).digest("hex");
 checksums[name]=hash;
 const entry=new ZipDeflate(name,{level:1});
 zip.add(entry);
 entry.push(bytes,true);
 return bytes.byteLength;
}

async function streamMedia(zip:Zip,item:any,remaining:number,checksums:Record<string,string>){
 const {data:signed}=await getSignedUrl(item.storage_path);
 const url=signed?.signedUrl;
 if(!url)return 0;
 const response=await fetch(url,{cache:"no-store"});
 if(!response.ok||!response.body)return 0;
 const declared=Number(response.headers.get("content-length")||0);
 if(declared>0&&declared>remaining)return 0;
 const name="media/"+String(item.storage_path).replace(/^\/+/, "");
 const entry=new ZipPassThrough(name);
 zip.add(entry);
 const hash=createHash("sha256");
 let total=0;
 const reader=response.body.getReader();
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   if(!value)continue;
   total+=value.byteLength;
   if(total>remaining)throw new Error("media-limit");
   hash.update(value);
   entry.push(value,false);
  }
  entry.push(new Uint8Array(0),true);
  checksums[name]=hash.digest("hex");
  return total;
 }finally{
  reader.releaseLock();
 }
}

async function getSignedUrl(path:string){
 const supabase=await createClient();
 return supabase.storage.from("user-media").createSignedUrl(path,300);
}

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
 const json=JSON.stringify(payload);
 const checksums:Record<string,string>={};
 const jsonBytes=strToU8(json);
 checksums["shyraq-backup.json"]=createHash("sha256").update(jsonBytes).digest("hex");
 const stream=new ReadableStream<Uint8Array>({
  start(controller){
   const zip=new Zip((error,chunk,final)=>{
    if(error){controller.error(error);return;}
    if(chunk)controller.enqueue(chunk);
    if(final)controller.close();
   });
   void (async()=>{
    try{
     const jsonEntry=new ZipDeflate("shyraq-backup.json",{level:1});
     zip.add(jsonEntry);jsonEntry.push(jsonBytes,true);
     let mediaBytes=0;
     for(const item of media){
      if(mediaBytes>=MAX_MEDIA_BYTES)break;
      try{
       const added=await streamMedia(zip,item,MAX_MEDIA_BYTES-mediaBytes,checksums);
       mediaBytes+=added;
      }catch(error){
       if(error instanceof Error&&error.message==="media-limit")continue;
      }
     }
     const checksumBytes=strToU8(JSON.stringify({algorithm:"sha256",files:checksums},null,2));
     const checksumEntry=new ZipDeflate("checksums.json",{level:1});
     zip.add(checksumEntry);checksumEntry.push(checksumBytes,true);
     zip.end();
    }catch(error){controller.error(error);}
   })();
  }
 });
 return new Response(stream,{headers:{
  "Content-Type":"application/zip",
  "Content-Disposition":'attachment; filename="shyraq-backup.zip"',
  "Cache-Control":"no-store"
 }});
}
