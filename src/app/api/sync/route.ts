import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {shouldPreserveRemoteState} from "@/lib/sync/conflicts";

function isPlainObject(value:unknown):value is Record<string,unknown>{
 return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
}

function sanitizeDeckPayload(payload:Record<string,unknown>,userId:string){
 return {
  id:String(payload.id),
  workspace_id:String(payload.workspace_id??payload.workspaceId),
  owner_id:userId,
  name:String(payload.name??"").trim().slice(0,120),
  description:String(payload.description??"").slice(0,5000),
  visibility:String(payload.visibility??"private"),
  settings:isPlainObject(payload.settings)?payload.settings:{}
 };
}

function sanitizeTagPayload(payload:Record<string,unknown>,userId:string,workspaceId:string){
 return {id:String(payload.id),workspace_id:workspaceId,name:String(payload.name??"").trim().slice(0,120)};
}
function sanitizeCollectionPayload(payload:Record<string,unknown>,userId:string,workspaceId:string){
 return {
  id:String(payload.id),workspace_id:workspaceId,owner_id:userId,name:String(payload.name??"Imported collection").trim().slice(0,120),
  description:String(payload.description??"").slice(0,5000),kind:String(payload.kind??"custom"),
  rule:isPlainObject(payload.rule)?payload.rule:{},sort_mode:String(payload.sort_mode??payload.sortMode??"manual").slice(0,40),
  is_public:Boolean(payload.is_public??payload.isPublic),is_featured:false
 };
}

function sanitizeCardPayload(payload:Record<string,unknown>,userId:string){
 return {
  id:String(payload.id),
  deck_id:String(payload.deck_id??payload.deckId),
  owner_id:userId,
  template_id:payload.template_id?String(payload.template_id):null,
  kind:String(payload.kind??"basic"),
  content:isPlainObject(payload.content)?payload.content:{},
  sort_order:Number(payload.sort_order??payload.sortOrder??0),
  is_suspended:Boolean(payload.is_suspended??payload.isSuspended),
  is_marked:Boolean(payload.is_marked??payload.isMarked)
 };
}

async function fetchAll<T>(queryFactory:(from:number,to:number)=>any,pageSize=1000):Promise<T[]>{
 const rows:T[]=[];
 let from=0;
 while(true){
  const {data,error}=await queryFactory(from,from+pageSize-1);
  if(error)throw new Error(error.message);
  const batch=(data??[]) as T[];
  rows.push(...batch);
  if(batch.length<pageSize)break;
  from+=pageSize;
 }
 return rows;
}

async function canEditWorkspace(supabase:any,userId:string,workspaceId:string){
 const {data}=await supabase.from("workspace_members").select("role").eq("workspace_id",workspaceId).eq("user_id",userId).maybeSingle();
 return ["owner","admin","editor"].includes(String(data?.role||""));
}
async function canEditDeck(supabase:any,userId:string,deckId:string){
 const {data:deck}=await supabase.from("decks").select("workspace_id").eq("id",deckId).maybeSingle();
 if(!deck)return false;
 if(await canEditWorkspace(supabase,userId,String(deck.workspace_id)))return true;
 const {data:member}=await supabase.from("deck_members").select("role").eq("deck_id",deckId).eq("user_id",userId).maybeSingle();
 return String(member?.role||"")==="editor";
}
async function canEditCollection(supabase:any,userId:string,collectionId:string){
 const {data:collection}=await supabase.from("collections").select("workspace_id").eq("id",collectionId).maybeSingle();
 if(!collection)return false;
 if(await canEditWorkspace(supabase,userId,String(collection.workspace_id)))return true;
 const {data:member}=await supabase.from("collection_members").select("role").eq("collection_id",collectionId).eq("user_id",userId).maybeSingle();
 return String(member?.role||"")==="editor";
}

export async function GET(request:NextRequest){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const since=Math.max(0,Number(request.nextUrl.searchParams.get("since")||0));
 if(request.nextUrl.searchParams.get("bootstrap")==="1"){
  const {data:members}=await supabase.from("workspace_members").select("workspace_id").eq("user_id",user.id);
  const workspaceIds=(members??[]).map(row=>row.workspace_id).filter(Boolean);
  if(!workspaceIds.length)return NextResponse.json({decks:[],cards:[],media:[]});
  let decks:Record<string,unknown>[]=[];
  try{
   decks=await fetchAll<Record<string,unknown>>((from,to)=>supabase.from("decks").select("id,workspace_id,owner_id,name,description,visibility,settings,created_at,updated_at").in("workspace_id",workspaceIds).order("updated_at",{ascending:false}).order("id",{ascending:true}).range(from,to));
  }catch(error){
   return NextResponse.json({error:error instanceof Error?error.message:"Bootstrap failed."},{status:500});
  }
  const deckIds=decks.map(deck=>deck.id).filter(Boolean);
  try{
   const [cards,templates,tags,collections,media]=await Promise.all([
    deckIds.length
     ? fetchAll<Record<string,unknown>>((from,to)=>supabase.from("cards").select("id,deck_id,template_id,owner_id,kind,content,sort_order,is_suspended,is_marked,created_at,updated_at").in("deck_id",deckIds).order("updated_at",{ascending:false}).order("id",{ascending:true}).range(from,to))
     : Promise.resolve([]),
    deckIds.length
     ? fetchAll<Record<string,unknown>>((from,to)=>supabase.from("card_templates").select("id,deck_id,name,front_template,back_template,css,field_schema,created_at,updated_at").in("deck_id",deckIds).order("updated_at",{ascending:false}).order("id",{ascending:true}).range(from,to))
     : Promise.resolve([]),
    workspaceIds.length
     ? fetchAll<Record<string,unknown>>((from,to)=>supabase.from("tags").select("id,workspace_id,name").in("workspace_id",workspaceIds).order("name",{ascending:true}).order("id",{ascending:true}).range(from,to))
     : Promise.resolve([]),
    workspaceIds.length
     ? fetchAll<Record<string,unknown>>((from,to)=>supabase.from("collections").select("id,workspace_id,owner_id,name,description,kind,rule,sort_mode,is_public,is_featured,created_at").in("workspace_id",workspaceIds).order("created_at",{ascending:false}).order("id",{ascending:true}).range(from,to))
     : Promise.resolve([]),
    fetchAll<Record<string,unknown>>((from,to)=>supabase.from("media").select("workspace_id,owner_id,storage_path,mime_type,byte_size,created_at").in("workspace_id",workspaceIds).order("created_at",{ascending:false}).order("storage_path",{ascending:true}).range(from,to))
   ]);
   const reviewCardIds=cards.map(card=>card.id).filter(Boolean);
   const reviewStates=reviewCardIds.length
    ? await fetchAll<Record<string,unknown>>((from,to)=>supabase.from("review_states").select("id,user_id,card_id,queue,state_data,due_at,last_reviewed_at,reps,lapses,stability,difficulty,scheduled_days").eq("user_id",user.id).in("card_id",reviewCardIds).order("card_id",{ascending:true}).order("id",{ascending:true}).range(from,to))
    : [];
   const {data:reviewPreferences,error:reviewPreferencesError}=await supabase.from("review_preferences").select("desired_retention,maximum_interval,learning_steps,relearning_steps,enable_fuzz,enable_short_term,rating_labels,rating_order,show_keyboard_hints,swipe_enabled,rating_styles,accessibility,session_defaults,scheduler_profiles").eq("user_id",user.id).maybeSingle();
   if(reviewPreferencesError)throw new Error(reviewPreferencesError.message);
   const collectionIds=collections.map(collection=>collection.id).filter(Boolean);
   const collectionCardRows=collectionIds.length
    ? await fetchAll<{collection_id:string;card_id:string;created_at:string}>((from,to)=>supabase.from("collection_cards").select("collection_id,card_id,created_at").in("collection_id",collectionIds).order("collection_id",{ascending:true}).order("card_id",{ascending:true}).range(from,to))
    : [];
   const mediaWithUrls=await Promise.all(media.map(async item=>{
    const {data}=await supabase.storage.from("user-media").createSignedUrl(String(item.storage_path),900);
    return {...item,signed_url:data?.signedUrl||null};
   }));
   return NextResponse.json({user_id:user.id,decks,cards,templates,tags,collections,collectionCards:collectionCardRows,reviewStates,reviewPreferences:reviewPreferences??null,media:mediaWithUrls});
  }catch(error){
   return NextResponse.json({error:error instanceof Error?error.message:"Bootstrap failed."},{status:500});
  }
 }
 const {data,error}=await supabase.from("sync_changes").select("cursor,event_key,entity_type,entity_id,operation,payload,occurred_at").eq("user_id",user.id).gt("cursor",since).order("cursor",{ascending:true}).limit(500);
 if(error)return NextResponse.json({error:error.message},{status:500});
 const {data:conflicts}=await supabase.from("sync_conflicts").select("id,card_id,event_key,detected_at,resolution,resolved_at,incoming_state,current_state,incoming_reviewed_at,current_reviewed_at").eq("user_id",user.id).is("resolved_at",null).order("detected_at",{ascending:false}).limit(100);
 return NextResponse.json({changes:data??[],cursor:data?.at(-1)?.cursor??since,conflicts:conflicts??[]});
}

export async function POST(request:NextRequest){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await request.json();
 const events=Array.isArray(body.events)?body.events:[];
 const operations=Array.isArray(body.operations)?body.operations:[];
 const batch=events.slice(0,500);
 const conflicts:string[]=[];
 const failedEvents:string[]=[];
 const failedOperations:string[]=[];
 const attemptedOperationIds:string[]=[];
 let acceptedCount=0;
 let deviceIds:string[]=[];

 if(batch.length>0){
  const rows=batch.map((e:any)=>({
    event_key:e.event_key??e.eventKey??crypto.randomUUID(),
    user_id:user.id,
    card_id:e.card_id??e.cardId,
    device_id:e.device_id??e.deviceId,
    client_sequence:e.client_sequence??e.clientSequence,
    reviewed_at:e.reviewed_at??e.reviewedAt,
    rating:e.rating,
    elapsed_ms:Math.max(0,Math.min(15*60*1000,Number.isFinite(Number(e.elapsed_ms??e.elapsedMs))?Math.round(Number(e.elapsed_ms??e.elapsedMs)):0)),
    previous_state:e.previous_state??e.previousState??{},
    next_state:e.next_state??e.nextState??{},
    metadata:e.metadata??{}
  }));
  deviceIds=[...new Set(rows.map((row:any)=>row.device_id).filter(Boolean))] as string[];
  if(deviceIds.length){
   const deviceRows=deviceIds.map((id)=>({id,user_id:user.id,name:String(body.deviceName||"Web browser").slice(0,60),last_seen_at:new Date().toISOString()}));
   await supabase.from("review_devices").upsert(deviceRows,{onConflict:"id"});
  }
  const eventKeys=rows.map((row:any)=>row.event_key);
  const {data:existingEvents}=await supabase.from("review_events").select("event_key").eq("user_id",user.id).in("event_key",eventKeys);
  const existingKeys=new Set((existingEvents??[]).map((row:any)=>row.event_key));
  const newRows=rows.filter((row:any)=>!existingKeys.has(row.event_key));
  const {error:eventError}=await supabase.from("review_events").upsert(newRows,{onConflict:"event_key",ignoreDuplicates:true});
  if(eventError)return NextResponse.json({error:eventError.message},{status:400});
  acceptedCount=newRows.length;

  for(const e of newRows){
   const incoming=e.next_state as any;
   if(!incoming?.due)continue;
   const {data:existing}=await supabase.from("review_states").select("state_data,last_reviewed_at").eq("user_id",user.id).eq("card_id",e.card_id).maybeSingle();
   const currentReviewedAt=existing?.last_reviewed_at?new Date(existing.last_reviewed_at).getTime():0;
   const incomingReviewedAt=new Date(e.reviewed_at).getTime();
   if(shouldPreserveRemoteState(existing?.last_reviewed_at??null,e.reviewed_at)){
    const {error:conflictError}=await supabase.from("sync_conflicts").insert({
     user_id:user.id,card_id:e.card_id,event_key:e.event_key,incoming_state:incoming,current_state:existing?.state_data??{},
     incoming_reviewed_at:e.reviewed_at,current_reviewed_at:existing?.last_reviewed_at??null
    });
    if(conflictError)continue;
    const {error:notificationError}=await supabase.rpc("create_notification",{
     target_user:user.id,
     notification_kind:"sync_conflict",
     notification_title:"Review sync conflict detected",
     notification_body:"A newer remote review state was preserved. Open Sync to review the conflict.",
     notification_href:"/settings/sync"
    });
    if(notificationError)continue;
    conflicts.push(e.event_key);
    continue;
   }
   const {error:stateError}=await supabase.from("review_states").upsert({
    user_id:user.id,card_id:e.card_id,
    queue:incoming.state===2?"review":incoming.state===3?"relearning":"learning",
    state_data:incoming,due_at:new Date(incoming.due).toISOString(),last_reviewed_at:e.reviewed_at,
    reps:incoming.reps??0,lapses:incoming.lapses??0,stability:incoming.stability??null,
    difficulty:incoming.difficulty??null,scheduled_days:incoming.scheduled_days??0
   });
   if(stateError){
    failedEvents.push(String(e.event_key));
    await supabase.from("review_events").delete().eq("event_key",e.event_key).eq("user_id",user.id);
   }
  }
 }

 for(const raw of operations.slice(0,500)){
 if(!isPlainObject(raw))continue;
 const id=String(raw.id||"");
 const entityType=String(raw.entity_type||"");
 const operation=String(raw.operation||"");
 const entityId=String(raw.entity_id||"");
 const payload=isPlainObject(raw.payload)?raw.payload:{};
 if(!id||!entityId||!["upsert","delete"].includes(operation))continue;
 attemptedOperationIds.push(id);
 try{
  if(entityType==="decks"){
   const {data:existingDeck}=await supabase.from("decks").select("id,workspace_id,owner_id").eq("id",entityId).maybeSingle();
   const workspaceId=String(existingDeck?.workspace_id||payload.workspace_id||payload.workspaceId||"");
   if(!workspaceId||!(await canEditWorkspace(supabase,user.id,workspaceId)))throw new Error("Workspace edit permission required.");
   if(operation==="delete"){
    const {error}=await supabase.from("decks").delete().eq("id",entityId);
    if(error)throw new Error(error.message);
   }else{
    const row=sanitizeDeckPayload({...payload,id:entityId,workspace_id:workspaceId},user.id);
    if(existingDeck)row.owner_id=existingDeck.owner_id;
    const {error}=await supabase.from("decks").upsert(row,{onConflict:"id"});
    if(error)throw new Error(error.message);
    const {data:template}=await supabase.from("card_templates").select("id").eq("deck_id",row.id).limit(1).maybeSingle();
    if(!template){
     const {error:templateError}=await supabase.from("card_templates").insert({deck_id:row.id,name:"Basic",front_template:"{{front}}",back_template:"{{back}}",css:"",field_schema:[{name:"front",type:"text"},{name:"back",type:"text"}]});
     if(templateError)throw new Error(templateError.message);
    }
   }
  }else if(entityType==="cards"){
   const {data:existingCard}=await supabase.from("cards").select("id,deck_id,owner_id").eq("id",entityId).maybeSingle();
   const requestedDeckId=String(payload.deck_id??payload.deckId??existingCard?.deck_id??"");
   const {data:cardDeck}=requestedDeckId
    ? await supabase.from("decks").select("id,workspace_id").eq("id",requestedDeckId).maybeSingle()
    : {data:null};
   if(!cardDeck||!(await canEditDeck(supabase,user.id,String(cardDeck.id))))throw new Error("Deck edit permission required.");
   if(existingCard&&String(existingCard.deck_id)!==String(cardDeck.id))throw new Error("Moving an existing card between decks is not supported offline.");
   if(operation==="delete"){
    const {error}=await supabase.from("cards").delete().eq("id",entityId);
    if(error)throw new Error(error.message);
   }else{
    const row=sanitizeCardPayload({...payload,id:entityId,deck_id:cardDeck.id},user.id);
    if(existingCard)row.owner_id=existingCard.owner_id;
    const {error}=await supabase.from("cards").upsert(row,{onConflict:"id"});
    if(error)throw new Error(error.message);
    const tagNames=Array.isArray((row.content as any)?.tags)?(row.content as any).tags.map((tag:any)=>String(tag).trim()).filter(Boolean).slice(0,30):[];
    if(tagNames.length){
     const {data:tags,error:tagError}=await supabase.from("tags").upsert(tagNames.map((name:string)=>({workspace_id:cardDeck.workspace_id,name})),{onConflict:"workspace_id,name"}).select("id");
     if(tagError)throw new Error(tagError.message);
     await supabase.from("card_tags").delete().eq("card_id",row.id);
     if(tags?.length){
      const {error:linkError}=await supabase.from("card_tags").insert(tags.map((tag:any)=>({card_id:row.id,tag_id:tag.id})));
      if(linkError)throw new Error(linkError.message);
     }
    }else{
     await supabase.from("card_tags").delete().eq("card_id",row.id);
    }
   }
  }else if(entityType==="tags"){
   const {data:existingTag}=await supabase.from("tags").select("id,workspace_id").eq("id",entityId).maybeSingle();
   const workspaceId=String(existingTag?.workspace_id||payload.workspace_id||payload.workspaceId||"");
   if(!workspaceId||!(await canEditWorkspace(supabase,user.id,workspaceId)))throw new Error("Workspace edit permission required.");
   if(operation==="delete"){
    const {error}=await supabase.from("tags").delete().eq("id",entityId);
    if(error)throw new Error(error.message);
   }else{
    const row=sanitizeTagPayload({...payload,id:entityId},user.id,workspaceId);
    const {error}=await supabase.from("tags").upsert(row,{onConflict:"id"});
    if(error)throw new Error(error.message);
   }
  }else if(entityType==="collections"){
   const {data:existingCollection}=await supabase.from("collections").select("id,workspace_id,owner_id").eq("id",entityId).maybeSingle();
   const workspaceId=String(existingCollection?.workspace_id||payload.workspace_id||payload.workspaceId||"");
   if(!workspaceId||!(await canEditWorkspace(supabase,user.id,workspaceId)))throw new Error("Workspace edit permission required.");
   if(operation==="delete"){
    const {error}=await supabase.from("collections").delete().eq("id",entityId);
    if(error)throw new Error(error.message);
   }else{
    const row=sanitizeCollectionPayload({...payload,id:entityId},user.id,workspaceId);
    if(existingCollection)row.owner_id=existingCollection.owner_id;
    const {error}=await supabase.from("collections").upsert(row,{onConflict:"id"});
    if(error)throw new Error(error.message);
   }
  }else if(entityType==="collection_cards"){
   const collectionId=String(payload.collection_id??payload.collectionId??"");
   const cardId=String(payload.card_id??payload.cardId??"");
   const {data:collection}=collectionId?await supabase.from("collections").select("id,workspace_id").eq("id",collectionId).maybeSingle():{data:null};
   const {data:card}=cardId?await supabase.from("cards").select("id,deck_id").eq("id",cardId).maybeSingle():{data:null};
   const {data:deck}=card?.deck_id?await supabase.from("decks").select("id,workspace_id").eq("id",card.deck_id).maybeSingle():{data:null};
   if(!collection||!card||!deck||String(collection.workspace_id)!==String(deck.workspace_id)||!(await canEditCollection(supabase,user.id,String(collection.id))))throw new Error("Collection edit permission required.");
   if(operation==="delete"){
    const {error}=await supabase.from("collection_cards").delete().eq("collection_id",collectionId).eq("card_id",cardId);
    if(error)throw new Error(error.message);
   }else{
    const {error}=await supabase.from("collection_cards").upsert({collection_id:collectionId,card_id:cardId},{onConflict:"collection_id,card_id"});
    if(error)throw new Error(error.message);
   }
  }else if(entityType==="card_templates"){
   const {data:existingTemplate}=await supabase.from("card_templates").select("id,deck_id").eq("id",entityId).maybeSingle();
   const deckId=String(payload.deck_id??payload.deckId??existingTemplate?.deck_id??"");
   const {data:templateDeck}=deckId
    ? await supabase.from("decks").select("id,workspace_id").eq("id",deckId).maybeSingle()
    : {data:null};
   if(!templateDeck||!(await canEditDeck(supabase,user.id,String(templateDeck.id))))throw new Error("Deck edit permission required.");
   if(existingTemplate&&String(existingTemplate.deck_id)!==String(templateDeck.id))throw new Error("Moving an existing template between decks is not supported offline.");
   if(operation==="delete"){
    const {error}=await supabase.from("card_templates").delete().eq("id",entityId);
    if(error)throw new Error(error.message);
   }else{
    const row={
     id:entityId,deck_id:templateDeck.id,
     name:String(payload.name??"Basic").slice(0,120),
     front_template:String(payload.front_template??payload.frontTemplate??"{{front}}"),
     back_template:String(payload.back_template??payload.backTemplate??"{{back}}"),
     css:String(payload.css??"").slice(0,20000),
     field_schema:isPlainObject(payload.field_schema)?payload.field_schema:(Array.isArray(payload.field_schema)?payload.field_schema:[])
    };
    const {error}=await supabase.from("card_templates").upsert(row,{onConflict:"id"});
    if(error)throw new Error(error.message);
   }
  }else{
   throw new Error("Unsupported offline entity.");
  }
 }catch(error){
  failedOperations.push(id);
 }
}


 return NextResponse.json({
  accepted:Math.max(0,acceptedCount-conflicts.length-failedEvents.length)+attemptedOperationIds.filter(id=>!failedOperations.includes(id)).length,
  conflicts,failed:failedOperations,failedEvents,devices:deviceIds
 });
}
