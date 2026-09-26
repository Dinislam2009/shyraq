"use client";
import Dexie,{type Table} from "dexie";

export type OfflineReview={
 id:string;userId:string;cardId:string;deviceId:string;sequence:number;
 rating:"again"|"hard"|"good"|"easy";reviewedAt:string;
 previousState:Record<string,unknown>;nextState:Record<string,unknown>;
 metadata?:Record<string,unknown>;status:"pending"|"synced"|"failed";elapsedMs?:number;
};

export type OfflineDeck={
 id:string;userId:string;workspaceId:string;ownerId:string;name:string;description:string;
 visibility:string;settings:Record<string,unknown>;createdAt:string;updatedAt:string;
};

export type OfflineCard={
 id:string;userId:string;deckId:string;templateId:string|null;kind:string;
 content:Record<string,unknown>;sortOrder:number;isSuspended:boolean;isMarked:boolean;
 createdAt:string;updatedAt:string;
};

export type OfflineTag={id:string;userId:string;workspaceId:string;name:string};
export type OfflineCollection={id:string;userId:string;workspaceId:string;ownerId:string;name:string;kind:string;description:string;rule:unknown;sortMode:string;isPublic:boolean;isFeatured:boolean;createdAt:string};
export type OfflineCollectionCard={id:string;collectionId:string;cardId:string;createdAt:string};
export type OfflineCardTemplate={
 id:string;userId:string;deckId:string;name:string;frontTemplate:string;backTemplate:string;
 css:string;fieldSchema:unknown;createdAt:string;updatedAt:string;
};
export type OfflineReviewState={
 id:string;userId:string;cardId:string;queue:string;stateData:Record<string,unknown>;
 dueAt:string|null;lastReviewedAt:string|null;reps:number;lapses:number;stability:number|null;difficulty:number|null;scheduledDays:number;
};

export type OfflineMutation={
 id:string;userId:string;entityType:"decks"|"cards"|"card_templates"|"tags"|"collections"|"collection_cards";
 operation:"upsert"|"delete";entityId:string;payload:Record<string,unknown>;
 createdAt:string;attempts:number;status:"pending"|"failed";lastError?:string;
};

export type OfflineMediaCache={
 path:string;userId:string;blob:Blob;mimeType:string;name:string;byteSize:number;savedAt:string;
};

export type OfflineSyncMeta={
 key:string;userId:string;cursor:number;lastSyncAt:string|null;lastError:string|null;
 lastAccepted:number;lastConflicts:number;
};

export type CachedReviewSession={key:string;userId:string;queue:unknown[];preferences:unknown;savedAt:string};

const DEVICE_KEY="shyraq:device-id";

export function getDeviceId(){
 if(typeof window==="undefined")return "server";
 const current=localStorage.getItem(DEVICE_KEY);
 if(current)return current;
 const next=crypto.randomUUID();
 localStorage.setItem(DEVICE_KEY,next);
 return next;
}

class OfflineStore extends Dexie{
 reviews!:Table<OfflineReview,string>;
 reviewCache!:Table<CachedReviewSession,string>;
 decks!:Table<OfflineDeck,string>;
 cards!:Table<OfflineCard,string>;
 cardTemplates!:Table<OfflineCardTemplate,string>;
 tags!:Table<OfflineTag,string>;
 collections!:Table<OfflineCollection,string>;
 collectionCards!:Table<OfflineCollectionCard,string>;
 mutations!:Table<OfflineMutation,string>;
 mediaCache!:Table<OfflineMediaCache,string>;
 syncMeta!:Table<OfflineSyncMeta,string>;
 reviewStates!:Table<OfflineReviewState,string>;
 constructor(){
  super("shyraq-offline");
  this.version(1).stores({reviews:"id,userId,cardId,deviceId,sequence,status,reviewedAt"});
  this.version(2).stores({reviews:"id,userId,cardId,deviceId,sequence,status,reviewedAt",reviewCache:"key,userId,savedAt"});
  this.version(3).stores({
   reviews:"id,userId,cardId,deviceId,sequence,status,reviewedAt",
   reviewCache:"key,userId,savedAt",
   decks:"id,userId,workspaceId,updatedAt",
   cards:"id,userId,deckId,updatedAt,sortOrder",
   mutations:"id,userId,entityType,operation,status,createdAt",
   mediaCache:"path,userId,savedAt",
   syncMeta:"key,userId,cursor,lastSyncAt"
  });
  this.version(4).stores({
   reviews:"id,userId,cardId,deviceId,sequence,status,reviewedAt",
   reviewCache:"key,userId,savedAt",
   decks:"id,userId,workspaceId,updatedAt",
   cards:"id,userId,deckId,updatedAt,sortOrder",
   cardTemplates:"id,userId,deckId,updatedAt",
   tags:"id,userId,workspaceId,name",
   collections:"id,userId,workspaceId,createdAt",
   mutations:"id,userId,entityType,operation,status,createdAt",
   mediaCache:"path,userId,savedAt",
   syncMeta:"key,userId,cursor,lastSyncAt"
  });
  this.version(5).stores({
   reviews:"id,userId,cardId,deviceId,sequence,status,reviewedAt",
   reviewCache:"key,userId,savedAt",
   decks:"id,userId,workspaceId,updatedAt",
   cards:"id,userId,deckId,updatedAt,sortOrder",
   cardTemplates:"id,userId,deckId,updatedAt",
   tags:"id,userId,workspaceId,name",
   collections:"id,userId,workspaceId,createdAt",
   collectionCards:"id,collectionId,cardId,createdAt",
   mutations:"id,userId,entityType,operation,status,createdAt",
   mediaCache:"path,userId,savedAt",
   syncMeta:"key,userId,cursor,lastSyncAt"
  });  this.version(6).stores({
   reviews:"id,userId,cardId,deviceId,sequence,status,reviewedAt",
   reviewCache:"key,userId,savedAt",
   decks:"id,userId,workspaceId,updatedAt",
   cards:"id,userId,deckId,updatedAt,sortOrder",
   cardTemplates:"id,userId,deckId,updatedAt",
   tags:"id,userId,workspaceId,name",
   collections:"id,userId,workspaceId,createdAt",
   collectionCards:"id,collectionId,cardId,createdAt",
   reviewStates:"id,userId,cardId,dueAt,lastReviewedAt",
   mutations:"id,userId,entityType,operation,status,createdAt",
   mediaCache:"path,userId,savedAt",
   syncMeta:"key,userId,cursor,lastSyncAt"
  });

 }
}

export const offlineStore=new OfflineStore();

export async function cacheReviewSession(userId:string,queue:unknown[],preferences:unknown){
 await offlineStore.reviewCache.put({key:"current",userId,queue,preferences,savedAt:new Date().toISOString()});
}

export async function getCachedReviewSession(userId?:string){
 const cached=await offlineStore.reviewCache.get("current");
 if(!cached)return null;
 if(userId&&cached.userId!==userId)return null;
 return cached;
}

export async function cacheReviewPreferences(userId:string,preferences:unknown){
 await offlineStore.reviewCache.put({key:"preferences",userId,queue:[],preferences,savedAt:new Date().toISOString()});
}

export async function getCachedReviewPreferences(userId?:string){
 const cached=await offlineStore.reviewCache.get("preferences");
 if(!cached)return null;
 if(userId&&cached.userId!==userId)return null;
 return cached.preferences;
}

export async function cacheMirror(
 userId:string,
 decks:OfflineDeck[],
 cards:OfflineCard[],
 templates:OfflineCardTemplate[]=[],tags:OfflineTag[]=[],collections:OfflineCollection[]=[],collectionCards:OfflineCollectionCard[]=[],reviewStates:OfflineReviewState[]=[]
){
 await offlineStore.transaction("rw",[offlineStore.decks,offlineStore.cards,offlineStore.cardTemplates,offlineStore.tags,offlineStore.collections,offlineStore.collectionCards,offlineStore.reviewStates],async()=>{
  if(decks.length)await offlineStore.decks.bulkPut(decks);
  if(cards.length)await offlineStore.cards.bulkPut(cards);
  if(templates.length)await offlineStore.cardTemplates.bulkPut(templates);
  if(tags.length)await offlineStore.tags.bulkPut(tags);
  if(collections.length)await offlineStore.collections.bulkPut(collections);
  if(collectionCards.length)await offlineStore.collectionCards.bulkPut(collectionCards);
  if(reviewStates.length)await offlineStore.reviewStates.bulkPut(reviewStates);
 });
}

export async function removeMirroredEntity(entityType:string,entityId:string){
 if(entityType==="decks")await offlineStore.decks.delete(entityId);
 if(entityType==="cards")await offlineStore.cards.delete(entityId);
 if(entityType==="card_templates")await offlineStore.cardTemplates.delete(entityId);
 if(entityType==="tags")await offlineStore.tags.delete(entityId);
 if(entityType==="collections")await offlineStore.collections.delete(entityId);
 if(entityType==="collection_cards")await offlineStore.collectionCards.delete(entityId);
 if(entityType==="review_states")await offlineStore.reviewStates.delete(entityId);
}

export async function getSyncMeta(userId:string){
 return (await offlineStore.syncMeta.get(userId))??{
  key:userId,userId,cursor:0,lastSyncAt:null,lastError:null,lastAccepted:0,lastConflicts:0
 };
}

export async function setSyncMeta(userId:string,patch:Partial<OfflineSyncMeta>){
 const current=await getSyncMeta(userId);
 await offlineStore.syncMeta.put({...current,...patch,key:userId,userId});
}

export async function queueMutation(mutation:Omit<OfflineMutation,"attempts"|"status"|"createdAt">){
 await offlineStore.mutations.put({...mutation,attempts:0,status:"pending",createdAt:new Date().toISOString()});
}

export async function getPendingMutations(userId:string){
 return offlineStore.mutations.where("userId").equals(userId).filter(item=>item.status==="pending").sortBy("createdAt");
}

export async function cacheMediaBlob(userId:string,path:string,blob:Blob,name:string){
 await offlineStore.mediaCache.put({
  path,userId,blob,mimeType:blob.type||"application/octet-stream",name,byteSize:blob.size,savedAt:new Date().toISOString()
 });
}

export async function deleteCachedMedia(path:string){
 await offlineStore.mediaCache.delete(path);
}

export async function pruneOfflineMediaCache(userId:string,maxBytes=150*1024*1024){
 const items=await offlineStore.mediaCache.where("userId").equals(userId).sortBy("savedAt");
 let total=items.reduce((sum,item)=>sum+item.byteSize,0);
 for(const item of items){
  if(total<=maxBytes)break;
  await offlineStore.mediaCache.delete(item.path);
  total-=item.byteSize;
 }
 return {remainingBytes:Math.max(0,total),removedBytes:Math.max(0,items.reduce((sum,item)=>sum+item.byteSize,0)-total)};
}

export async function getOfflineStorageUsage(){
 const [reviews,reviewCache,decks,cards,cardTemplates,tags,collections,collectionCards,reviewStates,mutations,media]=await Promise.all([
  offlineStore.reviews.count(),offlineStore.reviewCache.count(),offlineStore.decks.count(),
  offlineStore.cards.count(),offlineStore.cardTemplates.count(),offlineStore.tags.count(),offlineStore.collections.count(),offlineStore.collectionCards.count(),offlineStore.reviewStates.count(),offlineStore.mutations.count(),offlineStore.mediaCache.toArray()
 ]);
 return {
  reviews,reviewCache,decks,cards,cardTemplates,tags,collections,collectionCards,reviewStates,mutations,mediaFiles:media.length,
  mediaBytes:media.reduce((sum,item)=>sum+item.byteSize,0)
 };
}

export async function getOfflineMedia(path:string){
 return offlineStore.mediaCache.get(path);
}

export async function upsertOfflineReviewState(state:OfflineReviewState){
 await offlineStore.reviewStates.put(state);
}

export async function getOfflineReviewQueue(userId:string,deckId:string|undefined,limit=20){
 const cards=await offlineStore.cards.where("userId").equals(userId).toArray();
 const selected=deckId?cards.filter(card=>card.deckId===deckId):cards;
 const active=selected.filter(card=>!card.isSuspended);
 const cardIds=active.map(card=>card.id);
 const states=cardIds.length?await offlineStore.reviewStates.where("userId").equals(userId).filter(state=>cardIds.includes(state.cardId)).toArray():[];
 const stateByCard=new Map(states.map(state=>[state.cardId,state]));
 const templates=await offlineStore.cardTemplates.where("userId").equals(userId).toArray();
 const templatesByDeck=new Map<string,OfflineCardTemplate[]>();
 for(const template of templates){const list=templatesByDeck.get(template.deckId)||[];list.push(template);templatesByDeck.set(template.deckId,list);}
 const now=Date.now();
 const rows=active.map(card=>{const state=stateByCard.get(card.id);const due=state?.dueAt?Date.parse(state.dueAt):0;return {card,state,due};})
  .filter(item=>!item.state||!item.due||item.due<=now)
  .sort((a,b)=>(a.state?1:0)-(b.state?1:0)||(a.due||0)-(b.due||0)||a.card.sortOrder-b.card.sortOrder)
  .slice(0,Math.max(1,Math.min(100,limit)));
 return rows.map(item=>({
  card:{id:item.card.id,content:item.card.content,kind:item.card.kind,template_id:item.card.templateId,card_templates:templatesByDeck.get(item.card.deckId)||[]},
  stateData:item.state?.stateData||null,
  isNew:!item.state
 }));
}
