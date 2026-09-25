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
export async function getDecks(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return [];
 const {data:members}=await supabase.from("workspace_members").select("workspace_id").eq("user_id",user.id);
 const workspaceIds=(members??[]).map((row:any)=>row.workspace_id).filter(Boolean);
 if(!workspaceIds.length)return [];
 const {data}=await supabase
  .from("decks")
  .select("id,name,description,visibility,workspace_id,owner_id,updated_at,settings,cards(count)")
  .in("workspace_id",workspaceIds)
  .is("deleted_at",null)
  .order("updated_at",{ascending:false});
 return (data??[]).filter((deck:any)=>deck.settings?.archived!==true);
}
export async function getDeck(id:string){const supabase=await createClient();const {data}=await supabase.from("decks").select("id,name,description,visibility,workspace_id,owner_id,settings,deleted_at,created_at,updated_at,cards(id,content,kind,sort_order,is_suspended,is_marked,updated_at)").eq("id",id).maybeSingle();return data;}
export async function getReviewPreferences(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data}=await supabase.from("review_preferences").select("*").eq("user_id",user.id).maybeSingle();return data;}
export async function getReviewBatch(deckId?:string,limit=20){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return [];

 const todayStart=new Date();
 todayStart.setHours(0,0,0,0);
 const todayIso=todayStart.toISOString();

 const {data:prefs}=await supabase
  .from("review_preferences")
  .select("new_cards_per_day,reviews_per_day")
  .eq("user_id",user.id)
  .maybeSingle();

 const reviewsPerDay=Number(prefs?.reviews_per_day??9999);
 const newCardsPerDay=Number(prefs?.new_cards_per_day??20);

 const [{count:todayReviews},{count:todayNew}] = await Promise.all([
  supabase.from("review_events").select("*",{count:"exact",head:true}).eq("user_id",user.id).gte("reviewed_at",todayIso),
  supabase.from("review_events").select("*",{count:"exact",head:true}).eq("user_id",user.id).eq("metadata->>event_kind","new-card").gte("reviewed_at",todayIso)
 ]);

 const remainingReviews=Math.max(0,reviewsPerDay-(todayReviews??0));
 if(remainingReviews<=0)return [];

 const batchLimit=Math.min(limit,remainingReviews);
 const remainingNewCards=Math.max(0,newCardsPerDay-(todayNew??0));
 const result:any[]=[];
 const now=new Date().toISOString();

 let dueQuery=supabase
  .from("review_states")
  .select("card_id,state_data,due_at,cards!inner(id,deck_id,kind,content,is_suspended,template_id,card_templates(id,name,front_template,back_template,css))")
  .eq("user_id",user.id)
  .eq("cards.is_suspended",false)
  .lte("due_at",now)
  .order("due_at",{ascending:true})
  .limit(batchLimit);
 if(deckId)dueQuery=dueQuery.eq("cards.deck_id",deckId);

 const {data:dueStates}=await dueQuery;
 for(const due of dueStates??[]){
  const card=(due as any).cards;
  if(card)result.push({card:await withMediaUrl(supabase,card),stateData:due.state_data,isNew:false});
  if(result.length>=batchLimit)break;
 }

 const newLimit=Math.min(batchLimit-result.length,remainingNewCards);
 if(newLimit>0&&result.length<batchLimit){
  const {data:tracked}=await supabase.from("review_states").select("card_id").eq("user_id",user.id).limit(5000);
  const trackedIds=(tracked??[]).map((row:any)=>row.card_id).filter(Boolean);
  let query=supabase
   .from("cards")
   .select("id,deck_id,kind,content,template_id,card_templates(id,name,front_template,back_template,css)")
   .eq("is_suspended",false)
   .order("updated_at",{ascending:true})
   .limit(newLimit);
  if(deckId)query=query.eq("deck_id",deckId);
  if(trackedIds.length)query=query.not("id","in","("+trackedIds.join(",")+")");
  const {data:cards}=await query;
  for(const card of cards??[])result.push({card:await withMediaUrl(supabase,card),stateData:null,isNew:true});
 }

 return result;
}

export async function getReviewCard(deckId?:string){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const prefs:any=(await supabase.from("review_preferences").select("new_cards_per_day,reviews_per_day").eq("user_id",user.id).maybeSingle()).data??{new_cards_per_day:20,reviews_per_day:9999};
 const todayStart=new Date();todayStart.setHours(0,0,0,0);
 const {count:todayReviews}=await supabase.from("review_events").select("*",{count:"exact",head:true}).eq("user_id",user.id).gte("reviewed_at",todayStart.toISOString());
 if((todayReviews??0)>=Number(prefs.reviews_per_day))return null;

 const {data:dueStates}=await supabase.from("review_states").select("card_id,state_data,due_at").eq("user_id",user.id).lte("due_at",new Date().toISOString()).order("due_at",{ascending:true}).limit(20);
 for(const due of dueStates??[]){
   const {data:card}=await supabase.from("cards").select("id,deck_id,kind,content,is_suspended,template_id,card_templates(id,name,front_template,back_template,css)").eq("id",due.card_id).maybeSingle();
   if(card&&!card.is_suspended&&(!deckId||card.deck_id===deckId))return {card:await withMediaUrl(supabase,card),stateData:due.state_data,isNew:false};
 }

 const {data:tracked}=await supabase.from("review_states").select("card_id").eq("user_id",user.id).limit(5000);
 const trackedIds=(tracked??[]).map((row:any)=>row.card_id).filter(Boolean);
 let query=supabase.from("cards").select("id,deck_id,kind,content,template_id,card_templates(id,name,front_template,back_template,css)").eq("is_suspended",false).order("updated_at",{ascending:true}).limit(1);
 if(deckId)query=query.eq("deck_id",deckId);
 if(trackedIds.length)query=query.not("id","in","("+trackedIds.join(",")+")");
 const {count:newToday}=await supabase.from("review_events").select("*",{count:"exact",head:true}).eq("user_id",user.id).eq("metadata->>event_kind","new-card").gte("reviewed_at",todayStart.toISOString());
 if((newToday??0)>=Number(prefs.new_cards_per_day))return null;
 const {data:cards}=await query;
 if(!cards?.[0])return null;
 return {card:await withMediaUrl(supabase,cards[0]),stateData:null,isNew:true};
}
export async function getReviewStats(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return {reviews:0,accuracy:null,studyMinutes:0,averageSeconds:0,ratings:{again:0,hard:0,good:0,easy:0},daily:[],deckBreakdown:[],retentionCurve:[],dueForecast:[],newReviewBalance:[],difficultyDistribution:[],learningBreakdown:{learning:0,relearning:0,review:0},cardPerformance:[],tagPerformance:[],collectionPerformance:[],historicalComparison:{current:0,previous:0,currentAccuracy:null,previousAccuracy:null},scheduler:{averageStability:null,averageDifficulty:null}};

 const [{data:events},{data:states}]=await Promise.all([
  supabase.from("review_events").select("id,card_id,rating,elapsed_ms,reviewed_at,metadata,next_state").eq("user_id",user.id).neq("metadata->>event_kind","review-undo").order("reviewed_at",{ascending:true}).limit(50000),
  supabase.from("review_states").select("card_id,state_data,due_at,stability,difficulty,queue").eq("user_id",user.id).limit(50000)
 ]);
 const list=events??[];
 const stateList=states??[];
 const cardIds=[...new Set(list.map((event:any)=>event.card_id).filter(Boolean))];
 const {data:cards}=cardIds.length
  ? await supabase.from("cards").select("id,deck_id,content,decks(id,name)").in("id",cardIds)
  : {data:[]};
 const cardsById=new Map((cards??[]).map((card:any)=>[card.id,card]));

 const ratings={again:0,hard:0,good:0,easy:0};
 for(const event of list){if(event.rating in ratings)ratings[event.rating as keyof typeof ratings]++;}
 const good=list.filter((event:any)=>event.rating!=="again").length;
 const totalMs=list.reduce((sum:number,event:any)=>sum+Number(event.elapsed_ms||0),0);
 const studyMinutes=Math.round(totalMs/60000);
 const averageSeconds=list.length?Math.round(totalMs/list.length/100)/10:0;

 const dailyMap=new Map<string,{reviews:number;minutes:number;again:number;newCards:number}>();
 for(let i=29;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);dailyMap.set(d.toISOString().slice(0,10),{reviews:0,minutes:0,again:0,newCards:0});}
 for(const event of list){const key=new Date(event.reviewed_at).toISOString().slice(0,10);const day=dailyMap.get(key);if(day){day.reviews++;day.minutes+=Number(event.elapsed_ms||0)/60000;if(event.rating==="again")day.again++;if(event.metadata?.event_kind==="new-card")day.newCards++;}}

 const deckMap=new Map<string,{name:string;reviews:number;again:number;minutes:number}>();
 const cardMap=new Map<string,{reviews:number;again:number;minutes:number;name:string}>();
 for(const event of list){
  const card=cardsById.get(event.card_id) as any;
  const deck=Array.isArray(card?.decks)?card.decks[0]:card?.decks;
  if(deck){const current=deckMap.get(deck.id)||{name:String(deck.name||"Deck"),reviews:0,again:0,minutes:0};current.reviews++;current.minutes+=Number(event.elapsed_ms||0)/60000;if(event.rating==="again")current.again++;deckMap.set(deck.id,current);}
  const cardName=String(card?.content?.front||"Untitled card");
  const currentCard=cardMap.get(event.card_id)||{reviews:0,again:0,minutes:0,name:cardName};
  currentCard.reviews++;currentCard.minutes+=Number(event.elapsed_ms||0)/60000;if(event.rating==="again")currentCard.again++;cardMap.set(event.card_id,currentCard);
 }

 const deckBreakdown=[...deckMap.entries()].map(([id,value])=>({id,...value,accuracy:value.reviews?Math.round((value.reviews-value.again)/value.reviews*100):null})).sort((a,b)=>b.reviews-a.reviews).slice(0,20);
 const cardPerformance=[...cardMap.entries()].map(([id,value])=>({id,...value,accuracy:value.reviews?Math.round((value.reviews-value.again)/value.reviews*100):null})).sort((a,b)=>b.reviews-a.reviews).slice(0,30);

 const tagLinks=cardIds.length?await supabase.from("card_tags").select("card_id,tag_id,tags(id,name)").in("card_id",cardIds):{data:[]};
 const tagMap=new Map<string,{name:string;reviews:number;again:number;minutes:number}>();
 const cardTagsByCard=new Map<string,string[]>();
 for(const link of tagLinks.data??[]){const name=String((Array.isArray((link as any).tags)?(link as any).tags[0]:(link as any).tags)?.name||"");if(!name)continue;const listTags=cardTagsByCard.get(String((link as any).card_id))||[];listTags.push(name);cardTagsByCard.set(String((link as any).card_id),listTags);}
 for(const event of list){for(const name of cardTagsByCard.get(event.card_id)||[]){const current=tagMap.get(name)||{name,reviews:0,again:0,minutes:0};current.reviews++;current.minutes+=Number(event.elapsed_ms||0)/60000;if(event.rating==="again")current.again++;tagMap.set(name,current);}}
 const tagPerformance=[...tagMap.values()].map(value=>({...value,accuracy:value.reviews?Math.round((value.reviews-value.again)/value.reviews*100):null})).sort((a,b)=>b.reviews-a.reviews).slice(0,30);

 const {data:collections}=await supabase.from("collections").select("id,name,collection_cards(card_id)").eq("owner_id",user.id);
 const collectionMap=new Map<string,{name:string;cardIds:Set<string>}>();
 for(const collection of collections??[])collectionMap.set(collection.id,{name:collection.name,cardIds:new Set((collection.collection_cards??[]).map((x:any)=>String(x.card_id)))});
 const collectionPerformance=[...collectionMap.values()].map(value=>{const subset=list.filter((event:any)=>value.cardIds.has(String(event.card_id)));const reviews=subset.length;const again=subset.filter((event:any)=>event.rating==="again").length;const minutes=subset.reduce((sum:number,event:any)=>sum+Number(event.elapsed_ms||0),0)/60000;return {name:value.name,reviews,again,minutes,accuracy:reviews?Math.round((reviews-again)/reviews*100):null};}).filter(x=>x.reviews>0).sort((a,b)=>b.reviews-a.reviews).slice(0,20);

 const retentionBuckets=[{label:"0–1d",min:0,max:1},{label:"2–7d",min:2,max:7},{label:"8–30d",min:8,max:30},{label:"31d+",min:31,max:Number.POSITIVE_INFINITY}];
 const retentionCurve=retentionBuckets.map(bucket=>{const subset=list.filter((event:any)=>{const days=Number(event.next_state?.scheduled_days??event.next_state?.scheduledDays??0);return days>=bucket.min&&days<=bucket.max;});const success=subset.filter((event:any)=>event.rating!=="again").length;return {label:bucket.label,reviews:subset.length,retention:subset.length?Math.round(success/subset.length*100):null};});

 const forecastMap=new Map<string,number>();
 for(const state of stateList){const key=new Date(state.due_at).toISOString().slice(0,10);forecastMap.set(key,(forecastMap.get(key)||0)+1);}
 const dueForecast=Array.from({length:14},(_,index)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+index);const key=d.toISOString().slice(0,10);return {date:key,due:forecastMap.get(key)||0};});

 const difficultyBuckets={easy:0,medium:0,hard:0};
 for(const state of stateList){const value=Number(state.difficulty);if(!Number.isFinite(value))continue;if(value<4)difficultyBuckets.easy++;else if(value<7)difficultyBuckets.medium++;else difficultyBuckets.hard++;}
 const learningBreakdown={learning:stateList.filter((state:any)=>String(state.queue)==="learning").length,relearning:stateList.filter((state:any)=>String(state.queue)==="relearning").length,review:stateList.filter((state:any)=>String(state.queue)==="review").length};

 const cutoff=new Date();cutoff.setDate(cutoff.getDate()-30);const previousCutoff=new Date();previousCutoff.setDate(previousCutoff.getDate()-60);
 const currentEvents=list.filter((event:any)=>new Date(event.reviewed_at)>=cutoff);
 const previousEvents=list.filter((event:any)=>new Date(event.reviewed_at)>=previousCutoff&&new Date(event.reviewed_at)<cutoff);
 const historicalComparison={current:currentEvents.length,previous:previousEvents.length,currentAccuracy:currentEvents.length?Math.round(currentEvents.filter((event:any)=>event.rating!=="again").length/currentEvents.length*100):null,previousAccuracy:previousEvents.length?Math.round(previousEvents.filter((event:any)=>event.rating!=="again").length/previousEvents.length*100):null};

 const stabilities=stateList.map((state:any)=>Number(state.stability)).filter(Number.isFinite);
 const difficulties=stateList.map((state:any)=>Number(state.difficulty)).filter(Number.isFinite);

 return {
  reviews:list.length,accuracy:list.length?Math.round(good/list.length*100):null,studyMinutes,averageSeconds,ratings,
  daily:[...dailyMap.entries()].map(([date,value])=>({date,...value})),deckBreakdown,retentionCurve,dueForecast,
  newReviewBalance:[...dailyMap.entries()].map(([date,value])=>({date,newCards:value.newCards,reviews:Math.max(0,value.reviews-value.newCards)})),
  difficultyDistribution:Object.entries(difficultyBuckets).map(([label,value])=>({label,value})),learningBreakdown,
  cardPerformance,tagPerformance,collectionPerformance,historicalComparison,
  scheduler:{averageStability:stabilities.length?Math.round(stabilities.reduce((a,b)=>a+b,0)/stabilities.length*10)/10:null,averageDifficulty:difficulties.length?Math.round(difficulties.reduce((a,b)=>a+b,0)/difficulties.length*10)/10:null}
 };
}

export async function getDashboardStats(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return {dueToday:0,newToday:0,reviewsToday:0,studyMinutesToday:0,accuracyToday:null,streak:0};

 const start=new Date();start.setHours(0,0,0,0);
 const tomorrow=new Date(start);tomorrow.setDate(tomorrow.getDate()+1);

 const {count:dueToday}=await supabase
  .from("review_states")
  .select("card_id,cards!inner(id,is_suspended)",{count:"exact",head:true})
  .eq("user_id",user.id)
  .eq("cards.is_suspended",false)
  .lt("due_at",tomorrow.toISOString());

 const {data:todayEvents}=await supabase
  .from("review_events")
  .select("rating,elapsed_ms,metadata")
  .eq("user_id",user.id)
  .neq("metadata->>event_kind","review-undo")
  .gte("reviewed_at",start.toISOString())
  .lt("reviewed_at",tomorrow.toISOString());

 const today=todayEvents??[];
 const reviewsToday=today.length;
 const newToday=today.filter((event:any)=>event.metadata?.event_kind==="new-card").length;
 const goodToday=today.filter((event:any)=>event.rating!=="again").length;
 const studyMinutesToday=Math.round(today.reduce((sum:number,event:any)=>sum+Number(event.elapsed_ms||0),0)/60000);
 const accuracyToday=reviewsToday?Math.round(goodToday/reviewsToday*100):null;

 const {data:events}=await supabase
  .from("review_events")
  .select("reviewed_at")
  .eq("user_id",user.id)
  .order("reviewed_at",{ascending:false})
  .limit(5000);

 const dates=new Set((events??[]).map((e:any)=>new Date(e.reviewed_at).toISOString().slice(0,10)));
 let streak=0;
 for(let i=0;;i++){
  const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);
  if(dates.has(d.toISOString().slice(0,10)))streak++;else break;
 }

 return {dueToday:dueToday??0,newToday,reviewsToday,studyMinutesToday,accuracyToday,streak};
}
