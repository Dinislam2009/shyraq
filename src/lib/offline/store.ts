"use client";
import Dexie,{type Table} from "dexie";
export type OfflineReview={id:string;userId:string;cardId:string;deviceId:string;sequence:number;rating:"again"|"hard"|"good"|"easy";reviewedAt:string;previousState:Record<string,unknown>;nextState:Record<string,unknown>;metadata?:Record<string,unknown>;status:"pending"|"synced"|"failed";elapsedMs?:number};
export type CachedReviewSession={key:string;userId:string;queue:any[];preferences:any;savedAt:string};
const DEVICE_KEY="shyraq:device-id";
export function getDeviceId(){if(typeof window==="undefined")return "server";const current=localStorage.getItem(DEVICE_KEY);if(current)return current;const next=crypto.randomUUID();localStorage.setItem(DEVICE_KEY,next);return next;}
class OfflineStore extends Dexie{reviews!:Table<OfflineReview,string>;reviewCache!:Table<CachedReviewSession,string>;constructor(){super("shyraq-offline");this.version(1).stores({reviews:"id,userId,cardId,deviceId,sequence,status,reviewedAt"});this.version(2).stores({reviews:"id,userId,cardId,deviceId,sequence,status,reviewedAt",reviewCache:"key,userId,savedAt"});}}
export const offlineStore=new OfflineStore();
export async function cacheReviewSession(userId:string,queue:any[],preferences:any){await offlineStore.reviewCache.put({key:"current",userId,queue,preferences,savedAt:new Date().toISOString()});}
export async function getCachedReviewSession(userId?:string){const cached=await offlineStore.reviewCache.get("current");if(!cached)return null;if(userId&&cached.userId!==userId)return null;return cached;}
