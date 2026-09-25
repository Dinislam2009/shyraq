"use client";
import {offlineStore,type OfflineReview} from "@/lib/offline/store";

const CURSOR_KEY="shyraq:sync-cursor";

export async function queueReview(event:OfflineReview){
 await offlineStore.reviews.put({...event,status:"pending"});
}

export async function syncReviews(){
 const events=await offlineStore.reviews.where("status").equals("pending").limit(500).toArray();
 if(!events.length)return {accepted:0,conflicts:[] as string[]};
 const response=await fetch("/api/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({events:events.map(e=>({...e,event_key:e.id}))})});
 if(!response.ok)throw new Error("Sync failed");
 const result=(await response.json()) as {accepted:number;conflicts:string[]};
 const conflictSet=new Set(result.conflicts??[]);
 await offlineStore.reviews.bulkPut(events.map(e=>({...e,status:conflictSet.has(e.id)?"failed" as const:"synced" as const})));
 return result;
}

export async function pullChanges(){
 const since=Number(localStorage.getItem(CURSOR_KEY)||"0");
 const response=await fetch("/api/sync?since="+encodeURIComponent(String(since)),{cache:"no-store"});
 if(!response.ok)throw new Error("Pull failed");
 const result=(await response.json()) as {changes:any[];cursor:number;conflicts:any[]};
 if(typeof result.cursor==="number")localStorage.setItem(CURSOR_KEY,String(result.cursor));
 return result;
}
