"use client";
import {
 cacheMirror,cacheMediaBlob,getCachedReviewSession,getCachedReviewPreferences,getDeviceId,getOfflineStorageUsage,
 getPendingMutations,offlineStore,queueMutation,removeMirroredEntity,setSyncMeta,cacheReviewPreferences,upsertOfflineReviewState,getOfflineReviewQueue
} from "@/lib/offline/store";
import type {OfflineReview,OfflineCardTemplate,OfflineReviewState} from "@/lib/offline/store";

export type SyncOperation={
 id:string;entity_type:"decks"|"cards"|"card_templates"|"tags"|"collections"|"collection_cards";
 operation:"upsert"|"delete";entity_id:string;payload:Record<string,unknown>;
};

type SyncProgress={phase:"idle"|"pushing"|"pulling"|"done"|"error";completed:number;total:number;message:string};

let progress:SyncProgress={phase:"idle",completed:0,total:0,message:"Idle"};

function emitProgress(next:SyncProgress){
 progress=next;
 if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("shyraq:sync-progress",{detail:progress}));
}

export function getSyncProgress(){return progress;}

async function syncMutations(userId:string){
 const pending=await getPendingMutations(userId);
 if(!pending.length)return {accepted:0,conflicts:[] as string[],failed:0};
 emitProgress({phase:"pushing",completed:0,total:pending.length,message:"Uploading offline changes…"});
 const operations:SyncOperation[]=pending.map(item=>({
  id:item.id,entity_type:item.entityType,operation:item.operation,entity_id:item.entityId,payload:item.payload
 }));
 const response=await fetch("/api/sync",{
  method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({operations})
 });
 if(!response.ok)throw new Error("Offline changes could not be synced.");
 const result=(await response.json()) as {accepted:number;conflicts:string[];failed?:string[]};
 const failedSet=new Set(result.failed??[]);
 await offlineStore.mutations.bulkDelete(pending.filter(item=>!failedSet.has(item.id)).map(item=>item.id));
 for(const item of pending.filter(item=>failedSet.has(item.id))){
  await offlineStore.mutations.put({...item,status:"failed",attempts:item.attempts+1,lastError:"Server rejected the change."});
 }
 emitProgress({phase:"pushing",completed:pending.length,total:pending.length,message:"Offline changes uploaded."});
 return {...result,failed:failedSet.size};
}

export async function queueReview(event:OfflineReview){
 await offlineStore.reviews.put({...event,status:"pending"});
}

export async function syncReviews(){
 const events=await offlineStore.reviews.where("status").equals("pending").limit(500).toArray();
 if(!events.length)return {accepted:0,conflicts:[] as string[]};
 const response=await fetch("/api/sync",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({events:events.map(e=>({...e,event_key:e.id}))})
 });
 if(!response.ok)throw new Error("Review sync failed.");
 const result=(await response.json()) as {accepted:number;conflicts:string[]};
 const conflictSet=new Set(result.conflicts??[]);
 await offlineStore.reviews.bulkPut(events.map(e=>({...e,status:conflictSet.has(e.id)?"failed" as const:"synced" as const})));
 return result;
}

function mapReviewState(item:Record<string,unknown>,userId:string):OfflineReviewState{
 return {
  id:userId+":"+String(item.card_id??item.cardId??""),
  userId,
  cardId:String(item.card_id??item.cardId??""),
  queue:String(item.queue??"review"),
  stateData:(item.state_data&&typeof item.state_data==="object"?item.state_data:{}) as Record<string,unknown>,
  dueAt:item.due_at?String(item.due_at):null,
  lastReviewedAt:item.last_reviewed_at?String(item.last_reviewed_at):null,
  reps:Number(item.reps??0),
  lapses:Number(item.lapses??0),
  stability:item.stability===null||item.stability===undefined?null:Number(item.stability),
  difficulty:item.difficulty===null||item.difficulty===undefined?null:Number(item.difficulty),
  scheduledDays:Number(item.scheduled_days??0)
 };
}

function mapDeck(item:Record<string,unknown>,userId:string){
 return {
  id:String(item.id),userId,workspaceId:String(item.workspace_id??item.workspaceId??""),
  ownerId:String(item.owner_id??item.ownerId??userId),name:String(item.name??""),
  description:String(item.description??""),visibility:String(item.visibility??"private"),
  settings:(item.settings&&typeof item.settings==="object"?item.settings:{}) as Record<string,unknown>,
  createdAt:String(item.created_at??item.createdAt??new Date().toISOString()),
  updatedAt:String(item.updated_at??item.updatedAt??new Date().toISOString())
 };
}

function mapTag(item:Record<string,unknown>,userId:string){
 return {id:String(item.id),userId,workspaceId:String(item.workspace_id??item.workspaceId??""),name:String(item.name??"")};
}
function mapCollectionCard(item:Record<string,unknown>){
 const collectionId=String(item.collection_id??item.collectionId);
 const cardId=String(item.card_id??item.cardId);
 return {id:collectionId+":"+cardId,collectionId,cardId,createdAt:String(item.created_at??item.createdAt??new Date().toISOString())};
}
function mapCollection(item:Record<string,unknown>,userId:string){
 return {id:String(item.id),userId,workspaceId:String(item.workspace_id??item.workspaceId??""),ownerId:String(item.owner_id??item.ownerId??userId),name:String(item.name??""),kind:String(item.kind??"custom"),description:String(item.description??""),rule:item.rule??{},sortMode:String(item.sort_mode??"manual"),isPublic:Boolean(item.is_public??item.isPublic),isFeatured:Boolean(item.is_featured??item.isFeatured),createdAt:String(item.created_at??item.createdAt??new Date().toISOString())};
}

function mapTemplate(item:Record<string,unknown>,userId:string):OfflineCardTemplate{
 return {
  id:String(item.id),
  userId,
  deckId:String(item.deck_id??item.deckId??""),
  name:String(item.name??"Basic"),
  frontTemplate:String(item.front_template??item.frontTemplate??"{{front}}"),
  backTemplate:String(item.back_template??item.backTemplate??"{{back}}"),
  css:String(item.css??""),
  fieldSchema:item.field_schema??item.fieldSchema??[],
  createdAt:String(item.created_at??item.createdAt??new Date().toISOString()),
  updatedAt:String(item.updated_at??item.updatedAt??new Date().toISOString())
 };
}

function mapCard(item:Record<string,unknown>,userId:string){
 return {
  id:String(item.id),userId,deckId:String(item.deck_id??item.deckId??""),
  templateId:item.template_id?String(item.template_id):null,kind:String(item.kind??"basic"),
  content:(item.content&&typeof item.content==="object"?item.content:{}) as Record<string,unknown>,
  sortOrder:Number(item.sort_order??item.sortOrder??0),isSuspended:Boolean(item.is_suspended??item.isSuspended),
  isMarked:Boolean(item.is_marked??item.isMarked),
  createdAt:String(item.created_at??item.createdAt??new Date().toISOString()),
  updatedAt:String(item.updated_at??item.updatedAt??new Date().toISOString())
 };
}

async function applyPulledChanges(userId:string,changes:Array<Record<string,unknown>>){
 for(const change of changes){
  const type=String(change.entity_type||"");
  const operation=String(change.operation||"");
  const id=String(change.entity_id||"");
  if(operation==="delete"){
   if(type==="collection_cards"){
    const payload=(change.payload&&typeof change.payload==="object"?change.payload:{}) as Record<string,unknown>;
    const key=String(payload.collection_id??payload.collectionId)+":"+String(payload.card_id??payload.cardId);
    await offlineStore.collectionCards.delete(key);
   }else{
    await removeMirroredEntity(type,id);
   }
   continue;
  }
  const payload=(change.payload&&typeof change.payload==="object"?change.payload:{}) as Record<string,unknown>;
  if(type==="decks")await offlineStore.decks.put(mapDeck(payload,userId));
  if(type==="cards")await offlineStore.cards.put(mapCard(payload,userId));
  if(type==="card_templates")await offlineStore.cardTemplates.put(mapTemplate(payload,userId));
  if(type==="tags")await offlineStore.tags.put(mapTag(payload,userId));
  if(type==="collections")await offlineStore.collections.put(mapCollection(payload,userId));
  if(type==="collection_cards")await offlineStore.collectionCards.put(mapCollectionCard(payload));
  if(type==="review_states")await offlineStore.reviewStates.put(mapReviewState(payload,userId));
 }
}

export async function pullChanges(userId:string){
 const meta=await import("@/lib/offline/store").then(m=>m.getSyncMeta(userId));
 const response=await fetch("/api/sync?since="+encodeURIComponent(String(meta.cursor)),{cache:"no-store"});
 if(!response.ok)throw new Error("Sync pull failed.");
 const result=(await response.json()) as {
  changes:Array<Record<string,unknown>>;cursor:number;conflicts:Array<Record<string,unknown>>;
 };
 await applyPulledChanges(userId,result.changes??[]);
 await setSyncMeta(userId,{cursor:typeof result.cursor==="number"?result.cursor:meta.cursor,lastSyncAt:new Date().toISOString(),lastError:null});
 return result;
}

export async function hydrateOfflineMirror(userId:string){
 const response=await fetch("/api/sync?bootstrap=1",{cache:"no-store"});
 if(!response.ok)throw new Error("Offline mirror bootstrap failed.");
 const data=(await response.json()) as {decks:Record<string,unknown>[];cards:Record<string,unknown>[];templates?:Record<string,unknown>[];tags?:Record<string,unknown>[];collections?:Record<string,unknown>[];collectionCards?:Record<string,unknown>[];reviewStates?:Record<string,unknown>[];media?:Record<string,unknown>[]};
 await cacheMirror(
  userId,
  (data.decks??[]).map(item=>mapDeck(item,userId)),
  (data.cards??[]).map(item=>mapCard(item,userId)),
  (data.templates??[]).map(item=>mapTemplate(item,userId)),
  (data.tags??[]).map(item=>mapTag(item,userId)),
  (data.collections??[]).map(item=>mapCollection(item,userId)),
  (data.collectionCards??[]).map(mapCollectionCard),
  (data.reviewStates??[]).map(item=>mapReviewState(item,userId))
 );
 return data;
}

export async function syncAll(userId:string){
 if(typeof navigator!=="undefined"&&!navigator.onLine)return {offline:true,accepted:0,conflicts:[] as string[]};
 try{
  const mutations=await syncMutations(userId);
  emitProgress({phase:"pulling",completed:0,total:1,message:"Downloading remote changes…"});
  const pulled=await pullChanges(userId);
  const reviews=await syncReviews();
  await setSyncMeta(userId,{lastAccepted:mutations.accepted+reviews.accepted,lastConflicts:(mutations.conflicts?.length??0)+(reviews.conflicts?.length??0),lastError:null,lastSyncAt:new Date().toISOString()});
  emitProgress({phase:"done",completed:1,total:1,message:"Sync complete."});
  return {offline:false,...mutations,pulled,reviews};
 }catch(error){
  const message=error instanceof Error?error.message:"Sync failed.";
  await setSyncMeta(userId,{lastError:message});
  emitProgress({phase:"error",completed:0,total:1,message});
  throw error;
 }
}

export function startBackgroundSync(userId:string){
 if(typeof window==="undefined")return()=>{};
 let stopped=false;
 const run=async()=>{if(stopped||!navigator.onLine)return;try{await syncAll(userId);}catch{}};
 const onOnline=()=>void run();
 const onVisibility=()=>{if(document.visibilityState==="visible")void run();};
 window.addEventListener("online",onOnline);
 document.addEventListener("visibilitychange",onVisibility);
 const interval=window.setInterval(()=>void run(),60000);
 void run();
 return()=>{
  stopped=true;
  window.removeEventListener("online",onOnline);
  document.removeEventListener("visibilitychange",onVisibility);
  window.clearInterval(interval);
 };
}

export async function requestBackgroundSync(){
 if(typeof window==="undefined"||!("serviceWorker" in navigator))return false;
 try{
  const registration=await navigator.serviceWorker.ready;
  const syncManager=(registration as ServiceWorkerRegistration&{sync?:{register:(tag:string)=>Promise<void>}}).sync;
  if(!syncManager)return false;
  await syncManager.register("shyraq-sync");
  return true;
 }catch{return false;}
}

export async function cacheMediaAsset(userId:string,path:string,url:string,name:string){
 const response=await fetch(url,{cache:"no-store"});
 if(!response.ok)throw new Error("Media download failed.");
 const blob=await response.blob();
 await cacheMediaBlob(userId,path,blob,name);
 return blob.size;
}

export async function getOfflineOverview(){
 return getOfflineStorageUsage();
}

export function listenToSyncProgress(callback:(progress:SyncProgress)=>void){
 if(typeof window==="undefined")return()=>{};
 const handler=(event:Event)=>{
  const custom=event as CustomEvent<SyncProgress>;
  callback(custom.detail);
 };
 window.addEventListener("shyraq:sync-progress",handler);
 return()=>window.removeEventListener("shyraq:sync-progress",handler);
}

export async function clearFailedMutations(userId:string){
 const failed=await offlineStore.mutations.where("userId").equals(userId).filter(item=>item.status==="failed").toArray();
 await offlineStore.mutations.bulkDelete(failed.map(item=>item.id));
 return failed.length;
}

export async function createOfflineMutation(userId:string,operation:SyncOperation){
 await queueMutation({id:operation.id,userId,entityType:operation.entity_type,operation:operation.operation,entityId:operation.entity_id,payload:operation.payload});
}

export {getCachedReviewSession,getDeviceId};


export async function bootstrapOfflineMirror(){
 const response=await fetch("/api/sync?bootstrap=1",{cache:"no-store"});
 if(!response.ok)throw new Error("Offline bootstrap failed.");
 const data=await response.json() as {user_id:string;decks:Record<string,unknown>[];cards:Record<string,unknown>[];templates?:Record<string,unknown>[];tags?:Record<string,unknown>[];collections?:Record<string,unknown>[];collectionCards?:Record<string,unknown>[];reviewStates?:Record<string,unknown>[];reviewPreferences?:Record<string,unknown>|null};
 const userId=String(data.user_id||"");
 if(!userId)throw new Error("No authenticated user.");
 if(typeof window!=="undefined")localStorage.setItem("shyraq:last-user-id",userId);
 await cacheMirror(userId,(data.decks??[]).map(item=>mapDeck(item,userId)),(data.cards??[]).map(item=>mapCard(item,userId)),(data.templates??[]).map(item=>mapTemplate(item,userId)),(data.tags??[]).map(item=>mapTag(item,userId)),(data.collections??[]).map(item=>mapCollection(item,userId)),(data.collectionCards??[]).map(mapCollectionCard),(data.reviewStates??[]).map(item=>mapReviewState(item,userId)));
 if(data.reviewPreferences)await cacheReviewPreferences(userId,data.reviewPreferences);
 await setSyncMeta(userId,{lastSyncAt:new Date().toISOString(),lastError:null});
 return {userId,decks:data.decks??[],cards:data.cards??[],templates:data.templates??[],tags:data.tags??[],collections:data.collections??[],collectionCards:data.collectionCards??[],reviewStates:data.reviewStates??[]};
}


export {getOfflineReviewQueue,getCachedReviewPreferences};
