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

export async function GET(request:NextRequest){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const since=Math.max(0,Number(request.nextUrl.searchParams.get("since")||0));
 if(request.nextUrl.searchParams.get("bootstrap")==="1"){
  const {data:members}=await supabase.from("workspace_members").select("workspace_id").eq("user_id",user.id);
  const workspaceIds=(members??[]).map(row=>row.workspace_id).filter(Boolean);
  if(!workspaceIds.length)return NextResponse.json({decks:[],cards:[],media:[]});
  const [{data:decks,error:deckError},{data:cards,error:cardError},{data:media}]=await Promise.all([
   supabase.from("decks").select("id,workspace_id,owner_id,name,description,visibility,settings,created_at,updated_at").in("workspace_id",workspaceIds).order("updated_at",{ascending:false}).limit(5000),
   supabase.from("cards").select("id,deck_id,template_id,owner_id,kind,content,sort_order,is_suspended,is_marked,created_at,updated_at").eq("owner_id",user.id).order("updated_at",{ascending:false}).limit(20000),
   supabase.from("media").select("storage_path,mime_type,byte_size,created_at").eq("owner_id",user.id).order("created_at",{ascending:false}).limit(200)
  ]);
  if(deckError||cardError)return NextResponse.json({error:deckError?.message||cardError?.message||"Bootstrap failed."},{status:500});
  const mediaWithUrls=await Promise.all((media??[]).map(async item=>{
   const {data}=await supabase.storage.from("user-media").createSignedUrl(item.storage_path,900);
   return {...item,signed_url:data?.signedUrl||null};
  }));
  return NextResponse.json({user_id:user.id,decks:decks??[],cards:cards??[],media:mediaWithUrls});
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
 const failedOperations:string[]=[];
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
    elapsed_ms:e.elapsed_ms??e.elapsedMs,
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
    await supabase.from("notifications").insert({
     user_id:user.id,kind:"sync_conflict",title:"Review sync conflict detected",
     body:"A newer remote review state was preserved. Open Sync to review the conflict.",href:"/settings/sync"
    });
    conflicts.push(e.event_key);
    continue;
   }
   await supabase.from("review_states").upsert({
    user_id:user.id,card_id:e.card_id,
    queue:incoming.state===2?"review":incoming.state===3?"relearning":"learning",
    state_data:incoming,due_at:new Date(incoming.due).toISOString(),last_reviewed_at:e.reviewed_at,
    reps:incoming.reps??0,lapses:incoming.lapses??0,stability:incoming.stability??null,
    difficulty:incoming.difficulty??null,scheduled_days:incoming.scheduled_days??0
   });
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
  try{
   if(entityType==="decks"){
    if(operation==="delete"){
     const {error}=await supabase.from("decks").delete().eq("id",entityId).eq("owner_id",user.id);
     if(error)throw new Error(error.message);
    }else{
     const row=sanitizeDeckPayload({...payload,id:entityId},user.id);
     const {error}=await supabase.from("decks").upsert(row,{onConflict:"id"});
     if(error)throw new Error(error.message);
     const {data:template}=await supabase.from("card_templates").select("id").eq("deck_id",row.id).limit(1).maybeSingle();
     if(!template){
      const {error:templateError}=await supabase.from("card_templates").insert({deck_id:row.id,name:"Basic",front_template:"{{front}}",back_template:"{{back}}",css:"",field_schema:[{name:"front",type:"text"},{name:"back",type:"text"}]});
      if(templateError)throw new Error(templateError.message);
     }
    }
   }else if(entityType==="cards"){
    if(operation==="delete"){
     const {error}=await supabase.from("cards").delete().eq("id",entityId).eq("owner_id",user.id);
     if(error)throw new Error(error.message);
    }else{
     const row=sanitizeCardPayload({...payload,id:entityId},user.id);
     const {error}=await supabase.from("cards").upsert(row,{onConflict:"id"});
     if(error)throw new Error(error.message);
     const {data:deckForCard}=await supabase.from("decks").select("workspace_id").eq("id",row.deck_id).maybeSingle();
     const tagNames=Array.isArray((row.content as any)?.tags)?(row.content as any).tags.map((tag:any)=>String(tag).trim()).filter(Boolean).slice(0,30):[];
     if(deckForCard?.workspace_id){
      if(tagNames.length){
       const {data:tags,error:tagError}=await supabase.from("tags").upsert(tagNames.map((name:string)=>({workspace_id:deckForCard.workspace_id,name})),{onConflict:"workspace_id,name"}).select("id");
       if(tagError)throw new Error(tagError.message);
       await supabase.from("card_tags").delete().eq("card_id",row.id);
       if(tags?.length){const {error:linkError}=await supabase.from("card_tags").insert(tags.map((tag:any)=>({card_id:row.id,tag_id:tag.id})));if(linkError)throw new Error(linkError.message);}
      }else{
       await supabase.from("card_tags").delete().eq("card_id",row.id);
      }
     }
    }
   }else if(entityType==="card_templates"){
    if(operation==="delete"){
     const {error}=await supabase.from("card_templates").delete().eq("id",entityId);
     if(error)throw new Error(error.message);
    }else{
     const row={
      id:entityId,deck_id:String(payload.deck_id??payload.deckId),
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
  accepted:Math.max(0,acceptedCount-conflicts.length)+operations.filter((item:any)=>!failedOperations.includes(String(item?.id||""))).length,
  conflicts,failed:failedOperations,devices:deviceIds
 });
}
