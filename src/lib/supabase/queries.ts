import {createClient} from "@/lib/supabase/server";

async function withMediaUrl(supabase:any,card:any){
 const content={...(card?.content??{})};
 if(content.mediaPath){
  const {data}=await supabase.storage.from("user-media").createSignedUrl(content.mediaPath,3600);
  if(data?.signedUrl)content.mediaUrl=data.signedUrl;
 }
 if(Array.isArray(content.mediaItems)&&content.mediaItems.length){
  const items=[];
  for(const item of content.mediaItems){
   const {data}=await supabase.storage.from("user-media").createSignedUrl(item.path,3600);
   if(data?.signedUrl)items.push({...item,url:data.signedUrl});
  }
  content.mediaItems=items;
 }
 return {...card,content};
}
export async function getCurrentUser(){const supabase=await createClient();const {data,error}=await supabase.auth.getUser();return error||!data.user?null:data.user;}
export async function getPersonalWorkspace(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data}=await supabase.from("workspaces").select("*").eq("owner_id",user.id).eq("kind","personal").order("created_at").limit(1).maybeSingle();return data;}
export async function getDecks(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return [];const {data}=await supabase.from("decks").select("id,name,description,visibility,workspace_id,owner_id,updated_at,cards(count)").order("updated_at",{ascending:false});return data??[];}
export async function getDeck(id:string){const supabase=await createClient();const {data}=await supabase.from("decks").select("id,name,description,visibility,workspace_id,owner_id,settings,created_at,updated_at,cards(id,content,kind,sort_order,is_suspended,is_marked,updated_at)").eq("id",id).maybeSingle();return data;}
export async function getReviewPreferences(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data}=await supabase.from("review_preferences").select("*").eq("user_id",user.id).maybeSingle();return data;}
export async function getReviewCard(deckId?:string){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const prefs:any=(await supabase.from("review_preferences").select("new_cards_per_day,reviews_per_day").eq("user_id",user.id).maybeSingle()).data??{new_cards_per_day:20,reviews_per_day:9999};
 const todayStart=new Date();todayStart.setHours(0,0,0,0);
 const {count:todayReviews}=await supabase.from("review_events").select("*",{count:"exact",head:true}).eq("user_id",user.id).gte("reviewed_at",todayStart.toISOString());
 if((todayReviews??0)>=Number(prefs.reviews_per_day))return null;

 const {data:dueStates}=await supabase.from("review_states").select("card_id,state_data,due_at").eq("user_id",user.id).lte("due_at",new Date().toISOString()).order("due_at",{ascending:true}).limit(20);
 for(const due of dueStates??[]){
   const {data:card}=await supabase.from("cards").select("id,deck_id,kind,content").eq("id",due.card_id).maybeSingle();
   if(card&&(!deckId||card.deck_id===deckId))return {card:await withMediaUrl(supabase,card),stateData:due.state_data,isNew:false};
 }

 const {data:tracked}=await supabase.from("review_states").select("card_id").eq("user_id",user.id).limit(5000);
 const trackedIds=(tracked??[]).map((row:any)=>row.card_id).filter(Boolean);
 let query=supabase.from("cards").select("id,deck_id,kind,content").order("updated_at",{ascending:true}).limit(1);
 if(deckId)query=query.eq("deck_id",deckId);
 if(trackedIds.length)query=query.not("id","in","("+trackedIds.join(",")+")");
 const {count:newToday}=await supabase.from("review_events").select("*",{count:"exact",head:true}).eq("user_id",user.id).eq("metadata->>event_kind","new-card").gte("reviewed_at",todayStart.toISOString());
 if((newToday??0)>=Number(prefs.new_cards_per_day))return null;
 const {data:cards}=await query;
 if(!cards?.[0])return null;
 return {card:await withMediaUrl(supabase,cards[0]),stateData:null,isNew:true};
}
export async function getReviewStats(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return {reviews:0,accuracy:null,studyMinutes:0,daily:[]};
 const {count:reviews}=await supabase.from("review_events").select("*",{count:"exact",head:true}).eq("user_id",user.id);
 const {data:events}=await supabase.from("review_events").select("rating,elapsed_ms,reviewed_at").eq("user_id",user.id);
 const list=events??[];const good=list.filter((e:any)=>e.rating!=="again").length;const studyMinutes=Math.round(list.reduce((sum:number,e:any)=>sum+Number(e.elapsed_ms||0),0)/60000);
 const dailyMap=new Map<string,{reviews:number;minutes:number;again:number}>();
 for(let i=29;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);dailyMap.set(d.toISOString().slice(0,10),{reviews:0,minutes:0,again:0});}
 for(const event of list){const key=new Date(event.reviewed_at).toISOString().slice(0,10);const day=dailyMap.get(key);if(day){day.reviews+=1;day.minutes+=Number(event.elapsed_ms||0)/60000;if(event.rating==="again")day.again+=1;}}
 return {reviews:reviews??0,accuracy:list.length?Math.round(good/list.length*100):null,studyMinutes,daily:[...dailyMap.entries()].map(([date,value])=>({date,...value}))};
}